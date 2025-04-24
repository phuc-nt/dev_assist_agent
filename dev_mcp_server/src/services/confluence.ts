import env from '../config/env';
import { ConfluenceSpace, ConfluencePage, ServiceResult } from '../types';
import * as fs from 'fs';
import * as path from 'path';

// Đường dẫn tới file .env.test
const envTestPath = path.join(process.cwd(), '.env.test');

// Lấy thông tin từ file .env.test nếu có
let CONFLUENCE_API_TOKEN = env.confluence.apiToken;
let CONFLUENCE_EMAIL = env.confluence.email;

// Thử đọc token từ file .env.test trực tiếp (không qua dotenv vì nó không xử lý biến ${VAR})
try {
  if (fs.existsSync(envTestPath)) {
    const envContent = fs.readFileSync(envTestPath, 'utf8');
    
    // Đọc CONFLUENCE_API_TOKEN
    const tokenMatch = envContent.match(/CONFLUENCE_API_TOKEN=([^\n]+)/);
    if (tokenMatch && tokenMatch[1]) {
      CONFLUENCE_API_TOKEN = tokenMatch[1];
      console.log('Using Confluence token from .env.test file');
    }
    
    // Đọc CONFLUENCE_EMAIL
    const emailMatch = envContent.match(/CONFLUENCE_EMAIL=([^\n]+)/);
    if (emailMatch && emailMatch[1]) {
      CONFLUENCE_EMAIL = emailMatch[1];
      console.log('Using Confluence email from .env.test file');
    }
  }
} catch (err) {
  console.error('Error reading .env.test file:', err);
}

console.log('Using Confluence credentials:');
console.log(`- Email: ${CONFLUENCE_EMAIL}`);
console.log(`- Token length: ${CONFLUENCE_API_TOKEN?.length || 0}`);

// Đọc thông tin cấu hình project
const CONFLUENCE_DOMAIN = 'https://phuc-nt.atlassian.net';
const CONFLUENCE_SPACE_KEY = 'TX';

// Cấu hình cơ bản cho các yêu cầu API Confluence
const CONFLUENCE_API_BASE = `${CONFLUENCE_DOMAIN}/wiki/rest/api`;

// Tạo Auth header từ giá trị trực tiếp, không qua biến môi trường
const AUTH_HEADER = `Basic ${Buffer.from(`${CONFLUENCE_EMAIL}:${CONFLUENCE_API_TOKEN}`).toString('base64')}`;
console.log(`- Auth header length: ${AUTH_HEADER.length}`);

/**
 * Xử lý lỗi API từ Confluence
 */
function handleConfluenceError(error: any): ServiceResult<any> {
  console.error('Confluence API Error:', error);
  
  return {
    success: false,
    error: {
      message: error.message || 'Unknown Confluence API error',
      code: error.statusCode || 'UNKNOWN_ERROR',
      details: error.response?.data || {},
    },
  };
}

/**
 * Lấy danh sách tất cả các không gian trong Confluence
 */
export async function getSpaces(): Promise<ServiceResult<{ spaces: ConfluenceSpace[] }>> {
  try {
    console.log(`Fetching spaces from URL: ${CONFLUENCE_API_BASE}/space`);
    
    const response = await fetch(`${CONFLUENCE_API_BASE}/space`, {
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Confluence API response status: ${response.status}`);
    
    // Lấy dữ liệu phản hồi dù có lỗi hay không
    const result = await response.json();
    
    // Kiểm tra phản hồi có thành công không
    if (!response.ok) {
      throw new Error(`Failed to fetch spaces: ${response.statusText}`);
    }
    
    // Kiểm tra cấu trúc phản hồi có đúng không
    if (!result.results || !Array.isArray(result.results)) {
      console.warn('Unexpected response structure:', result);
      throw new Error('Unexpected response structure from Confluence API');
    }
    
    return {
      success: true,
      data: {
        spaces: result.results.map((space: any) => ({
          id: space.id,
          key: space.key,
          name: space.name,
          type: space.type,
          url: `${CONFLUENCE_DOMAIN}/spaces/${space.key}`
        }))
      }
    };
  } catch (error: any) {
    return handleConfluenceError(error);
  }
}

/**
 * Lấy danh sách tất cả các trang trong một không gian cụ thể
 */
export async function getPages(spaceKey: string = CONFLUENCE_SPACE_KEY): Promise<ServiceResult<{ pages: ConfluencePage[] }>> {
  try {
    const url = `${CONFLUENCE_API_BASE}/content?spaceKey=${spaceKey}&type=page&expand=version`;
    console.log(`Fetching pages from URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Confluence API response status: ${response.status}`);
    
    // Lấy dữ liệu phản hồi dù có lỗi hay không
    const result = await response.json();
    
    // Kiểm tra phản hồi có thành công không
    if (!response.ok) {
      throw new Error(`Failed to fetch pages: ${response.statusText}`);
    }
    
    // Kiểm tra cấu trúc phản hồi có đúng không
    if (!result.results || !Array.isArray(result.results)) {
      console.warn('Unexpected response structure:', result);
      throw new Error('Unexpected response structure from Confluence API');
    }
    
    return {
      success: true,
      data: {
        pages: result.results.map((page: any) => ({
          id: page.id,
          title: page.title,
          version: page.version?.number,
          lastUpdated: page.version?.when,
          spaceKey: spaceKey,
          url: `${CONFLUENCE_DOMAIN}${page._links?.webui || `/spaces/${spaceKey}/pages/${page.id}`}`
        }))
      }
    };
  } catch (error: any) {
    return handleConfluenceError(error);
  }
}

/**
 * Lấy nội dung của một trang cụ thể
 */
export async function getPageContent(pageId: string): Promise<ServiceResult<ConfluencePage>> {
  try {
    const url = `${CONFLUENCE_API_BASE}/content/${pageId}?expand=body.storage,version,space`;
    console.log(`Fetching page content from URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Confluence API response status: ${response.status}`);
    
    // Lấy dữ liệu phản hồi dù có lỗi hay không
    const page = await response.json();
    
    // Kiểm tra phản hồi có thành công không
    if (!response.ok) {
      throw new Error(`Failed to fetch page content: ${response.statusText}`);
    }
    
    return {
      success: true,
      data: {
        id: page.id,
        title: page.title,
        spaceKey: page.space?.key,
        content: page.body?.storage?.value,
        version: page.version?.number,
        lastUpdated: page.version?.when,
        url: `${CONFLUENCE_DOMAIN}${page._links?.webui || `/spaces/${page.space?.key}/pages/${page.id}`}`
      }
    };
  } catch (error: any) {
    return handleConfluenceError(error);
  }
}

/**
 * Tạo một trang mới trong Confluence
 */
export async function createPage(
  title: string, 
  content: string, 
  spaceKey: string = CONFLUENCE_SPACE_KEY,
  parentId?: string
): Promise<ServiceResult<ConfluencePage>> {
  try {
    const body: any = {
      type: 'page',
      title,
      space: { key: spaceKey },
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      }
    };
    
    // Nếu có parentId, thêm trang mới như một trang con
    if (parentId) {
      body.ancestors = [{ id: parentId }];
    }
    
    console.log(`Creating page in space "${spaceKey}" with title "${title}"`);
    console.log(`Using URL: ${CONFLUENCE_API_BASE}/content`);
    
    const response = await fetch(`${CONFLUENCE_API_BASE}/content`, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    console.log(`Confluence API response status: ${response.status}`);
    
    // Lấy dữ liệu phản hồi dù có lỗi hay không
    const result = await response.json();
    
    // Kiểm tra phản hồi có thành công không
    if (!response.ok) {
      console.error('Error creating page, response:', result);
      throw new Error(`Failed to create page: ${response.statusText}`);
    }
    
    return {
      success: true,
      data: {
        id: result.id,
        title: result.title,
        spaceKey: spaceKey,
        version: result.version?.number,
        url: `${CONFLUENCE_DOMAIN}${result._links?.webui || `/spaces/${spaceKey}/pages/${result.id}`}`
      }
    };
  } catch (error: any) {
    return handleConfluenceError(error);
  }
}

/**
 * Cập nhật nội dung của một trang
 */
export async function updatePage(
  pageId: string, 
  title: string, 
  content: string, 
  version?: number
): Promise<ServiceResult<ConfluencePage>> {
  try {
    // Đầu tiên, lấy thông tin trang hiện tại
    const pageResult = await getPageContent(pageId);
    
    if (!pageResult.success) {
      throw new Error(`Failed to get current page info: ${pageResult.error?.message}`);
    }
    
    const currentPage = pageResult.data;
    
    // Đảm bảo sử dụng version mới nhất từ API
    const currentVersion = currentPage?.version || 1;
    console.log(`Updating page ${pageId}: provided version=${version}, current version=${currentVersion}`);
    
    // Version mới phải tăng 1 so với version hiện tại
    const newVersion = currentVersion + 1;
    
    const response = await fetch(`${CONFLUENCE_API_BASE}/content/${pageId}`, {
      method: 'PUT',
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'page',
        title,
        version: {
          number: newVersion
        },
        body: {
          storage: {
            value: content,
            representation: 'storage'
          }
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error updating page:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(`Failed to update page: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      data: {
        id: result.id,
        title: result.title,
        spaceKey: currentPage?.spaceKey,
        version: result.version?.number,
        url: `${CONFLUENCE_DOMAIN}${result._links?.webui || `/spaces/${currentPage?.spaceKey}/pages/${result.id}`}`
      }
    };
  } catch (error: any) {
    return handleConfluenceError(error);
  }
}

/**
 * Tìm kiếm nội dung trong Confluence
 */
export async function searchContent(
  query: string, 
  spaceKey: string = CONFLUENCE_SPACE_KEY
): Promise<ServiceResult<{ results: ConfluencePage[] }>> {
  try {
    const cql = `siteSearch ~ "${query}" AND space = "${spaceKey}"`;
    const response = await fetch(`${CONFLUENCE_API_BASE}/content/search?cql=${encodeURIComponent(cql)}&expand=space,version`, {
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search content: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      data: {
        results: result.results.map((content: any) => ({
          id: content.id,
          title: content.title,
          spaceKey: content.space?.key,
          version: content.version?.number,
          lastUpdated: content.version?.when,
          url: `${CONFLUENCE_DOMAIN}${content._links?.webui || `/spaces/${content.space?.key}/pages/${content.id}`}`
        }))
      }
    };
  } catch (error: any) {
    return handleConfluenceError(error);
  }
} 