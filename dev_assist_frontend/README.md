# DevAssist Bot Frontend

Ứng dụng giao diện người dùng cho DevAssist Bot - trợ lý thông minh hỗ trợ các nhà phát triển tự động hóa các tác vụ hành chính và quản lý dự án.

## Tính năng

- Giao diện chatbot tương tác
- Lưu trữ và quản lý lịch sử hội thoại
- Tích hợp với các dịch vụ bên ngoài (JIRA, Slack, Calendar)
- Theo dõi sử dụng token
- Giao diện thích ứng với thiết bị di động

## Công nghệ sử dụng

- React
- Next.js
- TypeScript
- Redux (Redux Toolkit)
- Tailwind CSS
- Axios

## Cài đặt

1. Clone repository:

```bash
git clone <repository-url>
cd dev_assist_frontend
```

2. Cài đặt các dependencies:

```bash
npm install
```

3. Tạo file .env.local với các biến môi trường:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
BACKEND_API_URL=http://localhost:8000/api
```

4. Khởi chạy server phát triển:

```bash
npm run dev
```

5. Mở trình duyệt và truy cập http://localhost:3000

## Kết nối với Backend

Ứng dụng frontend này cần kết nối với một backend API để xử lý các yêu cầu chat và quản lý tài nguyên. Backend API cần có các endpoints sau:

### API Endpoints

1. **Chat Completions**
   - `POST /api/chat/completions`
   - Request format tuân theo chuẩn của OpenAI Chat Completion:
   ```json
   {
     "model": "gpt-4o-mini",
     "messages": [
       {
         "role": "user",
         "content": "Nội dung tin nhắn"
       }
     ],
     "conversation_id": "id_cuộc_trò_chuyện",
     "temperature": 0.7,
     "max_tokens": 2000
   }
   ```

2. **Quản lý Cuộc trò chuyện**
   - `GET /api/conversations` - Lấy danh sách cuộc trò chuyện
   - `POST /api/conversations` - Tạo cuộc trò chuyện mới
   - `GET /api/conversations/{id}` - Lấy thông tin chi tiết cuộc trò chuyện
   - `DELETE /api/conversations/{id}` - Xóa cuộc trò chuyện
   - `GET /api/conversations/{id}/messages` - Lấy tin nhắn của cuộc trò chuyện

3. **Tích hợp Dịch vụ**
   - `GET /api/integrations/status` - Lấy trạng thái các tích hợp
   - `POST /api/integrations/{type}/connect` - Kết nối với dịch vụ
   - `POST /api/integrations/{type}/disconnect` - Ngắt kết nối với dịch vụ

4. **Sử dụng Token**
   - `GET /api/tokens/usage` - Lấy thống kê sử dụng token

### Cấu hình Backend URL

URL của backend API có thể được cấu hình trong file `.env.local`:

```
BACKEND_API_URL=http://localhost:8000/api
```

## Build cho Production

Để build ứng dụng cho môi trường production:

```bash
npm run build
npm start
```

## Giấy phép

[MIT](LICENSE)
