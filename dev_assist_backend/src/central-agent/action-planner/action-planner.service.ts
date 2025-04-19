import { Injectable } from '@nestjs/common';
import { OpenaiService } from '../../openai/openai.service';
import { ActionPlan, ActionStep, StepStatus, PlanStatus, AgentType } from '../models/action-plan.model';
import { EnhancedLogger } from '../../utils/logger';

@Injectable()
export class ActionPlanner {
  private readonly logger = EnhancedLogger.getLogger(ActionPlanner.name);
  
  constructor(private readonly openaiService: OpenaiService) {}
  
  async createPlan(processedInput: string): Promise<ActionPlan> {
    try {
      // Chuẩn bị prompt cho OpenAI
      const systemPrompt = this.getSystemPrompt();
      const userPrompt = this.getUserPrompt(processedInput);
      
      // Gọi OpenAI API
      const response = await this.openaiService.chatWithFunctionCalling(systemPrompt, userPrompt);
      
      // Xử lý markdown nếu có
      const cleanedResponse = this.cleanMarkdownCodeBlocks(response);
      this.logger.debug(`Cleaned response: ${cleanedResponse}`);
      
      // Parse kết quả JSON từ response
      try {
        const planData = JSON.parse(cleanedResponse);
        
        // Xác thực dữ liệu trả về
        if (!planData.steps || !Array.isArray(planData.steps) || planData.steps.length === 0) {
          throw new Error('Kết quả không hợp lệ: Thiếu hoặc định dạng steps không đúng');
        }
        
        // Tạo ActionPlan từ dữ liệu
        const plan: ActionPlan = {
          steps: planData.steps.map(s => ({
            ...s,
            agentType: this.validateAgentType(s.agentType),
            dependsOn: Array.isArray(s.dependsOn) ? s.dependsOn : [],
            maxRetries: s.maxRetries || 2,
            retryCount: 0,
            status: StepStatus.PENDING,
          })),
          currentStepIndex: 0,
          executionContext: {},
          status: PlanStatus.CREATED,
          overallProgress: 0,
        };
        
        return plan;
      } catch (error) {
        this.logger.error(`Error parsing response: ${error.message}`);
        this.logger.debug(`Response content: ${response}`);
        throw new Error(`Không thể tạo kế hoạch: ${error.message}`);
      }
    } catch (error) {
      this.logger.error(`Error creating action plan: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Xử lý response có chứa markdown code blocks
   */
  private cleanMarkdownCodeBlocks(text: string): string {
    // Kiểm tra xem text có bắt đầu bằng markdown code block hay không
    if (text.trimStart().startsWith('```')) {
      // Tìm kết thúc của code block đầu tiên nếu có
      const codeBlockRegex = /```(?:json)?\s*\n([\s\S]*?)```/;
      const match = text.match(codeBlockRegex);
      
      if (match && match[1]) {
        // Trả về nội dung bên trong code block
        return match[1].trim();
      }
    }
    
    // Nếu không phải markdown hoặc không tìm thấy code block, trả về text gốc
    return text;
  }
  
  private validateAgentType(agentType: string): AgentType {
    // Đảm bảo agentType hợp lệ
    const normalized = agentType?.toUpperCase();
    if (normalized in AgentType) {
      return AgentType[normalized];
    }
    throw new Error(`Agent type không hợp lệ: ${agentType}`);
  }
  
  private getSystemPrompt(): string {
    return `
Bạn là một AI assistant được thiết kế để lập kế hoạch hành động từ mô tả yêu cầu.

Với mỗi yêu cầu đã được xử lý, hãy:
1. Xác định các bước cần thực hiện
2. Xác định agent phù hợp cho mỗi bước (JIRA, SLACK, EMAIL, CALENDAR, MEETING_ROOM)
3. Tạo prompt ngôn ngữ tự nhiên chi tiết cho mỗi agent
4. Thiết lập quan hệ phụ thuộc giữa các bước
5. Thêm điều kiện cho các bước nếu cần

Trả về kế hoạch dưới dạng JSON với cấu trúc:
{
  "steps": [
    {
      "id": "step1",
      "agentType": "JIRA",
      "prompt": "Chi tiết prompt cho JIRA agent...",
      "dependsOn": [],
      "condition": null,
      "maxRetries": 2,
      "timeout": 15000
    },
    ...
  ]
}

QUAN TRỌNG: Trả về JSON thuần túy, không bọc trong markdown code block.
    `;
  }
  
  private getUserPrompt(processedInput: string): string {
    return `
Dựa trên yêu cầu đã được phân tích sau:

${processedInput}

Tạo kế hoạch thực hiện bao gồm các bước với thông tin:
1. ID của bước
2. Loại agent cần gọi (JIRA, SLACK, EMAIL, CALENDAR, MEETING_ROOM)
3. Prompt ngôn ngữ tự nhiên chi tiết cho agent đó
4. Các bước phụ thuộc (nếu có)
5. Điều kiện thực hiện (nếu có)

Các prompt cần chứa đủ thông tin để Sub-Agent có thể tự xác định hành động cụ thể.
QUAN TRỌNG: Trả về JSON thuần túy, không bọc trong markdown code block.
    `;
  }
} 