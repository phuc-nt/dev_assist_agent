import env from '../config/env';
import { ConfluenceSpace, ConfluencePage, ServiceResult } from '../types';

// Đọc thông tin cấu hình project từ tệp project_config_demo.json
// Trong thực tế, chúng ta nên đọc từ file cấu hình riêng và quản lý đúng cách
const CONFLUENCE_DOMAIN = 'https://phuc-nt.atlassian.net';
const CONFLUENCE_SPACE_KEY = 'TX';

// Cấu hình cơ bản cho các yêu cầu API Confluence
const CONFLUENCE_API_BASE = `${CONFLUENCE_DOMAIN}/wiki/rest/api`;
const AUTH_HEADER = `Basic ${Buffer.from(`${env.confluence.email}:${env.confluence.apiToken}`).toString('base64')}`;

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
    const response = await fetch(`${CONFLUENCE_API_BASE}/space`, {
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spaces: ${response.statusText}`);
    }
    
    const result = await response.json();
    
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
    const response = await fetch(`${CONFLUENCE_API_BASE}/content?spaceKey=${spaceKey}&type=page&expand=version`, {
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch pages: ${response.statusText}`);
    }
    
    const result = await response.json();
    
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
    const response = await fetch(`${CONFLUENCE_API_BASE}/content/${pageId}?expand=body.storage,version,space`, {
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page content: ${response.statusText}`);
    }
    
    const page = await response.json();
    
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
    
    const response = await fetch(`${CONFLUENCE_API_BASE}/content`, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create page: ${response.statusText}`);
    }
    
    const result = await response.json();
    
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
  version: number
): Promise<ServiceResult<ConfluencePage>> {
  try {
    // Đầu tiên, lấy thông tin trang hiện tại
    const pageResult = await getPageContent(pageId);
    
    if (!pageResult.success) {
      throw new Error(`Failed to get current page info: ${pageResult.error?.message}`);
    }
    
    const currentPage = pageResult.data;
    
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
          number: version
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