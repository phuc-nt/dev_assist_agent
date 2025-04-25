import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { callJiraApi, adfToMarkdown } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { JiraIssue, JiraComment, JiraTransition } from '../../utils/jira-interfaces.js';
import { McpResponse, createTextResponse, createErrorResponse, createResponseFromResult } from '../../utils/mcp-response.js';

// Khởi tạo logger
const logger = Logger.getLogger('JiraTools:getIssue');

// Schema cho tham số đầu vào
export const getIssueSchema = z.object({
  issueIdOrKey: z.string().describe('ID hoặc key của issue (ví dụ: PROJ-123)'),
});

type GetIssueParams = z.infer<typeof getIssueSchema>;

interface GetIssueResult {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: string;
  issueType: string;
  priority: string;
  assignee: string;
  reporter: string;
  created: string;
  updated: string;
  labels: string[];
  comments: {
    id: string;
    author: string;
    created: string;
    content: string;
  }[];
  availableTransitions?: {
    id: string;
    name: string;
  }[];
}

// Khai báo bổ sung thuộc tính transitions cho JiraIssue nếu có
interface JiraIssueWithTransitions extends JiraIssue {
  transitions?: JiraTransition[];
}

// Hàm xử lý chính để lấy thông tin chi tiết về một issue
export async function getIssueHandler(
  params: GetIssueParams,
  config: AtlassianConfig
): Promise<GetIssueResult> {
  try {
    logger.info(`Getting issue information for: ${params.issueIdOrKey}`);
    
    // Gọi Jira API để lấy chi tiết issue
    const issue = await callJiraApi<JiraIssueWithTransitions>(
      config,
      `/issue/${params.issueIdOrKey}?expand=renderedFields,names,transitions`,
      'GET'
    );
    
    // Chuyển đổi mô tả từ ADF sang Markdown nếu có
    let description = '';
    if (issue.fields && issue.fields.description) {
      description = adfToMarkdown(issue.fields.description);
    }
    
    // Chuyển đổi comments từ ADF sang Markdown nếu có
    let comments: GetIssueResult['comments'] = [];
    if (issue.fields && issue.fields.comment && issue.fields.comment.comments) {
      comments = issue.fields.comment.comments.map((comment: JiraComment) => {
        return {
          id: comment.id,
          author: comment.author.displayName,
          created: comment.created,
          content: adfToMarkdown(comment.body)
        };
      });
    }
    
    // Trả về dữ liệu đã xử lý
    const result: GetIssueResult = {
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description,
      status: issue.fields.status?.name || 'Không có trạng thái',
      issueType: issue.fields.issuetype.name,
      priority: issue.fields.priority?.name || 'Không có',
      assignee: issue.fields.assignee ? issue.fields.assignee.displayName : 'Chưa gán',
      reporter: issue.fields.reporter ? issue.fields.reporter.displayName : 'Không có',
      created: issue.fields.created || '',
      updated: issue.fields.updated || '',
      labels: issue.fields.labels || [],
      comments
    };
    
    // Thêm transitions nếu có
    if (issue.transitions) {
      result.availableTransitions = issue.transitions.map((t: JiraTransition) => ({
        id: t.id,
        name: t.name
      }));
    }
    
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error getting issue ${params.issueIdOrKey}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Không thể lấy thông tin issue: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Tạo và đăng ký tool với MCP Server
export const registerGetIssueTool = (server: McpServer) => {
  server.tool(
    'getIssue', 
    'Lấy thông tin chi tiết về một issue trong Jira',
    getIssueSchema.shape,
    async (params: GetIssueParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Lấy cấu hình Atlassian từ context
        const config = context.get('atlassianConfig') as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Cấu hình Atlassian không hợp lệ hoặc không tìm thấy');
        }
        
        // Lấy thông tin issue
        const result = await getIssueHandler(params, config);
        
        // Tạo nội dung trả về có định dạng
        const summary = `Issue ${result.key}: ${result.summary}`;
        const details = [
          `ID: ${result.id}`,
          `Key: ${result.key}`,
          `Tiêu đề: ${result.summary}`,
          `Trạng thái: ${result.status}`,
          `Loại: ${result.issueType}`,
          `Ưu tiên: ${result.priority}`,
          `Người được gán: ${result.assignee}`,
          `Người báo cáo: ${result.reporter}`,
          `Tạo lúc: ${result.created}`,
          `Cập nhật lúc: ${result.updated}`,
          `Nhãn: ${result.labels.join(', ') || 'Không có nhãn'}`,
          '',
          `Mô tả:`,
          result.description || 'Không có mô tả',
          '',
          `Số lượng comments: ${result.comments.length}`
        ].join('\n');
        
        return createTextResponse(details, result as unknown as Record<string, unknown>);
      } catch (error) {
        if (error instanceof ApiError) {
          return createErrorResponse(error.message, { 
            code: error.code, 
            statusCode: error.statusCode,
            type: error.type
          });
        }
        
        return createErrorResponse(
          `Lỗi khi lấy thông tin issue: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 