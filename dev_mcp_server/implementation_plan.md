# Kế hoạch triển khai MCP Server cho JIRA và Confluence

## Tổng quan
Tài liệu này mô tả kế hoạch triển khai Model Context Protocol (MCP) Server cho JIRA và Confluence, hoạt động như các Sub-Agent trong kiến trúc DevAssist Bot. MCP Server cho phép các mô hình AI như Claude tương tác với JIRA và Confluence theo cách tiêu chuẩn hóa, đóng vai trò là cầu nối giữa Central Agent và hệ thống Atlassian.

Quá trình triển khai được chia thành 12 giai đoạn, từ thiết lập cơ bản và xây dựng các dịch vụ API đến containerization với Docker, kiểm thử với MCP client bên thứ 3, và cuối cùng là tích hợp với Central Agent của DevAssist. Kế hoạch này đảm bảo MCP Server phát triển theo các bước rõ ràng, được kiểm thử kỹ lưỡng và sẵn sàng cho triển khai trong môi trường production.

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
- [x] Tạo kịch bản kiểm thử cơ bản
  - [x] Kiểm thử kết nối với API Jira thật
  - [x] Kiểm thử cơ bản với mock data
  - [x] Hoàn thiện kiểm thử tất cả các phương thức trong services
- [x] Kiểm thử từng công cụ MCP
  - [x] Thiết lập các test đơn giản cho công cụ MCP Jira và Confluence
  - [x] Hoàn thiện kiểm thử tất cả các công cụ MCP
- [x] Tối ưu xử lý lỗi và performance
  - [x] Cập nhật cấu hình test để hỗ trợ môi trường test
  - [x] Cải thiện xử lý lỗi khi API không phản hồi
  - [x] Tối ưu hóa xử lý version khi cập nhật trang Confluence
- [x] Thêm logging để giám sát hoạt động
  - [x] Tạo module utils/logging.ts với các cấp độ nhật ký
  - [x] Tạo module utils/error-handler.ts để xử lý lỗi nhất quán

### Phase 8: Containerization với Docker
- [ ] Thiết lập Docker cho môi trường phát triển
  - [ ] Tạo Dockerfile cho MCP Server
  - [ ] Cấu hình multi-stage build để tối ưu kích thước image
  - [ ] Thiết lập .dockerignore để loại bỏ các file không cần thiết
- [ ] Cấu hình Docker Compose
  - [ ] Tạo file docker-compose.yml cho môi trường phát triển
  - [ ] Định nghĩa volumes cho persistence data
  - [ ] Cấu hình biến môi trường trong Docker
- [ ] Tối ưu Docker image
  - [ ] Sử dụng image cơ sở nhẹ (Node Alpine)
  - [ ] Cài đặt chỉ các dependencies cần thiết cho production
  - [ ] Tối ưu layer caching

### Phase 9: Kiểm thử với MCP Client bên thứ 3
- [ ] Thiết lập môi trường test với MCP Client
  - [ ] Cấu hình MCP Client để kết nối với MCP Server
  - [ ] Thiết lập các test case tích hợp
  - [ ] Tạo tài liệu hướng dẫn kết nối
- [ ] Kiểm tra các chức năng JIRA qua MCP Client
  - [ ] Kiểm tra lấy danh sách dự án
  - [ ] Kiểm tra tạo và cập nhật task
  - [ ] Kiểm tra tìm kiếm và lấy chi tiết task
- [ ] Kiểm tra các chức năng Confluence qua MCP Client
  - [ ] Kiểm tra lấy danh sách không gian
  - [ ] Kiểm tra tạo và cập nhật trang
  - [ ] Kiểm tra tìm kiếm nội dung
- [ ] Xử lý phản hồi và cải tiến
  - [ ] Thu thập phản hồi từ bên thứ 3
  - [ ] Cải thiện API dựa trên phản hồi
  - [ ] Cập nhật tài liệu API

### Phase 10: Tích hợp với Central Agent
- [ ] Xác định giao thức giao tiếp giữa Central Agent và MCP Server
  - [ ] Định nghĩa schema cho các request và response
  - [ ] Thiết lập cơ chế xác thực giữa Central Agent và MCP Server
  - [ ] Định nghĩa API endpoints dành riêng cho Central Agent
- [ ] Triển khai endpoint cho Central Agent gọi đến
  - [ ] Tạo middleware xử lý request từ Central Agent
  - [ ] Triển khai cơ chế rate limiting cho các request từ Central Agent
  - [ ] Tạo adapter chuyển đổi dữ liệu giữa các hệ thống
- [ ] Kiểm thử tích hợp giữa Central Agent và MCP Server
  - [ ] Thiết lập môi trường test tích hợp
  - [ ] Tạo test case end-to-end
  - [ ] Giám sát hiệu năng và độ trễ trong quá trình tích hợp

### Phase 11: Bảo mật và xác thực
- [ ] Thêm cơ chế xác thực cho MCP Server
- [ ] Triển khai quản lý API token an toàn
- [ ] Đảm bảo HTTPS cho kết nối

### Phase 12: Triển khai giám sát và ghi nhật ký
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
├── __tests__/          # Các file kiểm thử
│   ├── connection.test.ts
│   ├── real-atlassian.test.ts
│   └── quick-atlassian.test.ts
├── Dockerfile          # Cấu hình Docker cho ứng dụng
├── .dockerignore       # Các file và thư mục bỏ qua khi build Docker
├── docker-compose.yml  # Cấu hình Docker Compose cho môi trường phát triển
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

17. **Chiến lược kiểm thử đa tầng**:
    - Phân tầng kiểm thử thành nhiều cấp độ (kết nối cơ bản, tích hợp nhanh, tích hợp đầy đủ)
    - Tạo file test có mục đích rõ ràng, tránh trùng lặp và dư thừa
    - Thiết lập scripts test chuyên biệt trong package.json để dễ dàng thực hiện từng loại test

18. **Xử lý version conflict tự động**:
    - Tự động lấy version hiện tại từ API thay vì phụ thuộc vào tham số truyền vào
    - Tự động tăng version khi thực hiện cập nhật để tránh conflict
    - Xử lý lỗi và log chi tiết khi xảy ra version conflict

19. **Thiết kế test thích ứng**:
    - Kiểm tra điều kiện môi trường trước khi chạy test (RUN_REAL_TESTS, token API)
    - Tự động bỏ qua test không phù hợp thay vì báo lỗi
    - Hiển thị thông báo hữu ích khi bỏ qua test để người dùng hiểu rõ lý do

20. **Tối ưu hóa kiểm thử API thực tế**:
    - Thiết kế các test case độc lập, tránh phụ thuộc vào trạng thái trước đó
    - Sử dụng timestamp hoặc UUID trong dữ liệu test để tránh xung đột
    - Thêm thông tin debug đầy đủ khi test API thực tế để dễ dàng theo dõi và gỡ lỗi

## Cấu trúc kiểm thử

Hệ thống kiểm thử của MCP Server đã được cải tiến để tập trung vào ba loại test chính, đảm bảo cả tính toàn diện và hiệu quả:

### 1. Test kết nối cơ bản (connection.test.ts)
- Kiểm tra khả năng kết nối cơ bản với API Jira và Confluence
- Xác minh xác thực API token hoạt động đúng
- Kiểm tra định dạng phản hồi có cấu trúc

### 2. Test tích hợp đầy đủ (real-atlassian.test.ts)
- Kiểm tra toàn diện tất cả các chức năng của JIRA (6 chức năng)
- Kiểm tra toàn diện tất cả các chức năng của Confluence (6 chức năng)
- Kiểm tra đầy đủ luồng làm việc từ tạo, đọc, cập nhật đến tìm kiếm
- Đảm bảo xử lý version khi cập nhật trang Confluence hoạt động đúng

### 3. Test tích hợp nhanh (quick-atlassian.test.ts)
- Test nhanh với 2 chức năng cơ bản của JIRA (lấy dự án và tạo task)
- Test nhanh với 2 chức năng cơ bản của Confluence (lấy không gian và tạo trang)
- Phù hợp cho kiểm tra nhanh chóng trong quá trình phát triển

### Lệnh chạy test
Các script đã được thêm vào package.json để dễ dàng chạy test:
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

### Cải tiến quan trọng
1. **Xử lý version trong updatePage**: Đã khắc phục lỗi khi cập nhật trang Confluence bằng cách tự động lấy và tăng số phiên bản.
2. **Kiểm tra tự động**: Các test sẽ tự động bỏ qua nếu không có token API hoặc không được cấu hình để chạy với API thật.
3. **Cải thiện logging**: Thêm chi tiết log trong quá trình kiểm thử để dễ dàng theo dõi và gỡ lỗi.
4. **Thống nhất cấu trúc test**: Áp dụng cùng một mẫu cho tất cả các test để đảm bảo tính nhất quán.

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