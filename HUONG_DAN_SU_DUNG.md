# 📱 CARFLOW 910 — HƯỚNG DẪN SỬ DỤNG

## Hệ thống Quản lý & Đăng ký Điều xe
### VietinBank Chi nhánh Nam Sài Gòn

---

## 📋 MỤC LỤC

1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Đăng nhập hệ thống](#2-đăng-nhập-hệ-thống)
3. [Quy trình phê duyệt](#3-quy-trình-phê-duyệt-đề-xuất)
4. [Hướng dẫn cho Nhân viên](#4-nhân-viên-staff)
5. [Hướng dẫn cho Trưởng phòng](#5-trưởng-phòng-dept_head)
6. [Hướng dẫn cho Phòng TCTH](#6-phòng-tổ-chức-tổng-hợp-tcth)
7. [Hướng dẫn cho Ban Giám đốc](#7-ban-giám-đốc-director)
8. [Hướng dẫn cho Tài xế](#8-tài-xế-driver)
9. [Hướng dẫn cho Quản trị viên](#9-quản-trị-viên-admin)
10. [Bảng so sánh phân quyền](#10-bảng-so-sánh-phân-quyền)

---

## 1. GIỚI THIỆU TỔNG QUAN

**CarFlow 910** là hệ thống số hóa toàn bộ quy trình đăng ký, phê duyệt và điều phối xe công tác tại VietinBank Chi nhánh Nam Sài Gòn.

### Tính năng nổi bật

- **Số hóa hoàn toàn** quy trình Mẫu số 02/GĐNSDX (Giấy đề nghị sử dụng xe)
- **Phê duyệt đa cấp** theo đúng cơ cấu tổ chức ngân hàng
- **Quản lý đội xe & tài xế** theo thời gian thực
- **Kiểm soát xung đột lịch trình** tự động khi gán xe và tài xế
- **Ghi nhận chỉ số ODO** và thống kê kilomet công tác
- **Thiết kế Mobile-first** — tối ưu cho điện thoại thông minh
- **Bảo mật Server-side** — xác thực API, tự động đăng xuất sau 5 phút không tương tác

### 6 vai trò người dùng

| Vai trò | Mô tả | Ký hiệu |
|---------|-------|---------|
| **Nhân viên** | Các phòng ban chi nhánh | `staff` |
| **Trưởng phòng** | Lãnh đạo phòng ban | `dept_head` |
| **Phòng TCTH** | Phòng Tổ chức Tổng hợp — Bộ phận điều xe | `tcth` |
| **Ban Giám đốc** | Lãnh đạo Chi nhánh | `director` |
| **Tài xế** | Đội ngũ lái xe công tác | `driver` |
| **Quản trị viên** | Quản trị hệ thống | `admin` |

---

## 2. ĐĂNG NHẬP HỆ THỐNG

### Bước thực hiện

1. Truy cập ứng dụng CarFlow 910 trên trình duyệt
2. Nhập **Tên đăng nhập** và **Mật khẩu** được cấp
3. Nhấn nút **"Đăng nhập"**
4. Hệ thống sẽ tự động chuyển đến Dashboard phù hợp với vai trò của bạn

### Lưu ý bảo mật

- Hệ thống **tự động đăng xuất sau 5 phút** không tương tác (không bấm, không cuộn, không nhập liệu)
- Xác thực được thực hiện hoàn toàn **phía Server** — mật khẩu không bao giờ lưu trên thiết bị
- Mã hóa bảo mật chuẩn **256-bit SSL**
- Để đăng xuất thủ công: Nhấn nút **"Đăng xuất"** trên Dashboard → Xác nhận

---

## 3. QUY TRÌNH PHÊ DUYỆT ĐỀ XUẤT

### Luồng chuẩn (Nhân viên tạo)

```
Nhân viên tạo đề xuất
        │
        ▼
   ① Chờ TP duyệt (pending)
        │
   Trưởng phòng phê duyệt
        │
        ▼
   ② TP đã duyệt (dept_approved)
        │
   Phòng TCTH duyệt & gán Xe + Tài xế
        │
        ▼
   ③ Chờ tài xế nhận (tcth_approved)
        │
   Tài xế xác nhận nhận nhiệm vụ
        │
        ▼
   ④ Đang thực hiện (driver_accepted)
        │
   Tài xế chốt số ODO khi hoàn thành
        │
        ▼
   ⑤ Hoàn thành (completed)
```

### Luồng rút gọn (Trưởng phòng / TCTH / BGĐ / Admin tạo)

Khi Lãnh đạo tự tạo đề xuất → **Bỏ qua bước duyệt Trưởng phòng** → Gửi thẳng Phòng TCTH.

### Luồng giao việc trực tiếp (Chỉ TCTH & Admin)

Phòng TCTH / Admin chỉ định ngay Tài xế + Xe + Lộ trình → **Bỏ qua mọi bước duyệt** → Tài xế nhận lệnh ngay.

### Các trạng thái đề xuất

| Trạng thái | Ý nghĩa | Màu hiển thị |
|------------|----------|-------------|
| **Bản nháp** | Đề xuất mới tạo, chưa gửi | Xám |
| **Chờ TP duyệt** | Đang chờ Trưởng phòng phê duyệt | Vàng đồng |
| **TP đã duyệt** | Trưởng phòng đã duyệt, chuyển TCTH | Trắng |
| **Chờ tài xế nhận** | TCTH đã gán xe & tài xế | Vàng đồng |
| **Đang thực hiện** | Tài xế đã nhận, đang chạy | Trắng |
| **Hoàn thành** | Chuyến đi đã kết thúc | Vàng đồng |
| **Từ chối** | Đề xuất bị từ chối kèm lý do | Xám |

---

## 4. NHÂN VIÊN (`staff`)

### Màn hình Dashboard

Khi đăng nhập, Nhân viên sẽ thấy:

- **Thẻ thông tin cá nhân**: Tên, vai trò, phòng ban
- **Thẻ thống kê**: Tổng số đề xuất và kilomet của phòng ban (có thể ẩn/hiện số liệu)
- **Chức năng yêu thích**: Tạo đề xuất, Đề xuất của tôi, Tình hình Đội xe, Giám sát GPS, Lịch sử điều xe, Quy định an toàn
- **Đề xuất gần đây**: Danh sách các đề xuất thuộc phòng ban

### Thanh điều hướng (Bottom Bar)

| Vị trí | Nút | Chức năng |
|--------|-----|-----------|
| Trái | **Home** | Về trang Dashboard |
| Giữa | **Nút tròn** | Tạo đề xuất điều xe mới |
| Phải | **Đoàn xe** | Xem tình hình Đội xe |

### Các thao tác chính

#### ✍️ Tạo đề xuất điều xe mới

1. Nhấn **nút tròn giữa** trên thanh điều hướng hoặc icon **"Tạo đề xuất"** trên Dashboard
2. Điền đầy đủ thông tin:
   - **Phòng ban**: Tự động gán theo tài khoản (không thể thay đổi)
   - **Danh sách người đi**: Thêm họ tên các nhân sự cùng đi
   - **Thời gian công tác**: Chọn ngày giờ xuất phát và dự kiến kết thúc (hỗ trợ chọn nhanh: +2h, +4h, đến 17h, cả ngày)
   - **Lộ trình**: Nhập nơi đến (có gợi ý sẵn các địa điểm thường xuyên)
   - **Lý do công tác**: Mô tả mục đích sử dụng xe
3. Nhấn **"Gửi Trưởng phòng duyệt"** để chuyển đề xuất lên cấp trên

#### ✏️ Chỉnh sửa / Xóa đề xuất

- Chỉ được chỉnh sửa/xóa khi đề xuất đang ở trạng thái **Chờ TP duyệt**
- Trên danh sách đề xuất gần đây → Nhấn vào đề xuất → Chọn **"Chỉnh sửa"** hoặc **"Xóa"**

#### 📋 Xem trước biểu mẫu

- Nhấn vào bất kỳ đề xuất nào → Xem **Mẫu số 02/GĐNSDX** định dạng chuẩn ngân hàng
- Theo dõi **Lịch sử phê duyệt** (ai đã duyệt/từ chối, lúc nào)

#### 🚗 Xem tình hình Đội xe

- Vào mục **"Tình hình Đội xe"** → Xem danh sách xe và tài xế hiện có
- Biết xe nào **sẵn sàng**, xe nào **đang dùng** hoặc **bảo trì**

---

## 5. TRƯỞNG PHÒNG (`dept_head`)

### Màn hình Dashboard

Ngoài các tính năng của Nhân viên, Trưởng phòng có thêm:

- **Nút "Phê duyệt ngay"** nhấp nháy khi có đề xuất chờ duyệt (kèm số lượng)
- **Chức năng "Xuất Excel"**: Xuất báo cáo dữ liệu ra file Excel
- **Badge đếm**: Hiển thị số đề xuất chờ duyệt trên icon Phê duyệt

### Thanh điều hướng

| Vị trí | Nút | Chức năng |
|--------|-----|-----------|
| Trái | **Home** | Về trang Dashboard |
| Giữa | **Nút tròn** | Tạo đề xuất mới |
| Phải | **Phê duyệt** | Vào màn hình phê duyệt |

### Các thao tác chính

#### ✅ Phê duyệt đề xuất

1. Nhấn nút **"Phê duyệt"** trên thanh điều hướng hoặc **"Phê duyệt ngay"** trên Dashboard
2. Xem danh sách các đề xuất **Chờ TP duyệt** từ nhân viên trong phòng
3. Nhấn vào đề xuất cần duyệt → Xem chi tiết biểu mẫu
4. Chọn một trong hai hành động:
   - **"Duyệt & Gửi Phòng TCTH"** → Đề xuất chuyển tiếp sang Phòng TCTH
   - **"Từ chối"** → Chọn lý do từ chối → Nhân viên sẽ nhận được thông báo

#### 📊 Xuất báo cáo Excel

1. Nhấn icon **"Xuất Excel"** trên Dashboard
2. **Thiết lập bộ lọc**: Thời gian, trạng thái, xe, tài xế
3. **Xem trước kết quả** trong bảng dữ liệu
4. Nhấn **"Xuất file"** → Tải về file `.xlsx`

#### 🚀 Tạo đề xuất nhanh (Fast-Track)

- Khi Trưởng phòng tạo đề xuất → **Tự động bỏ qua bước duyệt TP** → Gửi thẳng Phòng TCTH

---

## 6. PHÒNG TỔ CHỨC TỔNG HỢP (`tcth`)

> **Đây là vai trò trung tâm điều phối toàn bộ hoạt động xe công tác.**

### Màn hình Dashboard

- **Nút "Giao việc trực tiếp"**: Xuất hiện trên thẻ thống kê, thanh Quick Nav và banner
- **Nút "Quản lý đề xuất"**: Truy cập nhanh hệ thống quản lý
- **Xem toàn bộ đề xuất** của tất cả phòng ban trong chi nhánh

### Thanh điều hướng

| Vị trí | Nút | Chức năng |
|--------|-----|-----------|
| Trái | **Home** | Về trang Dashboard |
| Giữa | **Nút tròn** | Tạo đề xuất mới |
| Phải | **Phê duyệt** | Vào màn hình phê duyệt & gán xe |

### Các thao tác chính

#### 🚐 Duyệt & Gán xe + Tài xế

1. Vào **"Phê duyệt"** → Xem danh sách đề xuất **TP đã duyệt** từ toàn chi nhánh
2. Nhấn vào đề xuất → Xem chi tiết biểu mẫu
3. Nhấn **"Gán xe & Tài xế"** → Hệ thống hiển thị:
   - **Danh sách xe sẵn sàng**: Tự động loại xe trùng lịch
   - **Danh sách tài xế sẵn sàng**: Tự động loại tài xế đang bận
   - Cảnh báo nếu xe đang bảo trì, tài xế đang nghỉ phép, hoặc đã có lịch trình xung đột
4. Chọn xe → Chọn tài xế → Nhấn **"Duyệt & Gán Tài xế"**
5. Đề xuất chuyển trạng thái **"Chờ tài xế nhận"** → Tài xế sẽ thấy nhiệm vụ mới

#### ⚡ Giao việc trực tiếp (Direct Task)

1. Nhấn **"Giao việc trực tiếp"** trên Dashboard
2. Trong cửa sổ giao việc:
   - **Chọn Tài xế** từ danh sách đang rảnh
   - **Chọn Phương tiện** từ danh sách xe sẵn sàng
   - **Nhập Nơi đến** và **Chi tiết nhiệm vụ**
   - **Chọn Khung giờ**: Thời gian bắt đầu và kết thúc
3. Nhấn **"Giao việc"** → Tạo đề xuất thẳng trạng thái **"Chờ tài xế nhận"**

#### 🔧 Quản lý Đội xe & Tài xế

1. Vào **"Tình hình Đội xe"** (`/fleet`)
2. **Tab Danh sách xe**:
   - Xem trạng thái từng xe (Sẵn sàng / Đang dùng / Bảo trì / Thanh lý)
   - Đổi trạng thái xe khi cần (VD: chuyển xe sang bảo trì)
3. **Tab Danh sách Tài xế**:
   - Xem trạng thái từng tài xế
   - Đổi trạng thái (VD: báo tài xế nghỉ phép)
   - Chỉnh sửa thông tin, số điện thoại
   - Xem lịch sử chạy xe của từng tài xế

#### 🔓 Cưỡng chế hoàn thành chuyến quá hạn

- Khi chuyến đi đã quá thời gian kết thúc mà tài xế quên chốt ODO:
  1. Vào xem chi tiết đề xuất trên trang **Preview**
  2. Hệ thống hiển thị cảnh báo **"Quá hạn"**
  3. Nhấn **"Xác nhận hoàn thành & Giải phóng xe/tài xế"** → Xe và tài xế được mở khóa trở lại **"Sẵn sàng"**

#### 📡 Giám sát hoạt động

- Vào **"Giám sát GPS"** (`/monitor`) để theo dõi:
  - Tổng quan đoàn xe (số xe trống, đang dùng, bảo trì)
  - Đề xuất chờ xử lý
  - Nhật ký hoạt động gần đây (Audit Logs)

---

## 7. BAN GIÁM ĐỐC (`director`)

> **Vai trò giám sát chiến lược — Giao diện tối ưu cho Lãnh đạo.**

### Màn hình Dashboard

- **Nút "Báo cáo vận hành"** _(độc quyền)_: Thay thế nút "Tạo đề xuất" ở vị trí ưu tiên
- **Không hiển thị** chức năng Phê duyệt trên Dashboard (đã tối ưu UX cho Lãnh đạo)
- **Xem toàn bộ đề xuất** của toàn chi nhánh

### Thanh điều hướng

| Vị trí | Nút | Chức năng |
|--------|-----|-----------|
| Trái | **Home** | Về trang Dashboard |
| Giữa | **Nút tròn** | Tạo đề xuất mới |
| Phải | **Đoàn xe** | Xem tình hình Đội xe |

### Các thao tác chính

#### 📊 Xem Báo cáo Vận hành _(tính năng độc quyền)_

1. Nhấn nút **"Báo cáo vận hành"** trên Dashboard
2. Cửa sổ báo cáo hiển thị (thiết kế mobile-first, 3 màu sang trọng):
   - **Tổng quan Đội xe**: Số xe Sẵn sàng / Đang hoạt động / Bảo trì
   - **Tổng quan Tài xế**: Số tài xế Sẵn sàng / Đang công tác / Nghỉ phép
   - **Lịch trình hôm nay**: Danh sách các chuyến đi trong ngày (nơi đến, giờ, xe, tài xế, trạng thái)
   - **Lịch trình sắp tới**: Các chuyến ngày mai và tương lai

#### 👁️ Giám sát tiến độ phê duyệt

- Vào trang **Phê duyệt**: Xem toàn bộ đề xuất đang chờ xử lý của chi nhánh
- Hiển thị banner: _"Giám sát tiến độ phê duyệt toàn chi nhánh"_
- **Chỉ xem, không can thiệp** — đảm bảo tính minh bạch

#### 📡 Giám sát hoạt động

- Truy cập **Giám sát GPS** để nắm tình hình trực ban và biến động đoàn xe

---

## 8. TÀI XẾ (`driver`)

### Màn hình Dashboard

- **Thẻ thống kê cá nhân**: Tổng số chuyến và tổng km đã chạy
- **Icon "Nhiệm vụ tài xế"**: Truy cập nhanh trang nhiệm vụ
- **Đề xuất gần đây**: Chỉ hiển thị các chuyến được phân công cho mình

### Thanh điều hướng

| Vị trí | Nút | Chức năng |
|--------|-----|-----------|
| Trái | **Home** | Về trang Dashboard |
| Giữa | **Nút tròn** | Tạo đề xuất mới |
| Phải | **Nhiệm vụ** | Vào trang Nhiệm vụ tài xế |

### Các thao tác chính

#### 📋 Xem nhiệm vụ được giao

1. Nhấn **"Nhiệm vụ"** trên thanh điều hướng hoặc icon **"Nhiệm vụ tài xế"** trên Dashboard
2. Xem thông tin cá nhân: Tổng chuyến hoàn thành, đang thực hiện, chờ nhận
3. Chuyển qua lại giữa 3 tab:
   - **Chờ nhận**: Các nhiệm vụ mới chưa xác nhận
   - **Đang thực hiện**: Chuyến đang chạy
   - **Đã xong**: Lịch sử hoàn thành

#### ✋ Nhận nhiệm vụ

1. Vào tab **"Chờ nhận"** → Nhấn vào nhiệm vụ cần nhận
2. Kiểm tra thông tin: Nơi đến, thời gian, xe được gán
3. Nhấn **"Nhận nhiệm vụ"**
   - ⚠️ Chỉ nhận được khi **đến đúng ngày công tác** và **không đang bận chuyến khác**
4. Trạng thái chuyển sang **"Đang thực hiện"**

#### ✅ Hoàn thành chuyến & Chốt ODO

1. Sau khi kết thúc chuyến đi, vào xem chi tiết đề xuất
2. Nhấn **"Xác nhận hoàn thành"**
3. Nhập chỉ số công tơ mét:
   - **ODO xuất phát**: Số km trên đồng hồ lúc bắt đầu
   - **ODO kết thúc**: Số km trên đồng hồ lúc về
4. Hệ thống **tự động tính quãng đường** (ODO kết thúc − ODO xuất phát)
5. Nhấn **"Xác nhận"** → Chuyến hoàn thành, xe và tài xế được giải phóng

#### 📱 Cập nhật số điện thoại

- Trên trang Nhiệm vụ → Nhấn icon bút chì cạnh số điện thoại → Nhập số mới → Lưu

---

## 9. QUẢN TRỊ VIÊN (`admin`)

> **Toàn quyền quản trị hệ thống — Kết hợp tất cả chức năng của mọi vai trò.**

### Màn hình Dashboard

Quản trị viên có đầy đủ mọi tính năng, thêm:

- **"Quản trị Admin"**: Truy cập hệ thống quản trị trung tâm
- **"Giao việc trực tiếp"**: Giống quyền TCTH
- **"Thống kê km"**: Modal hiển thị tổng quãng đường và số chuyến hoàn thành
- **"Quản lý đề xuất"**: Rà soát đa chiều

### Thanh điều hướng

| Vị trí | Nút | Chức năng |
|--------|-----|-----------|
| Trái | **Home** | Về trang Dashboard |
| Giữa | **Nút tròn** | Tạo đề xuất mới |
| Phải | **Đoàn xe** | Xem tình hình Đội xe |

### Hệ thống Quản trị Trung tâm (`/admin`)

#### 👥 Quản lý Người dùng

- Thêm, sửa, xóa tài khoản người dùng
- Phân quyền vai trò (staff, dept_head, tcth, director, driver, admin)
- Đổi mật khẩu cho người dùng

#### 🚗 Quản lý Phương tiện

- Thêm, sửa thông tin xe (biển số, dòng xe, số chỗ ngồi)
- Quản lý trạng thái xe (Sẵn sàng, Bảo trì, Thanh lý)

#### 🏢 Quản lý Phòng ban

- Thêm, xóa danh mục phòng ban chi nhánh

#### 📄 Quản lý Đề xuất

- Rà soát toàn bộ đề xuất với bộ lọc đa chiều
- Xóa đề xuất lỗi hoặc trùng lặp

#### 🔄 Đồng bộ Supabase

- **Xuất SQL**: Trích xuất dữ liệu dưới dạng Custom SQL
- **Đẩy dữ liệu**: Đồng bộ trực tiếp lên Supabase Database qua API
- Kiểm tra trạng thái kết nối Supabase

### Đặc quyền riêng

- **Tạo đề xuất cho mọi phòng ban**: Không bị khóa cứng phòng ban như các role khác
- **Toàn quyền can thiệp**: Duyệt, từ chối, xóa, giao việc trực tiếp, cưỡng chế hoàn thành chuyến quá hạn ở bất kỳ giai đoạn nào

---

## 10. BẢNG SO SÁNH PHÂN QUYỀN

| Tính năng | Nhân viên | Trưởng phòng | TCTH | Giám đốc | Tài xế | Admin |
|-----------|:---------:|:------------:|:----:|:--------:|:------:|:-----:|
| Tạo đề xuất điều xe | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chỉnh sửa / Xóa đề xuất của mình | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Duyệt cấp Trưởng phòng | — | ✅ | ✅ | 👁️ | — | ✅ |
| Gán xe & Tài xế | — | — | ✅ | 👁️ | — | ✅ |
| Giao việc trực tiếp | — | — | ✅ | — | — | ✅ |
| Nhận nhiệm vụ & Chốt ODO | — | — | — | — | ✅ | — |
| Đổi trạng thái Xe & Tài xế | — | — | ✅ | — | — | ✅ |
| Báo cáo vận hành | — | — | — | ✅ | — | — |
| Giám sát GPS & Nhật ký | — | — | ✅ | ✅ | — | ✅ |
| Xuất Excel | — | ✅ | ✅ | — | — | ✅ |
| Quản trị hệ thống | — | — | — | — | — | ✅ |
| Cưỡng chế hoàn thành quá hạn | — | — | ✅ | — | — | ✅ |

> **Chú thích**: ✅ = Có quyền &nbsp;&nbsp; 👁️ = Chỉ giám sát (xem) &nbsp;&nbsp; — = Không có quyền

---

## 📌 QUY ĐỊNH SỬ DỤNG XE CÔNG TÁC

1. **Đăng ký trước giờ đi**: Tối thiểu **2 tiếng** trước giờ xuất phát (trừ trường hợp khẩn cấp)
2. **Trách nhiệm người đi xe**: Giữ gìn vệ sinh chung, không mang chất dễ cháy nổ
3. **Phân công Phòng TCTH**: Tài xế và phương tiện được gán theo tính cấp bách và khả dụng
4. **Ghi nhận ODO**: Tài xế có trách nhiệm cập nhật số km lúc xuất phát và khi hoàn thành

---

> **CarFlow 910** — Số hóa quy trình điều xe VietinBank Nam Sài Gòn
>
> Phiên bản: 9.10 | Cập nhật: 25/09/2026
