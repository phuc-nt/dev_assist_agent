# Test Cases cho Slack Agent

Tổ chức: T07UZEWG7A9  
Kênh dự án: C08JFTGTN2K

## Test Case 1: Gửi tin nhắn đến channel
**Mục tiêu:** Kiểm tra khả năng gửi tin nhắn đến channel dự án  
**Input (Câu lệnh tiếng Việt):**
```
Gửi tin nhắn đến channel dự án với nội dung "Xin chào team, tôi vừa hoàn thành tính năng đăng nhập. Mọi người có thể kiểm tra tại branch feature/login"
```

**Expected API Params:**
```json
{
  "channel": "C08JFTGTN2K",
  "text": "Xin chào team, tôi vừa hoàn thành tính năng đăng nhập. Mọi người có thể kiểm tra tại branch feature/login"
}
```

**API Endpoint:**
- URL: `https://slack.com/api/chat.postMessage`
- Method: POST
- Headers: `Authorization: Bearer xoxb-your-token`

**Chú thích triển khai:**
- Agent cần xác định kênh dự án từ cấu hình dự án (C08JFTGTN2K)
- Không cần xử lý đặc biệt cho nội dung tin nhắn, chỉ cần trích xuất từ câu lệnh

## Test Case 2: Gửi tin nhắn riêng tư
**Mục tiêu:** Kiểm tra khả năng gửi tin nhắn riêng tư đến thành viên  
**Input (Câu lệnh tiếng Việt):**
```
Gửi tin nhắn cho Hưng với nội dung "Xin chào Hưng, bạn có thể review PR #1234 không?"
```

**Expected API Params:**
```json
{
  "channel": "U12345678",
  "text": "Xin chào Hưng, bạn có thể review PR #1234 không?"
}
```

**API Endpoint:**
- URL: `https://slack.com/api/chat.postMessage`
- Method: POST
- Headers: `Authorization: Bearer xoxb-your-token`

**Chú thích triển khai:**
- Agent cần tìm user ID của "Hưng" từ tên người dùng (cần gọi API user.lookupByEmail hoặc users.list trước)
- Sau khi có user ID, sử dụng ID đó làm giá trị cho trường "channel"
- Cần lưu trữ mapping giữa tên thành viên và user ID

## Test Case 3: Tìm kiếm tin nhắn
**Mục tiêu:** Kiểm tra khả năng tìm kiếm tin nhắn trong lịch sử chat  
**Input (Câu lệnh tiếng Việt):**
```
Tìm kiếm các tin nhắn có chứa từ khóa "login" trong channel dự án từ tuần trước
```

**Expected API Params:**
```json
{
  "query": "login in:#project-channel",
  "sort": "timestamp",
  "sort_dir": "desc",
  "count": 20
}
```

**API Endpoint:**
- URL: `https://slack.com/api/search.messages`
- Method: GET
- Headers: `Authorization: Bearer xoxb-your-token`

**Chú thích triển khai:**
- Agent cần tạo query tìm kiếm theo cú pháp Slack
- Cần xác định tên kênh dự án (trên Slack thường là tên, không phải ID)
- Xác định khoảng thời gian "tuần trước" cần xử lý đặc biệt

## Test Case 4: Tạo thread mới
**Mục tiêu:** Kiểm tra khả năng tạo thread từ tin nhắn  
**Input (Câu lệnh tiếng Việt):**
```
Trả lời tin nhắn có ID "1616734022.000400" trong channel dự án với nội dung "Đã sửa xong các lỗi, mọi người có thể kiểm tra lại"
```

**Expected API Params:**
```json
{
  "channel": "C08JFTGTN2K",
  "thread_ts": "1616734022.000400",
  "text": "Đã sửa xong các lỗi, mọi người có thể kiểm tra lại"
}
```

**API Endpoint:**
- URL: `https://slack.com/api/chat.postMessage`
- Method: POST
- Headers: `Authorization: Bearer xoxb-your-token`

**Chú thích triển khai:**
- Agent cần trích xuất ID tin nhắn (thread_ts) từ câu lệnh
- ID kênh phải được xác định từ cấu hình dự án
- thread_ts phải là ID tin nhắn hợp lệ trong kênh

## Test Case 5: Thông báo trạng thái task
**Mục tiêu:** Kiểm tra khả năng thông báo trạng thái task lên Slack  
**Input (Câu lệnh tiếng Việt):**
```
Thông báo lên channel dự án rằng task XDEMO2-123 đã được chuyển sang trạng thái "Done"
```

**Expected API Params:**
```json
{
  "channel": "C08JFTGTN2K",
  "text": "📢 Thông báo: Task XDEMO2-123 đã được chuyển sang trạng thái Done",
  "attachments": [
    {
      "title": "XDEMO2-123: Cập nhật tính năng đăng nhập",
      "title_link": "https://phuc-nt.atlassian.net/browse/XDEMO2-123",
      "text": "Assignee: Phúc\nStatus: Done",
      "color": "#36a64f"
    }
  ]
}
```

**API Endpoint:**
- URL: `https://slack.com/api/chat.postMessage`
- Method: POST
- Headers: `Authorization: Bearer xoxb-your-token`

**Chú thích triển khai:**
- Agent cần trích xuất thông tin task (XDEMO2-123) và trạng thái ("Done")
- Cần tạo tin nhắn có định dạng với attachment
- Phải lấy thông tin chi tiết về task từ JIRA trước (tiêu đề, người được gán)
- Cần xác định màu phù hợp cho trạng thái (xanh lá cho "Done") 