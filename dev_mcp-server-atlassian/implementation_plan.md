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

### Phase 6: Tối ưu và Mở rộng
- [ ] Tối ưu hóa hiệu suất API calls
- [ ] Cài đặt caching để giảm số lượng requests
- [ ] Cải thiện error handling và retry logic
- [ ] Thêm các authentication methods bổ sung (OAuth)
- [ ] Cập nhật documentation cho tất cả APIs

### Phase 7: Tích hợp với DevAssist Central Agent
- [ ] Tạo interface giữa MCP Server và Central Agent
- [ ] Cập nhật mock agents trong Central Agent để sử dụng MCP Server
- [ ] Viết integration test giữa Central Agent và MCP Server
- [ ] Cập nhật cấu hình để Central Agent có thể sử dụng MCP Server

### Phase 8: Triển khai Security và Monitoring
- [ ] Triển khai rate limiting để tránh quá tải API
- [ ] Thiết lập monitoring cho API calls
- [ ] Cài đặt logging cho mọi requests và responses
- [ ] Thiết lập cơ chế bảo mật cho tokens và credentials

### Phase 9: Dockerization và Deployment
- [ ] Tạo Dockerfile
- [ ] Thiết lập Docker Compose cho môi trường phát triển
- [ ] Tạo CI/CD pipeline
- [ ] Chuẩn bị tài liệu hướng dẫn triển khai

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