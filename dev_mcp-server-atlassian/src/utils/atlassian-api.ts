import axios from 'axios';
import { ApiError, ApiErrorType } from './error-handler.js';
import { Logger } from './logger.js';

/**
 * Utilites để gọi API Atlassian (Jira, Confluence)
 */

export interface AtlassianConfig {
  baseUrl: string;
  apiToken: string;
  email: string;
}

/**
 * Hàm tạo các header cơ bản cho API request
 * @param email Email người dùng
 * @param apiToken API token của người dùng
 * @returns Object chứa các header cơ bản
 */
const createBasicHeaders = (email: string, apiToken: string) => {
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

/**
 * Hàm gọi API Jira
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
    const headers = createBasicHeaders(config.email, config.apiToken);
    const url = `${config.baseUrl}/rest/api/3${endpoint}`;
    
    const response = await axios({
      method,
      url,
      headers,
      data,
      params
    });
    
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const responseData = error.response?.data || {};
      
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
        throw new ApiError(ApiErrorType.SERVER_ERROR, `Lỗi Jira API: ${error.message}`, statusCode, error);
      }
    }
    
    throw new ApiError(ApiErrorType.UNKNOWN_ERROR, `Lỗi không xác định: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}

/**
 * Hàm gọi API Confluence
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
    const url = `${config.baseUrl}/rest/api${endpoint}`;
    
    const response = await axios({
      method,
      url,
      headers,
      data,
      params
    });
    
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const responseData = error.response?.data || {};
      
      // Xử lý các mã lỗi phổ biến từ Confluence API
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
        throw new ApiError(ApiErrorType.SERVER_ERROR, `Lỗi Confluence API: ${error.message}`, statusCode, error);
      }
    }
    
    throw new ApiError(ApiErrorType.UNKNOWN_ERROR, `Lỗi không xác định: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}

/**
 * Chuyển đổi Atlassian Document Format sang Markdown đơn giản
 * @param content Nội dung ADF
 * @returns Nội dung Markdown
 */
export function adfToMarkdown(content: any): string {
  // Khởi tạo logger cho hàm chuyển đổi ADF
  const logger = Logger.getLogger('AdfConverter');
  
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
      case 'table':
        if (!node.content) return '';
        let tableMarkdown = '\n';
        
        // Xử lý các hàng
        node.content.forEach((row: any, rowIndex: number) => {
          if (!row.content) return;
          
          // Xử lý các ô trong hàng
          const cells = row.content.map((cell: any) => {
            const cellContent = cell.content ? cell.content.map(processNode).join('').trim() : '';
            return cellContent;
          });
          
          // Thêm hàng vào bảng
          tableMarkdown += `| ${cells.join(' | ')} |\n`;
          
          // Thêm phần ngăn cách cho header (row đầu tiên)
          if (rowIndex === 0) {
            tableMarkdown += `|${cells.map(() => ' --- |').join('')}\n`;
          }
        });
        
        return tableMarkdown + '\n';
      default:
        return node.content ? node.content.map(processNode).join('') : '';
    }
  };
  
  try {
    content.content.forEach((node: any) => {
      markdown += processNode(node);
    });
    return markdown;
  } catch (error) {
    logger.error('Error converting ADF to Markdown:', error);
    return 'Error converting content format';
  }
} 