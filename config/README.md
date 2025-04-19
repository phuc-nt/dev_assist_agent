# Cấu hình hệ thống

Thư mục này chứa các file cấu hình cho DevAssist Bot. Đây là nơi lưu trữ các cài đặt và thông tin cấu hình mà hệ thống cần để hoạt động.

## Danh sách tài liệu

- **`project_config_demo.json`** - Cấu hình mẫu cho dự án, chứa thông tin cơ bản mà agent cần để có context chi tiết khi xử lý yêu cầu

## Mục đích sử dụng

Các tài liệu cấu hình được sử dụng để:
- Cung cấp context cho agent khi xử lý yêu cầu
- Lưu trữ thông tin về dự án và môi trường làm việc
- Định nghĩa các tham số cài đặt
- Quản lý các thiết lập cho các tích hợp với dịch vụ bên ngoài

## Lưu ý

- File `project_config_demo.json` là file mẫu. Trong môi trường sản xuất, hệ thống sẽ sử dụng file `project_config.json` thực tế.
- Thông tin nhạy cảm (như API key, token, mật khẩu) không nên được lưu trữ trực tiếp trong các file cấu hình, thay vào đó nên sử dụng biến môi trường hoặc các giải pháp quản lý bí mật an toàn.
- Khi thay đổi cấu trúc của file cấu hình, cần đảm bảo cập nhật cả file mẫu và tài liệu liên quan. 