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
- [x] Thiết kế interface và class cho Action Planner
- [x] Xây dựng cấu trúc ActionPlan và ActionStep
- [x] Tích hợp OpenAI API cho việc lập kế hoạch
- [x] Xây dựng prompt template cho Action Planner
- [x] Viết unit test cho Action Planner

### Phase 5: Agent Coordinator
- [x] Thiết kế interface và class cho Agent Coordinator
- [x] Xây dựng logic xử lý các bước trong kế hoạch
- [x] Phát triển cơ chế tương tác với các sub-agent (mock)
- [x] Viết unit test cho Agent Coordinator

### Phase 6: Result Synthesizer
- [x] Thiết kế interface và class cho Result Synthesizer
- [x] Tích hợp OpenAI API cho việc tổng hợp kết quả
- [x] Xây dựng prompt template cho Result Synthesizer
- [x] Viết unit test cho Result Synthesizer

### Phase 7: Mock Sub-Agents
- [x] Tạo mock JIRA Agent
- [x] Tạo mock Slack Agent
- [x] Tạo Agent Factory để quản lý các agent

### Phase 8: Tích hợp hoàn chỉnh
- [x] Tích hợp tất cả các module
- [x] Tạo e2e test cho toàn bộ luồng xử lý
- [ ] Viết API documentation
- [x] Kiểm thử với các kịch bản sử dụng thực tế

## Báo cáo tiến độ

### Phiên làm việc #1: Hoàn thành Phase 1-3
- Đã tạo cấu trúc thư mục và thiết lập các file cơ bản cho Central Agent
- Đã triển khai ProjectConfigReader để đọc thông tin cấu hình từ file JSON
- Đã triển khai InputProcessor để phân tích yêu cầu người dùng sử dụng OpenAI API
- Đã tạo API endpoint `/central-agent/process` để nhận và xử lý yêu cầu người dùng
- Đã viết unit test cho các thành phần đã triển khai
- API endpoint đã hoạt động và trả về kết quả phân tích yêu cầu

### Phiên làm việc #2: Hoàn thành Phase 4
- Đã tạo cấu trúc model cho ActionPlan và ActionStep
- Đã triển khai ActionPlanner để tạo kế hoạch hành động từ phân tích yêu cầu
- Đã tích hợp với OpenAI API để lập kế hoạch
- Đã viết unit test cho ActionPlanner
- Đã tích hợp ActionPlanner vào CentralAgentService
- API endpoint hiện trả về phân tích yêu cầu và kế hoạch hành động

### Phiên làm việc #3: Cải thiện hệ thống logging
- Đã triển khai EnhancedLogger để cải thiện khả năng ghi log trong toàn bộ hệ thống
- Đã tích hợp EnhancedLogger vào ActionPlanner, InputProcessor, CentralAgentService và ActionPlanStorageService
- EnhancedLogger hỗ trợ ghi logs ra file với timestamp, phân loại mức log và hiển thị màu sắc trên terminal
- Logs được lưu tại thư mục `logs` với định dạng `app-YYYY-MM-DD.log`
- Cải thiện khả năng debug và theo dõi luồng xử lý của hệ thống

### Phiên làm việc #4: Hoàn thành Phase 5 và 7
- Đã triển khai AgentCoordinator để thực thi kế hoạch hành động
- Đã phát triển cơ chế xử lý điều kiện phụ thuộc giữa các bước
- Đã tạo MockJiraAgent và MockSlackAgent để mô phỏng tương tác với các hệ thống bên ngoài
- Đã triển khai AgentFactory để quản lý các agent theo loại
- Đã thiết lập cấu trúc dữ liệu cho kết quả thực thi từ các agent
- Đã viết unit test và integration test cho AgentCoordinator
- Đã cải thiện cơ chế xử lý lỗi và retry cho các bước thực thi

### Phiên làm việc #5: Cải tiến và sửa lỗi
- Đã cải thiện cơ chế xử lý điều kiện tiếng Việt trong AgentCoordinator
- Đã mở rộng mock data cho MockSlackAgent để hiển thị thông báo phong phú hơn
- Đã cải thiện cơ chế lưu trữ và cập nhật kế hoạch trong database và file
- Đã sửa lỗi databaseId không được lưu khi cập nhật kết quả thực thi
- Đã thực hiện kiểm thử e2e với nhiều kịch bản sử dụng thực tế
- Đã cải thiện hiệu suất và độ tin cậy của toàn bộ hệ thống

### Phiên làm việc #6: Hoàn thành Phase 6
- Đã triển khai ResultSynthesizerService để tổng hợp kết quả từ các bước thực thi
- Đã tích hợp với OpenAI API thông qua phương thức chatWithFunctionCalling
- Đã cập nhật CentralAgentService để sử dụng ResultSynthesizerService
- Đã viết unit test cho ResultSynthesizerService
- Phản hồi người dùng giờ đây đã chi tiết hơn và tự nhiên hơn
- Với các thành phần đã triển khai, Central Agent đã có thể thực hiện đầy đủ vòng lặp: Input → Plan → Execute → Result

### Bài học kinh nghiệm
1. **Cấu hình cổng kết nối**: Fix cứng cổng trong main.ts để tránh xung đột với các tiến trình khác
2. **SQLite cho môi trường phát triển**: Cần đảm bảo gói `sqlite3` đã được cài đặt khi sử dụng TypeORM với SQLite
3. **OpenAI API key**: Đảm bảo API key được cấu hình đúng trong file .env
4. **Thực hiện lệnh từ thư mục đúng**: Cần phải cd vào thư mục dev_assist_backend trước khi chạy npm run start:dev
5. **Cấu hình đường dẫn file**: Cần đảm bảo đường dẫn file cấu hình dự án được xác định đúng trong môi trường
6. **Xử lý lỗi kết nối cơ sở dữ liệu**: Kiểm tra SQLite đã được cài đặt đúng cách và có quyền truy cập vào thư mục lưu trữ cơ sở dữ liệu
7. **Quản lý databaseId**: Đảm bảo truyền databaseId khi cập nhật kết quả thực thi để tránh tạo nhiều kế hoạch mới
8. **Xử lý điều kiện tiếng Việt**: Cần xử lý đặc biệt đối với các điều kiện bằng tiếng Việt trong phương thức evaluateCondition

## Chi tiết triển khai mới

### Result Synthesizer đã hoàn thành

Result Synthesizer đã được triển khai thành công với các tính năng:

- Tổng hợp kết quả từ các bước thực thi thành câu trả lời mạch lạc, dễ hiểu
- Tích hợp với OpenAI API thông qua chatWithFunctionCalling
- Xử lý nhiều trường hợp khác nhau: thành công, thất bại, thực thi một phần
- Cung cấp thông tin chi tiết và có tính context về quá trình thực thi
- Ngữ cảnh tự nhiên và thân thiện với người dùng

File structure triển khai:
```
src/central-agent/
├── result-synthesizer/
│   ├── result-synthesizer.service.ts
│   └── result-synthesizer.spec.ts
```

### Hoàn thiện API Documentation

Bước tiếp theo trong kế hoạch là hoàn thiện API Documentation. Công việc này sẽ bao gồm:

1. Tạo Swagger document đầy đủ cho tất cả API endpoints
2. Thêm mô tả chi tiết cho các DTO và entities
3. Tạo hướng dẫn sử dụng API cho các nhà phát triển tiếp theo
4. Mô tả các luồng làm việc chính và cách tích hợp

### Cải thiện hiệu suất và reliability

Ngoài ra, cần thực hiện các cải tiến về hiệu suất và độ tin cậy:

1. Tối ưu hóa prompt để giảm chi phí token
2. Cải thiện cơ chế retry và xử lý lỗi
3. Thêm logging chi tiết hơn để dễ debug
4. Tạo các kịch bản test tự động

## Kế hoạch tiếp theo: Sub-Agents thực

Sau khi đã hoàn thiện Central Agent với mock Sub-Agents, bước tiếp theo sẽ là triển khai các Sub-Agents thực tế:

1. JIRA Agent: Tích hợp với JIRA API thực tế
2. Slack Agent: Tích hợp với Slack API thực tế
3. Thay thế các mock agents bằng các agents thực trong hệ thống

**Dự kiến triển khai JIRA Agent:**
```typescript
@Injectable()
export class JiraAgent {
  private readonly logger = EnhancedLogger.getLogger(JiraAgent.name);
  private readonly jiraApiService: JiraApiService;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly openaiService: OpenaiService,
  ) {
    this.jiraApiService = new JiraApiService(
      configService.get('JIRA_DOMAIN'),
      configService.get('JIRA_EMAIL'),
      configService.get('JIRA_API_TOKEN'),
    );
  }
  
  async execute(prompt: string): Promise<AgentResponse> {
    try {
      this.logger.log(`JIRA Agent executing: ${prompt}`);
      const startTime = Date.now();
      
      // Sử dụng OpenAI để phân tích prompt và xác định hành động JIRA cần thực hiện
      const analysis = await this.openaiService.chatWithFunctionCalling(
        this.getSystemPrompt(),
        prompt
      );
      
      // Thực hiện hành động JIRA thông qua JiraApiService
      // ... code thực thi các hành động JIRA ...
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          // Kết quả từ JIRA API
        },
        metadata: {
          executionTime,
          tokenUsage: 150 // estimation
        }
      };
    } catch (error) {
      this.logger.error(`Error executing JIRA Agent: ${error.message}`);
      return {
        success: false,
        error: {
          message: error.message
        },
        metadata: {}
      };
    }
  }
  
  private getSystemPrompt(): string {
    // System prompt cho JIRA agent
  }
} 