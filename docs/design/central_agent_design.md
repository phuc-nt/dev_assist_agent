# Thiết kế Agent Trung tâm (Central Agent)

## 1. Mục đích và vai trò

Agent Trung tâm đóng vai trò là "bộ não" của hệ thống DevAssist Bot, chịu trách nhiệm:
- Phân tích yêu cầu từ người dùng bằng ngôn ngữ tự nhiên
- Xác định công cụ/agent cần sử dụng
- Lập kế hoạch hành động chi tiết
- Điều phối các agent chức năng
- Tổng hợp kết quả và trả về cho người dùng

## 2. Kiến trúc tổng quan

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   Web UI/API    │◄────►  Central Agent  │
│                 │     │                 │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
        ┌───────────────────────┬───────────────────────┐
        │                       │                       │
┌───────▼───────┐      ┌────────▼───────┐      ┌───────▼───────┐
│               │      │                │      │               │
│  JIRA Agent   │      │  Slack Agent   │      │ Other Agents  │
│               │      │                │      │               │
└───────────────┘      └────────────────┘      └───────────────┘
```

## 3. Các thành phần chính

### 3.1 Input Processor
- Xử lý đầu vào từ người dùng (văn bản)
- Phân tích ngữ cảnh, ý định, và các thông tin liên quan

### 3.2 Agent Selector
- Xác định agent thích hợp nhất để xử lý yêu cầu
- Hỗ trợ xử lý yêu cầu đa agent (khi cần nhiều agent phối hợp)

### 3.3 Action Planner
- Lập kế hoạch chi tiết gồm nhiều bước để thực hiện yêu cầu
- Xác định thứ tự thực hiện các bước

### 3.4 Agent Coordinator
- Điều phối việc thực hiện giữa các agent
- Chuyển tiếp dữ liệu giữa các bước trong kế hoạch

### 3.5 Result Synthesizer
- Tổng hợp kết quả từ các agent
- Định dạng dữ liệu phù hợp để trả về cho người dùng

### 3.6 Cost Manager
- Theo dõi sử dụng token
- Thực hiện chiến lược tối ưu hóa chi phí

## 4. Luồng xử lý

1. **Nhận yêu cầu**: Người dùng gửi yêu cầu bằng ngôn ngữ tự nhiên
2. **Phân tích yêu cầu**: Input Processor phân tích yêu cầu và trích xuất thông tin
3. **Lựa chọn agent**: Agent Selector xác định agent cần thiết
4. **Lập kế hoạch**: Action Planner tạo kế hoạch hành động chi tiết
5. **Thực thi kế hoạch**: Agent Coordinator gọi các agent theo kế hoạch
6. **Tổng hợp kết quả**: Result Synthesizer tổng hợp kết quả từ các agent
7. **Trả kết quả**: Trả về kết quả cuối cùng cho người dùng

## 5. Chi tiết kỹ thuật

### 5.1 Mô hình dữ liệu

**RequestContext**
```typescript
interface RequestContext {
  requestId: string;        // ID yêu cầu
  userId: string;           // ID người dùng
  originalQuery: string;    // Yêu cầu gốc
  timestamp: Date;          // Thời gian yêu cầu
  sessionId: string;        // ID phiên làm việc
  conversationHistory: Message[]; // Lịch sử cuộc trò chuyện
}
```

**ActionPlan**
```typescript
interface ActionPlan {
  steps: ActionStep[];      // Các bước trong kế hoạch
  currentStep: number;      // Bước hiện tại đang thực hiện
  status: PlanStatus;       // Trạng thái kế hoạch
}
```

**ActionStep**
```typescript
interface ActionStep {
  id: string;               // ID bước
  agentType: AgentType;     // Loại agent (JIRA, Slack, v.v.)
  action: string;           // Hành động cần thực hiện
  parameters: any;          // Tham số cho hành động
  dependsOn: string[];      // Các bước phụ thuộc
  status: StepStatus;       // Trạng thái bước
  result: any;              // Kết quả của bước
}
```

### 5.2 API Endpoints

**Central Agent API**
```
POST /api/central-agent/process
- Input: { query: string, userId: string, sessionId: string }
- Output: { response: string, actions: ActionSummary[] }

GET /api/central-agent/status/:requestId
- Output: { status: string, progress: number, currentStep: string }
```

### 5.3 Kỹ thuật xử lý ngôn ngữ tự nhiên

- Sử dụng OpenAI GPT-4o-mini hoặc GPT-3.5-turbo-o3-mini
- Function calling để trích xuất thông tin có cấu trúc
- Quy trình 2 bước:
  1. Phân tích ngôn ngữ tự nhiên để xác định ý định và tham số
  2. Ánh xạ ý định sang agent và hành động cụ thể

### 5.4 Chiến lược tối ưu hóa chi phí

- Tự động chọn mô hình phù hợp dựa trên độ phức tạp của yêu cầu
- Cache kết quả các yêu cầu tương tự
- Giới hạn độ dài prompt và token đầu ra
- Theo dõi sử dụng token theo người dùng/dự án

## 6. Tương tác với các Agent khác

### 6.1 JIRA Agent
- Tạo issue mới
- Cập nhật trạng thái task
- Tìm kiếm và truy xuất thông tin task
- Gán task cho thành viên

### 6.2 Slack Agent
- Gửi tin nhắn đến kênh hoặc cá nhân
- Tìm kiếm tin nhắn
- Tạo thread mới
- Thông báo trạng thái

### 6.3 Các Đặc điểm chung
- Giao diện thống nhất cho tất cả agent
- Schema validation cho input/output
- Xử lý lỗi nhất quán

## 7. Triển khai

### 7.1 Cấu trúc thư mục
```
src/
  central-agent/
    interfaces.ts           # Định nghĩa các interface
    central-agent.module.ts # Module definition
    central-agent.service.ts # Business logic
    central-agent.controller.ts # API endpoints
    processors/            # Input processors
    selectors/             # Agent selectors
    planners/              # Action planners
    coordinators/          # Agent coordinators
    synthesizers/          # Result synthesizers
```

### 7.2 Phụ thuộc
- OpenAI SDK (hoặc tương đương)
- Các module agent chức năng (JIRA, Slack)
- TypeORM cho lưu trữ (tùy chọn)

### 7.3 Chiến lược triển khai
1. Triển khai core processor và planner
2. Tích hợp với JIRA Agent (ưu tiên cao)
3. Tích hợp với Slack Agent (ưu tiên cao)
4. Triển khai Cost Manager
5. Tích hợp với các agent khác (tùy chọn)

## 8. Test Cases

### 8.1 Test case đơn giản
**Input**: "Tạo một task JIRA mới với tiêu đề 'Cập nhật tính năng đăng nhập', mô tả 'Cần cập nhật lại API xác thực người dùng', priority cao, gán cho Phúc"

**Kỳ vọng**:
- Phân tích đúng yêu cầu tạo JIRA task
- Trích xuất đúng thông tin: tiêu đề, mô tả, priority, assignee
- Gọi JIRA Agent với các tham số đúng
- Tạo task thành công và trả về thông tin task

### 8.2 Test case phức tạp
**Input**: "Tạo một task JIRA về feature login, đặt meeting để thảo luận với team vào ngày mai lúc 2 giờ chiều, và thông báo trên Slack channel #project-alpha"

**Kỳ vọng**:
- Xác định cần sử dụng 3 agent: JIRA, Calendar, Slack
- Tạo kế hoạch 3 bước
- Thực hiện tuần tự các bước và chia sẻ dữ liệu giữa các bước
- Tổng hợp kết quả và trả về thông tin tổng quan

## 9. Quản lý trạng thái và xử lý lỗi

### 9.1 Quản lý trạng thái
- Lưu trữ trạng thái của mỗi yêu cầu
- Hỗ trợ truy vấn tiến độ xử lý
- Cho phép tiếp tục xử lý sau khi gặp lỗi

### 9.2 Xử lý lỗi
- Phân loại lỗi: hệ thống, nghiệp vụ, kết nối
- Chiến lược retry cho lỗi tạm thời
- Cơ chế fallback cho các agent không hoạt động
- Thông báo chi tiết lỗi cho người dùng

## 10. Hiệu suất và khả năng mở rộng

### 10.1 Hiệu suất
- Tối ưu hóa độ dài prompt LLM
- Sử dụng threading cho xử lý đồng thời
- Caching kết quả cho các yêu cầu tương tự

### 10.2 Khả năng mở rộng
- Kiến trúc plugin để dễ dàng thêm agent mới
- Hỗ trợ nhiều LLM providers (không chỉ OpenAI)
- Khả năng mở rộng theo chiều ngang 