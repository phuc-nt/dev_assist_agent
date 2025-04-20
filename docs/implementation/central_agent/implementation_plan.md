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

### Phase 9: Cấu hình tập trung LLM
- [x] Tạo file cấu hình tập trung cho LLM và prompt
- [x] Triển khai các API endpoints để quản lý cấu hình
- [x] Cập nhật các thành phần để sử dụng cấu hình tập trung
- [x] Cải thiện hệ thống logging để theo dõi việc sử dụng LLM

### Phase 10: Theo dõi chi phí (Cost Monitoring)
- [x] Tạo module theo dõi chi phí sử dụng LLM
- [x] Thiết kế cấu trúc dữ liệu cho việc lưu trữ thông tin sử dụng token
- [x] Cập nhật `OpenaiService` để theo dõi và tính toán chi phí
- [x] Tạo API endpoints để xem thống kê chi phí
- [x] Triển khai cơ chế cảnh báo khi chi phí vượt ngưỡng

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

### Phiên làm việc #7: Hoàn thành Phase 9
- Đã tạo file `src/config/llm.config.ts` để tập trung quản lý các cấu hình LLM và prompt
- Đã triển khai cấu trúc dữ liệu `LLMConfig` và `PromptConfig` để quản lý các cấu hình
- Đã cập nhật `OpenaiService` để sử dụng cấu hình tập trung
- Đã triển khai các API endpoints để xem và cập nhật cấu hình LLM:
  - GET `/openai/config` - Lấy cấu hình LLM hiện tại
  - POST `/openai/config` - Cập nhật cấu hình LLM
  - GET `/openai/model` - Lấy thông tin model hiện tại
  - POST `/openai/test-model` - Test model với prompt
- Đã thêm biến môi trường `OPENAI_MODEL` để cấu hình model mặc định từ môi trường
- Đã cập nhật tất cả các thành phần (InputProcessor, ActionPlanner, ResultSynthesizer) để sử dụng cấu hình tập trung
- Đã cải thiện hệ thống logging để theo dõi việc sử dụng LLM trong các thành phần
- Đã viết thêm chi tiết hướng dẫn sử dụng cấu hình tập trung trong code

### Phiên làm việc #8: Hoàn thành Phase 10 - Cost Monitoring
- Đã triển khai module theo dõi chi phí sử dụng LLM
- Đã tạo entity LLMUsageRecord để lưu trữ thông tin sử dụng token
- Đã cập nhật OpenaiService để theo dõi việc sử dụng token và tính toán chi phí
- Đã tạo API endpoints để xem thống kê chi phí theo ngày, tháng, component và model
- Đã triển khai cơ chế cảnh báo tự động khi chi phí vượt ngưỡng
- Đã sử dụng tiktoken để tính toán chính xác số lượng token
- Đã cải thiện việc lưu trữ dữ liệu bằng cách chuyển từ in-memory database sang file database

### Phiên làm việc #9: Cập nhật giá model và sửa lỗi tính toán token
- Đã cập nhật giá cho các model mới của OpenAI trong `model-cost.config.ts`:
  - Đã thêm `gpt-4o`: $0.0025 / $0.01 per 1K tokens
  - Đã thêm `gpt-4o-mini`: $0.00015 / $0.0006 per 1K tokens
  - Đã thêm `gpt-4.1`: $0.002 / $0.008 per 1K tokens
  - Đã thêm `gpt-4.1-mini`: $0.0004 / $0.0016 per 1K tokens
  - Đã thêm `gpt-4.1-nano`: $0.0001 / $0.0004 per 1K tokens
  - Đã thêm `o3`: $0.01 / $0.04 per 1K tokens
  - Đã thêm `o4-mini`: $0.0011 / $0.0044 per 1K tokens
- Đã sửa lỗi "Invalid model" trong thư viện tiktoken khi tính toán token
- Đã triển khai cơ chế ánh xạ model trong `token-counter.ts` để xử lý model mới chưa được tiktoken hỗ trợ
- Đã giải quyết vấn đề tính toán token cho các model mới (như gpt-4.1-mini, gpt-4o, v.v.)
- Đã cải thiện hiệu suất và độ tin cậy của hệ thống khi sử dụng các model mới
- Đã kiểm thử tính toán chi phí với tất cả các model đã cấu hình

### Phiên làm việc #10: Triển khai chức năng Điều chỉnh Kế hoạch (Plan Adjustment)
- Đã triển khai phương thức `adjustPlan` trong `ActionPlanner` để hỗ trợ điều chỉnh kế hoạch khi gặp lỗi
- Đã tạo hai phương thức hỗ trợ:
  - `getAdjustmentSystemPrompt()`: Tạo system prompt cho việc điều chỉnh kế hoạch
  - `getAdjustmentUserPrompt()`: Tạo user prompt chi tiết dựa trên kế hoạch gốc và bước bị lỗi
- Đã cập nhật `AgentCoordinator` để hỗ trợ gọi `adjustPlan` khi cần điều chỉnh kế hoạch
- Đã cải thiện cơ chế xử lý lỗi để xác định các trường hợp cần điều chỉnh kế hoạch:
  - Task không tồn tại trong JIRA
  - Phòng họp không khả dụng
  - Người dùng không tồn tại
  - Tài nguyên không được tìm thấy
- Phương thức `adjustPlan` nhận vào thông tin điều chỉnh bao gồm:
  - Kế hoạch ban đầu (originalPlan)
  - Bước bị lỗi (failedStep)
  - Kết quả của bước bị lỗi (failedStepResult)
  - Ngữ cảnh thực thi hiện tại (currentExecutionContext)
  - Lý do cần điều chỉnh (reason)
- Kết quả trả về là một kế hoạch mới hoặc null nếu không thể điều chỉnh
- Đã cập nhật logic trong `evaluateStepResult` để đánh giá khi nào cần điều chỉnh kế hoạch thông qua trường `needsAdjustment`
- Đã cải thiện khả năng xử lý của Central Agent trong các tình huống ngoại lệ và lỗi không lường trước

**Ví dụ triển khai interface cho điều chỉnh kế hoạch:**
```typescript
interface AdjustmentInfo {
  originalPlan: ActionPlan;
  failedStep: ActionStep;
  failedStepResult: any;
  currentExecutionContext: Record<string, any>;
  reason: string;
}

async adjustPlan(adjustmentInfo: AdjustmentInfo): Promise<ActionPlan | null>
```

**Workflow điều chỉnh kế hoạch:**
1. AgentCoordinator phát hiện bước thực thi thất bại
2. Đánh giá kết quả thất bại với `evaluateStepResult`
3. Nếu `needsAdjustment` là true, gọi `adjustPlan` với thông tin thích hợp
4. LLM tạo kế hoạch mới dựa trên tình hình hiện tại
5. Kế hoạch mới được thực thi thay thế kế hoạch cũ

Việc triển khai chức năng điều chỉnh kế hoạch giúp Central Agent có khả năng thích ứng cao với các tình huống thay đổi, xử lý lỗi thông minh hơn, và cải thiện trải nghiệm người dùng khi hệ thống gặp phải các tình huống ngoại lệ không lường trước.

### Ghi chú về kịch bản test "tôi xong việc hôm nay rồi"

Đã thực hiện kiểm thử thành công kịch bản phức tạp "tôi xong việc hôm nay rồi" với các mock sub-agent:

**Cấu hình Mock Sub-Agents:**
- **MockJiraAgent**: 
  - Đã cấu hình để trả về 3 task (XDEMO2-1, XDEMO2-2, XDEMO2-3) ở trạng thái "In Progress" hoặc "To Do" khi tìm kiếm
  - Đã xử lý cập nhật trạng thái task sang "Done"
  - Đã lưu lịch sử thay đổi trạng thái task
  
- **MockSlackAgent**: 
  - Đã cấu hình để trả về 2 tin nhắn thảo luận về XDEMO2-1 và XDEMO2-2
  - Đã xử lý đúng các yêu cầu gửi thông báo cập nhật task
  - Đã thêm logic xử lý để phản hồi phù hợp với các tin nhắn xác nhận hoàn thành
  
- **MockConfluenceAgent**:
  - Đã triển khai để xử lý tạo/cập nhật báo cáo hàng ngày
  - Đã lưu trữ thông tin về công việc hoàn thành, đang thực hiện, kế hoạch và vấn đề gặp phải

**Luồng thực thi:**
1. Central Agent nhận yêu cầu "tôi xong việc hôm nay rồi" từ người dùng
2. InputProcessor phân tích yêu cầu và xác định người dùng muốn cập nhật trạng thái các task đã hoàn thành
3. ActionPlanner tạo kế hoạch 5 bước:
   - Tìm các task đang thực hiện (JIRA)
   - Tìm các thảo luận liên quan (SLACK)
   - Cập nhật trạng thái task (JIRA)
   - Gửi thông báo về việc cập nhật (SLACK)
   - Cập nhật báo cáo hàng ngày (CONFLUENCE)
4. AgentCoordinator thực thi từng bước trong kế hoạch
5. ResultSynthesizer tổng hợp kết quả và trả về phản hồi cho người dùng

**Kết quả kiểm thử:**
- Toàn bộ luồng hoạt động 100% tự động, không cần người dùng cung cấp thêm thông tin
- Các mock agent đã phản hồi đúng theo kịch bản đã định nghĩa
- Kế hoạch được thực thi tuần tự và đúng thứ tự phụ thuộc
- Phản hồi cuối cùng cho người dùng rõ ràng và đầy đủ thông tin

**Cải tiến đã thực hiện trong quá trình test:**
1. Thêm CONFLUENCE vào enum AgentType
2. Cập nhật AgentFactory để hỗ trợ CONFLUENCE agent
3. Sửa đổi mockSendMessage trong MockSlackAgent để xử lý chính xác các yêu cầu gửi thông báo

Kịch bản này đã chứng minh khả năng của Central Agent trong việc xử lý quy trình công việc phức tạp, tích hợp nhiều hệ thống và điều phối luồng thông tin giữa các hệ thống.

**Các file source code quan trọng liên quan đến kịch bản:**

1. **Định nghĩa các agent type và cấu trúc kế hoạch:**
   - `dev_assist_backend/src/central-agent/models/action-plan.model.ts`: Định nghĩa các enum và interfaces cơ bản như `AgentType`, `ActionStep`, `ActionPlan`
   
2. **Xử lý đầu vào và phân tích yêu cầu:**
   - `dev_assist_backend/src/central-agent/input-processor/input-processor.service.ts`: Phân tích yêu cầu "tôi xong việc hôm nay rồi" thành mô tả có cấu trúc

3. **Tạo kế hoạch hành động:**
   - `dev_assist_backend/src/central-agent/action-planner/action-planner.service.ts`: Tạo kế hoạch 5 bước cho kịch bản
   - `dev_assist_backend/src/central-agent/action-planner/prompts/planner-prompts.ts`: Chứa templates cho system/user prompts

4. **Điều phối và thực thi kế hoạch:**
   - `dev_assist_backend/src/central-agent/agent-coordinator/agent-coordinator.service.ts`: Điều phối thực thi các bước trong kế hoạch

5. **Factory và định nghĩa mock agents:**
   - `dev_assist_backend/src/central-agent/agent-factory/agent-factory.service.ts`: Khởi tạo các agents và định nghĩa các mock agents
   - `dev_assist_backend/src/central-agent/agent-factory/mock/mock-jira-agent.ts`: Mock JIRA agent trả về và cập nhật tasks
   - `dev_assist_backend/src/central-agent/agent-factory/mock/mock-slack-agent.ts`: Mock Slack agent xử lý tin nhắn và thông báo
   - `dev_assist_backend/src/central-agent/agent-factory/mock/mock-confluence-agent.ts`: Mock Confluence agent cập nhật báo cáo

6. **Tổng hợp kết quả:**
   - `dev_assist_backend/src/central-agent/result-synthesizer/result-synthesizer.service.ts`: Tổng hợp kết quả từ các bước thực thi

7. **API endpoints xử lý yêu cầu:**
   - `dev_assist_backend/src/central-agent/central-agent.controller.ts`: API endpoints `/central-agent/process` xử lý yêu cầu
   - `dev_assist_backend/src/central-agent/central-agent.service.ts`: Service điều phối toàn bộ quy trình

8. **OpenAI integration:**
   - `dev_assist_backend/src/openai/openai.service.ts`: Service giao tiếp với OpenAI
   - `dev_assist_backend/src/config/llm.config.ts`: Cấu hình LLM và prompts

9. **Lưu trữ và quản lý kế hoạch:**
   - `dev_assist_backend/src/central-agent/action-plan-storage/action-plan-storage.service.ts`: Lưu trữ kế hoạch và kết quả thực thi

10. **Logging và monitoring:**
    - `dev_assist_backend/src/utils/enhanced-logger.ts`: Logger được nâng cao để theo dõi luồng thực thi

Các file này hoạt động cùng nhau tạo thành một pipeline xử lý hoàn chỉnh cho kịch bản "tôi xong việc hôm nay rồi", từ việc nhận và phân tích yêu cầu đến việc lập kế hoạch, thực thi và trả về kết quả cuối cùng.

## Bài học kinh nghiệm
1. **Cấu hình cổng kết nối**: Fix cứng cổng trong main.ts để tránh xung đột với các tiến trình khác
2. **SQLite cho môi trường phát triển**: Cần đảm bảo gói `sqlite3` đã được cài đặt khi sử dụng TypeORM với SQLite
3. **OpenAI API key**: Đảm bảo API key được cấu hình đúng trong file .env
4. **Thực hiện lệnh từ thư mục đúng**: Cần phải cd vào thư mục dev_assist_backend trước khi chạy npm run start:dev
5. **Cấu hình đường dẫn file**: Cần đảm bảo đường dẫn file cấu hình dự án được xác định đúng trong môi trường
6. **Xử lý lỗi kết nối cơ sở dữ liệu**: Kiểm tra SQLite đã được cài đặt đúng cách và có quyền truy cập vào thư mục lưu trữ cơ sở dữ liệu
7. **Quản lý databaseId**: Đảm bảo truyền databaseId khi cập nhật kết quả thực thi để tránh tạo nhiều kế hoạch mới
8. **Xử lý điều kiện tiếng Việt**: Cần xử lý đặc biệt đối với các điều kiện bằng tiếng Việt trong phương thức evaluateCondition
9. **Ánh xạ model cho thư viện tiktoken**: Khi sử dụng các model mới, cần ánh xạ sang các model mà thư viện tiktoken hỗ trợ
10. **Cập nhật bảng giá thường xuyên**: Đảm bảo bảng giá được cập nhật theo giá mới nhất từ OpenAI
11. **Điều chỉnh kế hoạch dựa trên LLM**: Sử dụng LLM để tạo kế hoạch thay thế là cách tiếp cận hiệu quả, nhưng cần đảm bảo hướng dẫn rõ ràng (prompt) để có kết quả như mong đợi