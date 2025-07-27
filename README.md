# ⛅ Weather Aura – Smart Bilingual Weather Dashboard

> 🇻🇳 Ứng dụng web dự báo thời tiết thông minh, giao diện động, hỗ trợ song ngữ 🇬🇧 A smart, animated weather dashboard web app with bilingual support

---

## 🎯 Overview | Tổng quan

**Weather Aura** is a modern full-stack web application that delivers real-time weather information in a responsive and visually engaging interface. Registered users can personalize their experience by saving favorite cities, while all users enjoy detailed forecasts and dynamic backgrounds that adapt to current weather conditions.

**Weather Aura** là một ứng dụng web full-stack hiện đại, cung cấp thông tin thời tiết thời gian thực với giao diện động và thân thiện. Người dùng đã đăng ký có thể cá nhân hóa trải nghiệm bằng cách lưu thành phố yêu thích, trong khi tất cả người dùng đều được xem dự báo chi tiết và nền động phản ánh thời tiết hiện tại.

---

## ✅ Features | Tính năng nổi bật

| 🧩 Chức năng chính            | 📋 Mô tả                                         |
| ----------------------------- | ------------------------------------------------ |
| 🔍 City Weather Lookup        | Tra cứu thời tiết theo tên thành phố             |
| 📍 Geolocation Support        | Tự động lấy thời tiết theo vị trí hiện tại       |
| 📅 5-Day Forecast             | Hiển thị dự báo thời tiết 5 ngày                 |
| 🧾 Weather Details            | Nhiệt độ, độ ẩm, gió, áp suất, UV, bình minh...  |
| 🔐 User Authentication        | Đăng ký, đăng nhập, bảo mật bằng JWT + bcrypt    |
| ⭐ Save Favorite Cities        | Lưu & xem nhanh các thành phố yêu thích          |
| 🌓 Dark / Light Mode          | Hỗ trợ chế độ nền tối / sáng                     |
| 🌍 Bilingual UI               | Giao diện song ngữ (EN/VI) toàn diện             |
| 💬 Autocomplete               | Gợi ý thành phố khi gõ tìm kiếm                  |
| 🌈 Dynamic Weather Animations | Nền thay đổi theo thời tiết (mưa, tuyết...)      |
| ⚠️ Friendly Error Handling    | Xử lý lỗi thân thiện nếu thành phố không tồn tại |

---

## 🛠 Tech Stack | Công nghệ sử dụng

### 🔧 Backend

- **Platform:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **ODM:** Mongoose
- **Auth & Security:** JWT, bcrypt
- **API Integration:** axios (OpenWeatherMap)
- **Environment Management:** dotenv
- **CORS Handling:** cors

### 🎨 Frontend

- **Core:** HTML5, CSS3, JavaScript (ES6+)
- **Styling:** Tailwind CSS + custom CSS
- **Icons:** Font Awesome

### ☁️ APIs

- **Weather Data:** OpenWeatherMap API
- **Geocoding:** OpenWeatherMap Geocoding API

---

## 🚀 How to Setup | Hướng dẫn Cài đặt

### 📡 Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder with:

```env
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_super_secret_string
WEATHER_API_KEY=your_openweathermap_api_key
```

Start the server:

```bash
node server.js
# Server will run at http://localhost:5000
```

---

### 🌐 Frontend Setup

- Open `index.html` in your browser
- For best experience, use VSCode Live Server extension

```bash
# No build step needed
# Static frontend only – instantly ready to use
```

---

## 📁 Folder Structure | Cấu trúc Thư mục

```plaintext
Weather-Aura/
├── backend/                     # ⚙️ Node.js API server
│   ├── models/                  # 📊 User & city schema
│   ├── routes/                  # 🧭 API endpoints
│   ├── middleware/              # 🔒 Auth middleware
│   ├── server.js                # 🚀 Main backend app
│   └── .env                     # 🔐 Environment variables
│
├── frontend/                    # 🌐 Frontend UI (optional structure)
│   ├── index.html               # 🏠 Main entry file
│   ├── style.css                # 🎨 Tailwind & custom styles
│   ├── app.js                   # 🧠 JS logic (API, i18n, auth...)
│   ├── lang/                    # 🌍 JSON language packs (en.json, vi.json)
│   └── assets/                  # 📦 Images, icons, weather backgrounds
```

---

## 👨‍💻 Author | Tác giả

- **Ngô Nhật Nguyên** – Full-stack Developer & Creative Technologist
- 🇻🇳 Based in HCM, Vietnam
- 🔗 [GitHub Profile](https://github.com/NhatNguyenYn)

---

## 📜 License | Giấy phép

Licensed under the **MIT License** – free for personal and educational use.

Dự án sử dụng **MIT License** – miễn phí cho mục đích cá nhân & học tập.

