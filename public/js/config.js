// ========================================
// KONFIGURASI API (KHUSUS XAMPP PORT 80)
// ========================================

const API_CONFIG = {
    // URL dipaksa langsung ke localhost port 80 (default) dengan folder sipkj
    BASE_URL: 'http://localhost/sipkj/backend/api',
    
    ENDPOINTS: {
        // --- AUTH ---
        LOGIN: '/auth/login.php',
        REGISTER: '/auth/register.php',
        FORGOT_PASSWORD: '/auth/forgot-password.php',
        RESET_PASSWORD: '/auth/reset-password.php',
        SEND_OTP: '/auth/send-otp.php',
        VERIFY_OTP: '/auth/verify-otp.php',
        LOGOUT: '/auth/logout.php',
        
        // --- PENGADUAN ---
        CREATE_PENGADUAN: '/pengaduan/create.php',
        LIST_PENGADUAN: '/pengaduan/list.php',
        DETAIL_PENGADUAN: '/pengaduan/detail.php',
        UPDATE_STATUS: '/pengaduan/update-status.php',
        
        // --- USER / PROFILE ---
        GET_PROFILE: '/user/profile.php',
        UPDATE_PROFILE: '/user/update-profile.php',
        CHANGE_PASSWORD: '/user/change-password.php',
        
        // --- ADMIN ---
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

// Debug log untuk memastikan konfigurasi terbaca
console.log('✅ SIPKJ Config Loaded');
console.log('🌐 API Base URL:', API_CONFIG.BASE_URL);