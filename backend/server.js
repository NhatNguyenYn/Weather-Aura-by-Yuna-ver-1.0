// =====================================================================
// SERVER.JS - PHIÊN BẢN ĐÃ SỬA LỖI HOÀN CHỈNH
// =====================================================================
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const API_KEY = process.env.WEATHER_API_KEY;
// Các import này phải đúng đường dẫn
const auth = require('./middleware/auth'); 
const User = require('./models/User');     

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Kết nối MongoDB
const MONGO_URI = process.env.MONGO_URI; 
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ [MongoDB] Kết nối thành công.'))
    .catch(err => console.error('❌ [MongoDB] Lỗi kết nối:', err));

// === API ĐĂNG KÝ ===
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: "Vui lòng điền đủ thông tin" });
        if (await User.findOne({ email })) return res.status(409).json({ message: 'Email đã được đăng ký' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        
        console.log(`✅ [Register] Đăng ký thành công cho: ${email}`);
        res.status(201).json({ message: 'Đăng ký thành công! Vui lòng đăng nhập.' });

    } catch (error) {
        console.error("Lỗi khi đăng ký:", error.message);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi đăng ký.' });
    }
});

// === API ĐĂNG NHẬP ===
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Vui lòng điền email và mật khẩu." });
        
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

        const payload = { user: { id: user.id, name: user.name, email: user.email } };
        const secretKey = process.env.JWT_SECRET;
        const token = jwt.sign(payload, secretKey, { expiresIn: '1d' });

        console.log(`✅ [Login] Đăng nhập thành công cho: ${email}`);
        res.status(200).json({ token, user: payload.user });

    } catch (error) {
        console.error("Lỗi khi đăng nhập:", error.message);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi đăng nhập.' });
    }
});

// --- CƠ CHẾ CACHING ĐỂ TĂNG TỐC ---
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 phút

// === ENDPOINT 1: LẤY DỮ LIỆU THỜI TIẾT ĐẦY ĐỦ (XỬ LÝ CẢ CITY VÀ TỌA ĐỘ) ===
app.get('/api/weather/full', async (req, res) => {
    const { city, lat, lon, lang } = req.query;
    const language = lang || 'vi';
    
    let cacheKey;
    if (city) {
        cacheKey = `city-${city.toLowerCase()}-${language}`;
    } else if (lat && lon) {
        cacheKey = `coords-${lat}-${lon}-${language}`;
    } else {
        return res.status(400).json({ message: 'City or coordinates are required' });
    }

    if (weatherCache.has(cacheKey)) {
        const cachedData = weatherCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < CACHE_DURATION) {
            console.log(`✅ [Cache] Trả về dữ liệu từ cache cho: ${cacheKey}`);
            return res.status(200).json(cachedData.data);
        }
    }
    console.log("Đang sử dụng API Key:", process.env.WEATHER_API_KEY); 
    try {
        let currentUrl, forecastUrl;

        if (city) {
            console.log(`🔍 [City] Tìm kiếm cho thành phố: ${city}`);
            currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=${language}`;
            forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=${language}`;
        } else {
            console.log(`🔍 [Coords] Tìm kiếm cho tọa độ: lat=${lat}, lon=${lon}`);
            currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=${language}`;
            forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=${language}`;
        }

        const [currentResponse, forecastResponse] = await Promise.all([
            axios.get(currentUrl),
            axios.get(forecastUrl)
        ]);
        
        const currentData = currentResponse.data;
        const forecastData = forecastResponse.data;

        const fullWeatherData = {
            current: {
                city: currentData.name,
                country: currentData.sys.country,
                temperature: currentData.main.temp,
                feels_like: currentData.main.feels_like,
                humidity: currentData.main.humidity,
                pressure: currentData.main.pressure,
                sunrise: currentData.sys.sunrise,
                sunset: currentData.sys.sunset,
                uvi: null,
                visibility: currentData.visibility,
                wind_speed: currentData.wind.speed,
                description: currentData.weather[0].description,
                icon: `http://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`,
            },
            forecast: forecastData.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5).map(day => ({
                dt: day.dt,
                temp: { day: day.main.temp, min: day.main.temp_min, max: day.main.temp_max },
                feels_like: { day: day.main.feels_like },
                humidity: day.main.humidity,
                wind_speed: day.wind.speed,
                pop: day.pop,
                description: day.weather[0].description,
                icon: `http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`,
            })),
        };

        weatherCache.set(cacheKey, { timestamp: Date.now(), data: fullWeatherData });
        res.status(200).json(fullWeatherData);

    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ message: "City not found" });
        }
        console.error('Lỗi khi lấy dữ liệu (v2.5):', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// === ENDPOINT 2: GỢI Ý THÀNH PHỐ ===
app.get('/api/cities/search', async (req, res) => {
    const { query } = req.query;
    if (!query || query.length < 3) {
        return res.json([]);
    }
    console.log(`🔍 [Suggest] Tìm gợi ý cho: "${query}"`);
    try {
        const geocodingUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`;
        const response = await axios.get(geocodingUrl);
        const suggestions = response.data.map(city => ({
            name: city.name,
            country: city.country,
            state: city.state,
        }));
        res.json(suggestions);
    } catch (error) {
        console.error('Lỗi khi tìm gợi ý thành phố:', error.message);
        res.status(500).json({ message: "Lỗi server khi tìm thành phố" });
    }
});

// === USER SPECIFIC ENDPOINTS (PROTECTED) ===

// @route   POST /api/users/favorites
// @desc    Thêm thành phố vào danh sách yêu thích
// @access  Private (Cần token)
app.post('/api/users/favorites', auth, async (req, res) => {
    try {
        const { city, country } = req.body;
        if (!city || !country) {
            return res.status(400).json({ message: 'Tên thành phố và quốc gia là bắt buộc' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        // Kiểm tra xem thành phố đã tồn tại chưa để tránh trùng lặp
        const alreadyExists = user.favoriteCities.some(
            fav => fav.name.toLowerCase() === city.toLowerCase() && fav.country.toLowerCase() === country.toLowerCase()
        );

        if (alreadyExists) {
            return res.status(409).json({ message: 'Thành phố đã có trong danh sách yêu thích' });
        }

        user.favoriteCities.push({ name: city, country });
        await user.save();

        res.status(200).json(user.favoriteCities);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Lỗi Server');
    }
});

// Thêm một endpoint nữa để lấy danh sách yêu thích (sẽ dùng trong dashboard)
// @route   GET /api/users/favorites
// @desc    Lấy danh sách thành phố yêu thích
// @access  Private
app.get('/api/users/favorites', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('favoriteCities');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.json(user.favoriteCities);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Lỗi Server');
    }
});


// --- KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
    console.log(`✅ SERVER ĐẦY ĐỦ TÍNH NĂNG ĐANG CHẠY TẠI http://localhost:${PORT}`);
});