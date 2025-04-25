import { z } from 'zod';
import { callJiraApi } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Khởi tạo logger
const logger = Logger.getLogger('JiraTools:transitionIssue');

// Schema cho tham số đầu vào
export const transitionIssueSchema = z.object({
  issueIdOrKey: z.string().describe('ID hoặc key của issue (ví dụ: PROJ-123)'),
  transitionId: z.string().describe('ID của transition cần áp dụng'),
  comment: z.string().optional().describe('Comment khi thực hiện transition')
});

type TransitionIssueParams = z.infer<typeof transitionIssueSchema>;

interface TransitionIssueResult {
  issueIdOrKey: string;
  success: boolean;
  transitionId: string;
  message: string;
}

// Hàm xử lý chính để chuyển trạng thái issue
export async function transitionIssueHandler(
  params: TransitionIssueParams,
  config: AtlassianConfig
): Promise<TransitionIssueResult> {
  try {
    logger.info(`Transitioning issue ${params.issueIdOrKey} with transition ${params.transitionId}`);
    
    // Chuẩn bị dữ liệu cho API call
    const requestData: any = {
      transition: {
        id: params.transitionId
      }
    };
    
    // Thêm comment nếu có
    if (params.comment) {
      requestData.update = {
        comment: [
          {
            add: {
              body: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: params.comment
                      }
                    ]
                  }
                ]
              }
            }
          }
        ]
      };
    }
    
    // Gọi Jira API để thực hiện transition
    await callJiraApi(
      config,
      `/issue/${params.issueIdOrKey}/transitions`,
      'POST',
      requestData
    );
    
    return {
      issueIdOrKey: params.issueIdOrKey,
      success: true,
      transitionId: params.transitionId,
      message: 'Đã chuyển trạng thái issue thành công'
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error transitioning issue ${params.issueIdOrKey}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Không thể chuyển trạng thái issue: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Tạo và đăng ký tool với MCP Server
export const registerTransitionIssueTool = (server: McpServer) => {
  server.tool(
    'transitionIssue',
    'Chuyển trạng thái của một issue trong Jira',
    transitionIssueSchema.shape,
    async (params: TransitionIssueParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Lấy cấu hình Atlassian từ context
        const config = context.get('atlassianConfig') as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Cấu hình Atlassian không hợp lệ hoặc không tìm thấy');
        }
        
        const result = await transitionIssueHandler(params, config);
        
        return createTextResponse(
          result.message,
          {
            issueIdOrKey: result.issueIdOrKey,
            transitionId: result.transitionId,
            success: result.success
          }
        );
      } catch (error) {
        if (error instanceof ApiError) {
          return createErrorResponse(error.message, {
            code: error.code,
            statusCode: error.statusCode,
            type: error.type
          });
        }
        
        return createErrorResponse(
          `Lỗi khi chuyển trạng thái issue: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 