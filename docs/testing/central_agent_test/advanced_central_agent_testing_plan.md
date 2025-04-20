# Kế hoạch kiểm thử nâng cao cho Central Agent

Tài liệu này trình bày các kịch bản kiểm thử phức tạp để đánh giá khả năng xử lý tình huống thực tế của Central Agent, bao gồm các kịch bản yêu cầu điều chỉnh kế hoạch và xử lý lỗi phức tạp.

## Tổng quan

Mục tiêu của các kịch bản kiểm thử nâng cao là đánh giá khả năng xử lý các tình huống phức tạp của Central Agent như:
- Điều chỉnh kế hoạch khi gặp lỗi
- Xử lý các yêu cầu đa bước phức tạp
- Đảm bảo tính chính xác khi thực hiện các quy trình phụ thuộc nhiều thành phần
- Kiểm tra tích hợp giữa các agent con
- Đảm bảo hệ thống phản hồi thông minh khi gặp các điều kiện ngoại lệ

## Kịch bản kiểm thử

### 1. Điều chỉnh kế hoạch khi Jira task không tồn tại

**Mô tả:** Kiểm tra khả năng điều chỉnh kế hoạch khi một Jira task không tồn tại

**Curl command:**
```bash
curl -X POST http://localhost:3000/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Cập nhật trạng thái task XDEMO2-999 sang Done",
    "userId": "u123"
  }'
```

**Luồng xử lý kỳ vọng:**
1. Central Agent tạo kế hoạch ban đầu bao gồm bước tìm và cập nhật task
2. MockJiraAgent trả về kết quả không tìm thấy task
3. ActionPlanner đánh giá thất bại và điều chỉnh kế hoạch
4. Kế hoạch mới được tạo với bước thông báo cho người dùng về việc không tìm thấy task
5. MockSlackAgent gửi thông báo cho người dùng

**Tiêu chí đánh giá:**
- Kế hoạch được điều chỉnh đúng cách sau khi nhận kết quả thất bại
- Người dùng nhận được thông báo rõ ràng về lỗi
- Cả kế hoạch ban đầu và kế hoạch điều chỉnh được lưu vào cơ sở dữ liệu

### 2. Xử lý điều kiện và phụ thuộc phức tạp

**Mô tả:** Kiểm tra xử lý các bước có điều kiện và phụ thuộc phức tạp

**Curl command:**
```bash
curl -X POST http://localhost:3000/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm tất cả task chưa hoàn thành của tôi, nếu có thì thông báo trên Slack và tổ chức cuộc họp với team để thảo luận",
    "userId": "u123"
  }'
```

**Luồng xử lý kỳ vọng:**
1. Central Agent tạo kế hoạch với các bước phụ thuộc:
   - Tìm các task chưa hoàn thành (JIRA)
   - Nếu có task, gửi thông báo (SLACK)
   - Nếu có task, tạo lịch họp (CALENDAR)
2. Các bước được thực thi theo đúng phụ thuộc
3. Bước tạo lịch họp chỉ được thực hiện nếu tìm thấy task chưa hoàn thành

**Tiêu chí đánh giá:**
- Các điều kiện thực thi được đánh giá chính xác
- Phụ thuộc giữa các bước được đảm bảo
- Bước tạo lịch họp chỉ thực hiện khi điều kiện đúng

### 3. Xử lý lỗi và thử lại

**Mô tả:** Kiểm tra khả năng xử lý lỗi tạm thời và thử lại

**Curl command:**
```bash
curl -X POST http://localhost:3000/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Đặt phòng họp D456 cho ngày mai từ 2 đến 4 giờ chiều",
    "userId": "u123"
  }'
```

**Luồng xử lý kỳ vọng:**
1. Central Agent tạo kế hoạch đặt phòng họp
2. MockMeetingRoomAgent trả về lỗi "phòng đã có người đặt" (lỗi tạm thời)
3. Central Agent thử lại bước đặt phòng với số lần thử tối đa
4. Sau khi đạt giới hạn thử lại, ActionPlanner điều chỉnh kế hoạch
5. Kế hoạch mới được tạo với bước đề xuất phòng họp thay thế và đặt phòng mới

**Tiêu chí đánh giá:**
- Cơ chế thử lại hoạt động đúng cách với số lần thử đã cấu hình
- Kế hoạch được điều chỉnh thông minh sau khi đạt giới hạn thử lại
- Phản hồi cuối cùng cho người dùng phải đề xuất giải pháp thay thế

### 4. Tích hợp luồng công việc phức tạp

**Mô tả:** Kiểm tra khả năng xử lý quy trình công việc liên hoàn phức tạp

**Curl command:**
```bash
curl -X POST http://localhost:3000/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tạo báo cáo tuần cho dự án XDEMO2, gửi email cho team leader và thông báo trên kênh #general",
    "userId": "u123"
  }'
```

**Luồng xử lý kỳ vọng:**
1. Central Agent tạo kế hoạch nhiều bước:
   - Tìm thông tin dự án XDEMO2 (JIRA)
   - Tạo báo cáo tuần (CONFLUENCE)
   - Gửi email cho team leader (EMAIL)
   - Thông báo trên Slack (SLACK)
2. Mỗi bước phụ thuộc vào kết quả của bước trước đó
3. Dữ liệu trả về từ bước trước được sử dụng trong bước sau

**Tiêu chí đánh giá:**
- Dữ liệu được truyền chính xác giữa các bước
- Phụ thuộc giữa các bước được thực thi đúng thứ tự
- Tất cả các bước được hoàn thành thành công

### 5. Xử lý ngữ cảnh hội thoại

**Mô tả:** Kiểm tra khả năng duy trì ngữ cảnh hội thoại trong nhiều lượt tương tác

**Curl commands:**
```bash
# Lượt 1
curl -X POST http://localhost:3000/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tìm các task của tôi trong dự án XDEMO2",
    "userId": "u123"
  }'

# Lượt 2
curl -X POST http://localhost:3000/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Cập nhật task đầu tiên sang trạng thái In Progress",
    "userId": "u123"
  }'

# Lượt 3
curl -X POST http://localhost:3000/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Thông báo cho team về việc này",
    "userId": "u123"
  }'
```

**Luồng xử lý kỳ vọng:**
1. Lượt 1: Central Agent tìm và hiển thị danh sách task
2. Lượt 2: Central Agent hiểu "task đầu tiên" dựa vào ngữ cảnh trước đó
3. Lượt 3: Central Agent hiểu "việc này" là việc cập nhật task đã thực hiện ở lượt 2

**Tiêu chí đánh giá:**
- InputProcessor xử lý đúng ngữ cảnh hội thoại
- Dữ liệu ngữ cảnh được duy trì giữa các lượt tương tác
- ActionPlanner tạo kế hoạch phù hợp dựa trên ngữ cảnh

### 6. Xử lý kỳ vọng người dùng không rõ ràng

**Mô tả:** Kiểm tra khả năng xử lý khi yêu cầu người dùng không rõ ràng

**Curl command:**
```bash
curl -X POST http://localhost:3000/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Cập nhật thông tin dự án",
    "userId": "u123"
  }'
```

**Luồng xử lý kỳ vọng:**
1. Central Agent nhận ra yêu cầu không đủ thông tin
2. ActionPlanner tạo kế hoạch với bước yêu cầu thông tin bổ sung
3. MockSlackAgent gửi tin nhắn yêu cầu người dùng cung cấp thêm thông tin
4. Hệ thống sẵn sàng xử lý phản hồi tiếp theo

**Tiêu chí đánh giá:**
- Hệ thống nhận biết được khi yêu cầu không rõ ràng
- Tin nhắn yêu cầu thông tin bổ sung phải cụ thể
- Ngữ cảnh ban đầu được lưu để xử lý trong tương tác tiếp theo

## Phương pháp đánh giá

### Đánh giá hiệu suất
- Thời gian phản hồi trung bình dưới 5 giây
- Tỷ lệ thành công trên 95% cho các kịch bản phức tạp
- CPU và RAM sử dụng dưới 70% trong quá trình xử lý yêu cầu phức tạp

### Đánh giá độ chính xác
- Tỷ lệ hiểu đúng ngữ cảnh hội thoại > 90%
- Tỷ lệ điều chỉnh kế hoạch thành công > 85%
- Độ chính xác của thông tin trong phản hồi > 95%

### Đánh giá khả năng xử lý lỗi
- Thời gian phát hiện lỗi < 1 giây
- Tỷ lệ phát hiện lỗi và đưa ra giải pháp thay thế > 80%
- Số lượng thử lại được cấu hình hợp lý cho từng loại lỗi

## Công cụ monitoring

### Logs
- Lưu chi tiết các bước xử lý trong file logs
- Ghi log theo cấp độ error, warn, info, debug
- Log đầy đủ đầu vào và đầu ra của mỗi agent con

### Metrics
- Thời gian xử lý mỗi bước
- Tỷ lệ thành công của mỗi loại agent con
- CPU, RAM và network I/O trong quá trình xử lý

### Alerts
- Cảnh báo khi tỷ lệ lỗi vượt quá 10%
- Cảnh báo khi thời gian phản hồi vượt quá 10 giây
- Cảnh báo khi RAM sử dụng vượt quá 80%

## Kết luận

Kế hoạch kiểm thử nâng cao này giúp đánh giá toàn diện khả năng xử lý tình huống phức tạp của Central Agent, từ đó cải thiện độ tin cậy và khả năng thích ứng của hệ thống trong môi trường thực tế. Kết quả kiểm thử sẽ được sử dụng để cải thiện các thuật toán tạo kế hoạch và điều chỉnh các tham số hệ thống. 