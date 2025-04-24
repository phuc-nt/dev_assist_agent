import { 
  defineTools,
  ToolDefinition,
  z
} from '@modelcontextprotocol/sdk';
import * as confluenceService from '../services/confluence';

/**
 * Định nghĩa các công cụ MCP cho Confluence
 */
export const confluenceTools = defineTools((tools) => ({
  /**
   * Liệt kê tất cả các không gian Confluence
   */
  list_confluence_spaces: tools.create({
    description: 'Lấy danh sách tất cả các không gian trong Confluence',
    parameters: z.object({}),
    handler: async () => {
      const result = await confluenceService.getSpaces();
      
      if (!result.success) {
        throw new Error(`Failed to fetch Confluence spaces: ${result.error?.message}`);
      }
      
      return {
        spaces: result.data?.spaces || []
      };
    }
  }),
  
  /**
   * Liệt kê tất cả các trang trong một không gian Confluence
   */
  list_confluence_pages: tools.create({
    description: 'Lấy danh sách tất cả các trang trong một không gian Confluence',
    parameters: z.object({
      spaceKey: z.string().optional().describe('Key của không gian, sử dụng không gian mặc định nếu không được chỉ định')
    }),
    handler: async (params) => {
      const result = await confluenceService.getPages(params.spaceKey);
      
      if (!result.success) {
        throw new Error(`Failed to fetch Confluence pages: ${result.error?.message}`);
      }
      
      return {
        pages: result.data?.pages || []
      };
    }
  }),
  
  /**
   * Lấy nội dung của một trang cụ thể
   */
  get_confluence_page_content: tools.create({
    description: 'Lấy nội dung chi tiết của một trang Confluence',
    parameters: z.object({
      pageId: z.string().describe('ID của trang cần lấy nội dung')
    }),
    handler: async (params) => {
      const result = await confluenceService.getPageContent(params.pageId);
      
      if (!result.success) {
        throw new Error(`Failed to get Confluence page content: ${result.error?.message}`);
      }
      
      return result.data;
    }
  }),
  
  /**
   * Tạo trang mới trong Confluence
   */
  create_confluence_page: tools.create({
    description: 'Tạo trang mới trong Confluence',
    parameters: z.object({
      title: z.string().describe('Tiêu đề của trang'),
      content: z.string().describe('Nội dung của trang (HTML)'),
      spaceKey: z.string().optional().describe('Key của không gian, sử dụng không gian mặc định nếu không được chỉ định'),
      parentId: z.string().optional().describe('ID của trang cha nếu đây là trang con')
    }),
    handler: async (params) => {
      const result = await confluenceService.createPage(
        params.title,
        params.content,
        params.spaceKey,
        params.parentId
      );
      
      if (!result.success) {
        throw new Error(`Failed to create Confluence page: ${result.error?.message}`);
      }
      
      return result.data;
    }
  }),
  
  /**
   * Cập nhật nội dung trang
   */
  update_confluence_page: tools.create({
    description: 'Cập nhật nội dung của một trang Confluence',
    parameters: z.object({
      pageId: z.string().describe('ID của trang cần cập nhật'),
      title: z.string().describe('Tiêu đề mới của trang'),
      content: z.string().describe('Nội dung mới của trang (HTML)'),
      version: z.number().describe('Số phiên bản hiện tại của trang')
    }),
    handler: async (params) => {
      const result = await confluenceService.updatePage(
        params.pageId,
        params.title,
        params.content,
        params.version
      );
      
      if (!result.success) {
        throw new Error(`Failed to update Confluence page: ${result.error?.message}`);
      }
      
      return result.data;
    }
  }),
  
  /**
   * Tìm kiếm nội dung trong Confluence
   */
  search_confluence_content: tools.create({
    description: 'Tìm kiếm nội dung trong Confluence',
    parameters: z.object({
      query: z.string().describe('Từ khóa tìm kiếm'),
      spaceKey: z.string().optional().describe('Key của không gian, sử dụng không gian mặc định nếu không được chỉ định')
    }),
    handler: async (params) => {
      const result = await confluenceService.searchContent(
        params.query,
        params.spaceKey
      );
      
      if (!result.success) {
        throw new Error(`Failed to search Confluence content: ${result.error?.message}`);
      }
      
      return {
        results: result.data?.results || []
      };
    }
  })
})); 