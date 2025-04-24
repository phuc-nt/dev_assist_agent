import { 
  defineTools,
  ToolDefinition,
  z
} from '@modelcontextprotocol/sdk';
import * as jiraService from '../services/jira';

/**
 * Định nghĩa các công cụ MCP cho JIRA
 */
export const jiraTools = defineTools((tools) => ({
  /**
   * Liệt kê tất cả các dự án JIRA
   */
  list_jira_projects: tools.create({
    description: 'Lấy danh sách tất cả các dự án trong JIRA',
    parameters: z.object({}),
    handler: async () => {
      const result = await jiraService.fetchProjects();
      
      if (!result.success) {
        throw new Error(`Failed to fetch JIRA projects: ${result.error?.message}`);
      }
      
      return {
        projects: result.data?.projects || []
      };
    }
  }),
  
  /**
   * Tìm kiếm vấn đề trong JIRA
   */
  search_jira_issues: tools.create({
    description: 'Tìm kiếm vấn đề trong JIRA bằng JQL',
    parameters: z.object({
      jql: z.string().describe('Jira Query Language (JQL) để tìm kiếm vấn đề')
    }),
    handler: async (params) => {
      const result = await jiraService.searchIssues(params.jql);
      
      if (!result.success) {
        throw new Error(`Failed to search JIRA issues: ${result.error?.message}`);
      }
      
      return {
        total: result.data?.total || 0,
        issues: result.data?.issues || []
      };
    }
  }),
  
  /**
   * Lấy thông tin chi tiết của một vấn đề
   */
  get_jira_issue: tools.create({
    description: 'Lấy thông tin chi tiết về một vấn đề cụ thể',
    parameters: z.object({
      issueIdOrKey: z.string().describe('ID hoặc key của vấn đề cần lấy thông tin')
    }),
    handler: async (params) => {
      const result = await jiraService.getIssue(params.issueIdOrKey);
      
      if (!result.success) {
        throw new Error(`Failed to get JIRA issue: ${result.error?.message}`);
      }
      
      return result.data;
    }
  }),
  
  /**
   * Tạo vấn đề mới trong JIRA
   */
  create_jira_issue: tools.create({
    description: 'Tạo vấn đề mới trong JIRA',
    parameters: z.object({
      summary: z.string().describe('Tiêu đề của vấn đề'),
      description: z.string().describe('Mô tả chi tiết của vấn đề'),
      issueType: z.string().describe('Loại vấn đề (Task, Bug, Story, ...)'),
      projectKey: z.string().optional().describe('Key của dự án, sử dụng dự án mặc định nếu không được chỉ định')
    }),
    handler: async (params) => {
      const result = await jiraService.createIssue(
        params.summary,
        params.description,
        params.issueType,
        params.projectKey
      );
      
      if (!result.success) {
        throw new Error(`Failed to create JIRA issue: ${result.error?.message}`);
      }
      
      return result.data;
    }
  }),
  
  /**
   * Cập nhật trạng thái vấn đề
   */
  update_jira_issue: tools.create({
    description: 'Cập nhật trạng thái của một vấn đề trong JIRA',
    parameters: z.object({
      issueIdOrKey: z.string().describe('ID hoặc key của vấn đề cần cập nhật'),
      statusName: z.string().describe('Tên trạng thái mới')
    }),
    handler: async (params) => {
      const result = await jiraService.updateIssueStatus(
        params.issueIdOrKey,
        params.statusName
      );
      
      if (!result.success) {
        throw new Error(`Failed to update JIRA issue status: ${result.error?.message}`);
      }
      
      return result.data;
    }
  }),
  
  /**
   * Thêm bình luận vào vấn đề
   */
  add_jira_comment: tools.create({
    description: 'Thêm bình luận vào một vấn đề trong JIRA',
    parameters: z.object({
      issueIdOrKey: z.string().describe('ID hoặc key của vấn đề cần thêm bình luận'),
      commentText: z.string().describe('Nội dung bình luận')
    }),
    handler: async (params) => {
      const result = await jiraService.addComment(
        params.issueIdOrKey,
        params.commentText
      );
      
      if (!result.success) {
        throw new Error(`Failed to add comment to JIRA issue: ${result.error?.message}`);
      }
      
      return result.data;
    }
  })
})); 