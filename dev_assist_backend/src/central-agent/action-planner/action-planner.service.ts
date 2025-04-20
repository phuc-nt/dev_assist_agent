import { Injectable } from '@nestjs/common';
import { OpenaiService } from '../../openai/openai.service';
import {
  ActionPlan,
  ActionStep,
  StepStatus,
  PlanStatus,
  AgentType,
} from '../models/action-plan.model';
import { EnhancedLogger } from '../../utils/logger';

@Injectable()
export class ActionPlanner {
  private readonly logger = EnhancedLogger.getLogger(ActionPlanner.name);

  constructor(private readonly openaiService: OpenaiService) {}

  async createPlan(processedInput: string): Promise<ActionPlan> {
    try {
      const currentConfig = this.openaiService.getLLMConfig();
      this.logger.log(
        `ActionPlanner sử dụng model: ${currentConfig.model}, temperature: ${currentConfig.temperature}`,
      );

      // Chuẩn bị prompt cho OpenAI
      const systemPrompt = this.getSystemPrompt();
      const userPrompt = this.getUserPrompt(processedInput);

      this.logger.debug(
        'Bắt đầu gọi chatWithFunctionCalling với system prompt và user prompt',
      );
      // Gọi OpenAI API
      const response = await this.openaiService.chatWithFunctionCalling(
        systemPrompt,
        userPrompt,
      );

      // Xử lý markdown nếu có
      const cleanedResponse = this.cleanMarkdownCodeBlocks(response);
      this.logger.debug(`Cleaned response: ${cleanedResponse}`);

      // Parse kết quả JSON từ response
      try {
        const planData = JSON.parse(cleanedResponse);

        // Xác thực dữ liệu trả về
        if (
          !planData.steps ||
          !Array.isArray(planData.steps) ||
          planData.steps.length === 0
        ) {
          throw new Error(
            'Kết quả không hợp lệ: Thiếu hoặc định dạng steps không đúng',
          );
        }

        this.logger.debug(`Tạo kế hoạch với ${planData.steps.length} bước`);
        // Tạo ActionPlan từ dữ liệu
        const plan: ActionPlan = {
          steps: planData.steps.map((s) => ({
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
   * Đánh giá kết quả của một bước thực thi
   * Trả về đánh giá về kết quả: thành công hay thất bại, và lý do
   */
  async evaluateStepResult(
    stepToEvaluate: ActionStep,
    plan: ActionPlan,
  ): Promise<{
    success: boolean;
    reason: string;
    needsAdjustment: boolean;
  }> {
    try {
      this.logger.log(`Đánh giá kết quả của bước ${stepToEvaluate.id}`);

      // Nếu không có kết quả, không thể đánh giá
      if (!stepToEvaluate.result) {
        return {
          success: false,
          reason: 'Không có kết quả để đánh giá',
          needsAdjustment: false,
        };
      }

      // Chuẩn bị prompt cho OpenAI để đánh giá kết quả
      const systemPrompt = this.getStepEvaluationSystemPrompt();
      const userPrompt = this.getStepEvaluationUserPrompt(stepToEvaluate, plan);

      // Gọi OpenAI API để đánh giá kết quả
      const response = await this.openaiService.chatWithFunctionCalling(
        systemPrompt,
        userPrompt,
      );

      try {
        // Parse kết quả JSON từ response
        const cleanedResponse = this.cleanMarkdownCodeBlocks(response);
        const evaluationResult = JSON.parse(cleanedResponse);

        if (
          typeof evaluationResult.success !== 'boolean' ||
          !evaluationResult.reason
        ) {
          throw new Error('Kết quả đánh giá không hợp lệ');
        }

        // Log kết quả đánh giá
        this.logger.log(
          `Đánh giá bước ${stepToEvaluate.id}: ${evaluationResult.success ? 'Thành công' : 'Thất bại'} - ${evaluationResult.reason}`,
        );

        return {
          success: evaluationResult.success,
          reason: evaluationResult.reason,
          needsAdjustment: evaluationResult.needsAdjustment === true,
        };
      } catch (error) {
        this.logger.error(
          `Lỗi khi phân tích kết quả đánh giá: ${error.message}`,
        );
        // Mặc định sử dụng kết quả .success từ agent nếu không thể phân tích
        return {
          success: stepToEvaluate.result.success,
          reason: `Không thể đánh giá chi tiết, sử dụng kết quả từ agent: ${stepToEvaluate.result.success ? 'Thành công' : 'Thất bại'}`,
          needsAdjustment: false,
        };
      }
    } catch (error) {
      this.logger.error(
        `Lỗi khi đánh giá kết quả bước ${stepToEvaluate.id}: ${error.message}`,
      );
      return {
        success: false,
        reason: `Lỗi khi đánh giá: ${error.message}`,
        needsAdjustment: false,
      };
    }
  }

  /**
   * Điều chỉnh kế hoạch khi gặp lỗi hoặc cần thay đổi giữa chừng
   */
  async adjustPlan(adjustmentInfo: {
    originalPlan: ActionPlan;
    failedStep: ActionStep;
    failedStepResult: any;
    currentExecutionContext: Record<string, any>;
    reason: string;
  }): Promise<ActionPlan | null> {
    try {
      const {
        originalPlan,
        failedStep,
        failedStepResult,
        currentExecutionContext,
        reason,
      } = adjustmentInfo;

      this.logger.log(
        `ActionPlanner điều chỉnh kế hoạch sau khi bước ${failedStep.id} thất bại: ${reason}`,
      );

      // Chuẩn bị prompt cho OpenAI
      const systemPrompt = this.getAdjustmentSystemPrompt();
      const userPrompt = this.getAdjustmentUserPrompt(
        originalPlan,
        failedStep,
        reason,
      );

      // Gọi OpenAI API
      const response = await this.openaiService.chatWithFunctionCalling(
        systemPrompt,
        userPrompt,
      );

      // Xử lý markdown nếu có
      const cleanedResponse = this.cleanMarkdownCodeBlocks(response);
      this.logger.debug(`Cleaned adjustment response: ${cleanedResponse}`);

      // Parse kết quả JSON từ response
      try {
        const planData = JSON.parse(cleanedResponse);

        // Xác thực dữ liệu trả về
        if (
          !planData.steps ||
          !Array.isArray(planData.steps) ||
          planData.steps.length === 0
        ) {
          throw new Error(
            'Kết quả điều chỉnh không hợp lệ: Thiếu hoặc định dạng steps không đúng',
          );
        }

        // Tạo ActionPlan từ dữ liệu
        const adjustedPlan: ActionPlan = {
          steps: planData.steps.map((s) => ({
            ...s,
            agentType: this.validateAgentType(s.agentType),
            dependsOn: Array.isArray(s.dependsOn) ? s.dependsOn : [],
            maxRetries: s.maxRetries || 2,
            retryCount: 0,
            status: StepStatus.PENDING,
          })),
          currentStepIndex: 0,
          executionContext: { ...originalPlan.executionContext },
          status: PlanStatus.CREATED,
          overallProgress: 0,
          startTime: originalPlan.startTime,
        };

        this.logger.debug(`Kế hoạch mới có ${adjustedPlan.steps.length} bước`);
        return adjustedPlan;
      } catch (error) {
        this.logger.error(
          `Error parsing adjustment response: ${error.message}`,
        );
        this.logger.debug(`Response content: ${response}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error adjusting action plan: ${error.message}`);
      return null;
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
    // Đọc cấu hình từ this.openaiService.getPromptConfig('actionPlanner')
    const config = this.openaiService.getPromptConfig('actionPlanner');
    if (config && config.systemPrompt) {
      return config.systemPrompt;
    }
    // Thêm phương thức getDefaultSystemPrompt() để sử dụng khi không có cấu hình
    return this.getDefaultSystemPrompt();
  }

  private getDefaultSystemPrompt(): string {
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
    return `Đây là yêu cầu của người dùng sau khi được phân tích:
    
    ${processedInput}
    
    Hãy tạo kế hoạch hành động để đáp ứng yêu cầu trên.
    
    ${this.getSpecialCasePrompt(processedInput)}
    
    Nhớ đảm bảo rằng kế hoạch phải hoàn chỉnh, có logic, và đủ chi tiết để các sub-agent có thể thực hiện.
    Trả về kết quả ở định dạng JSON theo cấu trúc đã được hướng dẫn.`;
  }

  private getAdjustmentSystemPrompt(): string {
    return `
Bạn là một AI assistant được thiết kế để điều chỉnh kế hoạch hành động khi gặp lỗi hoặc thay đổi tình huống.

Nhiệm vụ của bạn là:
1. Xem xét kế hoạch ban đầu và bước bị lỗi
2. Hiểu rõ lý do cần điều chỉnh
3. Tạo kế hoạch điều chỉnh phù hợp, có thể:
   - Thay đổi bước hiện tại
   - Thêm các bước mới để xử lý tình huống
   - Loại bỏ các bước không còn phù hợp
   - Điều chỉnh thứ tự và phụ thuộc giữa các bước

Trả về kế hoạch điều chỉnh dưới dạng JSON với cấu trúc:
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

  private getAdjustmentUserPrompt(
    originalPlan: ActionPlan,
    failedStep: ActionStep,
    reason: string,
  ): string {
    // Tạo mô tả bước bị lỗi
    const failedStepDescription = `
- ID: ${failedStep.id}
- Agent: ${failedStep.agentType}
- Prompt: "${failedStep.prompt}"
- Lỗi: ${reason}
    `;

    // Tạo mô tả kế hoạch hiện tại
    const stepsDescription = originalPlan.steps
      .map((step) => {
        return `
- ID: ${step.id}
- Agent: ${step.agentType}
- Prompt: "${step.prompt}"
- Phụ thuộc: ${step.dependsOn.length > 0 ? step.dependsOn.join(', ') : 'Không có'}
- Trạng thái: ${step.status}
      `;
      })
      .join('\n');

    return `
Kế hoạch hiện tại cần được điều chỉnh vì đã gặp lỗi tại một bước.

THÔNG TIN KẾ HOẠCH:
${stepsDescription}

BƯỚC BỊ LỖI:
${failedStepDescription}

LÝ DO CẦN ĐIỀU CHỈNH:
${reason}

Hãy tạo một kế hoạch mới phù hợp với tình huống hiện tại. Kế hoạch mới cần:
1. Xử lý được vấn đề đã gặp phải
2. Vẫn đảm bảo đạt được mục tiêu tổng thể
3. Điều chỉnh các bước để tránh lỗi tương tự
4. Bổ sung các bước cần thiết để khắc phục tình huống

Trả về kế hoạch điều chỉnh dưới dạng JSON.
    `;
  }

  /**
   * System prompt cho việc đánh giá kết quả bước
   */
  private getStepEvaluationSystemPrompt(): string {
    return `
Bạn là một AI assistant được thiết kế để đánh giá kết quả của một bước trong kế hoạch hành động.

Nhiệm vụ của bạn là:
1. Xem xét kết quả từ sub-agent
2. Đánh giá xem bước có thực sự thành công hay không, bất kể trạng thái success là true hay false
3. Xác định xem có cần điều chỉnh kế hoạch không dựa trên ngữ cảnh và kết quả

Trả về đánh giá dưới dạng JSON với cấu trúc:
{
  "success": true/false,
  "reason": "Lý do chi tiết cho đánh giá này",
  "needsAdjustment": true/false
}

Lưu ý:
- Đôi khi sub-agent trả về success=true nhưng kết quả không đáp ứng yêu cầu
- Có thể sub-agent trả về success=false nhưng vẫn cung cấp thông tin hữu ích

QUAN TRỌNG: Trả về JSON thuần túy, không bọc trong markdown code block.
    `;
  }

  /**
   * User prompt cho việc đánh giá kết quả bước
   */
  private getStepEvaluationUserPrompt(
    step: ActionStep,
    plan: ActionPlan,
  ): string {
    // Tạo mô tả về bước cần đánh giá
    const stepDescription = `
- ID: ${step.id}
- Agent: ${step.agentType}
- Prompt: "${step.prompt}"
- Success flag từ agent: ${step.result?.success}
    `;

    // Tạo mô tả về kết quả
    const resultDescription = JSON.stringify(step.result, null, 2);

    return `
Hãy đánh giá kết quả của bước sau trong kế hoạch:

THÔNG TIN BƯỚC:
${stepDescription}

KẾT QUẢ TỪ SUB-AGENT:
${resultDescription}

NGỮ CẢNH KẾ HOẠCH:
Mục tiêu tổng thể: Thực hiện yêu cầu của người dùng thông qua các sub-agent.
Trạng thái kế hoạch: ${plan.status}
Tiến độ: ${plan.overallProgress}%

Dựa trên thông tin trên, hãy đánh giá:
1. Bước này có thực sự THÀNH CÔNG hay không (bất kể trạng thái thành công từ agent)
2. Lý do chi tiết cho đánh giá của bạn
3. Cần điều chỉnh kế hoạch không (true/false)

Trả về đánh giá dưới dạng JSON.
    `;
  }

  private getOpenAISystemPrompt(): string {
    return `Bạn là Action Planner, nhiệm vụ của bạn là xây dựng một kế hoạch hành động (Action Plan) gồm nhiều bước (steps) dựa trên yêu cầu của người dùng. 
    
    Các bước (steps) có thể được thực hiện bởi nhiều loại sub-agent khác nhau. Mỗi sub-agent có khả năng thực hiện các tác vụ khác nhau.
    
    Các loại sub-agent bao gồm:
    - JIRA: Làm việc với hệ thống JIRA, có thể tạo/cập nhật/tìm kiếm issues, quản lý sprint,...
    - SLACK: Gửi tin nhắn, thông báo qua Slack, tìm kiếm lịch sử tin nhắn,...
    - EMAIL: Gửi email, kiểm tra hộp thư, quản lý email,...
    - CALENDAR: Quản lý lịch, tạo cuộc họp, mời người tham gia,...
    - MEETING_ROOM: Đặt phòng họp, kiểm tra tình trạng phòng họp,...
    
    Mỗi bước trong kế hoạch cần có các thông tin sau:
    - id: Định danh duy nhất của bước, dạng "step1", "step2",...
    - agentType: Loại agent thực hiện bước này (JIRA, SLACK, EMAIL, CALENDAR, MEETING_ROOM)
    - prompt: Hướng dẫn chi tiết cho agent về nhiệm vụ cần thực hiện
    - dependsOn: Danh sách các id của các bước phải hoàn thành trước khi bước này có thể thực hiện
    - condition: (tùy chọn) Điều kiện để thực hiện bước này, phụ thuộc vào kết quả của các bước trước
    - maxRetries: (tùy chọn) Số lần thử lại tối đa nếu bước này thất bại
    - timeout: (tùy chọn) Thời gian chờ tối đa (ms) cho bước này
    
    Khi người dùng yêu cầu "tôi xong việc hôm nay rồi", bạn NÊN tạo ra một kế hoạch tự động xử lý mà KHÔNG HỎI THÊM THÔNG TIN từ người dùng. Kế hoạch này nên bao gồm các bước:
    1. Kiểm tra các task của user đó trong JIRA
    2. Tìm các tin nhắn Slack liên quan đến các task đó
    3. Cập nhật trạng thái task sang hoàn thành
    4. Thông báo kết quả cập nhật
    5. Tạo báo cáo daily report trên Confluence
    
    Bạn nên trả về kế hoạch ở dạng JSON theo cấu trúc:
    {
      "steps": [
        {
          "id": "step1",
          "agentType": "JIRA",
          "prompt": "Tìm tất cả task của người dùng user123 đang trong trạng thái In Progress",
          "dependsOn": [],
          "condition": null, 
          "maxRetries": 2,
          "timeout": 10000
        },
        {
          "id": "step2",
          "agentType": "SLACK", 
          "prompt": "Tìm các tin nhắn liên quan đến task PROJ-123 trong ngày hôm nay",
          "dependsOn": ["step1"],
          "condition": "Nếu tìm thấy ít nhất một task trong trạng thái In Progress",
          "maxRetries": 2,
          "timeout": 15000
        }
        // và các bước khác...
      ]
    }`;
  }

  private getSpecialCasePrompt(processedInput: string): string {
    // Kiểm tra nếu là trường hợp "tôi xong việc hôm nay rồi"
    if (
      processedInput.toLowerCase().includes('hoàn thành') &&
      (processedInput.toLowerCase().includes('công việc') ||
        processedInput.toLowerCase().includes('task') ||
        processedInput.toLowerCase().includes('nhiệm vụ'))
    ) {
      return this.getAutoCompletionPlan();
    }

    // Thêm các trường hợp đặc biệt khác nếu cần

    return '';
  }

  private getAutoCompletionPlan(): string {
    return `
    Đây là trường hợp người dùng báo cáo đã hoàn thành công việc. Hãy tạo kế hoạch tự động thực hiện các bước sau mà KHÔNG cần hỏi thêm thông tin từ người dùng:
    
    1. Sử dụng JIRA agent để tìm các task đang trong trạng thái "In Progress" hoặc "To Do" của người dùng này.
    2. Sử dụng SLACK agent để tìm các tin nhắn liên quan đến các task đó trong ngày hôm nay.
    3. Sử dụng JIRA agent để cập nhật trạng thái các task sang "Done" dựa trên thông tin tìm được.
    4. Sử dụng SLACK agent để thông báo về việc đã cập nhật các task.
    5. Sử dụng CONFLUENCE agent để tạo/cập nhật daily report với các task đã hoàn thành.
    
    Đảm bảo các bước được sắp xếp logic, có thông tin dependency giữa các bước, và mỗi bước có hướng dẫn chi tiết.
    `;
  }
}
