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

### 1.1 Cập nhật trạng thái task khi hoàn thành công việc

**Mô tả**: Người dùng báo cáo đã hoàn thành công việc hôm nay và muốn cập nhật tất cả các task liên quan sang trạng thái Done. Hệ thống cần tự động tìm các task đang làm, cập nhật trạng thái và thông báo cho team.

**Endpoint**: `POST /central-agent/process`

**Curl Command**:
```bash
curl -X POST "http://localhost:3001/central-agent/process" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "tôi xong việc hôm nay rồi", 
    "userId": "user123"
  }' --max-time 300
```

**Cấu hình Mock Sub-Agents**:
- **MockJiraAgent**: 
  - Cấu hình để trả về 3 task (XDEMO2-1, XDEMO2-2, XDEMO2-3) ở trạng thái "In Progress" hoặc "To Do" 
  - Xử lý cập nhật trạng thái task sang "Done"
  - Trả về đầy đủ thông tin task bao gồm trường `lastUpdated`
  
- **MockSlackAgent**: 
  - Cấu hình để tìm tin nhắn liên quan đến các task
  - Xử lý thông báo cập nhật task lên kênh chung
  - Hỗ trợ đa dạng định dạng tin nhắn
  
- **MockConfluenceAgent**:
  - Tạo/cập nhật báo cáo hàng ngày
  - Lưu trữ thông tin về công việc hoàn thành

**Luồng thực thi**:
1. Central Agent nhận yêu cầu "tôi xong việc hôm nay rồi" từ người dùng
2. InputProcessor phân tích yêu cầu và xác định ý định cập nhật trạng thái task
3. ActionPlanner tạo kế hoạch 5 bước:
   - Tìm các task đang thực hiện (JIRA)
   - Tìm các thảo luận liên quan (SLACK)
   - Cập nhật trạng thái task (JIRA)
   - Gửi thông báo về việc cập nhật (SLACK)
   - Cập nhật báo cáo hàng ngày (CONFLUENCE)
4. AgentCoordinator thực thi từng bước trong kế hoạch
5. ResultSynthesizer tổng hợp kết quả và trả về phản hồi

**Kỳ vọng**:
- Hệ thống tự động xác định các task cần cập nhật 
- Cập nhật thành công trạng thái của tất cả task liên quan
- Gửi thông báo trên Slack với thông tin đầy đủ về các task đã cập nhật
- Tạo báo cáo ngày trên Confluence
- Trả về thông báo tổng hợp cho người dùng

### 1.2 Sắp xếp lịch họp dựa trên thời gian rảnh của nhóm

**Mô tả**: Người dùng muốn sắp xếp một cuộc họp nhóm trong tuần này dựa trên thời gian rảnh của tất cả thành viên trong nhóm. Hệ thống cần tìm khung giờ thích hợp và tạo lịch họp.

**Endpoint**: `POST /central-agent/process`

**Curl Command**:
```bash
curl -X POST "http://localhost:3001/central-agent/process" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "sắp xếp cuộc họp với team phát triển về tính năng mới trong tuần này", 
    "userId": "user123"
  }' --max-time 300
```

**Cấu hình Mock Sub-Agents**:
- **MockCalendarAgent**: 
  - Trả về lịch bận/rảnh của các thành viên trong team
  - Hỗ trợ tạo sự kiện lịch mới
  
- **MockUserDirectoryAgent**: 
  - Cung cấp thông tin về nhóm phát triển và thành viên
  
- **MockSlackAgent**: 
  - Gửi thông báo về cuộc họp
  - Tạo kênh thảo luận cho cuộc họp

**Luồng thực thi**:
1. Xác định các thành viên trong team phát triển
2. Tìm kiếm lịch trống chung trong tuần hiện tại
3. Chọn thời gian phù hợp nhất
4. Tạo cuộc họp mới trong lịch
5. Gửi thông báo cho tất cả thành viên
6. Tạo kênh Slack để chuẩn bị cho cuộc họp

**Kỳ vọng**:
- Tìm được khung giờ phù hợp cho tất cả thành viên
- Tạo thành công cuộc họp trong lịch với đầy đủ thông tin
- Thông báo cho tất cả thành viên qua Slack
- Trả về xác nhận với thông tin chi tiết về cuộc họp

### 1.3 Báo cáo tiến độ dự án và phân tích vấn đề

**Mô tả**: Người dùng yêu cầu hệ thống tạo báo cáo tiến độ dự án hiện tại, phân tích các vấn đề đang gặp phải và đề xuất giải pháp.

**Endpoint**: `POST /central-agent/process`

**Curl Command**:
```bash
curl -X POST "http://localhost:3001/central-agent/process" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "tạo báo cáo tiến độ dự án XDEMO và phân tích các vấn đề hiện tại", 
    "userId": "user123"
  }' --max-time 300
```

**Cấu hình Mock Sub-Agents**:
- **MockJiraAgent**: 
  - Cung cấp danh sách task theo dự án với trạng thái và mức ưu tiên
  - Trả về thông tin về bugs và issues
  
- **MockConfluenceAgent**: 
  - Tìm kiếm các báo cáo trước đó
  - Tạo trang báo cáo mới
  
- **MockAnalyticsAgent**: 
  - Phân tích xu hướng và thống kê dự án
  - Cung cấp biểu đồ tiến độ

**Luồng thực thi**:
1. Thu thập thông tin dự án từ JIRA
2. Phân tích trạng thái các task và vấn đề
3. Tìm các báo cáo trước đó để so sánh
4. Tạo phân tích xu hướng
5. Tổng hợp báo cáo trên Confluence
6. Đề xuất giải pháp cho các vấn đề

**Kỳ vọng**:
- Báo cáo đầy đủ về tiến độ dự án (tỷ lệ hoàn thành, công việc còn lại)
- Xác định chính xác các vấn đề đang gặp phải
- Phân tích xu hướng dựa trên dữ liệu lịch sử
- Đề xuất giải pháp khả thi cho các vấn đề

### 1.4 Rà soát và cập nhật tài liệu dự án

**Mô tả**: Người dùng yêu cầu hệ thống rà soát tất cả tài liệu hiện có của dự án, xác định những tài liệu cần cập nhật và tạo kế hoạch cập nhật.

**Endpoint**: `POST /central-agent/process`

**Curl Command**:
```bash
curl -X POST "http://localhost:3001/central-agent/process" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "rà soát tài liệu dự án XDEMO và cập nhật cho phiên bản mới", 
    "userId": "user123"
  }' --max-time 300
```

**Cấu hình Mock Sub-Agents**:
- **MockConfluenceAgent**: 
  - Cung cấp danh sách tài liệu hiện có
  - Kiểm tra ngày cập nhật gần nhất
  
- **MockJiraAgent**: 
  - Cung cấp thông tin về các thay đổi gần đây trong dự án
  - Xác định tính năng mới cần được tài liệu hóa
  
- **MockGitAgent**: 
  - Cung cấp thông tin về các commit và pull request

**Luồng thực thi**:
1. Tìm kiếm tất cả tài liệu dự án trên Confluence
2. Kiểm tra ngày cập nhật gần nhất của từng tài liệu
3. Thu thập thông tin về thay đổi gần đây từ JIRA và Git
4. Xác định tài liệu cần cập nhật
5. Tạo danh sách công việc cập nhật tài liệu
6. Gán nhiệm vụ cập nhật cho các thành viên liên quan

**Kỳ vọng**:
- Xác định chính xác tài liệu cần cập nhật
- Tạo danh sách công việc cụ thể
- Phân công nhiệm vụ cập nhật hợp lý
- Báo cáo tổng quan về tình trạng tài liệu dự án

### 1.5 Phân tích và xử lý phản hồi của khách hàng

**Mô tả**: Người dùng yêu cầu hệ thống thu thập và phân tích phản hồi từ khách hàng, tạo các task cải thiện dựa trên phản hồi.

**Endpoint**: `POST /central-agent/process`

**Curl Command**:
```bash
curl -X POST "http://localhost:3001/central-agent/process" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "phân tích phản hồi từ khách hàng về tính năng đăng nhập và tạo task cải thiện", 
    "userId": "user123"
  }' --max-time 300
```

**Cấu hình Mock Sub-Agents**:
- **MockSurveyAgent**: 
  - Cung cấp dữ liệu phản hồi khách hàng
  - Phân loại phản hồi theo chủ đề
  
- **MockJiraAgent**: 
  - Tạo task mới dựa trên phản hồi
  - Liên kết task với yêu cầu khách hàng
  
- **MockSlackAgent**: 
  - Thông báo cho team về phản hồi quan trọng
  - Tạo kênh thảo luận cho cải thiện

**Luồng thực thi**:
1. Thu thập dữ liệu phản hồi từ khách hàng
2. Phân loại và phân tích phản hồi theo chủ đề
3. Xác định các vấn đề cần ưu tiên xử lý
4. Tạo các task cải thiện trong JIRA
5. Thông báo cho team về kế hoạch cải thiện
6. Tạo báo cáo tổng hợp phản hồi khách hàng

**Kỳ vọng**:
- Phân tích chính xác các xu hướng trong phản hồi khách hàng
- Tạo được các task cải thiện với độ ưu tiên hợp lý
- Thông báo cho các bên liên quan
- Trả về báo cáo tổng quan về tình hình phản hồi

## 2. Cấu hình kiểm thử và môi trường

### 2.1 Cấu hình Mock Agents

**MockJiraAgent**:
- Cấu hình tập dữ liệu mẫu:
  - 10 task với các trạng thái khác nhau (To Do, In Progress, Review, Done)
  - 3 dự án (XDEMO, XDEV, XTEST)
  - Các mối quan hệ phụ thuộc giữa các task

**MockSlackAgent**:
- Cấu hình các kênh: #general, #project-xdemo, #dev-team
- Mẫu tin nhắn liên quan đến task và dự án
- Hỗ trợ tìm kiếm tin nhắn liên quan đến các task XDEMO2-xxx
- Hỗ trợ tìm kiếm tin nhắn về việc hoàn thành công việc

**MockConfluenceAgent**:
- Không gian làm việc mẫu: "XDEMO Project"
- Các trang tài liệu: Requirements, Design Docs, Meeting Notes
- Mẫu báo cáo ngày và tuần

**MockCalendarAgent**:
- Lịch team với các sự kiện định kỳ: Daily Standup, Sprint Planning
- Thời gian rảnh/bận của các thành viên

### 2.2 Metrics đo lường

Các metrics được sử dụng để đánh giá hiệu quả của Central Agent:

1. **Tỷ lệ thành công**: Phần trăm kịch bản được thực hiện thành công
2. **Thời gian phản hồi**: Thời gian trung bình để hoàn thành một yêu cầu
3. **Số lần thử lại**: Số lần trung bình phải thử lại các bước bị lỗi
4. **Độ chính xác kế hoạch**: Tỷ lệ bước trong kế hoạch được thực hiện thành công
5. **Độ phức tạp kế hoạch**: Số bước trung bình được tạo cho mỗi yêu cầu
6. **Chi phí token**: Số token LLM được sử dụng cho mỗi yêu cầu

### 2.3 Quy trình kiểm thử

1. **Chuẩn bị môi trường**:
   - Cấu hình các mock agent với dữ liệu mẫu
   - Thiết lập các biến môi trường cần thiết

2. **Thực hiện kiểm thử**:
   - Chạy các kịch bản kiểm thử theo thứ tự
   - Ghi lại kết quả và metrics

3. **Phân tích kết quả**:
   - So sánh kết quả thực tế với kỳ vọng
   - Xác định các vấn đề và điểm cải thiện

4. **Báo cáo và tối ưu hóa**:
   - Tạo báo cáo kiểm thử chi tiết
   - Đề xuất cải tiến cho Central Agent

## 3. Kết luận

Các kịch bản kiểm thử này cung cấp một cách tiếp cận toàn diện để đánh giá khả năng của Central Agent trong việc xử lý các yêu cầu phức tạp từ người dùng. Thông qua việc kiểm thử với nhiều tình huống khác nhau, chúng ta có thể đảm bảo hệ thống đủ mạnh mẽ và linh hoạt để đáp ứng các nhu cầu thực tế.

Việc liên tục cập nhật và mở rộng các kịch bản kiểm thử này sẽ giúp phát hiện sớm các vấn đề tiềm ẩn và cải thiện chất lượng tổng thể của Central Agent. 