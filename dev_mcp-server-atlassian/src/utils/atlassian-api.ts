import { Version3Client, Version3Models } from 'jira.js';
import { ApiError, ApiErrorType } from './error-handler.js';
import { Logger } from './logger.js';
import fetch from 'cross-fetch';

/**
 * Utilites để gọi API Atlassian (Jira, Confluence)
 */

export interface AtlassianConfig {
  baseUrl: string;
  apiToken: string;
  email: string;
}

// Khởi tạo logger
const logger = Logger.getLogger('AtlassianAPI');

// Cache cho các client Atlassian để tái sử dụng
const clientCache = new Map<string, Version3Client>();

/**
 * Hàm tạo các header cơ bản cho API request
 * @param email Email người dùng
 * @param apiToken API token của người dùng
 * @returns Object chứa các header cơ bản
 */
const createBasicHeaders = (email: string, apiToken: string) => {
  // Loại bỏ khoảng trắng và xuống dòng từ API token
  const cleanedToken = apiToken.replace(/\s+/g, '');
  
  // Luôn sử dụng Basic Authentication theo tài liệu tham khảo API
  const auth = Buffer.from(`${email}:${cleanedToken}`).toString('base64');
  
  // Log headers được tạo ra để debug
  logger.debug('Creating headers with User-Agent:', 'MCP-Atlassian-Server/1.0.0');
  
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Thêm User-Agent để giúp Cloudfront xác định request
    'User-Agent': 'MCP-Atlassian-Server/1.0.0'
  };
};

/**
 * Hàm tạo hoặc lấy client Jira từ cache
 * @param config Cấu hình Atlassian
 * @returns Jira API client
 */
export function getJiraClient(config: AtlassianConfig): Version3Client {
  const cacheKey = `jira:${config.baseUrl}:${config.email}`;
  
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey) as Version3Client;
  }
  
  logger.debug(`Creating new Jira client for ${config.baseUrl}`);
  
  // Chuẩn hóa baseUrl
  let baseUrl = config.baseUrl;
  if (baseUrl.startsWith('http://')) {
    baseUrl = baseUrl.replace('http://', 'https://');
  } else if (!baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  // Đảm bảo có .atlassian.net trong URL
  if (!baseUrl.includes('.atlassian.net')) {
    baseUrl = `${baseUrl}.atlassian.net`;
  }
  
  // Xử lý trường hợp bị duplicate phần .atlassian.net
  if (baseUrl.match(/\.atlassian\.net\.atlassian\.net/)) {
    baseUrl = baseUrl.replace('.atlassian.net.atlassian.net', '.atlassian.net');
  }
  
  // Tạo client Jira sử dụng jira.js
  const client = new Version3Client({
    host: baseUrl,
    authentication: {
      basic: {
        email: config.email,
        apiToken: config.apiToken,
      },
    },
    // Tùy chọn cấu hình cơ bản cho request
    baseRequestConfig: {
      headers: {
        'User-Agent': 'MCP-Atlassian-Server/1.0.0',
      },
    },
  });
  
  // Lưu vào cache để tái sử dụng
  clientCache.set(cacheKey, client);
  return client;
}

/**
 * Hàm gọi API Jira sử dụng jira.js
 * @param config Cấu hình Atlassian (baseUrl, apiToken, email)
 * @param endpoint Đường dẫn API endpoint
 * @param method HTTP method (GET, POST, PUT, DELETE)
 * @param data Dữ liệu gửi đi (body)
 * @param params Tham số query
 * @returns Promise với kết quả từ API
 */
export async function callJiraApi<T>(
  config: AtlassianConfig,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data: any = null,
  params: Record<string, any> = {}
): Promise<T> {
  try {
    const client = getJiraClient(config);
    
    logger.debug(`Calling Jira API with jira.js: ${method} ${endpoint}`);
    
    // Tùy vào endpoint và method, gọi đúng function của jira.js client
    // Ví dụ: client.issues.getIssue({ issueIdOrKey: 'PROJECT-1' })
    // Đây là một hàm helper generic, cần xử lý cụ thể cho từng API endpoint
    
    // Phần này yêu cầu triển khai cụ thể cho từng endpoint,
    // vì jira.js đã tổ chức API theo nhóm và phương thức
    // Cần viết các wrapper functions riêng cho từng nhóm API
    
    // Hàm dummy này chỉ là ví dụ, cần được thay thế bằng triển khai thực tế
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR, 
      'Phương thức gọi API này chưa được triển khai với jira.js. Hãy sử dụng các phương thức cụ thể.', 
      501
    );
  } catch (error: any) {
    logger.error(`Jira API error with jira.js:`, error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Xử lý lỗi từ jira.js
    const statusCode = error.response?.status || 500;
    const errorMessage = error.message || 'Unknown error';
    
    // Xử lý các mã lỗi phổ biến từ Jira API
    if (statusCode === 400) {
      throw new ApiError(ApiErrorType.VALIDATION_ERROR, 'Yêu cầu không hợp lệ', statusCode, error);
    } else if (statusCode === 401) {
      throw new ApiError(ApiErrorType.AUTHENTICATION_ERROR, 'Không được ủy quyền. Kiểm tra thông tin xác thực', statusCode, error);
    } else if (statusCode === 403) {
      throw new ApiError(ApiErrorType.AUTHORIZATION_ERROR, 'Không có quyền truy cập vào tài nguyên', statusCode, error);
    } else if (statusCode === 404) {
      throw new ApiError(ApiErrorType.NOT_FOUND_ERROR, 'Tài nguyên không tìm thấy', statusCode, error);
    } else if (statusCode === 429) {
      throw new ApiError(ApiErrorType.RATE_LIMIT_ERROR, 'Đã vượt quá giới hạn tỉ lệ API', statusCode, error);
    } else {
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Lỗi Jira API: ${errorMessage}`, statusCode, error);
    }
  }
}

/**
 * Hàm gọi API Confluence sử dụng fetch với User-Agent phù hợp
 * @param config Cấu hình Atlassian (baseUrl, apiToken, email)
 * @param endpoint Đường dẫn API endpoint
 * @param method HTTP method (GET, POST, PUT, DELETE)
 * @param data Dữ liệu gửi đi (body)
 * @param params Tham số query
 * @returns Promise với kết quả từ API
 */
export async function callConfluenceApi<T>(
  config: AtlassianConfig,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data: any = null,
  params: Record<string, any> = {}
): Promise<T> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    
    // Chuẩn hóa baseUrl
    let baseUrl = config.baseUrl;
    if (baseUrl.startsWith('http://')) {
      baseUrl = baseUrl.replace('http://', 'https://');
    } else if (!baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    // Đảm bảo có .atlassian.net trong URL
    if (!baseUrl.includes('.atlassian.net')) {
      baseUrl = `${baseUrl}.atlassian.net`;
    }
    
    // Xử lý trường hợp bị duplicate phần .atlassian.net
    if (baseUrl.match(/\.atlassian\.net\.atlassian\.net/)) {
      baseUrl = baseUrl.replace('.atlassian.net.atlassian.net', '.atlassian.net');
    }
    
    // URL API Confluence theo tài liệu
    let url = `${baseUrl}/wiki/rest/api${endpoint}`;
    
    // Thêm params vào URL nếu có
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      url += `?${queryParams.toString()}`;
    }
    
    // Log đầy đủ chi tiết để debug
    logger.debug(`Calling Confluence API: ${method} ${url}`);
    logger.debug(`With Auth: ${config.email}:*****`);
    logger.debug(`Token length: ${config.apiToken?.length || 0} characters`);
    logger.debug('Full request headers:', JSON.stringify(headers, (key, value) => 
      key === 'Authorization' ? 'Basic ***' : value, 2));
    
    // In lệnh curl để debug trực tiếp - theo format của tài liệu API
    const curlCmd = `curl -X ${method} -H "Content-Type: application/json" -H "Accept: application/json" -H "User-Agent: MCP-Atlassian-Server/1.0.0" -u "${config.email}:${config.apiToken.substring(0, 5)}..." "${url}"${
      data && (method === 'POST' || method === 'PUT') ? ` -d '${JSON.stringify(data)}'` : ''
    }`;
    logger.info(`Debug with curl: ${curlCmd}`);
    
    // Tạo fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
      credentials: 'omit' // Không gửi cookies
    };
    
    // Thêm body nếu cần
    if (data && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(data);
    }
    
    logger.debug('Fetch options:', {
      ...fetchOptions,
      headers: { ...headers, Authorization: 'Basic ***' }
    });
    
    // Sử dụng fetch
    const response = await fetch(url, fetchOptions);
    
    // Kiểm tra status code
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      
      // Log chi tiết error từ response
      logger.error(`Confluence API error (${statusCode}):`, responseText);
      
      // Xử lý các mã lỗi phổ biến từ Confluence API
      if (statusCode === 400) {
        throw new ApiError(ApiErrorType.VALIDATION_ERROR, 'Yêu cầu không hợp lệ', statusCode, new Error(responseText));
      } else if (statusCode === 401) {
        throw new ApiError(ApiErrorType.AUTHENTICATION_ERROR, 'Không được ủy quyền. Kiểm tra thông tin xác thực', statusCode, new Error(responseText));
      } else if (statusCode === 403) {
        throw new ApiError(ApiErrorType.AUTHORIZATION_ERROR, 'Không có quyền truy cập vào tài nguyên', statusCode, new Error(responseText));
      } else if (statusCode === 404) {
        throw new ApiError(ApiErrorType.NOT_FOUND_ERROR, 'Tài nguyên không tìm thấy', statusCode, new Error(responseText));
      } else if (statusCode === 429) {
        throw new ApiError(ApiErrorType.RATE_LIMIT_ERROR, 'Đã vượt quá giới hạn tỉ lệ API', statusCode, new Error(responseText));
      } else {
        throw new ApiError(ApiErrorType.SERVER_ERROR, `Lỗi Confluence API: ${responseText}`, statusCode, new Error(responseText));
      }
    }
    
    // Parse JSON
    const responseData = await response.json();
    return responseData as T;
  } catch (error: any) {
    // Xử lý các lỗi không được xử lý bởi fetch
    if (error instanceof ApiError) {
      throw error; // Đã được xử lý ở trên
    }
    
    logger.error('Unhandled error in Confluence API call:', error);
    throw new ApiError(ApiErrorType.UNKNOWN_ERROR, `Lỗi không xác định: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}

/**
 * Hàm lấy thông tin về một issue
 * @param config Cấu hình Atlassian
 * @param issueIdOrKey ID hoặc key của issue
 * @returns Thông tin về issue
 */
export async function getIssue(
  config: AtlassianConfig,
  issueIdOrKey: string
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    
    // Chuẩn hóa baseUrl
    let baseUrl = config.baseUrl;
    if (baseUrl.startsWith('http://')) {
      baseUrl = baseUrl.replace('http://', 'https://');
    } else if (!baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    // Đảm bảo có .atlassian.net trong URL
    if (!baseUrl.includes('.atlassian.net')) {
      baseUrl = `${baseUrl}.atlassian.net`;
    }
    
    // Xử lý trường hợp bị duplicate phần .atlassian.net
    if (baseUrl.match(/\.atlassian\.net\.atlassian\.net/)) {
      baseUrl = baseUrl.replace('.atlassian.net.atlassian.net', '.atlassian.net');
    }
    
    // URL API Jira theo tài liệu
    const url = `${baseUrl}/rest/api/3/issue/${issueIdOrKey}?expand=renderedFields,names,schema,operations`;
    
    logger.debug(`Getting issue with direct fetch: ${url}`);
    logger.debug(`With Auth: ${config.email}:*****`);
    
    // In lệnh curl để debug trực tiếp
    const curlCmd = `curl -X GET -H "Content-Type: application/json" -H "Accept: application/json" -H "User-Agent: MCP-Atlassian-Server/1.0.0" -u "${config.email}:${config.apiToken.substring(0, 5)}..." "${url}"`;
    logger.info(`Debug with curl: ${curlCmd}`);
    
    // Sử dụng fetch
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'omit' // Không gửi cookies
    });
    
    // Kiểm tra status code
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      
      // Log chi tiết error từ response
      logger.error(`Jira API error (${statusCode}):`, responseText);
      
      // Xử lý các mã lỗi phổ biến từ Jira API
      if (statusCode === 400) {
        throw new ApiError(ApiErrorType.VALIDATION_ERROR, 'Yêu cầu không hợp lệ', statusCode, new Error(responseText));
      } else if (statusCode === 401) {
        throw new ApiError(ApiErrorType.AUTHENTICATION_ERROR, 'Không được ủy quyền. Kiểm tra thông tin xác thực', statusCode, new Error(responseText));
      } else if (statusCode === 403) {
        throw new ApiError(ApiErrorType.AUTHORIZATION_ERROR, 'Không có quyền truy cập vào tài nguyên', statusCode, new Error(responseText));
      } else if (statusCode === 404) {
        throw new ApiError(ApiErrorType.NOT_FOUND_ERROR, `Issue ${issueIdOrKey} không tìm thấy`, statusCode, new Error(responseText));
      } else if (statusCode === 429) {
        throw new ApiError(ApiErrorType.RATE_LIMIT_ERROR, 'Đã vượt quá giới hạn tỉ lệ API', statusCode, new Error(responseText));
      } else {
        throw new ApiError(ApiErrorType.SERVER_ERROR, `Lỗi Jira API: ${responseText}`, statusCode, new Error(responseText));
      }
    }
    
    // Parse JSON
    const issue = await response.json();
    return issue;
  } catch (error: any) {
    logger.error(`Error getting issue ${issueIdOrKey}:`, error);
    
    if (error instanceof ApiError) {
      throw error; // Đã được xử lý ở trên
    }
    
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Lỗi khi lấy thông tin issue: ${error instanceof Error ? error.message : String(error)}`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Hàm tìm kiếm issues theo JQL
 * @param config Cấu hình Atlassian
 * @param jql JQL query string
 * @param maxResults Số lượng kết quả tối đa
 * @returns Danh sách issues
 */
export async function searchIssues(
  config: AtlassianConfig,
  jql: string,
  maxResults: number = 50
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    
    // Chuẩn hóa baseUrl
    let baseUrl = config.baseUrl;
    if (baseUrl.startsWith('http://')) {
      baseUrl = baseUrl.replace('http://', 'https://');
    } else if (!baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    // Đảm bảo có .atlassian.net trong URL
    if (!baseUrl.includes('.atlassian.net')) {
      baseUrl = `${baseUrl}.atlassian.net`;
    }
    
    // Xử lý trường hợp bị duplicate phần .atlassian.net
    if (baseUrl.match(/\.atlassian\.net\.atlassian\.net/)) {
      baseUrl = baseUrl.replace('.atlassian.net.atlassian.net', '.atlassian.net');
    }
    
    // URL API Jira search theo tài liệu
    const url = `${baseUrl}/rest/api/3/search`;
    
    logger.debug(`Searching issues with JQL: ${jql}`);
    logger.debug(`With Auth: ${config.email}:*****`);
    
    // Data cho request
    const data = {
      jql,
      maxResults,
      expand: ['names', 'schema', 'operations']
    };
    
    // In lệnh curl để debug trực tiếp
    const curlCmd = `curl -X POST -H "Content-Type: application/json" -H "Accept: application/json" -H "User-Agent: MCP-Atlassian-Server/1.0.0" -u "${config.email}:${config.apiToken.substring(0, 5)}..." "${url}" -d '${JSON.stringify(data)}'`;
    logger.info(`Debug with curl: ${curlCmd}`);
    
    // Sử dụng fetch
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit' // Không gửi cookies
    });
    
    // Kiểm tra status code
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      
      // Log chi tiết error từ response
      logger.error(`Jira API error (${statusCode}):`, responseText);
      
      // Xử lý các mã lỗi phổ biến từ Jira API
      if (statusCode === 400) {
        throw new ApiError(ApiErrorType.VALIDATION_ERROR, 'JQL không hợp lệ hoặc yêu cầu không hợp lệ', statusCode, new Error(responseText));
      } else if (statusCode === 401) {
        throw new ApiError(ApiErrorType.AUTHENTICATION_ERROR, 'Không được ủy quyền. Kiểm tra thông tin xác thực', statusCode, new Error(responseText));
      } else if (statusCode === 403) {
        throw new ApiError(ApiErrorType.AUTHORIZATION_ERROR, 'Không có quyền truy cập để tìm kiếm issues', statusCode, new Error(responseText));
      } else if (statusCode === 429) {
        throw new ApiError(ApiErrorType.RATE_LIMIT_ERROR, 'Đã vượt quá giới hạn tỉ lệ API', statusCode, new Error(responseText));
      } else {
        throw new ApiError(ApiErrorType.SERVER_ERROR, `Lỗi Jira API: ${responseText}`, statusCode, new Error(responseText));
      }
    }
    
    // Parse JSON
    const searchResults = await response.json();
    return searchResults;
  } catch (error: any) {
    logger.error(`Error searching issues:`, error);
    
    if (error instanceof ApiError) {
      throw error; // Đã được xử lý ở trên
    }
    
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Lỗi khi tìm kiếm issues: ${error instanceof Error ? error.message : String(error)}`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Hàm chuyển đổi Atlassian Document Format sang Markdown đơn giản
 * @param content Nội dung ADF
 * @returns Chuỗi Markdown
 */
export function adfToMarkdown(content: any): string {
  if (!content || !content.content) return '';
  
  let markdown = '';
  
  const processNode = (node: any): string => {
    if (!node) return '';
    
    switch (node.type) {
      case 'paragraph':
        return node.content ? node.content.map(processNode).join('') + '\n\n' : '\n\n';
      case 'text':
        let text = node.text || '';
        if (node.marks) {
          node.marks.forEach((mark: any) => {
            switch (mark.type) {
              case 'strong':
                text = `**${text}**`;
                break;
              case 'em':
                text = `*${text}*`;
                break;
              case 'code':
                text = `\`${text}\``;
                break;
              case 'link':
                text = `[${text}](${mark.attrs.href})`;
                break;
            }
          });
        }
        return text;
      case 'heading':
        const level = node.attrs.level;
        const headingContent = node.content ? node.content.map(processNode).join('') : '';
        return '#'.repeat(level) + ' ' + headingContent + '\n\n';
      case 'bulletList':
        return node.content ? node.content.map(processNode).join('') : '';
      case 'listItem':
        return '- ' + (node.content ? node.content.map(processNode).join('') : '') + '\n';
      case 'orderedList':
        return node.content ? node.content.map((item: any, index: number) => {
          return `${index + 1}. ${processNode(item)}`;
        }).join('') : '';
      case 'codeBlock':
        const code = node.content ? node.content.map(processNode).join('') : '';
        const language = node.attrs && node.attrs.language ? node.attrs.language : '';
        return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
      default:
        return node.content ? node.content.map(processNode).join('') : '';
    }
  };
  
  content.content.forEach((node: any) => {
    markdown += processNode(node);
  });
  
  return markdown;
} 