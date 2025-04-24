# DevAssist MCP Server

## Tổng quan

DevAssist MCP Server là phần mềm trung gian hoạt động như một Sub-Agent trong kiến trúc DevAssist Bot, cung cấp giao diện giao tiếp chuẩn (Model Context Protocol) cho phép các mô hình AI tương tác với các hệ thống Atlassian (JIRA và Confluence).

MCP Server đóng vai trò là cầu nối giữa Central Agent và hệ thống Atlassian, chuẩn hóa cách thức giao tiếp và đơn giản hóa việc tích hợp với các mô hình AI khác nhau.

Là một Sub-Agent, MCP Server nhận các yêu cầu từ Central Agent, xử lý các yêu cầu này bằng cách gọi API tương ứng của Atlassian, và trả về kết quả theo định dạng chuẩn. Điều này giúp tách biệt trách nhiệm, đơn giản hóa việc triển khai và bảo trì hệ thống, đồng thời cung cấp khả năng mở rộng dễ dàng cho các dịch vụ Atlassian khác trong tương lai.

## Mục đích

- Tạo giao diện chuẩn hóa để Central Agent tương tác với JIRA và Confluence
- Đảm bảo tương thích với các mô hình AI hiện tại và tương lai theo giao thức MCP
- Đơn giản hóa việc mở rộng tích hợp với các dịch vụ Atlassian khác
- Cung cấp cơ chế xử lý lỗi và ghi nhật ký nhất quán

## Cấu trúc dự án

```
dev_mcp_server/
├── src/
│   ├── config/         # Cấu hình ứng dụng và biến môi trường
│   │   └── env.ts
│   ├── services/       # Các dịch vụ giao tiếp với API Atlassian
│   │   ├── jira.ts
│   │   └── confluence.ts
│   ├── tools/          # Định nghĩa các công cụ MCP
│   │   ├── jira-tools.ts
│   │   └── confluence-tools.ts
│   ├── types/          # Định nghĩa kiểu dữ liệu TypeScript
│   │   └── index.ts
│   ├── utils/          # Các tiện ích và hàm hỗ trợ
│   │   ├── logging.ts
│   │   └── error-handler.ts
│   └── server.ts       # Điểm khởi đầu của ứng dụng
├── .env                # Biến môi trường (không được commit vào repository)
├── package.json
├── tsconfig.json
├── implementation_plan.md  # Tài liệu kế hoạch triển khai
└── README.md           # Tài liệu này
```

## Công nghệ sử dụng

- **Node.js / TypeScript**: Nền tảng và ngôn ngữ chính
- **@modelcontextprotocol/sdk**: SDK chính để triển khai Model Context Protocol
- **Zod**: Xác thực schema cho tham số đầu vào
- **Dotenv**: Quản lý biến môi trường
- **Fetch API**: Giao tiếp với API của Atlassian

## Các thành phần chính

### Services

Các module dịch vụ chịu trách nhiệm giao tiếp trực tiếp với API của Atlassian:

- **jira.ts**: Cung cấp các hàm cơ bản để tương tác với JIRA API
  - `fetchProjects`: Lấy danh sách dự án
  - `searchIssues`: Tìm kiếm vấn đề
  - `getIssue`: Lấy thông tin chi tiết vấn đề
  - `createIssue`: Tạo vấn đề mới
  - `updateIssueStatus`: Cập nhật trạng thái vấn đề
  - `addComment`: Thêm bình luận vào vấn đề

- **confluence.ts**: Cung cấp các hàm cơ bản để tương tác với Confluence API
  - `getSpaces`: Lấy danh sách không gian
  - `getPages`: Lấy danh sách trang trong không gian
  - `getPageContent`: Lấy nội dung trang
  - `createPage`: Tạo trang mới
  - `updatePage`: Cập nhật nội dung trang
  - `searchContent`: Tìm kiếm nội dung

### Tools

Các công cụ MCP được xây dựng trên các dịch vụ:

- **jira-tools.ts**: Định nghĩa các công cụ MCP cho JIRA
  - `list_jira_projects`: Liệt kê các dự án
  - `search_jira_issues`: Tìm kiếm vấn đề
  - `get_jira_issue`: Lấy chi tiết vấn đề
  - `create_jira_issue`: Tạo vấn đề mới
  - `update_jira_issue`: Cập nhật trạng thái vấn đề
  - `add_jira_comment`: Thêm bình luận

- **confluence-tools.ts**: Định nghĩa các công cụ MCP cho Confluence
  - `list_confluence_spaces`: Liệt kê không gian
  - `list_confluence_pages`: Liệt kê trang
  - `get_confluence_page_content`: Lấy nội dung trang
  - `create_confluence_page`: Tạo trang mới
  - `update_confluence_page`: Cập nhật trang
  - `search_confluence_content`: Tìm kiếm nội dung

### Server

File `server.ts` là điểm khởi đầu của ứng dụng, nơi khởi tạo MCP Server với các công cụ đã định nghĩa và thiết lập HTTP Transport.

### Utils

Các tiện ích hỗ trợ:

- **logging.ts**: Hệ thống ghi nhật ký với các cấp độ khác nhau (DEBUG, INFO, WARN, ERROR, FATAL)
- **error-handler.ts**: Xử lý lỗi tập trung với các lớp lỗi tiêu chuẩn và hàm chuyển đổi lỗi

## Liên kết với DevAssist Backend

DevAssist MCP Server là một phần quan trọng trong kiến trúc DevAssist Bot, hoạt động như một Sub-Agent tích hợp với `dev_assist_backend` (Central Agent). Dưới đây là mối quan hệ giữa hai thành phần:

### Kiến trúc tổng thể

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│    LLM Models   │◄────────│  Central Agent   │◄────────│     Client      │
│  (Claude, GPT)  │         │dev_assist_backend│         │   Applications  │
└────────┬────────┘         └────────┬─────────┘         └─────────────────┘
         │                           │
         │                           │
         │                  ┌────────▼─────────┐
         │                  │   MCP Server     │
         └──────────────────►dev_mcp_server    │
                            └────────┬─────────┘
                                     │
                                     │
                            ┌────────▼─────────┐
                            │  Atlassian APIs  │
                            │ (JIRA/Confluence)│
                            └──────────────────┘
```

### Luồng xử lý

1. Client gửi yêu cầu đến Central Agent (`dev_assist_backend`)
2. Central Agent phân tích yêu cầu và xác định cần tương tác với JIRA/Confluence
3. Central Agent gọi MCP Server (`dev_mcp_server`) với các tham số phù hợp
4. MCP Server xử lý yêu cầu, gọi API Atlassian và trả về kết quả chuẩn hóa
5. Central Agent kết hợp kết quả và trả lời cho Client

### Giao thức giao tiếp

- Central Agent gọi đến MCP Server thông qua HTTP API tuân theo giao thức MCP
- Các yêu cầu được xác thực thông qua Basic Authentication
- Phản hồi được chuẩn hóa theo định dạng ServiceResult với cấu trúc nhất quán

### Cấu hình kết nối

Trong `dev_assist_backend`, việc kết nối đến MCP Server cần được cấu hình với:

```typescript
// Mẫu cấu hình trong dev_assist_backend
const mcpServerConfig = {
  baseUrl: 'http://localhost:3000', // Hoặc URL triển khai thực tế
  auth: {
    username: 'central-agent',
    password: 'secure-password' // Thay đổi trong môi trường sản xuất
  }
};
```

## Cách sử dụng

### Thiết lập môi trường

1. Tạo file `.env` từ mẫu `.env.example`:

```bash
cp .env.example .env
```

2. Cập nhật các biến môi trường trong `.env`:

```
JIRA_API_TOKEN=your_jira_api_token
JIRA_EMAIL=your_jira_email

CONFLUENCE_API_TOKEN=your_confluence_api_token
CONFLUENCE_EMAIL=your_confluence_email

PORT=3000
NODE_ENV=development
```

### Cài đặt dependencies

```bash
npm install
```

### Chạy trong môi trường phát triển

```bash
npm run dev
```

### Build cho môi trường sản xuất

```bash
npm run build
npm start
```

## Kiểm thử

### Kiểm thử đơn vị và tích hợp

```bash
# Chạy toàn bộ test
npm test

# Chạy test trong chế độ watch
npm run test:watch
```

### Kiểm thử thực tế với Atlassian API

MCP Server có các test thực tế (real integration tests) để kiểm tra kết nối với các API của Atlassian:

1. **Cấu hình Atlassian API**:
   - Tạo file `.env.test` trong thư mục gốc với nội dung:
   ```
   JIRA_API_TOKEN=your_jira_api_token
   JIRA_EMAIL=your_atlassian_email
   CONFLUENCE_API_TOKEN=your_confluence_api_token
   CONFLUENCE_EMAIL=your_atlassian_email
   ```

2. **Chạy test thực tế**:
   ```bash
   npm run test:real
   ```

Lưu ý:
- Các test thực tế sẽ tạo ra các task JIRA và trang Confluence thật.
- Mặc định, các test thực tế được bỏ qua trừ khi có biến môi trường `RUN_REAL_TESTS=true`.
- URL của các tài nguyên được tạo sẽ hiển thị trong output của test.

## Mở rộng

### Thêm công cụ MCP mới

1. Nếu cần, tạo dịch vụ mới trong thư mục `src/services/`
2. Định nghĩa công cụ mới trong file tools tương ứng hoặc tạo file tools mới
3. Đăng ký công cụ trong `server.ts`

### Thêm tích hợp với dịch vụ Atlassian khác

1. Tạo dịch vụ mới trong thư mục `src/services/`
2. Tạo các công cụ MCP tương ứng trong thư mục `src/tools/`
3. Đăng ký tài nguyên và công cụ mới trong `server.ts`

## Thực hành tốt nhất

- Sử dụng `ServiceResult<T>` để chuẩn hóa kết quả từ tất cả các dịch vụ
- Quản lý token API an toàn, không lưu trữ trong mã nguồn
- Triển khai xử lý lỗi nhất quán thông qua module error-handler
- Ghi nhật ký đầy đủ cho tất cả các API request và response
- Sử dụng Zod để xác thực tham số đầu vào của tất cả các công cụ MCP
- Theo dõi giới hạn tốc độ API của Atlassian để tránh bị chặn

## Tài liệu tham khảo

- [Model Context Protocol Documentation](https://github.com/anthropics/model-context-protocol)
- [JIRA REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Confluence REST API Documentation](https://developer.atlassian.com/cloud/confluence/rest/) 