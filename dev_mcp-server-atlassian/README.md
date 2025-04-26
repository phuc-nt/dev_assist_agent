# MCP Server cho Atlassian (Jira và Confluence)

MCP (Model Context Protocol) Server cho Atlassian giúp kết nối các trợ lý AI với Jira và Confluence, cho phép truy vấn và thực hiện các tác vụ trên Atlassian Cloud.

## Tính năng

- **Tích hợp với Jira**:
  - Tìm kiếm và xem issues
  - Tạo và cập nhật issues
  - Chuyển trạng thái issues
  - Gán issues cho người dùng

- **Tích hợp với Confluence**:
  - Tìm kiếm và xem trang
  - Tạo và cập nhật trang
  - Xem danh sách spaces
  - Thêm comments vào trang

## Yêu cầu

- Node.js 16+ (cho phát triển local)
- Docker và Docker Compose (cho triển khai container)
- Tài khoản Atlassian Cloud và API token

## Cài đặt và Chạy

### Phát triển Local

1. Clone repository:
   ```bash
   git clone https://github.com/yourusername/mcp-atlassian-server.git
   cd mcp-atlassian-server
   ```

2. Cài đặt dependencies:
   ```bash
   npm install
   ```

3. Tạo file `.env` với nội dung:
   ```
   ATLASSIAN_SITE_NAME=your-site.atlassian.net
   ATLASSIAN_USER_EMAIL=your-email@example.com
   ATLASSIAN_API_TOKEN=your-api-token
   ```

4. Build và chạy:
   ```bash
   npm run build
   npm start
   ```

### Sử dụng Docker

1. Tạo file `.env` như trên

2. Chạy script để quản lý Docker:
   ```bash
   chmod +x start-docker.sh
   ./start-docker.sh
   ```

3. Chọn "1. Chạy MCP Server (với STDIO Transport)"

## Kết nối với Cline

Thêm cấu hình sau vào file `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "atlassian-docker": {
      "command": "docker",
      "args": ["exec", "-i", "mcp-atlassian", "node", "dist/index.js"],
      "env": {}
    }
  }
}
```

Thông tin xác thực Atlassian sẽ được đọc từ file `.env` trong container, không cần thiết lập lại trong cấu hình Cline.

## Các Tools Được Hỗ Trợ

### Jira

- `getIssue`: Lấy thông tin chi tiết về issue
- `searchIssues`: Tìm kiếm issues theo JQL
- `createIssue`: Tạo issue mới
- `updateIssue`: Cập nhật thông tin issue
- `transitionIssue`: Chuyển trạng thái issue
- `assignIssue`: Gán issue cho người dùng

### Confluence

- `getPage`: Lấy thông tin chi tiết về trang
- `searchPages`: Tìm kiếm trang theo CQL
- `createPage`: Tạo trang mới
- `updatePage`: Cập nhật nội dung trang
- `getSpaces`: Lấy danh sách spaces
- `addComment`: Thêm comment vào trang

## Quản lý Docker

Script `start-docker.sh` cung cấp các tùy chọn sau:

1. Chạy MCP Server (với STDIO Transport)
2. Dừng và xóa container
3. Xem logs của container
4. Hiển thị cấu hình Cline
5. Thoát

## Xử lý sự cố

Nếu bạn gặp vấn đề khi kết nối với Cline, hãy kiểm tra:

1. Container Docker đang chạy:
   ```bash
   docker ps --filter "name=mcp-atlassian"
   ```

2. Logs của container:
   ```bash
   docker logs mcp-atlassian
   ```

3. Cấu hình Atlassian API token có đúng không:
   - Đảm bảo tài khoản Atlassian có quyền truy cập vào các API cần thiết
   - Kiểm tra token còn hiệu lực 