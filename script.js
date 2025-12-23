/**
 * Weather Info Application
 * Uses Open-Meteo API (Free, No API Key Required)
 */

// ==================== Constants ====================
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const DEFAULT_CITY = 'Seoul';

// ==================== DOM Elements ====================
const elements = {
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    weatherInfo: document.getElementById('weatherInfo'),
    forecastContainer: document.getElementById('forecastContainer'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.getElementById('closeSettings'),
    navSettings: document.getElementById('navSettings'),
    languageSelect: document.getElementById('languageSelect'),
    autoRefresh: document.getElementById('autoRefresh'),
    notifications: document.getElementById('notifications')
};

// ==================== WMO Weather Code Mapping ====================
const weatherCodes = {
    0: { desc: 'Clear', icon: '☀️', image: 'sunny' },
    1: { desc: 'Mainly Clear', icon: '🌤️', image: 'sunny' },
    2: { desc: 'Partly Cloudy', icon: '⛅', image: 'cloudy' },
    3: { desc: 'Overcast', icon: '☁️', image: 'overcast' },
    45: { desc: 'Fog', icon: '🌫️', image: 'fog' },
    48: { desc: 'Fog', icon: '🌫️', image: 'fog' },
    51: { desc: 'Drizzle', icon: '🌦️', image: 'drizzle' },
    53: { desc: 'Drizzle', icon: '🌦️', image: 'drizzle' },
    55: { desc: 'Drizzle', icon: '🌧️', image: 'rain' },
    61: { desc: 'Rain', icon: '🌧️', image: 'rain' },
    63: { desc: 'Rain', icon: '🌧️', image: 'rain' },
    65: { desc: 'Rain', icon: '🌧️', image: 'rain' },
    71: { desc: 'Snow', icon: '❄️', image: 'snow' },
    73: { desc: 'Snow', icon: '❄️', image: 'snow' },
    75: { desc: 'Snow', icon: '❄️', image: 'snow' },
    80: { desc: 'Rain Showers', icon: '🌦️', image: 'rain' },
    81: { desc: 'Rain Showers', icon: '🌦️', image: 'rain' },
    82: { desc: 'Rain Showers', icon: '🌧️', image: 'rain' },
    95: { desc: 'Thunderstorm', icon: '⛈️', image: 'thunderstorm' },
    96: { desc: 'Thunderstorm', icon: '⛈️', image: 'thunderstorm' },
    99: { desc: 'Thunderstorm', icon: '⛈️', image: 'thunderstorm' }
};

// ==================== Translations ====================
const translations = {
    en: {
        placeholder: 'Search for a city to see weather',
        humidity: 'Humidity',
        wind: 'Wind',
        forecastTitle: '7-Day Forecast',
        searchPlaceholder: 'Enter city name...',
        searchBtn: 'Search',
        errorNotFound: 'City not found.'
    },
    ko: {
        placeholder: '도시명을 검색하여 날씨를 확인하세요',
        humidity: '습도',
        wind: '바람',
        forecastTitle: '7일 예보',
        searchPlaceholder: '도시명을 입력하세요...',
        searchBtn: '검색',
        errorNotFound: '도시를 찾을 수 없습니다.'
    },
    ja: {
        placeholder: '都市名を入力して天気を確認',
        humidity: '湿度',
        wind: '風',
        forecastTitle: '7日間予報',
        searchPlaceholder: '都市名を入力...',
        searchBtn: '検索',
        errorNotFound: '都市が見つかりません。'
    },
    zh: {
        placeholder: '输入城市名称查看天气',
        humidity: '湿度',
        wind: '风',
        forecastTitle: '7天预报',
        searchPlaceholder: '输入城市名称...',
        searchBtn: '搜索',
        errorNotFound: '未找到城市。'
    }
};

// Language code mapping for date formatting
const langDateCodes = {
    en: 'en-US',
    ko: 'ko-KR',
    ja: 'ja-JP',
    zh: 'zh-CN'
};

// ==================== Settings State ====================
let settings = {
    theme: 'light',
    language: 'en',
    unit: 'celsius',
    autoRefresh: true,
    notifications: false
};

// ==================== Settings Management ====================
function loadSettings() {
    const saved = localStorage.getItem('weatherSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
    applySettings();
}

function saveSettings() {
    localStorage.setItem('weatherSettings', JSON.stringify(settings));
}

function applySettings() {
    // Apply theme
    document.body.classList.toggle('dark-mode', settings.theme === 'dark');
    
    // Update theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === settings.theme);
    });
    
    // Update unit buttons
    document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.unit === settings.unit);
    });
    
    // Update form controls
    elements.languageSelect.value = settings.language;
    elements.autoRefresh.checked = settings.autoRefresh;
    elements.notifications.checked = settings.notifications;
    
    // Apply language
    applyLanguage();
}

function applyLanguage() {
    const t = translations[settings.language];
    
    document.querySelector('.placeholder').textContent = t.placeholder;
    document.querySelector('#forecast h2').textContent = t.forecastTitle;
    elements.cityInput.placeholder = t.searchPlaceholder;
    elements.searchBtn.textContent = t.searchBtn;
    
    // Update weather details if displayed
    const humiditySpan = elements.weatherInfo.querySelector('.detail-item span:first-child');
    const windSpan = elements.weatherInfo.querySelector('.detail-item span:last-child');
    if (humiditySpan) humiditySpan.textContent = t.humidity;
    if (windSpan) windSpan.textContent = t.wind;
}

// ==================== Temperature Conversion ====================
function convertTemp(celsius) {
    const temp = settings.unit === 'fahrenheit' 
        ? Math.round(celsius * 9/5 + 32)
        : Math.round(celsius);
    return `${temp}${settings.unit === 'fahrenheit' ? '°F' : '°C'}`;
}

// ==================== Background Image ====================
function setBackgroundImage(weatherCode) {
    const weather = weatherCodes[weatherCode] || { image: 'sunny' };
    const imageUrl = `https://picsum.photos/1920/1080?random=${Date.now()}`;
    document.body.style.backgroundImage = `url(${imageUrl})`;
}

// ==================== Weather Display ====================
function displayCurrentWeather(current, cityName, country) {
    const code = current.weather_code;
    const weather = weatherCodes[code] || { desc: 'Unknown', icon: '🌤️' };
    
    // Set background image based on weather
    setBackgroundImage(code);
    
    const t = translations[settings.language];

    elements.weatherInfo.innerHTML = `
        <div class="city">${cityName}, ${country}</div>
        <div class="temperature">${convertTemp(current.temperature_2m)}</div>
        <div class="description">${weather.icon} ${weather.desc}</div>
        <div class="details">
            <div class="detail-item">
                <span>${t.humidity}</span>
                <strong>${current.relative_humidity_2m}%</strong>
            </div>
            <div class="detail-item">
                <span>${t.wind}</span>
                <strong>${current.wind_speed_10m} m/s</strong>
            </div>
        </div>
    `;
}

function displayForecast(daily) {
    const langCode = langDateCodes[settings.language];
    
    elements.forecastContainer.innerHTML = daily.time.map((date, index) => {
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString(langCode, { weekday: 'short' });
        const monthDay = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
        const weather = weatherCodes[daily.weather_code[index]] || { icon: '🌤️' };
        
        return `
            <div class="forecast-item">
                <div class="date">${dayName}<br>${monthDay}</div>
                <div class="icon">${weather.icon}</div>
                <div class="temp">${convertTemp(daily.temperature_2m_max[index])}</div>
            </div>
        `;
    }).join('');
}

// ==================== API Calls ====================
async function getWeather(city) {
    try {
        const geoResponse = await fetch(
            `${GEO_URL}?name=${city}&count=1&language=${settings.language}&format=json`
        );

        if (!geoResponse.ok) {
            throw new Error(translations[settings.language].errorNotFound);
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(translations[settings.language].errorNotFound);
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        const weatherResponse = await fetch(
            `${BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&lang=${settings.language}`
        );

        const weatherData = await weatherResponse.json();
        displayCurrentWeather(weatherData.current, name, country);
        displayForecast(weatherData.daily);

        // Send notification if enabled
        if (settings.notifications && Notification.permission === 'granted') {
            const weather = weatherCodes[weatherData.current.weather_code] || {};
            new Notification(`Weather in ${name}`, {
                body: `${convertTemp(weatherData.current.temperature_2m)} - ${weather.desc || ''}`,
                icon: '🌤️'
            });
        }

    } catch (error) {
        elements.weatherInfo.innerHTML = `<p class="placeholder">${error.message}</p>`;
        elements.forecastContainer.innerHTML = '';
    }
}

// ==================== Event Listeners ====================
function initEventListeners() {
    // Search button
    elements.searchBtn.addEventListener('click', () => {
        const city = elements.cityInput.value.trim();
        if (city) getWeather(city);
    });

    // Enter key
    elements.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = elements.cityInput.value.trim();
            if (city) getWeather(city);
        }
    });

    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            settings.theme = btn.dataset.theme;
            saveSettings();
            applySettings();
        });
    });

    // Unit buttons
    document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            settings.unit = btn.dataset.unit;
            saveSettings();
            // Refresh weather if data exists
            if (elements.weatherInfo.querySelector('.city')) {
                getWeather(elements.cityInput.value.trim() || DEFAULT_CITY);
            }
        });
    });

    // Language select
    elements.languageSelect.addEventListener('change', (e) => {
        settings.language = e.target.value;
        saveSettings();
        applyLanguage();
        // Refresh weather if data exists
        if (elements.weatherInfo.querySelector('.city')) {
            getWeather(elements.cityInput.value.trim() || DEFAULT_CITY);
        }
    });

    // Auto refresh toggle
    elements.autoRefresh.addEventListener('change', (e) => {
        settings.autoRefresh = e.target.checked;
        saveSettings();
    });

    // Notifications toggle
    elements.notifications.addEventListener('change', (e) => {
        settings.notifications = e.target.checked;
        saveSettings();
        
        if (settings.notifications) {
            Notification.requestPermission();
        }
    });

    // Settings modal
    elements.navSettings.addEventListener('click', (e) => {
        e.preventDefault();
        elements.settingsModal.classList.add('show');
    });

    elements.closeSettings.addEventListener('click', () => {
        elements.settingsModal.classList.remove('show');
    });

    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            elements.settingsModal.classList.remove('show');
        }
    });
}

// ==================== Initialization ====================
function init() {
    loadSettings();
    initEventListeners();
    getWeather(DEFAULT_CITY);
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
