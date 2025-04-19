# Kế hoạch triển khai Central Agent

## Tổng quan
Kế hoạch triển khai Central Agent theo mô hình đã thiết kế, tập trung vào việc xây dựng từng module riêng biệt và tích hợp chúng với nhau. Trong giai đoạn đầu, các sub-agent sẽ được mock để tập trung vào việc xây dựng hoàn chỉnh Central Agent.

## Danh sách tác vụ và tiến độ

### Phase 1: Thiết lập cơ bản
- [x] Tạo cấu trúc thư mục cho Central Agent
- [x] Thiết lập các interface cơ bản
- [x] Tạo API endpoint chính cho central agent
- [x] Thêm unit test cơ bản

### Phase 2: Input Processor
- [x] Thiết kế interface và class cho Input Processor
- [x] Tích hợp OpenAI API cho việc phân tích yêu cầu
- [x] Xây dựng prompt template cho Input Processor
- [x] Tạo mock data cho các trường hợp test
- [x] Viết unit test cho Input Processor
- [x] Kiểm thử API endpoint với Input Processor

### Phase 3: Project Config Reader
- [x] Xây dựng class ProjectConfigReader
- [x] Tích hợp đọc file cấu hình dự án
- [x] Viết unit test cho ProjectConfigReader

### Phase 4: Action Planner
- [ ] Thiết kế interface và class cho Action Planner
- [ ] Xây dựng cấu trúc ActionPlan và ActionStep
- [ ] Tích hợp OpenAI API cho việc lập kế hoạch
- [ ] Xây dựng prompt template cho Action Planner
- [ ] Viết unit test cho Action Planner

### Phase 5: Agent Coordinator
- [ ] Thiết kế interface và class cho Agent Coordinator
- [ ] Xây dựng logic xử lý các bước trong kế hoạch
- [ ] Phát triển cơ chế tương tác với các sub-agent (mock)
- [ ] Viết unit test cho Agent Coordinator

### Phase 6: Result Synthesizer
- [ ] Thiết kế interface và class cho Result Synthesizer
- [ ] Tích hợp OpenAI API cho việc tổng hợp kết quả
- [ ] Xây dựng prompt template cho Result Synthesizer
- [ ] Viết unit test cho Result Synthesizer

### Phase 7: Mock Sub-Agents
- [ ] Tạo mock JIRA Agent
- [ ] Tạo mock Slack Agent
- [ ] Tạo Agent Factory để quản lý các agent

### Phase 8: Tích hợp hoàn chỉnh
- [ ] Tích hợp tất cả các module
- [ ] Tạo e2e test cho toàn bộ luồng xử lý
- [ ] Viết API documentation
- [ ] Kiểm thử với các kịch bản sử dụng thực tế

## Báo cáo tiến độ

### Ngày 19/04/2025: Hoàn thành Phase 1-3
- Đã tạo cấu trúc thư mục và thiết lập các file cơ bản cho Central Agent
- Đã triển khai ProjectConfigReader để đọc thông tin cấu hình từ file JSON
- Đã triển khai InputProcessor để phân tích yêu cầu người dùng sử dụng OpenAI API
- Đã tạo API endpoint `/central-agent/process` để nhận và xử lý yêu cầu người dùng
- Đã viết unit test cho các thành phần đã triển khai
- API endpoint đã hoạt động và trả về kết quả phân tích yêu cầu

### Bài học kinh nghiệm
1. **Cấu hình cổng kết nối**: Fix cứng cổng trong main.ts để tránh xung đột với các tiến trình khác
2. **SQLite cho môi trường phát triển**: Cần đảm bảo gói `sqlite3` đã được cài đặt khi sử dụng TypeORM với SQLite
3. **OpenAI API key**: Đảm bảo API key được cấu hình đúng trong file .env
4. **Thực hiện lệnh từ thư mục đúng**: Cần phải cd vào thư mục dev_assist_backend trước khi chạy npm run start:dev
5. **Cấu hình đường dẫn file**: Cần đảm bảo đường dẫn file cấu hình dự án được xác định đúng trong môi trường
6. **Xử lý lỗi kết nối cơ sở dữ liệu**: Kiểm tra SQLite đã được cài đặt đúng cách và có quyền truy cập vào thư mục lưu trữ cơ sở dữ liệu

## Chi tiết triển khai mới

### Kế hoạch tiếp theo: Triển khai Action Planner

Sau khi hoàn thành phân tích yêu cầu, bước tiếp theo là triển khai Action Planner để tạo kế hoạch hành động dựa trên yêu cầu đã phân tích. Action Planner sẽ:

1. Nhận kết quả từ InputProcessor
2. Tạo kế hoạch hành động với các bước cụ thể
3. Xác định agent cần gọi và tham số cần thiết cho mỗi bước
4. Thiết lập logic phụ thuộc giữa các bước

**Tạo file `action-planner.service.ts`:**
```typescript
import { Injectable } from '@nestjs/common';
import { OpenaiService } from '../../openai/openai.service';
import { ActionPlan, ActionStep, StepStatus, PlanStatus } from './models/action-plan.model';

@Injectable()
export class ActionPlanner {
  constructor(private readonly openaiService: OpenaiService) {}
  
  async createPlan(processedInput: string): Promise<ActionPlan> {
    // Chuẩn bị prompt cho OpenAI
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt(processedInput);
    
    // Gọi OpenAI API
    const response = await this.openaiService.chatWithFunctionCalling(systemPrompt, userPrompt);
    
    // Parse kết quả JSON từ response
    try {
      const planData = JSON.parse(response);
      
      // Tạo ActionPlan từ dữ liệu
      const plan: ActionPlan = {
        steps: planData.steps.map(s => ({
          ...s,
          status: StepStatus.PENDING,
          retryCount: 0,
        })),
        currentStepIndex: 0,
        executionContext: {},
        status: PlanStatus.CREATED,
        overallProgress: 0,
      };
      
      return plan;
    } catch (error) {
      throw new Error(`Không thể tạo kế hoạch: ${error.message}`);
    }
  }
  
  private getSystemPrompt(): string {
    return `
Bạn là một AI assistant được thiết kế để lập kế hoạch hành động từ mô tả yêu cầu.

Với mỗi yêu cầu đã được xử lý, hãy:
1. Xác định các bước cần thực hiện
2. Xác định agent phù hợp cho mỗi bước (JIRA, SLACK, etc.)
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
    `;
  }
  
  private getUserPrompt(processedInput: string): string {
    return `
Dựa trên yêu cầu đã được phân tích sau:

${processedInput}

Tạo kế hoạch thực hiện bao gồm các bước với thông tin:
1. ID của bước
2. Loại agent cần gọi (JIRA, SLACK, EMAIL, v.v.)
3. Prompt ngôn ngữ tự nhiên chi tiết cho agent đó
4. Các bước phụ thuộc (nếu có)
5. Điều kiện thực hiện (nếu có)

Các prompt cần chứa đủ thông tin để Sub-Agent có thể tự xác định hành động cụ thể.
Trả về kế hoạch theo định dạng JSON.
    `;
  }
} 