# Kế hoạch kiểm thử tích hợp Central Agent với Mock Agents

## Tổng quan

Tài liệu này mô tả kế hoạch kiểm thử tích hợp cho Central Agent khi tương tác với các mock agent. Mục tiêu là đảm bảo toàn bộ luồng xử lý từ yêu cầu người dùng, phân tích, lập kế hoạch, điều phối đến tổng hợp kết quả hoạt động mượt mà trong nhiều tình huống phức tạp. Trọng tâm kiểm thử là khả năng tương tác với các sub-agent chính: Slack, JIRA, Confluence và Calendar.

### Mục tiêu kiểm thử

1. Kiểm tra toàn diện luồng xử lý end-to-end với các sub-agent chính
2. Đánh giá khả năng xử lý các yêu cầu phức tạp, mơ hồ hoặc đa nhiệm
3. Kiểm tra cách hệ thống phản ứng với các điều kiện lỗi từ các sub-agent
4. Đánh giá chất lượng kết quả tổng hợp trong các tình huống khác nhau
5. Kiểm tra khả năng điều chỉnh kế hoạch trong quá trình thực thi
6. Đánh giá hiệu suất và thời gian phản hồi

### Phương pháp kiểm thử

- Sử dụng mock agents để mô phỏng tương tác với Slack, JIRA, Confluence và Calendar
- Cấu hình mock agents để trả về các phản hồi phức tạp và đôi khi là lỗi
- Sử dụng API endpoint `/central-agent/process` để gửi yêu cầu
- Đánh giá kết quả thông qua phản hồi API và logs hệ thống

### Tiêu chí đánh giá

- **Đúng đắn**: Kế hoạch hành động phải phù hợp với yêu cầu người dùng
- **Đầy đủ**: Tất cả các bước cần thiết phải được bao gồm trong kế hoạch
- **Tuần tự hợp lý**: Các bước phải được sắp xếp với phụ thuộc hợp lý
- **Khả năng thích ứng**: Hệ thống phải điều chỉnh kế hoạch khi gặp tình huống không lường trước
- **Tổng hợp chính xác**: Kết quả tổng hợp phải phản ánh chính xác kết quả thực thi
- **Xử lý lỗi**: Hệ thống phải xử lý lỗi từ các sub-agent một cách ưu nhã

## Chi tiết kịch bản kiểm thử

### Kịch bản 1: Tương tác giữa JIRA và Slack

**Mô tả**: Người dùng yêu cầu tạo task trong JIRA và thông báo qua Slack.

**Yêu cầu**: "Tạo task triển khai tính năng đăng nhập bằng Google cho team front-end, ưu tiên cao, deadline 26/04 và thông báo qua Slack cho team"

**CURL Command**:
```bash
curl -X POST http://localhost:3001/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tạo task triển khai tính năng đăng nhập bằng Google cho team front-end, ưu tiên cao, deadline 26/04 và thông báo qua Slack cho team",
    "userId": "user456"
  }'
```

**Cấu hình test**:
- MockJiraAgent trả về task đã tạo với ID "DEV-456"
- MockSlackAgent gửi thông báo đến channel "frontend-team"

**Kết quả kỳ vọng**:
- Input Processor nhận diện đúng các thông tin: tính năng, team, mức ưu tiên, deadline
- Action Planner tạo kế hoạch với các bước: tạo task JIRA, thông báo Slack
- Agent Coordinator thực thi các bước tuần tự, với thông báo chỉ được gửi sau khi tạo task thành công
- Result Synthesizer cung cấp thông tin đầy đủ về task đã tạo, bao gồm ID task và xác nhận đã thông báo

### Kịch bản 2: Tích hợp Calendar và Slack

**Mô tả**: Người dùng yêu cầu lên lịch họp và gửi lời mời qua Slack.

**Yêu cầu**: "Lên lịch họp demo dự án Dev-Assist vào 10h sáng thứ 6 tuần này, phòng họp A, và mời tất cả thành viên team qua Slack"

**CURL Command**:
```bash
curl -X POST http://localhost:3001/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Lên lịch họp demo dự án Dev-Assist vào 10h sáng thứ 6 tuần này, phòng họp A, và mời tất cả thành viên team qua Slack",
    "userId": "pm001"
  }'
```

**Cấu hình test**:
- MockCalendarAgent tạo cuộc họp và trả về link cuộc họp
- MockSlackAgent gửi thông báo kèm link cuộc họp đến channel "dev-assist-team"

**Kết quả kỳ vọng**:
- Input Processor nhận diện đúng thông tin cuộc họp: tiêu đề, thời gian, địa điểm
- Action Planner tạo kế hoạch với các bước: tạo lịch họp, lấy thông tin team, gửi lời mời
- Agent Coordinator thực thi các bước theo đúng thứ tự, các bước sau phụ thuộc vào kết quả của bước trước
- Result Synthesizer tạo phản hồi đầy đủ về lịch họp đã tạo và việc gửi lời mời thành công

### Kịch bản 3: Truy vấn JIRA và cập nhật Confluence

**Mô tả**: Người dùng yêu cầu tổng hợp thông tin từ JIRA và cập nhật vào trang wiki Confluence.

**Yêu cầu**: "Tạo báo cáo tiến độ sprint hiện tại, lấy dữ liệu từ JIRA và cập nhật vào trang Wiki Confluence 'Sprint-Review'"

**CURL Command**:
```bash
curl -X POST http://localhost:3001/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tạo báo cáo tiến độ sprint hiện tại, lấy dữ liệu từ JIRA và cập nhật vào trang Wiki Confluence \"Sprint-Review\"",
    "userId": "scrummaster001"
  }'
```

**Cấu hình test**:
- MockJiraAgent trả về danh sách task và tiến độ của sprint hiện tại
- MockConfluenceAgent cập nhật trang "Sprint-Review" với dữ liệu từ JIRA

**Kết quả kỳ vọng**:
- Input Processor nhận diện yêu cầu tạo báo cáo và nguồn dữ liệu
- Action Planner tạo kế hoạch với các bước: truy vấn JIRA, tổng hợp dữ liệu, cập nhật Confluence
- Agent Coordinator thực thi các bước tuần tự, lấy dữ liệu từ JIRA trước khi cập nhật Confluence
- Result Synthesizer cung cấp thông tin về báo cáo đã tạo và link đến trang Confluence

### Kịch bản 4: Xử lý lỗi từ JIRA và điều chỉnh kế hoạch

**Mô tả**: Người dùng yêu cầu cập nhật task không tồn tại, hệ thống phải xử lý lỗi và điều chỉnh kế hoạch.

**Yêu cầu**: "Cập nhật trạng thái task DEV-999 sang Done và thông báo cho team leader"

**CURL Command**:
```bash
curl -X POST http://localhost:3001/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Cập nhật trạng thái task DEV-999 sang Done và thông báo cho team leader",
    "userId": "dev002"
  }'
```

**Cấu hình test**:
- MockJiraAgent trả về lỗi "Task DEV-999 không tồn tại"
- Cấu hình để Central Agent tự điều chỉnh kế hoạch: tìm kiếm task thay vì cập nhật

**Kết quả kỳ vọng**:
- Input Processor nhận diện yêu cầu cập nhật task
- Action Planner tạo kế hoạch ban đầu với các bước: cập nhật JIRA, thông báo Slack
- Agent Coordinator ghi nhận lỗi từ JIRA và điều chỉnh kế hoạch: thêm bước tìm kiếm task
- Agent Coordinator thực thi kế hoạch điều chỉnh, tìm kiếm task rồi thông báo kết quả
- Result Synthesizer thông báo rõ ràng về việc task không tồn tại và các hành động đã thực hiện

### Kịch bản 5: Điều phối các sub-agent khi thông tin thay đổi giữa chừng

**Mô tả**: Người dùng yêu cầu lên lịch họp, nhưng trong quá trình thực hiện, phòng họp đã được đặt, hệ thống phải điều chỉnh kế hoạch.

**Yêu cầu**: "Đặt lịch họp review code với team backend vào 14h chiều mai tại phòng họp B"

**CURL Command**:
```bash
curl -X POST http://localhost:3001/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Đặt lịch họp review code với team backend vào 14h chiều mai tại phòng họp B",
    "userId": "lead001"
  }'
```

**Cấu hình test**:
- MockCalendarAgent ban đầu trả về lỗi "Phòng họp B đã được đặt vào thời gian này"
- Hệ thống phải tự động điều chỉnh kế hoạch: tìm phòng họp khác hoặc đề xuất thời gian khác
- MockCalendarAgent sau đó trả về các slot trống cho phòng họp B hoặc các phòng họp khác
- MockSlackAgent gửi thông báo về lịch họp đã được điều chỉnh

**Kết quả kỳ vọng**:
- Input Processor nhận diện đúng thông tin cuộc họp
- Action Planner tạo kế hoạch ban đầu với các bước: kiểm tra phòng họp, đặt lịch, thông báo
- Agent Coordinator phát hiện lỗi phòng họp đã đặt và điều chỉnh kế hoạch: tìm phòng họp thay thế
- Agent Coordinator thực thi kế hoạch điều chỉnh thành công và thông báo kết quả
- Result Synthesizer giải thích về sự thay đổi và cung cấp thông tin cuộc họp mới

### Kịch bản 6: Tìm kiếm thông tin trên Confluence và chia sẻ qua Slack

**Mô tả**: Người dùng yêu cầu tìm kiếm thông tin trên Confluence và chia sẻ qua Slack.

**Yêu cầu**: "Tìm tài liệu thiết kế database trên Confluence và chia sẻ link cho team backend qua Slack"

**CURL Command**:
```bash
curl -X POST http://localhost:3001/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm tài liệu thiết kế database trên Confluence và chia sẻ link cho team backend qua Slack",
    "userId": "architect001"
  }'
```

**Cấu hình test**:
- MockConfluenceAgent trả về kết quả tìm kiếm với nhiều trang liên quan đến "thiết kế database"
- MockSlackAgent chia sẻ link tài liệu đến channel "backend-team"

**Kết quả kỳ vọng**:
- Input Processor nhận diện yêu cầu tìm kiếm và chia sẻ tài liệu
- Action Planner tạo kế hoạch với các bước: tìm kiếm Confluence, lọc kết quả, chia sẻ qua Slack
- Agent Coordinator thực thi các bước theo thứ tự, lọc kết quả phù hợp nhất trước khi chia sẻ
- Result Synthesizer cung cấp thông tin về tài liệu đã tìm thấy và việc chia sẻ thành công

### Kịch bản 7: Xử lý yêu cầu đa nhiệm đòi hỏi tất cả các sub-agent

**Mô tả**: Người dùng yêu cầu thực hiện nhiều tác vụ khác nhau liên quan đến tất cả các sub-agent.

**Yêu cầu**: "Tạo task triển khai payment gateway trên JIRA, tổ chức cuộc họp kick-off vào thứ 5 tuần sau, cập nhật roadmap trên Confluence và thông báo cho team qua Slack"

**CURL Command**:
```bash
curl -X POST http://localhost:3001/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tạo task triển khai payment gateway trên JIRA, tổ chức cuộc họp kick-off vào thứ 5 tuần sau, cập nhật roadmap trên Confluence và thông báo cho team qua Slack",
    "userId": "pm002"
  }'
```

**Kết quả kỳ vọng**:
- Input Processor nhận diện nhiều yêu cầu khác nhau liên quan đến mỗi sub-agent
- Action Planner tạo kế hoạch phức tạp với các bước phù hợp cho từng sub-agent
- Agent Coordinator điều phối việc thực thi giữa các sub-agent, đảm bảo thứ tự logic
- Result Synthesizer tổng hợp kết quả từ tất cả các sub-agent vào một phản hồi mạch lạc

### Kịch bản 8: Tương tác với JIRA cần điều chỉnh kế hoạch nhiều lần

**Mô tả**: Người dùng yêu cầu tìm và cập nhật nhiều task, nhưng một số task cần xử lý đặc biệt, đòi hỏi điều chỉnh kế hoạch nhiều lần.

**Yêu cầu**: "Tìm tất cả các bug có mức độ ưu tiên cao và gán cho team QA để xử lý gấp"

**CURL Command**:
```bash
curl -X POST http://localhost:3001/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm tất cả các bug có mức độ ưu tiên cao và gán cho team QA để xử lý gấp",
    "userId": "pm003"
  }'
```

**Cấu hình test**:
- MockJiraAgent trả về danh sách bugs với mức độ ưu tiên cao
- Trong số các bugs, có một số yêu cầu phê duyệt đặc biệt để gán cho QA
- Hệ thống phải tự điều chỉnh kế hoạch để xử lý các trường hợp đặc biệt này

**Kết quả kỳ vọng**:
- Input Processor nhận diện yêu cầu tìm kiếm và cập nhật bugs
- Action Planner tạo kế hoạch ban đầu với các bước: tìm bugs, gán cho QA, thông báo
- Agent Coordinator phát hiện bugs cần phê duyệt đặc biệt và điều chỉnh kế hoạch
- Agent Coordinator thực thi kế hoạch điều chỉnh, xử lý từng trường hợp một cách phù hợp
- Result Synthesizer giải thích rõ ràng về các bugs đã xử lý, những bugs cần phê duyệt, và hành động đã thực hiện

### Kịch bản 9: Xử lý yêu cầu mơ hồ cần thu thập thêm thông tin qua Slack

**Mô tả**: Người dùng đưa ra yêu cầu thiếu thông tin, hệ thống phải sử dụng Slack để thu thập thêm thông tin.

**Yêu cầu**: "Cập nhật thông tin dự án trên Confluence"

**CURL Command**:
```bash
curl -X POST http://localhost:3001/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Cập nhật thông tin dự án trên Confluence",
    "userId": "user123"
  }'
```

**Cấu hình test**:
- MockSlackAgent gửi tin nhắn hỏi thêm thông tin: tên dự án, thông tin cần cập nhật
- MockSlackAgent giả lập phản hồi của người dùng về thông tin chi tiết
- MockConfluenceAgent cập nhật trang dự án với thông tin mới

**Kết quả kỳ vọng**:
- Input Processor nhận diện yêu cầu thiếu thông tin quan trọng
- Action Planner tạo kế hoạch bao gồm việc hỏi thêm thông tin qua Slack
- Agent Coordinator thực thi bước hỏi thêm thông tin, điều chỉnh kế hoạch dựa trên phản hồi
- Agent Coordinator thực hiện cập nhật Confluence sau khi có đủ thông tin
- Result Synthesizer giải thích quá trình thu thập thông tin và cập nhật thành công

### Kịch bản 10: Báo cáo hoàn thành công việc hàng ngày

**Mô tả**: Người dùng thông báo đã hoàn thành công việc ngày hôm nay, hệ thống cần xử lý và tự động cập nhật task/báo cáo.

**Yêu cầu**: "tôi xong việc hôm nay rồi"

**CURL Command**:
```bash
curl -X POST http://localhost:3001/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "tôi xong việc hôm nay rồi",
    "userId": "user123"
  }'
```

**Cấu hình test**:
- MockJiraAgent trả về danh sách task của người dùng hôm nay: "DEV-123: Implement login feature" với trạng thái "In Progress"
- MockSlackAgent trả về các đoạn hội thoại liên quan đến task "DEV-123" từ kênh "dev-team":
  ```
  [user123, 9:30]: Đang gặp khó khăn với việc xử lý refresh token
  [team_lead, 10:15]: Thử cách này xem: [link tài liệu]
  [user123, 14:20]: Đã giải quyết được vấn đề và implement xong phần login flow
  ```
- MockJiraAgent cập nhật task "DEV-123" sang trạng thái "Done" và thêm comment về công việc đã hoàn thành
- MockSlackAgent gửi thông báo cập nhật task vào kênh "dev-team"
- MockConfluenceAgent tạo/cập nhật daily report với thông tin về công việc đã hoàn thành

**Quy trình thực thi mong đợi**:
1. Central Agent nhận yêu cầu và hiểu rằng người dùng muốn báo cáo công việc đã hoàn thành
2. Action Planner tạo kế hoạch gồm các bước:
   - Tìm kiếm task của người dùng trên JIRA
   - Kiểm tra các trao đổi liên quan đến task trên Slack
   - Phân tích nội dung trao đổi để xác định công việc đã làm được
   - Cập nhật trạng thái task trên JIRA
   - Thông báo việc hoàn thành task qua Slack
   - Tạo/cập nhật daily report trên Confluence

3. Agent Coordinator thực thi từng bước theo thứ tự:
   - Truy vấn JIRA để lấy danh sách task của user123
   - Truy vấn Slack để lấy tin nhắn liên quan đến task DEV-123
   - Phân tích nội dung tin nhắn để xác định tiến độ và kết quả
   - Cập nhật task DEV-123 sang trạng thái "Done" trên JIRA
   - Gửi thông báo hoàn thành lên kênh Slack
   - Cập nhật/tạo daily report trên Confluence

**Kết quả kỳ vọng**:
- Input Processor nhận diện đúng ý định báo cáo hoàn thành công việc của người dùng
- Action Planner tạo kế hoạch đầy đủ các bước cần thiết từ truy vấn JIRA, Slack đến cập nhật báo cáo
- Agent Coordinator thực thi đúng trình tự các bước, đảm bảo logic phụ thuộc
- ActionPlanner đánh giá chính xác kết quả từ mỗi sub-agent và đưa ra quyết định phù hợp
- Result Synthesizer tổng hợp thông tin thành một báo cáo rõ ràng, bao gồm:
  - Task đã hoàn thành: DEV-123
  - Thông tin công việc đã thực hiện: implement login flow, xử lý refresh token
  - Xác nhận task đã được cập nhật trong JIRA
  - Xác nhận thông báo đã được gửi qua Slack
  - Xác nhận daily report đã được cập nhật

**Cấu hình MockJiraAgent**:
- Khi nhận prompt tìm task của user123, trả về:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "DEV-123",
        "title": "Implement login feature",
        "status": "In Progress",
        "assignee": "user123",
        "updated": "2023-04-20T09:15:30Z"
      }
    ]
  }
}
```
- Khi nhận prompt cập nhật task, trả về:
```json
{
  "success": true,
  "data": {
    "taskId": "DEV-123",
    "title": "Implement login feature",
    "status": "Done",
    "updated": "2023-04-20T17:30:15Z",
    "comments": [
      {
        "author": "user123",
        "text": "Đã hoàn thành implement login flow và xử lý refresh token",
        "timestamp": "2023-04-20T17:30:10Z"
      }
    ]
  }
}
```

**Cấu hình MockSlackAgent**:
- Khi nhận prompt tìm tin nhắn về task DEV-123, trả về:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "author": "user123",
        "text": "Đang gặp khó khăn với việc xử lý refresh token",
        "timestamp": "2023-04-20T09:30:00Z",
        "channel": "dev-team"
      },
      {
        "author": "team_lead",
        "text": "Thử cách này xem: https://auth0.com/docs/tokens/refresh-tokens",
        "timestamp": "2023-04-20T10:15:00Z",
        "channel": "dev-team"
      },
      {
        "author": "user123",
        "text": "Đã giải quyết được vấn đề và implement xong phần login flow",
        "timestamp": "2023-04-20T14:20:00Z",
        "channel": "dev-team"
      }
    ]
  }
}
```
- Khi nhận prompt gửi thông báo, trả về:
```json
{
  "success": true,
  "data": {
    "messageId": "slack-123",
    "channel": "dev-team",
    "timestamp": "2023-04-20T17:32:10Z",
    "text": "✅ user123 đã hoàn thành task DEV-123: Implement login feature"
  }
}
```

**Cấu hình MockConfluenceAgent**:
- Khi nhận prompt cập nhật daily report, trả về:
```json
{
  "success": true,
  "data": {
    "pageId": "CONF-456",
    "title": "Daily Report - April 20, 2023",
    "url": "https://confluence.example.com/pages/CONF-456",
    "updated": true,
    "sections": [
      {
        "title": "Completed Tasks",
        "content": "- DEV-123: Implement login feature (user123) - Implemented login flow and resolved refresh token issues"
      }
    ]
  }
}
```

**Đánh giá của ActionPlanner**:
- Đối với kết quả từ JIRA về danh sách task: ActionPlanner đánh giá là thành công và xác định được task cần cập nhật
- Đối với kết quả từ Slack về tin nhắn: ActionPlanner phân tích được tiến trình làm việc và các vấn đề đã được giải quyết
- Đối với kết quả cập nhật JIRA: ActionPlanner xác nhận task đã được cập nhật thành công sang trạng thái "Done"
- Đối với kết quả thông báo Slack: ActionPlanner xác nhận thông báo đã được gửi thành công
- Đối với kết quả cập nhật Confluence: ActionPlanner xác nhận daily report đã được cập nhật thành công

## Cài đặt và thực hiện kiểm thử

### Môi trường

- Server Central Agent chạy ở localhost:3001
- Mock agents cho Slack, JIRA, Confluence và Calendar đã được cấu hình
- Mỗi mock agent cần được cấu hình để trả về các phản hồi phù hợp, bao gồm cả các trường hợp lỗi

### Cấu hình mock agents

**1. MockSlackAgent**
- Cấu hình để gửi tin nhắn đến các channel khác nhau
- Cấu hình để gửi tin nhắn riêng đến người dùng
- Giả lập phản hồi từ người dùng khi cần thêm thông tin

**2. MockJiraAgent**
- Cấu hình để tạo, tìm kiếm và cập nhật task/bug
- Cấu hình để trả về lỗi trong một số trường hợp (ví dụ: task không tồn tại)
- Cung cấp thông tin về sprint, tiến độ và số lượng công việc

**3. MockConfluenceAgent**
- Cấu hình để tìm kiếm, đọc và cập nhật trang wiki
- Cung cấp kết quả tìm kiếm với nhiều lựa chọn
- Giả lập lỗi khi không tìm thấy trang hoặc không có quyền chỉnh sửa

**4. MockCalendarAgent**
- Cấu hình để kiểm tra lịch trống, đặt lịch họp
- Cấu hình để trả về lỗi khi phòng họp đã được đặt
- Cung cấp các lựa chọn thay thế khi có xung đột lịch

### Hướng dẫn thực hiện

1. Khởi động server với lệnh:
   ```
   cd dev_assist_backend && npm run start:dev
   ```

2. Mở terminal mới và chạy các curl command tương ứng với từng kịch bản

3. Phân tích kết quả phản hồi API và kiểm tra logs trong terminal của server

4. Kiểm tra các file kế hoạch được lưu trong thư mục `storage/action-plans/`

5. Đặc biệt chú ý đến các log về việc điều chỉnh kế hoạch trong quá trình thực thi

### Đánh giá kết quả

Sau khi thực hiện tất cả kịch bản, đánh giá kết quả dựa trên các tiêu chí:

1. Tỷ lệ kế hoạch được tạo đúng với yêu cầu
2. Khả năng điều chỉnh kế hoạch trong quá trình thực thi
3. Tỷ lệ bước được thực thi thành công
4. Chất lượng của kết quả tổng hợp
5. Thời gian phản hồi trung bình
6. Khả năng phục hồi sau lỗi 