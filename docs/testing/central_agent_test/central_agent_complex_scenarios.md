# Kế hoạch kiểm thử kịch bản phức tạp cho Central Agent

Tài liệu này mô tả các kịch bản kiểm thử phức tạp cho Central Agent, tập trung vào khả năng xử lý các tình huống đa dạng và phức tạp. Các kịch bản này được thiết kế để kiểm tra khả năng thích ứng, xử lý lỗi và phối hợp giữa các thành phần của hệ thống trong điều kiện thực tế.

## Tổng quan

Central Agent là thành phần chính trong hệ thống quản lý công việc, có nhiệm vụ phối hợp giữa các Sub-Agent (JIRA, Slack, Google Calendar...) để thực hiện các yêu cầu của người dùng. Việc kiểm thử toàn diện các kịch bản phức tạp giúp đảm bảo hệ thống có thể xử lý các tình huống thực tế và khó khăn, nâng cao độ tin cậy của hệ thống.

Các kịch bản kiểm thử trong tài liệu này tập trung vào:
- Xử lý nhiều yêu cầu đồng thời
- Điều phối các tác vụ có phụ thuộc phức tạp
- Khả năng phục hồi sau lỗi
- Xử lý ngữ cảnh hội thoại phức tạp
- Tích hợp với nhiều Sub-Agent cùng lúc

## 1. Kịch bản kiểm thử phức tạp

### 1.1 Quản lý dự án đa nhiệm

**Mô tả**: Người dùng muốn quản lý nhiều công việc liên quan đến một dự án, bao gồm tạo tasks, gán người thực hiện, thiết lập deadline và thông báo cho team.

**Endpoint**: `POST /api/central-agent/process`

**Curl Command**:
```bash
curl -X POST http://localhost:3000/api/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Tạo một sprint mới cho dự án XYZ với tên \"Sprint 12\", thời gian từ 15/07 đến 30/07. Tạo 3 task cho Nam về tính năng đăng nhập, cho Hương về thiết kế UI, và cho Tuấn về optimize database. Đặt deadline cho tất cả là 28/07 và gửi thông báo cho team qua kênh #project-xyz.",
    "userId": "user123",
    "conversationHistory": []
  }'
```

**Kỳ vọng**:
1. Central Agent phân tích yêu cầu phức tạp và tách thành nhiều tác vụ con
2. Tạo kế hoạch thực thi bao gồm các bước:
   - Tạo sprint mới
   - Tạo 3 task riêng biệt với thông tin người được gán
   - Thiết lập deadline
   - Gửi thông báo tới kênh Slack
3. Thực thi các bước theo đúng thứ tự phụ thuộc
4. Tổng hợp và trả về kết quả đầy đủ

**Kịch bản phụ**:
- **Người dùng không tồn tại**: Hệ thống cần thông báo lỗi và đề xuất kiểm tra lại thông tin
- **Sprint đã tồn tại**: Hệ thống cần điều chỉnh kế hoạch và đề xuất tạo phiên bản mới
- **Kênh Slack không tồn tại**: Hệ thống cần báo lỗi riêng phần thông báo nhưng vẫn hoàn thành các tác vụ khác

### 1.2 Xử lý lỗi và tái thực thi

**Mô tả**: Kiểm tra khả năng xử lý lỗi và điều chỉnh kế hoạch khi gặp sự cố trong quá trình thực thi.

**Endpoint**: `POST /api/central-agent/process`

**Curl Command**:
```bash
curl -X POST http://localhost:3000/api/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Chuyển tất cả các task đang ở trạng thái In Progress sang Done và thông báo cho team quản lý",
    "userId": "user123",
    "conversationHistory": []
  }'
```

**Kịch bản kiểm thử**:
1. Mock JIRA Agent trả về danh sách tasks ở trạng thái In Progress
2. Cấu hình một số task không thể chuyển trực tiếp sang Done (cần qua trạng thái Review)
3. Mock lỗi khi cố gắng chuyển trạng thái trực tiếp
4. Kiểm tra khả năng điều chỉnh kế hoạch của Central Agent:
   - Nhận dạng lỗi transition
   - Tạo kế hoạch mới với các bước trung gian
   - Thực thi kế hoạch đã điều chỉnh

**Kỳ vọng**:
- Central Agent nhận dạng được lỗi transition và tự điều chỉnh
- Tạo plan mới để chuyển task qua các trạng thái trung gian
- Hoàn thành được tất cả các chuyển đổi trạng thái
- Gửi thông báo thành công cho team

### 1.3 Xử lý hội thoại phức tạp

**Mô tả**: Kiểm tra khả năng hiểu và xử lý ngữ cảnh hội thoại phức tạp, với nhiều tham chiếu đến thông tin từ các lần tương tác trước.

**Endpoint**: `POST /api/central-agent/process`

**Curl Commands (chuỗi các lệnh)**:
```bash
# Lệnh 1: Tìm kiếm task
curl -X POST http://localhost:3000/api/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Tìm tất cả các task đang được gán cho tôi",
    "userId": "user123",
    "conversationHistory": []
  }'

# Lệnh 2: Tham chiếu đến kết quả trước
curl -X POST http://localhost:3000/api/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Trong số đó, chọn những task có priority cao và thêm label \"urgent\"",
    "userId": "user123",
    "conversationHistory": [
      {"role": "user", "content": "Tìm tất cả các task đang được gán cho tôi"},
      {"role": "assistant", "content": "Tôi đã tìm thấy 5 task được gán cho bạn: XDEMO-1 (Tính năng đăng nhập, priority: High), XDEMO-2 (Thiết kế UI, priority: Medium), XDEMO-3 (Fix bugs, priority: High), XDEMO-4 (Viết tài liệu, priority: Low), XDEMO-5 (Code review, priority: Medium)"}
    ]
  }'

# Lệnh 3: Tham chiếu sâu hơn
curl -X POST http://localhost:3000/api/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Tạo một cuộc họp khẩn cấp với team để thảo luận về chúng vào ngày mai 10 giờ sáng",
    "userId": "user123",
    "conversationHistory": [
      {"role": "user", "content": "Tìm tất cả các task đang được gán cho tôi"},
      {"role": "assistant", "content": "Tôi đã tìm thấy 5 task được gán cho bạn: XDEMO-1 (Tính năng đăng nhập, priority: High), XDEMO-2 (Thiết kế UI, priority: Medium), XDEMO-3 (Fix bugs, priority: High), XDEMO-4 (Viết tài liệu, priority: Low), XDEMO-5 (Code review, priority: Medium)"},
      {"role": "user", "content": "Trong số đó, chọn những task có priority cao và thêm label \"urgent\""},
      {"role": "assistant", "content": "Tôi đã thêm label \"urgent\" cho 2 task có priority cao: XDEMO-1 (Tính năng đăng nhập) và XDEMO-3 (Fix bugs)."}
    ]
  }'
```

**Kỳ vọng**:
- Central Agent hiểu được tham chiếu "chúng" ở lệnh 3 là các task priority cao đã được đánh dấu urgent
- Tạo được cuộc họp với title liên quan đến các task XDEMO-1 và XDEMO-3
- Mời đúng những người liên quan đến các task đó

### 1.4 Tích hợp đa Sub-Agent

**Mô tả**: Kiểm tra khả năng phối hợp nhiều Sub-Agent khác nhau (JIRA, Slack, Google Calendar, Gmail) trong một yêu cầu phức tạp.

**Endpoint**: `POST /api/central-agent/process`

**Curl Command**:
```bash
curl -X POST http://localhost:3000/api/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Lấy danh sách các task critical chưa hoàn thành, tạo báo cáo tóm tắt, đặt lịch họp khẩn cấp với team vào ngày mai, và gửi email thông báo cho quản lý với báo cáo đính kèm",
    "userId": "user123",
    "conversationHistory": []
  }'
```

**Kỳ vọng**:
1. Central Agent tạo kế hoạch phối hợp 4 Sub-Agent:
   - JIRA Agent: Lấy danh sách task critical chưa hoàn thành
   - Google Docs Agent: Tạo báo cáo tóm tắt
   - Google Calendar Agent: Đặt lịch họp với team
   - Gmail Agent: Gửi email kèm báo cáo
2. Các bước được thực thi theo đúng thứ tự phụ thuộc
3. Kết quả cuối cùng bao gồm thông tin từ tất cả các Sub-Agent

**Kịch bản phụ**:
- **Không có task critical nào**: Điều chỉnh nội dung báo cáo, vẫn tạo lịch họp nhưng với mục đích khác
- **Lỗi khi tạo báo cáo**: Vẫn gửi email nhưng chỉ với nội dung text, không có đính kèm
- **Không thể đặt lịch họp vào ngày mai**: Đề xuất thời gian thay thế

### 1.5 Xử lý yêu cầu mơ hồ

**Mô tả**: Kiểm tra khả năng xử lý yêu cầu không rõ ràng và khả năng làm rõ thông tin.

**Endpoint**: `POST /api/central-agent/process`

**Curl Command**:
```bash
curl -X POST http://localhost:3000/api/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Cập nhật task và thông báo cho team",
    "userId": "user123",
    "conversationHistory": []
  }'
```

**Kỳ vọng**:
- Central Agent nhận dạng yêu cầu mơ hồ và đề xuất làm rõ
- Trả về các thông tin cần làm rõ: task nào, cập nhật gì, team nào
- Cung cấp gợi ý cho các thông tin thiếu

## 2. Kịch bản kiểm thử xử lý lỗi

### 2.1 Tái thử khi gặp lỗi tạm thời

**Mô tả**: Kiểm tra khả năng tái thử khi gặp lỗi tạm thời từ các API.

**Endpoint**: `POST /api/central-agent/process`

**Curl Command**:
```bash
curl -X POST http://localhost:3000/api/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Tạo task mới về tính năng đăng nhập với priority cao",
    "userId": "user123",
    "conversationHistory": []
  }'
```

**Kịch bản kiểm thử**:
1. Cấu hình JIRA Agent trả về lỗi 429 (Rate Limit) ở lần gọi đầu tiên
2. Lần gọi thứ hai trả về lỗi 500 (Server Error)
3. Lần gọi thứ ba trả về kết quả thành công

**Kỳ vọng**:
- Central Agent thực hiện tối đa 3 lần thử lại
- Mỗi lần thử lại có thời gian chờ tăng dần
- Cuối cùng hoàn thành tạo task và trả về kết quả thành công

### 2.2 Khôi phục trạng thái sau lỗi

**Mô tả**: Kiểm tra khả năng khôi phục lại trạng thái khi một phần của quy trình bị lỗi.

**Endpoint**: `POST /api/central-agent/process`

**Curl Command**:
```bash
curl -X POST http://localhost:3000/api/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Tạo epic mới cho dự án XYZ, thêm 3 task con, và thông báo cho team",
    "userId": "user123",
    "conversationHistory": []
  }'
```

**Kịch bản kiểm thử**:
1. Epic được tạo thành công
2. Task đầu tiên và thứ hai được tạo thành công
3. Task thứ ba bị lỗi do dữ liệu không hợp lệ
4. Thông báo Slack bị lỗi do channel không tồn tại

**Kỳ vọng**:
- Epic và 2 task đầu tiên được giữ nguyên
- Central Agent báo cáo cụ thể những gì đã thành công và những gì thất bại
- Đề xuất cách khắc phục cho các phần bị lỗi

### 2.3 Xử lý thông tin người dùng không chính xác

**Mô tả**: Kiểm tra khả năng xử lý khi thông tin người dùng cung cấp không chính xác.

**Endpoint**: `POST /api/central-agent/process`

**Curl Command**:
```bash
curl -X POST http://localhost:3000/api/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Chuyển task XYZ-123 sang trạng thái Done",
    "userId": "user123",
    "conversationHistory": []
  }'
```

**Kịch bản kiểm thử**:
1. Task XYZ-123 không tồn tại
2. Central Agent tìm kiếm các task tương tự
3. Tìm thấy task XYZ-132 và XYZ-124

**Kỳ vọng**:
- Central Agent thông báo task XYZ-123 không tồn tại
- Đề xuất các task tương tự có thể người dùng đang đề cập đến
- Yêu cầu người dùng xác nhận trước khi thực hiện

## 3. Kịch bản kiểm thử hiệu suất

### 3.1 Xử lý yêu cầu đồng thời

**Mô tả**: Kiểm tra khả năng xử lý nhiều yêu cầu đồng thời từ nhiều người dùng khác nhau.

**Endpoint**: `POST /api/central-agent/process`

**Curl Command (chạy 10 lệnh đồng thời)**:
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/central-agent/process \
    -H "Content-Type: application/json" \
    -d '{
      "userInput": "Tìm tất cả các task đang được gán cho tôi với priority cao",
      "userId": "user'$i'",
      "conversationHistory": []
    }' &
done
```

**Kỳ vọng**:
- Tất cả các yêu cầu được xử lý thành công
- Thời gian phản hồi trung bình dưới 5 giây
- Không có race condition trong việc gọi các Sub-Agent

### 3.2 Xử lý yêu cầu phức tạp dài

**Mô tả**: Kiểm tra khả năng xử lý yêu cầu với nhiều bước và phụ thuộc phức tạp.

**Endpoint**: `POST /api/central-agent/process`

**Curl Command**:
```bash
curl -X POST http://localhost:3000/api/central-agent/process \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Lấy danh sách tất cả các epic trong sprint hiện tại, sau đó tìm tất cả các task chưa hoàn thành trong mỗi epic, phân loại chúng theo priority và người được gán, tạo báo cáo tiến độ dự án, đặt lịch họp review vào thứ 6 tuần này lúc 14:00, mời tất cả team lead và manager, gửi email tóm tắt tới ban quản lý với báo cáo đính kèm, và thông báo trên Slack kênh #project-xyz",
    "userId": "user123",
    "conversationHistory": []
  }'
```

**Kỳ vọng**:
- Central Agent tạo kế hoạch với ít nhất 7-8 bước
- Mỗi bước được thực thi theo đúng thứ tự phụ thuộc
- Kết quả tổng hợp đầy đủ tất cả thông tin từ các bước
- Thời gian thực thi tổng thể dưới 30 giây

## 4. Kết luận

Các kịch bản kiểm thử phức tạp này giúp đánh giá toàn diện khả năng của Central Agent trong việc xử lý các tình huống thực tế đa dạng. Qua việc kiểm thử các kịch bản này, chúng ta có thể:

1. Đánh giá độ chính xác và độ tin cậy của hệ thống
2. Xác định các điểm yếu và cải thiện cần thiết
3. Đảm bảo hệ thống hoạt động ổn định trong môi trường sản xuất
4. Chuẩn bị cho việc mở rộng chức năng trong tương lai

Các kịch bản này sẽ được thực hiện trong môi trường kiểm thử trước khi triển khai production, với đầy đủ các mock data và giả lập cho các Sub-Agent để đảm bảo kiểm thử toàn diện mà không ảnh hưởng đến hệ thống thật. 