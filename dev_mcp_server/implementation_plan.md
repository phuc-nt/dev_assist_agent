# Kế hoạch triển khai MCP Server cho JIRA và Confluence

## Tổng quan
Tài liệu này mô tả kế hoạch triển khai Model Context Protocol (MCP) Server cho JIRA và Confluence, hoạt động như các Sub-Agent trong kiến trúc DevAssist Bot. MCP Server cho phép các mô hình AI như Claude tương tác với JIRA và Confluence theo cách tiêu chuẩn hóa, đóng vai trò là cầu nối giữa Central Agent và hệ thống Atlassian.

## Danh sách tác vụ và tiến độ

### Phase 1: Thiết lập cơ bản
- [x] Khởi tạo dự án Node.js với TypeScript
- [x] Cài đặt các thư viện cần thiết (@modelcontextprotocol/sdk, zod, dotenv)
- [x] Thiết lập cấu trúc thư mục theo mô hình đã đề xuất
- [x] Tạo file cấu hình môi trường (.env)
- [x] Tạo file tsconfig.json với cấu hình phù hợp
- [x] Thiết lập scripts trong package.json (build, start, dev)

### Phase 2: Xây dựng service cho JIRA
- [x] Tạo module config/env.ts để quản lý biến môi trường
- [x] Phát triển services/jira.ts với các hàm cơ bản:
  - [x] fetchProjects: Lấy danh sách dự án
  - [x] searchIssues: Tìm kiếm các vấn đề bằng JQL
  - [x] getIssue: Lấy thông tin chi tiết về vấn đề
  - [x] createIssue: Tạo vấn đề mới
  - [x] updateIssue: Cập nhật vấn đề (trạng thái, assignee)
  - [x] addComment: Thêm bình luận vào vấn đề

### Phase 3: Xây dựng service cho Confluence
- [x] Phát triển services/confluence.ts với các hàm cơ bản:
  - [x] getSpaces: Lấy danh sách không gian
  - [x] getPages: Lấy danh sách trang trong không gian
  - [x] getPageContent: Lấy nội dung trang
  - [x] createPage: Tạo trang mới
  - [x] updatePage: Cập nhật nội dung trang
  - [x] searchContent: Tìm kiếm nội dung

### Phase 4: Triển khai công cụ MCP cho JIRA
- [x] Tạo module tools/jira-tools.ts
- [x] Định nghĩa các công cụ MCP cho JIRA:
  - [x] list_jira_projects: Liệt kê dự án
  - [x] search_jira_issues: Tìm kiếm vấn đề
  - [x] get_jira_issue: Lấy chi tiết vấn đề
  - [x] create_jira_issue: Tạo vấn đề mới
  - [x] update_jira_issue: Cập nhật vấn đề
  - [x] add_jira_comment: Thêm bình luận

### Phase 5: Triển khai công cụ MCP cho Confluence
- [x] Tạo module tools/confluence-tools.ts
- [x] Định nghĩa các công cụ MCP cho Confluence:
  - [x] list_confluence_spaces: Liệt kê không gian
  - [x] list_confluence_pages: Liệt kê trang
  - [x] get_confluence_page_content: Lấy nội dung trang
  - [x] create_confluence_page: Tạo trang mới
  - [x] update_confluence_page: Cập nhật trang
  - [x] search_confluence_content: Tìm kiếm nội dung

### Phase 6: Xây dựng máy chủ MCP
- [x] Tạo module server.ts
- [x] Khởi tạo MCP Server với các công cụ đã định nghĩa
- [x] Đăng ký các tài nguyên (resources) cho JIRA và Confluence
- [x] Thiết lập HTTP Transport cho server

### Phase 7: Kiểm thử và tối ưu
- [ ] Tạo kịch bản kiểm thử cơ bản
- [ ] Kiểm thử từng công cụ MCP
- [ ] Tối ưu xử lý lỗi và performance
- [x] Thêm logging để giám sát hoạt động
  - [x] Tạo module utils/logging.ts với các cấp độ nhật ký
  - [x] Tạo module utils/error-handler.ts để xử lý lỗi nhất quán

### Phase 8: Tích hợp với Central Agent
- [ ] Xác định giao thức giao tiếp giữa Central Agent và MCP Server
- [ ] Triển khai endpoint cho Central Agent gọi đến
- [ ] Kiểm thử tích hợp giữa Central Agent và MCP Server

### Phase 9: Bảo mật và xác thực
- [ ] Thêm cơ chế xác thực cho MCP Server
- [ ] Triển khai quản lý API token an toàn
- [ ] Đảm bảo HTTPS cho kết nối

### Phase 10: Triển khai giám sát và ghi nhật ký
- [ ] Triển khai hệ thống logging chi tiết
- [ ] Thiết lập giám sát hiệu suất
- [ ] Tạo dashboard để theo dõi sử dụng

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
├── .env                # Biến môi trường
├── package.json
├── tsconfig.json
└── implementation_plan.md  # Tài liệu kế hoạch triển khai (file hiện tại)
```

## Lưu ý triển khai

1. **Xử lý lỗi**: Triển khai cơ chế xử lý lỗi toàn diện cho tất cả các API call, đảm bảo phản hồi nhất quán và hữu ích cho các tình huống lỗi khác nhau.

2. **Rate limiting**: Các API của Atlassian có giới hạn tốc độ, cần triển khai cơ chế quản lý hàng đợi và xử lý rate limiting để tránh bị chặn.

3. **Caching**: Triển khai caching để giảm số lượng cuộc gọi API không cần thiết, đặc biệt là đối với dữ liệu ít thay đổi như danh sách dự án hoặc không gian.

4. **Định dạng dữ liệu**: Đảm bảo tất cả các phản hồi được chuẩn hóa theo cùng một định dạng để dễ sử dụng cho Central Agent.

5. **Tối ưu hóa hiệu suất**: Giảm thiểu kích thước phản hồi bằng cách chỉ trả về các trường cần thiết.

6. **Kiểm soát truy cập**: Xác thực và phân quyền để đảm bảo MCP Server chỉ có thể được truy cập bởi Central Agent hợp lệ.

7. **Ghi nhật ký**: Triển khai ghi nhật ký chi tiết để theo dõi và gỡ lỗi.

## Best Practices

Trong quá trình phát triển MCP Server, chúng tôi đã rút ra một số best practices quan trọng:

1. **Quản lý token API an toàn**: 
   - Sử dụng file .env cho các thông tin nhạy cảm như API token
   - Tham chiếu các biến môi trường sẵn có trong file .env (ví dụ: CONFLUENCE_API_TOKEN=${JIRA_API_TOKEN})
   - Không bao giờ check-in thông tin xác thực vào repository

2. **Triển khai có kế hoạch**:
   - Tuân theo kế hoạch triển khai từng bước, với mục đích rõ ràng cho mỗi giai đoạn
   - Đánh dấu tiến độ thực hiện để dễ dàng theo dõi
   - Giải thích rõ mục đích trước khi thực hiện mỗi bước

3. **Cấu trúc dự án rõ ràng**:
   - Tổ chức code theo chức năng (config, services, tools, utils)
   - Mỗi module chỉ đảm nhiệm một trách nhiệm duy nhất
   - Tách biệt dịch vụ giao tiếp API (services) và công cụ MCP (tools)

4. **Phát triển dựa trên dữ liệu thực tế**:
   - Sử dụng thông tin từ config/project_config_demo.json để đảm bảo tích hợp phù hợp
   - Kết hợp với dữ liệu thực từ Jira và Confluence khi phát triển và kiểm thử
   - Đảm bảo các giá trị cấu hình (domain, projectKey, etc.) được lấy từ config

5. **Phương pháp triển khai module-first**:
   - Phát triển và kiểm thử từng module riêng biệt
   - Chỉ tích hợp các module sau khi chúng đã hoạt động đúng
   - Ưu tiên hoàn thiện một service trước khi chuyển sang service tiếp theo

6. **Xử lý lỗi nhất quán**:
   - Sử dụng cấu trúc ServiceResult<T> để đảm bảo định dạng phản hồi nhất quán
   - Phản hồi luôn bao gồm trường success để dễ dàng kiểm tra kết quả
   - Cung cấp thông tin lỗi chi tiết với message, code và details để dễ dàng gỡ lỗi

7. **Kiểu dữ liệu rõ ràng**:
   - Định nghĩa các interface cho tất cả cấu trúc dữ liệu (JiraProject, JiraIssue, etc.)
   - Sử dụng TypeScript generics để đảm bảo type safety (ServiceResult<T>)
   - Đảm bảo kiểu dữ liệu nhất quán giữa services và MCP tools

8. **Tương thích với API Atlassian**:
   - Hiểu rõ cấu trúc dữ liệu từ API Atlassian để xử lý đúng
   - Đảm bảo định dạng body request đúng (ví dụ: định dạng Atlassian Document Format cho nội dung)
   - Xử lý đúng luồng API phức tạp (như cập nhật trạng thái issue qua transitions)

9. **Chuẩn hóa kết quả API**:
   - Chuyển đổi URL API thành URL giao diện người dùng để dễ dàng truy cập
   - Xử lý các trường null hoặc undefined bằng optional chaining (?.)
   - Áp dụng các giá trị mặc định hợp lý khi cần thiết

10. **Đồng nhất cấu trúc giữa các service**:
    - Áp dụng cùng một mẫu thiết kế và cơ chế xử lý lỗi cho tất cả các service
    - Duy trì phong cách code nhất quán giữa JIRA và Confluence services
    - Chuẩn hóa hình thức trả về kết quả để đơn giản hóa việc tạo các công cụ MCP

11. **Thiết kế công cụ MCP thân thiện**:
    - Sử dụng tên công cụ rõ ràng và mô tả chi tiết
    - Cung cấp mô tả rõ ràng cho từng tham số
    - Định dạng lỗi nhất quán và cung cấp thông báo lỗi hữu ích

12. **Triển khai kiểm tra đầu vào**:
    - Sử dụng Zod để xác thực tham số đầu vào của công cụ MCP
    - Đảm bảo kiểm tra tất cả các giá trị trước khi gọi service
    - Cung cấp thông báo lỗi rõ ràng khi đầu vào không hợp lệ

13. **Bảo mật và xác thực**:
    - Triển khai xác thực cơ bản cho API endpoints
    - Kiểm tra các HTTP headers để đảm bảo yêu cầu đến từ nguồn được ủy quyền
    - Hỗ trợ môi trường phát triển với cơ chế xác thực đơn giản hóa

14. **Thiết kế giao diện server thân thiện**:
    - Cung cấp tài liệu OpenAPI tại điểm cuối /docs
    - Hiển thị thông báo khởi động rõ ràng với URL và port
    - Xử lý lỗi server một cách nhất quán và cung cấp thông báo hữu ích

15. **Hệ thống ghi nhật ký toàn diện**:
    - Sử dụng các cấp độ nhật ký khác nhau (DEBUG, INFO, WARN, ERROR, FATAL) 
    - Định dạng nhật ký với thời gian, cấp độ và ngữ cảnh
    - Ghi nhật ký cho tất cả các API request và response
    - Hỗ trợ cấu hình cấp độ nhật ký dựa trên môi trường

16. **Quản lý lỗi tập trung**:
    - Định nghĩa các lớp lỗi riêng biệt cho các tình huống khác nhau
    - Chuẩn hóa cấu trúc lỗi với message, code, statusCode và details
    - Chuyển đổi lỗi từ bên ngoài thành lỗi nội bộ nhất quán
    - Ẩn thông tin nhạy cảm trong phản hồi lỗi ở môi trường sản xuất

## Tài nguyên cần thiết
- **Atlassian API Token**: Cần tạo API token cho JIRA và Confluence
- **Node.js và npm**: Môi trường runtime
- **TypeScript**: Ngôn ngữ lập trình
- **@modelcontextprotocol/sdk**: Thư viện MCP chính
- **Zod**: Xác thực schema
- **Dotenv**: Quản lý biến môi trường
- **Nodemon**: Công cụ phát triển tự động tải lại

## Kết luận
Việc triển khai MCP Server cho JIRA và Confluence sẽ tạo ra một giao diện tiêu chuẩn để Central Agent có thể tương tác với các hệ thống Atlassian. Bằng cách tuân theo giao thức MCP, chúng ta đảm bảo tính tương thích với các mô hình AI hiện tại và tương lai. Cấu trúc module hóa sẽ cho phép dễ dàng mở rộng hỗ trợ cho các API và dịch vụ Atlassian khác trong tương lai. 