# Kế hoạch triển khai Atlassian Agent (Jira và Confluence)

## Tổng quan
Kế hoạch triển khai Atlassian Agent (bao gồm Jira Agent và Confluence Agent) theo mô hình MCP (Model Context Protocol), tập trung vào việc xây dựng một server MCP để kết nối giữa trợ lý AI và các hệ thống Atlassian. Ban đầu, sẽ ưu tiên tích hợp với Jira và Confluence, hai công cụ phổ biến nhất trong hệ sinh thái Atlassian.

## Danh sách tác vụ và tiến độ

### Phase 1: Thiết lập cơ bản
- [x] Tạo cấu trúc thư mục cho MCP Atlassian Server
- [x] Thiết lập package.json và các dependencies cần thiết
- [x] Cấu hình TypeScript
- [x] Thiết lập tệp .env và cấu hình biến môi trường
- [x] Tạo các utils cơ bản cho việc giao tiếp với Atlassian API

### Phase 2: Xây dựng API Utils
- [x] Tạo hàm helper để gọi Jira API
- [x] Tạo hàm helper để gọi Confluence API
- [x] Xây dựng bộ chuyển đổi ADF (Atlassian Document Format) sang Markdown
- [x] Cài đặt error handling và logging
- [x] Viết unit test cho các utils

### Phase 3: Triển khai Jira Agent
- [x] Triển khai tool getIssue để lấy thông tin chi tiết về một issue
- [x] Triển khai tool searchIssues để tìm kiếm issues theo JQL
- [x] Triển khai tool createIssue để tạo issue mới
- [x] Triển khai tool updateIssue để cập nhật issue
- [x] Triển khai tool transitionIssue để chuyển trạng thái issue
- [x] Triển khai tool assignIssue để gán issue cho người dùng
- [x] Viết unit test cho từng tool

### Phase 4: Triển khai Confluence Agent
- [x] Triển khai tool getPage để lấy thông tin chi tiết về một trang
- [x] Triển khai tool searchPages để tìm kiếm trang theo CQL
- [x] Triển khai tool createPage để tạo trang mới
- [x] Triển khai tool updatePage để cập nhật trang
- [x] Triển khai tool getSpaces để lấy danh sách spaces
- [x] Triển khai tool addComment để thêm comment vào trang
- [x] Viết unit test cho từng tool

### Phase 5: Tích hợp MCP Protocol (Hoàn thành)
- [x] Khởi tạo MCP Server framework
- [x] Đổi API đăng ký từ registerTool sang tool (theo MCP SDK mới)
- [x] Thiết lập context quản lý cho các tools
- [x] Sửa lỗi kiểu dữ liệu trả về cho các tools để tuân thủ MCP Protocol
  - [x] Áp dụng kiểu McpResponse với createTextResponse/createErrorResponse
  - [x] Đảm bảo tất cả các tools trả về theo định dạng chuẩn
  - [x] Thêm xử lý lỗi đầy đủ với try-catch và định dạng lỗi chuẩn
- [x] Xây dựng transport layer (StdioServerTransport)
- [x] Thiết lập cấu trúc file test e2e

### Phase 6: Tạo và Kiểm thử MCP Client (New)
- [x] Tạo cấu trúc dự án client (dev_mcp-atlassian-test-client)
- [x] Cấu hình TypeScript và dependencies
- [x] Tạo mô-đun đọc và quản lý biến môi trường
- [x] Triển khai kết nối StdioClientTransport
- [x] Thực hiện các lệnh gọi API cơ bản
- [x] Phát hiện và ghi nhận vấn đề "context.get is not a function"
- [ ] Sửa lỗi xử lý context trong MCP Server

### Phase 7: Tối ưu và Mở rộng
- [ ] Tối ưu hóa hiệu suất API calls
- [ ] Cài đặt caching để giảm số lượng requests
- [ ] Cải thiện error handling và retry logic
- [ ] Thêm các authentication methods bổ sung (OAuth)
- [ ] Cập nhật documentation cho tất cả APIs

### Phase 8: Tích hợp với DevAssist Central Agent
- [ ] Tạo interface giữa MCP Server và Central Agent
- [ ] Cập nhật mock agents trong Central Agent để sử dụng MCP Server
- [ ] Viết integration test giữa Central Agent và MCP Server
- [ ] Cập nhật cấu hình để Central Agent có thể sử dụng MCP Server

### Phase 9: Triển khai Security và Monitoring
- [ ] Triển khai rate limiting để tránh quá tải API
- [ ] Thiết lập monitoring cho API calls
- [ ] Cài đặt logging cho mọi requests và responses
- [ ] Thiết lập cơ chế bảo mật cho tokens và credentials

### Phase 10: Dockerization và Deployment
- [ ] Tạo Dockerfile
- [ ] Thiết lập Docker Compose cho môi trường phát triển
- [ ] Tạo CI/CD pipeline
- [ ] Chuẩn bị tài liệu hướng dẫn triển khai

### Phase 7.1: Chuẩn hóa phương pháp gọi API (Mới)
- [ ] Chuyển đổi phương pháp gọi API Jira từ SDK jira.js sang sử dụng fetch trực tiếp
  - [x] Cập nhật hàm getIssue để sử dụng fetch thay vì SDK
  - [x] Cập nhật hàm searchIssues để sử dụng fetch thay vì SDK
  - [ ] Cập nhật các hàm Jira còn lại để sử dụng fetch
- [ ] Đảm bảo tất cả các API calls (cả Jira và Confluence) sử dụng cùng phương pháp
  - [x] Áp dụng header User-Agent nhất quán
  - [x] Sử dụng cấu trúc error handling giống nhau
  - [ ] Chuẩn hóa định dạng response
- [x] Kiểm thử các API calls
  - [x] Kiểm thử thành công với getIssue của Jira (Issue XDEMO2-1)
  - [x] Kiểm thử thành công với getSpaces của Confluence
- [ ] Viết unit tests cho các phương thức API mới
- [ ] Tái cấu trúc mã nguồn để mô-đun hóa các hàm gọi API

### Phân tích kỹ thuật: Từ Jira SDK sang fetch trực tiếp (Mới)

#### Vấn đề gặp phải với SDK jira.js:
1. **Lỗi 501 (Not Implemented)**: hàm `callJiraApi` trong `atlassian-api.ts` chỉ mới được triển khai phần khung nhưng chưa có thực thi cụ thể cho các phương thức của SDK jira.js
2. **Không nhất quán với Confluence API**: API Confluence sử dụng fetch trực tiếp trong khi Jira sử dụng SDK
3. **Phụ thuộc vào thư viện bên thứ ba**: Phụ thuộc vào SDK jira.js có thể gây khó khăn khi cần tùy chỉnh, đặc biệt là vấn đề User-Agent

#### Giải pháp đã triển khai:
1. **Chuyển sang fetch trực tiếp**:
   - Đã triển khai lại hàm `getIssue` sử dụng fetch trực tiếp thay vì gọi SDK jira.js
   - Sử dụng cấu trúc tương tự như `callConfluenceApi` để tạo request
   - Thêm header `User-Agent: MCP-Atlassian-Server/1.0.0` vào mọi request

2. **Cải tiến xử lý lỗi**:
   - Chuẩn hóa cách xử lý lỗi với mã trạng thái rõ ràng (400, 401, 403, 404...)
   - Sử dụng ApiError với các loại lỗi định nghĩa rõ ràng (VALIDATION_ERROR, AUTHENTICATION_ERROR...)
   - Log chi tiết response lỗi từ API để dễ dàng debug

3. **Kết quả kiểm thử**:
   - **getIssue**: trả về thông tin đầy đủ về issue XDEMO2-1 (tiêu đề, trạng thái, người được gán...)
   - **getSpaces**: trả về danh sách 4 spaces từ Confluence với đầy đủ thông tin

#### So sánh kết quả response:

**1. Jira Get Issue Result**: 
```json
{
  "content": [{
    "type": "text",
    "text": "\n# [Web UI] Cung cấp giao diện chat để nhập lệnh\n\n**Key**: XDEMO2-1\n**Type**: Task\n**Status**: Done\n**Priority**: Medium\n**Assignee**: Hung Nguyen\n**Reporter**: Phúc Nguyễn\n**Created**: 3/23/2025, 10:51:57 AM\n**Updated**: 3/23/2025, 11:02:47 AM\n\n## Description\nPhát triển giao diện chat cho phép người dùng nhập lệnh và yêu cầu. Tham chiếu: RF-UI-01\n\n\n"
  }],
  "key": "XDEMO2-1",
  "id": "10005",
  "summary": "[Web UI] Cung cấp giao diện chat để nhập lệnh",
  "issueType": "Task",
  "status": "Done",
  "priority": "Medium",
  "assignee": "Hung Nguyen",
  "reporter": "Phúc Nguyễn",
  "created": "3/23/2025, 10:51:57 AM",
  "updated": "3/23/2025, 11:02:47 AM",
  "description": "Phát triển giao diện chat cho phép người dùng nhập lệnh và yêu cầu. Tham chiếu: RF-UI-01\n\n"
}
```

**2. Confluence Get Spaces Result**:
```json
{
  "content": [{
    "type": "text",
    "text": "Tìm thấy 4 space(s)\nHiển thị từ 1 đến 4\n\nduchungbmtd (~5570588c1557f381f64479a006dd5e914a7c11) Loại: personal | Trạng thái: current URL: https://phuc-nt.atlassian.net/spaces/~5570588c1557f381f64479a006dd5e914a7c11\nphuc_nt (~55705824acce7ba0c14f4597f17eb4afd2ff5f) Loại: personal | Trạng thái: current URL: https://phuc-nt.atlassian.net/spaces/~55705824acce7ba0c14f4597f17eb4afd2ff5f\nProject management (PM) Loại: global | Trạng thái: current URL: https://phuc-nt.atlassian.net/spaces/PM\nTeam X (TX) Loại: collaboration | Trạng thái: current URL: https://phuc-nt.atlassian.net/spaces/TX"
  }],
  "size": 4,
  "limit": 25,
  "start": 0,
  "spaces": [
    {
      "id": 1081346,
      "key": "~5570588c1557f381f64479a006dd5e914a7c11",
      "name": "duchungbmtd",
      "type": "personal",
      "status": "current",
      "url": "https://phuc-nt.atlassian.net/spaces/~5570588c1557f381f64479a006dd5e914a7c11"
    },
    // ... other spaces
  ]
}
```

#### Hướng phát triển tiếp theo:
1. **Chuẩn hóa định dạng response**:
   - Đảm bảo tất cả các tools trả về cấu trúc response thống nhất
   - Tách biệt rõ ràng giữa phần hiển thị (content) và phần dữ liệu (data)
   - Thêm các trường metadata như totalResults, pageInfo nếu cần

2. **Tiếp tục chuyển đổi các hàm Jira còn lại**:
   - Chuyển đổi createIssue, updateIssue, transitionIssue... sang sử dụng fetch
   - Đảm bảo tất cả đều có cùng phong cách triển khai và xử lý lỗi

3. **Xây dựng hệ thống helper functions**:
   - Tạo các hàm helper chung để giảm lặp code khi gọi API
   - Chuẩn hóa quá trình khởi tạo URL, headers và xử lý response

4. **Lưu ý quan trọng cho các triển khai tiếp theo**:
   - Luôn bao gồm User-Agent trong mọi request để tránh bị Cloudfront chặn
   - Sử dụng cấu trúc try-catch nhất quán để bắt và xử lý lỗi từ API
   - Log đầy đủ thông tin request/response để dễ dàng debug
   - Đảm bảo tính nhất quán trong định dạng dữ liệu trả về

## Vấn đề đã phát hiện và cần giải quyết

### Lỗi context.get trong các tool handlers
- **Mô tả**: Khi gọi các tools từ MCP client, xuất hiện lỗi "context.get is not a function"
- **Nguyên nhân đã xác định**: 
  - Phương thức xử lý context trong các tool handlers không phù hợp với cách MCP SDK kết nối
  - Trong các tool handlers, `context` được truyền vào không phải là một `Map` hoặc đối tượng với phương thức `get`
  - Trong phiên bản mới của MCP SDK, đối tượng context có thể có cấu trúc khác

- **Giải pháp cần thực hiện**:
  - Thay đổi cách truy cập context trong các tool handlers:
    ```typescript
    // Thay vì
    const config = context.get('atlassianConfig') as AtlassianConfig;
    
    // Sử dụng
    const config = context.atlassianConfig as AtlassianConfig;
    // hoặc
    const config = (context as any).atlassianConfig as AtlassianConfig;
    ```
  - Cập nhật lại cách đăng ký context khi khởi tạo MCP Server để phù hợp với SDK mới
  - Kiểm tra tài liệu MCP SDK mới nhất để xác định cách chính xác truyền và truy cập context

### Vấn đề kết nối Atlassian API qua MCP Server
- **Mô tả**: Khi gọi Atlassian API thông qua MCP Server, luôn nhận được lỗi 403 từ Cloudfront, mặc dù gọi trực tiếp từ terminal với cùng credential hoạt động bình thường
- **Những kiểm tra đã thực hiện**:
  - Đã kiểm tra và xác nhận API token đúng và hoạt động khi gọi trực tiếp từ command line
  - Đã xác minh domain Atlassian (phuc-nt.atlassian.net) chính xác
  - Đã xác nhận project XDEMO2 và issue XDEMO2-1 tồn tại và có thể truy cập từ tài khoản phucnt0@gmail.com
  - Đã xác nhận thông tin Space TX trong Confluence tồn tại và có thể truy cập
  - Đã kiểm tra biến môi trường trong file .env được tải đúng (ATLASSIAN_SITE_NAME, ATLASSIAN_USER_EMAIL, ATLASSIAN_API_TOKEN)
- **Nguyên nhân khả thi**:
  - Lỗi "403 ERROR" từ Cloudfront (không phải từ Atlassian trực tiếp) gợi ý rằng có thể có vấn đề với header hoặc định dạng request
  - Có thể có vấn đề với proxy hoặc cấu hình mạng trung gian
  - Token API có thể bị xử lý không đúng cách (khoảng trắng, ký tự đặc biệt) trong quá trình gửi request
- **Giải pháp đã thực hiện**:
  - Phát hiện chính: Khi thêm header User-Agent: MCP-Atlassian-Server/1.0.0 vào request curl, nó hoạt động thành công và trả về dữ liệu
  - Đã thêm User-Agent vào headers trong hàm createBasicHeaders
  - Đã chuyển đổi từ SDK jira.js sang sử dụng fetch trực tiếp cho API Jira
  - Đã áp dụng cùng một cơ chế request cho cả Jira và Confluence API

### Lỗi MODULE_NOT_FOUND khi chạy npm start từ thư mục gốc (Mới)
- **Mô tả**: Khi chạy lệnh `npm start` từ thư mục gốc của dự án, gặp lỗi "Cannot find module '/Users/phucnt/Workspace/dev_assist_agent/dist/server.js'"
- **Nguyên nhân**: Lỗi này xảy ra vì file package.json trong thư mục gốc đang tham chiếu đến một đường dẫn không chính xác. Cụ thể:
  ```json
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js"
  }
  ```
- **Giải pháp cần thực hiện**:
  - Cập nhật package.json trong thư mục gốc để tham chiếu đúng đến thư mục dev_mcp-server-atlassian
  - Hoặc: Luôn chạy server từ thư mục dev_mcp-server-atlassian với lệnh `cd dev_mcp-server-atlassian && npm start`
  - Đảm bảo rằng các tài liệu hướng dẫn đều chỉ rõ cách chạy server từ thư mục đúng

### So sánh giữa Confluence API và Jira API (Mới)
- **Phân tích hiện trạng**:
  - **Confluence API** đang hoạt động tốt vì:
    - Sử dụng phương thức `fetch` trực tiếp với header `User-Agent` được cấu hình đúng
    - Đã triển khai đầy đủ logic cho các công cụ như `getSpaces` và `getPage`
    - Không phụ thuộc vào SDK mà gửi HTTP requests trực tiếp
    
  - **Jira API** đang gặp vấn đề vì:
    - Đang sử dụng SDK `jira.js` (thư viện chính thức)
    - Trong file `get-issue.ts`, hàm `getIssue` gọi đến hàm `callJiraApi` từ `atlassian-api.js`
    - Hàm `callJiraApi` chưa được triển khai đầy đủ, dẫn đến lỗi 501 (Not Implemented)
    
- **Nguyên nhân chính của lỗi Jira API**:
  - Vấn đề không liên quan đến `User-Agent` hay header (đã được sửa)
  - Cần hoàn thiện việc triển khai các hàm gọi API để sử dụng đúng các phương thức của thư viện `jira.js`
  
- **Giải pháp đã thực hiện**:
  - Đã sửa đổi hàm `getIssue` trong file `atlassian-api.ts` để sử dụng fetch trực tiếp thay vì thông qua SDK
  - Đã sửa đổi hàm `searchIssues` để sử dụng fetch với cùng phương pháp
  - Đã chuẩn hóa xử lý lỗi và logging giữa các API calls
  - Đã kiểm thử thành công cả API Jira và Confluence qua MCP test client

## Chi tiết triển khai các API chính

### Jira API
1. **getIssue**: Lấy thông tin chi tiết về một issue
   - Input: issueIdOrKey
   - Output: Chi tiết issue bao gồm trạng thái, người gán, mô tả, comments, v.v.

2. **searchIssues**: Tìm kiếm issues theo JQL
   - Input: jql, maxResults
   - Output: Danh sách các issues phù hợp với điều kiện tìm kiếm

3. **createIssue**: Tạo issue mới
   - Input: projectKey, summary, description, issueType, v.v.
   - Output: Thông tin về issue mới tạo

4. **updateIssue**: Cập nhật thông tin của issue
   - Input: issueIdOrKey, fields cần cập nhật
   - Output: Xác nhận cập nhật thành công

5. **transitionIssue**: Chuyển trạng thái của issue
   - Input: issueIdOrKey, transitionId
   - Output: Xác nhận chuyển trạng thái thành công

6. **assignIssue**: Gán issue cho người dùng
   - Input: issueIdOrKey, accountId
   - Output: Xác nhận gán người dùng thành công

### Confluence API
1. **getPage**: Lấy thông tin chi tiết về một trang
   - Input: pageId
   - Output: Chi tiết trang bao gồm nội dung, version, space, v.v.

2. **searchPages**: Tìm kiếm trang theo CQL
   - Input: cql, limit, expand
   - Output: Danh sách các trang phù hợp với điều kiện tìm kiếm

3. **createPage**: Tạo trang mới
   - Input: spaceKey, title, content, parentId
   - Output: Thông tin về trang mới tạo

4. **updatePage**: Cập nhật nội dung của trang
   - Input: pageId, title, content, version, addLabels, removeLabels
   - Output: Xác nhận cập nhật thành công

5. **getSpaces**: Lấy danh sách spaces
   - Input: limit, type, status, expand
   - Output: Danh sách các spaces

6. **addComment**: Thêm comment vào trang
   - Input: pageId, content
   - Output: ID của comment mới

## Bài học kinh nghiệm và Best Practices
1. **Xử lý ADF**: Atlassian Document Format là phức tạp, cần chú ý khi chuyển đổi giữa ADF và Markdown
2. **Rate Limiting**: API của Atlassian có rate limiting nghiêm ngặt, cần triển khai cơ chế throttling và retry
3. **Validation**: Cần validate kỹ dữ liệu đầu vào trước khi gửi request đến Atlassian API
   - Sử dụng Zod cho schema validation
   - Kiểm tra các trường bắt buộc
   - Xác thực giá trị của các tham số
4. **Error Handling**: Xử lý lỗi cẩn thận và trả về thông báo lỗi mô tả rõ ràng
   - Phân loại lỗi theo ApiErrorType
   - Bao bọc mọi API call trong try-catch
   - Trả về thông báo lỗi thân thiện với người dùng
5. **Authentication**: Bảo vệ thông tin xác thực và đảm bảo không để lộ API tokens
   - Sử dụng biến môi trường cho thông tin nhạy cảm
   - Không log thông tin xác thực
6. **Cấu trúc dự án**: Phân tách rõ ràng các module, utils và tools để dễ bảo trì và mở rộng
   - Mỗi công cụ có file riêng
   - Tái sử dụng mã thông qua các utils
   - Tách biệt logic nghiệp vụ và MCP Protocol
7. **Sử dụng TypeScript interfaces**: Xác định rõ cấu trúc dữ liệu cho API request/response
   - Định nghĩa interfaces riêng cho từng API
   - Sử dụng TypeScript generics cho các hàm API
   - Viết rõ các ghi chú JSDoc
8. **Logging nhất quán**: Cài đặt hệ thống logging chuẩn hóa xuyên suốt dự án
   - Log mức thông tin phù hợp (debug, info, warning, error)
   - Bao gồm thông tin ngữ cảnh trong log
   - Format log để dễ theo dõi và tìm kiếm
9. **Unit testing**: Viết tests cho từng module riêng lẻ trước khi tích hợp
   - Test các trường hợp thành công và thất bại
   - Sử dụng mock cho API calls
   - Kiểm tra đầu vào/đầu ra của các hàm
10. **MCP Protocol Conformance**: Đảm bảo tuân thủ đúng định dạng MCP
    - Sử dụng helper functions để tạo response đúng định dạng
    - Kiểm tra schema đầu vào/đầu ra
    - Xử lý lỗi theo chuẩn MCP
11. **Nullable/Optional Handling**: Xử lý cẩn thận các trường có thể null/undefined
    - Sử dụng optional chaining (?.)
    - Thiết lập giá trị mặc định
    - Kiểm tra tính hợp lệ của dữ liệu trước khi sử dụng
12. **Context Management**: Quản lý và truyền context hiệu quả
    - Sử dụng map để lưu trữ cấu hình và trạng thái
    - Truyền context qua các handler function
    - Kiểm tra xác thực context trước khi sử dụng

## Roadmap phát triển tương lai
1. **Tích hợp thêm các công cụ Atlassian**:
   - BitBucket for code management
   - Trello for task management
   - ServiceDesk for customer support
   - Bamboo và Opsgenie cho CI/CD và incident management

2. **Cải thiện hiệu suất**:
   - Caching đáp ứng với Redis hoặc Memcached
   - Parallel API calls
   - Batch requests
   - Streaming responses

3. **Tăng cường trải nghiệm người dùng**:
   - Streaming API responses
   - Progress indicators
   - Định dạng response thân thiện hơn
   - Nhất quán trong cách hiển thị kết quả

4. **Nâng cao bảo mật**:
   - Hỗ trợ multiple authentication methods (Basic, OAuth)
   - Encryption cho data at rest
   - Giới hạn phạm vi truy cập (scopes)
   - Audit logging

5. **Mở rộng tích hợp**:
   - Webhook support
   - WebSocket real-time updates
   - Event-driven architecture
   - Hỗ trợ plugin và mở rộng 