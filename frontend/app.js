// =====================================================================
// FILE app.js - PHIÊN BẢN "ONE FILE" CUỐI CÙNG - SẼ HOẠT ĐỘNG
// =====================================================================

const BACKEND_URL = 'http://localhost:5000';
let currentLang = 'en';

// --- TRẠNG THÁI ỨNG DỤNG ---
let currentWeather = null;
let forecastData = null;

// === LOGIC USER MỚI: SỬ DỤNG LOCALSTORAGE ĐỂ LƯU TRỮ LÂU DÀI ===
let currentUser = null;

// --- DOM elements ---
const elements = {
    themeToggle: document.getElementById('theme-toggle'),
    languageToggle: document.getElementById('language-toggle'),
    loginBtn: document.getElementById('login-btn'),
    userAvatar: document.getElementById('user-avatar'),
    userDropdown: document.getElementById('user-dropdown'),
    avatarInitials: document.getElementById('avatar-initials'),
    logoutBtn: document.getElementById('logout-btn'),
    dashboardBtn: document.getElementById('dashboard-btn'),
    citySearch: document.getElementById('city-search'),
    searchBtn: document.getElementById('search-btn'),
    getLocationBtn: document.getElementById('get-location-btn'),
    searchResults: document.getElementById('search-results'),
    loadingSkeleton: document.getElementById('loading-skeleton'), 
    currentWeatherSection: document.getElementById('current-weather'),
    forecastSection: document.getElementById('forecast-section'),
    dashboardSection: document.getElementById('dashboard-section'),
    loginModal: document.getElementById('login-modal'),
    closeLoginModal: document.getElementById('close-login-modal'),
    loginTab: document.getElementById('login-tab'),
    registerTab: document.getElementById('register-tab'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    authMessage: document.getElementById('auth-message'),
    loadingOverlay: document.getElementById('loading-overlay'),
    weatherEffects: document.getElementById('weather-effects')
};

// --- BỘ ĐIỀU KHIỂN & HANDLERS ---
function handleSearch() {
    const city = elements.citySearch.value.trim();
    if (!city) {
        alert(currentLang === 'vi' ? "Vui lòng nhập tên thành phố." : "Please enter a city name.");
        return;
    }
    runWeatherSearch({ city: city });
}

function handleGetLocation() {
    if (!navigator.geolocation) {
        alert(currentLang === 'vi' ? 'Trình duyệt của bạn không hỗ trợ định vị.' : 'Geolocation is not supported by your browser.');
        return;
    }
    showLoadingState();
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            runWeatherSearch({ lat: latitude, lon: longitude });
        },
        (error) => {
            hideLoadingState(true);
            let message = 'An unknown error occurred.';
            if (currentLang === 'vi') {
                message = 'Đã xảy ra lỗi không xác định.';
                if (error.code === 1) message = 'Bạn đã từ chối quyền truy cập vị trí.';
            } else {
                if (error.code === 1) message = 'You denied the request for Geolocation.';
            }
            displayError(message);
        }
    );
}

async function handleGetCitySuggestions() {
    const query = elements.citySearch.value.trim();
    if (query.length < 3) {
        elements.searchResults.classList.add('hidden');
        return;
    }
    try {
        const response = await fetch(`${BACKEND_URL}/api/cities/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) return;
        const suggestions = await response.json();
        displaySuggestions(suggestions);
    } catch (error) {
        console.error("Lỗi khi lấy gợi ý:", error);
    }
}

async function runWeatherSearch(params) {
    showLoadingState();
    try {
        let url = `${BACKEND_URL}/api/weather/full?lang=${currentLang}`;
        if (params.city) url += `&city=${encodeURIComponent(params.city)}`;
        else if (params.lat && params.lon) url += `&lat=${params.lat}&lon=${params.lon}`;

        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không tìm thấy thành phố');
        }
        
        const data = await response.json();
        currentWeather = data.current;
        forecastData = data.forecast;
        localStorage.setItem('lastSearchedCity', data.current.city);
        if (params.lat) {
            elements.citySearch.value = `${data.current.city}, ${data.current.country}`;
        }
        updateWeatherUI();
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu thời tiết:', error);
        displayError(error.message);
        hideLoadingState(true);
    } finally {
        hideLoadingState(false);
    }
}

// --- CẬP NHẬT GIAO DIỆN (UI) ---
function showLoadingState() { elements.loadingOverlay.classList.remove('hidden'); elements.loadingSkeleton.classList.remove('hidden'); elements.currentWeatherSection.innerHTML = ''; elements.currentWeatherSection.classList.add('hidden'); elements.forecastSection.classList.add('hidden'); }
function hideLoadingState(hideSkeleton = false) { elements.loadingOverlay.classList.add('hidden'); if (hideSkeleton) { elements.loadingSkeleton.classList.add('hidden'); } }

function updateWeatherUI() {
    if (!currentWeather) return;
    elements.loadingSkeleton.classList.add('hidden');
    
    // Inject HTML và các phần tử con
    elements.currentWeatherSection.innerHTML = `
        <div class="bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-white/20 dark:border-dark-700/30">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h2 class="text-2xl font-bold">${currentWeather.city}</h2>
                        <p class="text-gray-500 dark:text-gray-400" id="current-date-placeholder"></p>
                    </div>
                    <button id="save-location-btn" class="text-primary hover:text-primary/80 transition-colors"><i class="far fa-bookmark"></i><span class="en ml-1">Save</span><span class="vi hidden ml-1">Lưu</span></button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="md:col-span-2 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between">
                        <div class="flex items-center mb-4 md:mb-0">
                            <div class="text-8xl mr-4"><img src="${currentWeather.icon}" alt="${currentWeather.description}" class="w-24 h-24"></div>
                            <div>
                                <div class="text-5xl font-bold">${Math.round(currentWeather.temperature)}°C</div>
                                <div class="text-lg capitalize">${currentWeather.description}</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 w-full md:w-auto">
                            <div class="bg-white dark:bg-dark-700/50 rounded-lg p-3 text-center"><div class="text-sm text-gray-500 dark:text-gray-400"><span class="en">Feels Like</span><span class="vi hidden">Cảm giác</span></div><div class="font-bold">${Math.round(currentWeather.feels_like)}°C</div></div>
                            <div class="bg-white dark:bg-dark-700/50 rounded-lg p-3 text-center"><div class="text-sm text-gray-500 dark:text-gray-400"><span class="en">Humidity</span><span class="vi hidden">Độ ẩm</span></div><div class="font-bold">${currentWeather.humidity}%</div></div>
                            <div class="bg-white dark:bg-dark-700/50 rounded-lg p-3 text-center"><div class="text-sm text-gray-500 dark:text-gray-400"><span class="en">Wind</span><span class="vi hidden">Gió</span></div><div class="font-bold">${(currentWeather.wind_speed * 3.6).toFixed(1)} km/h</div></div>
                            <div class="bg-white dark:bg-dark-700/50 rounded-lg p-3 text-center"><div class="text-sm text-gray-500 dark:text-gray-400"><span class="en">Pressure</span><span class="vi hidden">Áp suất</span></div><div class="font-bold">${currentWeather.pressure} hPa</div></div>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <div class="bg-light-100 dark:bg-dark-700 rounded-lg p-4"><h3 class="font-medium mb-2"><span class="en">Sunrise & Sunset</span><span class="vi hidden">Bình minh & Hoàng hôn</span></h3><div class="flex items-center justify-between"><div class="flex items-center"><i class="fas fa-sunrise text-yellow-500 mr-2"></i><span id="sunrise-time-placeholder"></span></div><div class="flex items-center"><i class="fas fa-sunset text-orange-500 mr-2"></i><span id="sunset-time-placeholder"></span></div></div></div>
                        <div class="bg-light-100 dark:bg-dark-700 rounded-lg p-4"><h3 class="font-medium mb-2"><span class="en">UV Index</span><span class="vi hidden">Chỉ số UV</span></h3><div class="flex items-center"><div class="w-full bg-light-300 dark:bg-dark-600 rounded-full h-2.5"><div id="uv-bar-placeholder" class="bg-yellow-500 h-2.5 rounded-full"></div></div><span id="uv-index-placeholder" class="ml-2 font-bold"></span></div></div>
                        <div class="bg-light-100 dark:bg-dark-700 rounded-lg p-4"><h3 class="font-medium mb-2"><span class="en">Visibility</span><span class="vi hidden">Tầm nhìn</span></h3><div class="flex items-center"><i class="fas fa-eye mr-2 text-primary"></i><span>${(currentWeather.visibility / 1000).toFixed(1)} km</span></div></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (forecastData && forecastData.length > 0) {
        let forecastHTML = forecastData.map(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString(currentLang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
            return `
                <div class="bg-light-100 dark:bg-dark-700 rounded-lg p-4 flex flex-col items-center flex-shrink-0 w-40">
                    <div class="font-medium mb-2">${dayName}</div>
                    <div class="text-4xl my-2"><img src="${day.icon}" alt="${day.description}" class="w-12 h-12"></div>
                    <div class="text-xl font-bold">${Math.round(day.temp.day)}°C</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">${Math.round(day.temp.min)}° / ${Math.round(day.temp.max)}°</div>
                    <div class="text-sm capitalize mt-1 text-center">${day.description}</div>
                </div>
            `;
        }).join('');
        elements.forecastSection.innerHTML = `<h2 class="text-xl font-bold mb-4"><span class="en">5-Day Forecast</span><span class="vi hidden">Dự báo 5 ngày</span></h2><div class="bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-white/20 dark:border-dark-700/30"><div class="p-6"><div class="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">${forecastHTML}</div></div></div>`;
        elements.forecastSection.classList.remove('hidden');
    } else {
        elements.forecastSection.classList.add('hidden');
    }
    
    document.getElementById('sunrise-time-placeholder').textContent = new Date(currentWeather.sunrise * 1000).toLocaleTimeString(currentLang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('sunset-time-placeholder').textContent = new Date(currentWeather.sunset * 1000).toLocaleTimeString(currentLang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    const uvIndex = Math.round(currentWeather.uvi || 0);
    document.getElementById('uv-index-placeholder').textContent = uvIndex;
    document.getElementById('uv-bar-placeholder').style.width = `${uvIndex * 10}%`;
    document.getElementById('current-date-placeholder').textContent = new Date().toLocaleDateString(currentLang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    elements.currentWeatherSection.classList.remove('hidden');
    elements.currentWeatherSection.scrollIntoView({ behavior: 'smooth' });

    const iconCode = currentWeather.icon.split('/').pop().replace('@2x.png', '');
    setWeatherEffects(iconCode);
    updateLanguageDisplay();
    const saveBtn = document.getElementById('save-location-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveLocation);
        // Ta sẽ thêm logic kiểm tra và cập nhật trạng thái nút ở đây sau
    }
}

function displaySuggestions(suggestions) {
    elements.searchResults.innerHTML = '';
    if (suggestions.length === 0) { elements.searchResults.classList.add('hidden'); return; }
    suggestions.forEach(city => {
        const item = document.createElement('div');
        item.className = 'px-4 py-2 hover:bg-light-200 dark:hover:bg-dark-600 cursor-pointer';
        let displayName = `${city.name}, ${city.country}`;
        if (city.state) displayName = `${city.name}, ${city.state}, ${city.country}`;
        item.textContent = displayName;
        item.addEventListener('click', () => {
            elements.citySearch.value = `${city.name}, ${city.country}`;
            elements.searchResults.classList.add('hidden');
            handleSearch();
        });
        elements.searchResults.appendChild(item);
    });
    elements.searchResults.classList.remove('hidden');
}

function displayError(message) {
    elements.loadingSkeleton.classList.add('hidden');
    elements.forecastSection.classList.add('hidden');
    const errorHtml = `
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-lg p-6 text-center animate-fade-in">
            <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h3 class="text-xl font-bold text-red-800 dark:text-red-200 mb-2"><span class="en">An Error Occurred</span><span class="vi hidden">Đã có lỗi xảy ra</span></h3>
            <p class="text-red-600 dark:text-red-300">${message}</p>
        </div>
    `;
    elements.currentWeatherSection.innerHTML = errorHtml;
    elements.currentWeatherSection.classList.remove('hidden');
    updateLanguageDisplay();
}

// --- CÁC TÍNH NĂNG KHÁC ---

function analyzeDateWeather() {
    if (!currentWeather || !forecastData || forecastData.length === 0) {
        alert(currentLang === 'vi' ? 'Vui lòng tìm kiếm một thành phố trước.' : 'Please search for a city first.');
        return;
    }
    const selectedDate = document.getElementById('date-picker').valueAsDate;
    if (!selectedDate) {
        alert(currentLang === 'vi' ? 'Vui lòng chọn một ngày.' : 'Please select a date.');
        return;
    }
    selectedDate.setHours(0, 0, 0, 0);
    const matchedForecast = forecastData.find(day => {
        const forecastDate = new Date(day.dt * 1000);
        forecastDate.setHours(0, 0, 0, 0);
        return forecastDate.getTime() === selectedDate.getTime();
    });
    const dateAnalysisResultEl = document.getElementById('date-analysis-result');
    if (!matchedForecast) {
        alert(currentLang === 'vi' ? 'Không có dữ liệu dự báo cho ngày đã chọn.' : 'No forecast data available for the selected date.');
        dateAnalysisResultEl.classList.add('hidden');
        return;
    }
    let weatherQuality = '', weatherQualityClass = '', analysisText = '';
    const temp = matchedForecast.temp.day;
    const rainProb = matchedForecast.pop;
    const windSpeed = matchedForecast.wind_speed;
    if (rainProb < 0.3 && temp >= 18 && temp <= 28 && windSpeed < 5.5) {
        weatherQuality = currentLang === 'vi' ? 'Tốt' : 'Good';
        weatherQualityClass = 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
        analysisText = currentLang === 'vi' ? 'Thời tiết tuyệt vời cho các hoạt động ngoài trời! Trời quang đãng, nhiệt độ dễ chịu.' : 'Perfect weather for outdoor activities! Clear skies and comfortable temperature.';
    } else if (rainProb < 0.6 && temp >= 15 && temp <= 32) {
        weatherQuality = currentLang === 'vi' ? 'Khá' : 'Fair';
        weatherQualityClass = 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
        analysisText = currentLang === 'vi' ? 'Thời tiết khá ổn, có thể có mưa rào nhẹ. Nên mang theo ô dù nếu ra ngoài.' : 'Weather is fairly good, but there might be some light showers. Consider taking an umbrella.';
    } else {
        weatherQuality = currentLang === 'vi' ? 'Xấu' : 'Poor';
        weatherQualityClass = 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
        if (rainProb >= 0.6) {
            analysisText = currentLang === 'vi' ? 'Khả năng cao có mưa. Các hoạt động ngoài trời không được khuyến khích.' : 'High chance of rain. Outdoor activities are not recommended.';
        } else if (temp < 10 || temp > 35) {
            analysisText = currentLang === 'vi' ? 'Nhiệt độ khắc nghiệt. Hạn chế ở ngoài trời quá lâu.' : 'Extreme temperatures. Limit time spent outdoors.';
        } else {
            analysisText = currentLang === 'vi' ? 'Thời tiết không thuận lợi. Hãy kiểm tra lại chi tiết trước khi lên kế hoạch.' : 'Weather is not favorable. Check details before making plans.';
        }
    }
    const forecastDate = new Date(matchedForecast.dt * 1000);
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    
    dateAnalysisResultEl.innerHTML = `
        <h3 class="font-medium mb-2"><span class="en">Weather Analysis</span><span class="vi hidden">Phân tích thời tiết</span></h3>
        <div class="p-4 rounded-lg bg-light-100 dark:bg-dark-700">
            <div class="flex items-center mb-2">
                <span class="font-medium">${forecastDate.toLocaleDateString(currentLang === 'vi' ? 'vi-VN' : 'en-US', dateOptions)}</span>
                <span class="ml-auto px-2 py-1 rounded-full text-xs font-medium ${weatherQualityClass}">${weatherQuality}</span>
            </div>
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="text-3xl mr-2"><img src="${matchedForecast.icon}" alt="${matchedForecast.description}" class="w-10 h-10"></div>
                    <div>
                        <div class="font-bold">${Math.round(matchedForecast.temp.day)}°C</div>
                        <div class="text-sm capitalize">${matchedForecast.description}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm"><span class="en">Rain:</span><span class="vi hidden">Mưa:</span><span class="font-medium">${Math.round(matchedForecast.pop * 100)}%</span></div>
                    <div class="text-sm"><span class="en">Wind:</span><span class="vi hidden">Gió:</span><span class="font-medium">${(matchedForecast.wind_speed * 3.6).toFixed(1)} km/h</span></div>
                </div>
            </div>
            <div class="mt-3"><p class="text-sm">${analysisText}</p></div>
        </div>
    `;
    dateAnalysisResultEl.classList.remove('hidden');
    updateLanguageDisplay();
}
function toggleTheme() { document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light'); }
function updateLanguageDisplay() { const isEnglish = currentLang === 'en'; document.querySelectorAll('.en').forEach(el => el.classList.toggle('hidden', !isEnglish)); document.querySelectorAll('.vi').forEach(el => el.classList.toggle('hidden', isEnglish)); }
function toggleLanguage() { currentLang = (currentLang === 'en') ? 'vi' : 'en'; localStorage.setItem('language', currentLang); if (currentWeather) { runWeatherSearch({ city: currentWeather.city }); } else { updateLanguageDisplay(); } }
function debounce(func, wait) { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }
// --- Hiệu ứng & tiện ích ---

// Hàm này tạo hiệu ứng mưa rơi
function createRainEffect() {
    const container = document.createElement('div');
    container.className = 'rain';
    for (let i = 0; i < 100; i++) {
        const drop = document.createElement('div');
        drop.className = 'drop';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.top = `${Math.random() * -20}px`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        drop.style.animationDuration = `${0.5 + Math.random() * 1.5}s`;
        container.appendChild(drop);
    }
    elements.weatherEffects.appendChild(container);
}

// Hàm này tạo hiệu ứng tuyết rơi
function createSnowEffect() {
    const container = document.createElement('div');
    container.className = 'snow';
    for (let i = 0; i < 50; i++) {
        const flake = document.createElement('div');
        flake.className = 'flake';
        flake.style.left = `${Math.random() * 100}%`;
        flake.style.top = `${Math.random() * -10}px`;
        flake.style.animationDelay = `${Math.random() * 5}s`;
        flake.style.animationDuration = `${5 + Math.random() * 10}s`;
        flake.style.opacity = Math.random().toString();
        flake.style.width = `${5 + Math.random() * 5}px`;
        flake.style.height = flake.style.width;
        container.appendChild(flake);
    }
    elements.weatherEffects.appendChild(container);
}

// Hàm chính: Đặt hiệu ứng nền dựa trên mã icon thời tiết
function setWeatherEffects(iconCode) {
    // Dọn dẹp hiệu ứng cũ
    elements.weatherEffects.innerHTML = '';
    
    // Dọn dẹp các lớp CSS nền cũ
    const bodyClasses = ['weather-bg', 'sunny-bg', 'cloudy-bg', 'rainy-bg', 'thunderstorm-bg', 'snow-bg', 'fog-bg'];
    document.body.classList.remove(...bodyClasses);
    
    let bgClass = '';
    // Lấy 2 ký tự đầu của mã icon để xác định loại thời tiết chính
    const mainCondition = iconCode.substring(0, 2);

    switch (mainCondition) {
        case '01': // Trời quang
            bgClass = 'sunny-bg';
            break;
        case '02': // Mây ít
        case '03': // Mây rải rác
        case '04': // Mây nhiều
            bgClass = 'cloudy-bg';
            break;
        case '09': // Mưa rào
        case '10': // Mưa
            bgClass = 'rainy-bg';
            createRainEffect();
            break;
        case '11': // Giông bão
            bgClass = 'thunderstorm-bg';
            createRainEffect();
            break;
        case '13': // Tuyết
            bgClass = 'snow-bg';
            createSnowEffect();
            break;
        case '50': // Sương mù
            bgClass = 'fog-bg';
            break;
        default: // Mặc định
            bgClass = 'cloudy-bg';
    }
    
    // Thêm lớp CSS nền mới vào body
    document.body.classList.add('weather-bg', bgClass);
}

// --- AUTH LOGIC (ĐÃ SỬA LỖI) ---
async function login(email, password) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        // KIỂM TRA QUAN TRỌNG: Đảm bảo server trả về đúng thứ chúng ta cần
        if (!response.ok || !data.token || !data.user) {
            throw new Error(data.message || 'Dữ liệu trả về không hợp lệ');
        }

        // Đăng nhập thành công!
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        currentUser = data.user;
        updateAuthUI();
        elements.loginModal.classList.add('hidden');
        // Sau này sẽ gọi các hàm load dashboard ở đây
        // loadAndDisplayFavorites(); // Ví dụ
    } catch (error) {
        showAuthMessage(error.message, error.message, 'error');
    }
}

async function register(name, email, password, confirmPassword) {
    if (password !== confirmPassword) {
        showAuthMessage('Passwords do not match', 'Mật khẩu không khớp', 'error');
        return;
    }
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        showAuthMessage(data.message, data.message, 'success');
        switchAuthTab('login');
        elements.loginForm.querySelector('#login-email').value = email;
    } catch (error) {
        showAuthMessage(error.message, error.message, 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // <- QUAN TRỌNG: Xóa cả token
    updateAuthUI();
    elements.dashboardSection.classList.add('hidden');
}


function updateAuthUI() {
    const isLoggedIn = !!currentUser;
    elements.loginBtn.classList.toggle('hidden', isLoggedIn); // <<< ĐÚNG: ẩn nút login KHI ĐÃ đăng nhập
    elements.userAvatar.classList.toggle('hidden', !isLoggedIn); // <<< ĐÚNG: ẩn avatar KHI CHƯA đăng nhập
    if (isLoggedIn) {
        elements.avatarInitials.textContent = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
}
function showLoginModal() { elements.loginForm.reset(); elements.registerForm.reset(); elements.authMessage.classList.add('hidden'); switchAuthTab('login'); elements.loginModal.classList.remove('hidden'); }
function switchAuthTab(tab) { const isLogin = tab === 'login'; elements.loginTab.classList.toggle('border-primary', isLogin); elements.loginTab.classList.toggle('text-primary', isLogin); elements.registerTab.classList.toggle('border-primary', !isLogin); elements.registerTab.classList.toggle('text-primary', !isLogin); elements.loginForm.classList.toggle('hidden', !isLogin); elements.registerForm.classList.toggle('hidden', isLogin); }
function toggleUserDropdown() { elements.userDropdown.classList.toggle('hidden'); }

async function handleSaveLocation() {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    if (!currentWeather) {
        alert('Vui lòng tìm kiếm một thành phố trước khi lưu.');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Phiên làm việc đã hết hạn, vui lòng đăng nhập lại.');
        logout();
        return;
    }

    try {
        const cityData = {
            city: currentWeather.city,
            country: currentWeather.country
        };

        const response = await fetch(`${BACKEND_URL}/api/users/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token // <-- GỬI TOKEN TRONG HEADER
            },
            body: JSON.stringify(cityData)
        });

        const result = await response.json();
        
        if (!response.ok) {
             // Nếu đã tồn tại thì cũng coi như là thành công
            if(response.status === 409) {
                alert(`${cityData.city} đã có trong danh sách yêu thích của bạn.`);
                updateSaveButtonState(true);
            } else {
                throw new Error(result.message || 'Lỗi khi lưu');
            }
        } else {
             alert(`Đã lưu ${cityData.city} vào danh sách yêu thích!`);
             updateSaveButtonState(true);
             // Tùy chọn: Cập nhật lại danh sách yêu thích trong currentUser
        }

    } catch (error) {
        alert(error.message);
    }
}

function updateSaveButtonState(isSaved) {
    const saveBtn = document.getElementById('save-location-btn');
    if (!saveBtn) return;
    
    // Console log để biết nó hoạt động
    console.log(`Cập nhật trạng thái nút Save: ${isSaved}`);
    
    // (Nâng cấp sau):
    // if (isSaved) {
    //   saveBtn.querySelector('i').classList.replace('far', 'fas');
    // } else {
    //   saveBtn.querySelector('i').classList.replace('fas', 'far');
    // }
}

function showAuthMessage(enText, viText, type) { elements.authMessage.textContent = currentLang === 'vi' ? viText : enText; elements.authMessage.className = `mt-4 text-sm text-center text-${type === 'success' ? 'green' : 'red'}-500`; }
// Hàm này sẽ lấy danh sách yêu thích và hiển thị
async function loadAndDisplayFavorites() {
    const container = document.querySelector('#saved-queries-container'); // Container đã có sẵn trong dashboard
    if (!container) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
        container.innerHTML = `<p>Vui lòng đăng nhập để xem.</p>`;
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/users/favorites`, {
            headers: { 'x-auth-token': token }
        });
        const favorites = await response.json();

        if (!response.ok) throw new Error(favorites.message);

        if (favorites.length === 0) {
             container.innerHTML = `<p class="text-sm text-gray-500"><span class="en">No saved cities yet.</span><span class="vi hidden">Chưa có thành phố yêu thích nào.</span></p>`;
             return;
        }

        container.innerHTML = favorites.map(fav => `
            <div class="bg-light-100 dark:bg-dark-700 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-light-200 dark:hover:bg-dark-600 saved-city-item" data-city="${fav.name},${fav.country}">
                <div class="font-medium">${fav.name}, ${fav.country}</div>
                <i class="fas fa-chevron-right text-gray-400"></i>
            </div>
        `).join('');
        
        // Thêm event listener cho các item
        document.querySelectorAll('.saved-city-item').forEach(item => {
            item.addEventListener('click', () => {
                const cityFullName = item.getAttribute('data-city');
                elements.citySearch.value = cityFullName;
                handleSearch();
                elements.dashboardSection.classList.add('hidden');
            });
        });

    } catch (error) {
        container.innerHTML = `<p class="text-red-500">${error.message}</p>`;
    }
}

function renderDashboard() {
    // Đoạn HTML này tạo ra bộ khung cho phần Dashboard
    elements.dashboardSection.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold"><span class="en">Weather Planner</span><span class="vi hidden">Kế hoạch thời tiết</span></h2>
        </div>
        <div class="bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-white/20 dark:border-dark-700/30">
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="font-medium mb-2"><span class="en">Check weather for a specific date</span><span class="vi hidden">Kiểm tra thời tiết cho ngày cụ thể</span></h3>
                        <div class="flex gap-2">
                            <input type="date" id="date-picker" class="flex-1 px-4 py-2 rounded-lg border border-light-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-light-100 dark:bg-dark-700">
                            <button id="check-date-btn" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"><span class="en">Check</span><span class="vi hidden">Kiểm tra</span></button>
                        </div>
                    </div>
                    <div id="date-analysis-result" class="hidden"></div>
                </div>
                <div class="mt-6">
                    <h3 class="font-medium mb-2"><span class="en">Your Saved Cities</span><span class="vi hidden">Thành phố đã lưu</span></h3>
                    <div id="saved-queries-container" class="space-y-2">
                        <!-- Dữ liệu thành phố yêu thích sẽ được load vào đây bởi hàm loadAndDisplayFavorites() -->
                    </div>
                </div>
            </div>
        </div>
    `;

    // Gán lại sự kiện cho các nút vừa được tạo ra
    const checkDateBtn = document.getElementById('check-date-btn');
    if (checkDateBtn) {
        checkDateBtn.addEventListener('click', analyzeDateWeather);
    }
    
    // Đặt ngày mặc định cho date-picker
    const datePicker = document.getElementById('date-picker');
    if(datePicker) {
       const tomorrow = new Date();
       tomorrow.setDate(tomorrow.getDate() + 1);
       datePicker.valueAsDate = tomorrow;
    }
    
    // Cập nhật lại ngôn ngữ hiển thị
    updateLanguageDisplay();
}

// --- KHỞI TẠO VÀ LẮNG NGHE SỰ KIỆN ---
function setupEventListeners() {
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.getLocationBtn.addEventListener('click', handleGetLocation);
    elements.citySearch.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
    elements.citySearch.addEventListener('input', debounce(handleGetCitySuggestions, 300));
    elements.languageToggle.addEventListener('click', toggleLanguage);
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.loginBtn.addEventListener('click', showLoginModal);
    elements.logoutBtn.addEventListener('click', logout);
    elements.userAvatar.addEventListener('click', toggleUserDropdown);

    elements.dashboardBtn.addEventListener('click', () => {
        const isHidden = elements.dashboardSection.classList.contains('hidden');
        if (!isHidden) {
            elements.dashboardSection.classList.add('hidden'); // Nếu đang mở thì đóng lại
        } else {
            // Nếu đang đóng thì render lại và hiển thị
            renderDashboard();         // Hàm này chưa được định nghĩa, sẽ thêm sau
            loadAndDisplayFavorites();
            elements.dashboardSection.classList.remove('hidden');
        }
    });

    elements.closeLoginModal.addEventListener('click', () => elements.loginModal.classList.add('hidden'));
    elements.loginTab.addEventListener('click', () => switchAuthTab('login'));
    elements.registerTab.addEventListener('click', () => switchAuthTab('register'));
    elements.loginForm.addEventListener('submit', (e) => { e.preventDefault(); login(elements.loginForm.querySelector('#login-email').value, elements.loginForm.querySelector('#login-password').value); });
    elements.registerForm.addEventListener('submit', (e) => { e.preventDefault(); register(elements.registerForm.querySelector('#register-name').value, elements.registerForm.querySelector('#register-email').value, elements.registerForm.querySelector('#register-password').value, elements.registerForm.querySelector('#register-confirm-password').value); });
    
    document.addEventListener('click', (e) => {
        // Lý do: Nút "Save" được tạo động sau khi gọi API,
        // nên ta phải bắt sự kiện trên document và kiểm tra mục tiêu được click.
        // dùng .closest() để dù click vào icon <i class> bên trong button vẫn hoạt động.
        if (e.target.closest('#save-location-btn')) {
            handleSaveLocation();
        }
        
        // Logic ẩn dropdown của user khi click ra ngoài
        if (elements.userAvatar && !elements.userAvatar.contains(e.target) && !elements.userDropdown.classList.contains('hidden')) {
            elements.userDropdown.classList.add('hidden');
        }
        
        // Logic ẩn gợi ý thành phố khi click ra ngoài
        if (elements.citySearch && !elements.citySearch.contains(e.target)) {
            elements.searchResults.classList.add('hidden');
        }
    });
}

function init() {
    const savedUser = localStorage.getItem('user');
    if (savedUser && savedUser !== 'undefined') { 
        try {
            currentUser = JSON.parse(savedUser);
            updateAuthUI();
        } catch (e) {
            console.error("Lỗi parse user từ localStorage:", e);
            localStorage.removeItem('user');
        }
    }
    
    // Khối if thứ hai đã bị xóa, code tiếp tục từ đây
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
    
    const savedLanguage = localStorage.getItem('language') || 'en';
    currentLang = savedLanguage;
    updateLanguageDisplay();
    
    setupEventListeners();

    const lastCity = localStorage.getItem('lastSearchedCity');
    if (lastCity) {
        elements.citySearch.value = lastCity;
        handleSearch();
    } else {
        elements.loadingSkeleton.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', init);