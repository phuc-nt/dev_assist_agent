# Hướng dẫn kiểm thử cho MCP Server

## Chiến lược kiểm thử

Dự án MCP Server tập trung vào 3 loại kiểm thử chính:

1. **Kiểm thử kết nối API cơ bản**: Kiểm tra khả năng kết nối với API thực tế của Jira và Confluence
2. **Kiểm thử tích hợp thực tế đầy đủ**: Kiểm tra toàn diện các service và chức năng với API thực tế
3. **Kiểm thử tích hợp nhanh**: Kiểm tra nhanh chóng với API thực tế cho mỗi service

Cách tiếp cận này cho phép:
- Xác minh kết nối đến API Atlassian hoạt động
- Đảm bảo tất cả các chức năng hoạt động đúng với API thực tế
- Cho phép kiểm tra nhanh chóng khi cần

## Các test case hiện có

1. **connection.test.ts**: Kiểm tra kết nối cơ bản HTTP đến API Jira và Confluence. Test này:
   - Xác minh có thể thiết lập kết nối HTTP
   - Xác minh xác thực API token hoạt động
   - Xác minh có thể nhận phản hồi có cấu trúc từ API

2. **real-atlassian.test.ts**: Kiểm tra tích hợp đầy đủ với API thực tế. Test này:
   - Kiểm tra toàn diện tất cả các chức năng của JIRA (6 chức năng)
   - Kiểm tra toàn diện tất cả các chức năng của Confluence (6 chức năng)
   - Xác minh dữ liệu và xử lý lỗi

3. **quick-atlassian.test.ts**: Kiểm tra tích hợp nhanh. Test này:
   - Kiểm tra 2 chức năng cơ bản của JIRA trong một test (lấy dự án và tạo task)
   - Kiểm tra 2 chức năng cơ bản của Confluence trong một test (lấy không gian và tạo trang)
   - Phù hợp cho kiểm tra nhanh khi phát triển

## Cách chạy test

```bash
# Chạy tất cả các test
npm test

# Chạy test kết nối cơ bản
npm run test:connection

# Chạy test tích hợp đầy đủ với API thực tế
npm run test:real

# Chạy test tích hợp nhanh với API thực tế
npm run test:quick
```

## Sử dụng Token API thật

Các test đều sử dụng token API từ file `.env`. Để chạy đầy đủ test cần:

1. Tạo file `.env` dựa trên `.env.example`
2. Thêm token API cho Jira và Confluence vào file `.env`:
   ```
   JIRA_API_TOKEN=your_api_token
   JIRA_EMAIL=your_email@example.com
   CONFLUENCE_API_TOKEN=your_api_token
   CONFLUENCE_EMAIL=your_email@example.com
   ```

Nếu không cấu hình token API, test sẽ bỏ qua các testcase liên quan với thông báo.

## Mở rộng test

Khi thêm tính năng mới, hãy:
1. Cập nhật test đầy đủ trong real-atlassian.test.ts
2. Đảm bảo quick-atlassian.test.ts vẫn hoạt động
3. Nếu thay đổi cấu trúc API, cập nhật connection.test.ts 