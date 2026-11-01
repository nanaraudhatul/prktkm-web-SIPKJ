// Auto-detect environment dan set base URL
function getBaseUrl() {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const pathname = window.location.pathname;
    
    // XAMPP (port 80 atau tanpa port)
    if ((port === '80' || port === '') && pathname.includes('/sipkj/')) {
        return 'http://localhost/sipkj/backend/api';
    }
    
    // PHP Built-in Server (port 8000)
    if (port === '8000') {
        return 'http://localhost:8000/backend/api';
    }
    
    // Node.js Server (port 3000)
    if (port === '3000') {
        return 'http://localhost:3000/backend/api';
    }
    
    // Live Server (port 5500) - untuk development
    if (port === '5500') {
        return 'http://localhost/sipkj/backend/api';
    }
    
    // Default
    return 'http://localhost/sipkj/backend/api';
}

const API_CONFIG = {
    BASE_URL: getBaseUrl(),
    ENDPOINTS: {
        LOGIN: '/auth/login.php',
        REGISTER: '/auth/register.php',
        FORGOT_PASSWORD: '/auth/forgot-password.php',
        RESET_PASSWORD: '/auth/reset-password.php',
        SEND_OTP: '/auth/send-otp.php',           // ← TAMBAHKAN
        VERIFY_OTP: '/auth/verify-otp.php',  
        CREATE_PENGADUAN: '/pengaduan/create.php',       // ← Endpoint untuk buat pengaduan
        LIST_PENGADUAN: '/pengaduan/list.php',           // ← Endpoint untuk lihat daftar pengaduan
        DETAIL_PENGADUAN: '/pengaduan/detail.php',       // ← Endpoint untuk lihat detail
        GET_PROFILE: '/user/profile.php',
        UPDATE_STATUS: '/pengaduan/update-status.php',
        UPDATE_PROFILE: '/user/update-profile.php',
        CHANGE_PASSWORD: '/user/change-password.php'
    }
};

const STORAGE_KEYS = {
    TOKEN: 'sipkj_token',
    USER_DATA: 'sipkj_user',
    USER_ROLE: 'sipkj_role'
};

console.log('SIPKJ API Base URL:', API_CONFIG.BASE_URL);