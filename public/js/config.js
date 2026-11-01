// ========================================
// KONFIGURASI API & ENVIRONMENT DETECTION
// ========================================

// Auto-detect environment dan set base URL secara dinamis
function getBaseUrl() {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const pathname = window.location.pathname;
    
    // 1. XAMPP / WAMP (port 80 atau tanpa port, path mengandung /sipkj/)
    if ((port === '80' || port === '') && pathname.includes('/sipkj/')) {
        return 'http://localhost/sipkj/backend/api';
    }
    
    // 2. PHP Built-in Server (port 8000)
    if (port === '8000') {
        return 'http://localhost:8000/backend/api';
    }
    
    // 3. Node.js / Express Server (port 3000)
    if (port === '3000') {
        return 'http://localhost:3000/backend/api';
    }
    
    // 4. VS Code Live Server (port 5500) - untuk development frontend saja
    if (port === '5500') {
        // Asumsi folder proyek bernama sipkj di localhost
        return 'http://localhost/sipkj/backend/api'; 
    }
    
    // 5. Default fallback (jika diakses via IP jaringan, misal: 192.168.1.38)
    return `http://${hostname}${port ? ':' + port : ''}/sipkj/backend/api`;
}

// Konfigurasi Utama API
const API_CONFIG = {
    BASE_URL: getBaseUrl(),
    ENDPOINTS: {
        // Auth
        LOGIN: '/auth/login.php',
        REGISTER: '/auth/register.php',
        FORGOT_PASSWORD: '/auth/forgot-password.php',
        RESET_PASSWORD: '/auth/reset-password.php',
        SEND_OTP: '/auth/send-otp.php',
        VERIFY_OTP: '/auth/verify-otp.php',
        LOGOUT: '/auth/logout.php',
        
        // Pengaduan (Masyarakat & Admin)
        CREATE_PENGADUAN: '/pengaduan/create.php',
        LIST_PENGADUAN: '/pengaduan/list.php',
        DETAIL_PENGADUAN: '/pengaduan/detail.php',
        UPDATE_STATUS: '/pengaduan/update-status.php',
        
        // User / Profile
        GET_PROFILE: '/user/profile.php',
        UPDATE_PROFILE: '/user/update-profile.php',
        CHANGE_PASSWORD: '/user/change-password.php',
        
        // Admin Khusus (Opsional, jika dipisah foldernya)
        ADMIN_STATS: '/admin/dashboard-stats.php',
        ADMIN_USERS: '/admin/user-list.php',
        ADMIN_USER_SAVE: '/admin/user-save.php',
        ADMIN_USER_DELETE: '/admin/user-delete.php',
        ADMIN_VERIFIKASI: '/admin/verifikasi-pengaduan.php',
        ADMIN_LAPORAN: '/admin/laporan-stats.php'
    }
};

// Centralized Storage Keys (Mencegah typo di localStorage)
const STORAGE_KEYS = {
    TOKEN: 'sipkj_token',
    USER_DATA: 'sipkj_user',
    USER_ROLE: 'sipkj_role'
};

// Debug log untuk memastikan konfigurasi terbaca dengan benar
console.log('✅ SIPKJ Config Loaded');
console.log('🌐 API Base URL:', API_CONFIG.BASE_URL);