// ========================================
// KONFIGURASI API - PANDUAN UNTUK SHARE KE TEMAN
// ========================================

// 1. Cara mencari IP Komputer Host (Yang menjalankan XAMPP):
//    - Windows: Buka CMD, ketik "ipconfig", cari "IPv4 Address" (contoh: 192.168.1.38)
//    - Mac/Linux: Buka Terminal, ketik "ifconfig" atau "ip a"
// 2. Ganti nilai di bawah ini dengan IP tersebut.
// 3. Pastikan Windows Firewall mengizinkan Apache (XAMPP) untuk jaringan Private/Public.

const HOST_IP = '192.168.1.38'; // ⚠️ GANTI INI DENGAN IP KOMPUTER KAMU

const API_CONFIG = {
    // Gunakan ini jika teman satu jaringan Wi-Fi (Local Network)
    BASE_URL: `http://${HOST_IP}/sipkj/backend`,
    
    // ATAU, jika teman beda jaringan (gunakan Ngrok/Cloudflare Tunnel):
    // BASE_URL: 'https://xxxx-xx-xx-xx-xx.ngrok-free.app/sipkj/backend',

    ENDPOINTS: {
        // Auth
        LOGIN: '/api/auth/login.php',
        REGISTER: '/api/auth/register.php',
        LOGOUT: '/api/auth/logout.php',
        PROFILE: '/api/auth/profile.php',
        
        // Pengaduan (Masyarakat)
        PENGAUDAN_LIST: '/api/pengaduan/list.php',
        PENGAUDAN_DETAIL: '/api/pengaduan/detail.php',
        PENGAUDAN_CREATE: '/api/pengaduan/create.php',
        
        // Admin
        ADMIN_STATS: '/api/admin/dashboard-stats.php',
        ADMIN_USERS: '/api/admin/user-list.php',
        ADMIN_USER_SAVE: '/api/admin/user-save.php',
        ADMIN_USER_DELETE: '/api/admin/user-delete.php',
        ADMIN_VERIFIKASI: '/api/admin/verifikasi-pengaduan.php',
        ADMIN_LAPORAN: '/api/admin/laporan-stats.php'
    }
};

// Export agar bisa dipakai di file lain (jika menggunakan module)
// Atau biarkan global seperti ini untuk script tag biasa.

// ========================================
// AUTH.JS - Login & Register Handler (Satu Pintu)
// ========================================

// ========================================
// TOGGLE PASSWORD VISIBILITY
// ========================================
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const iconSvg = btn.querySelector('.eye-icon');
    
    if (!input || !iconSvg) return;

    if (input.type === 'password') {
        input.type = 'text';
        // Icon mata dicoret (terlihat)
        iconSvg.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        `;
    } else {
        input.type = 'password';
        // Icon mata normal (tersembunyi)
        iconSvg.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        `;
    }
}

// ========================================
// LOGIN FORM HANDLER
// ========================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('loginBtn');
        const errorMsg = document.getElementById('errorMessage');
        
        if (!btn) {
            console.error('Tombol login tidak ditemukan!');
            return;
        }
        
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Memproses...';
        btn.disabled = true;

        // Hide error message
        if (errorMsg) {
            errorMsg.style.display = 'none';
            errorMsg.textContent = '';
        }

        const emailOrUsername = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        console.log('🔐 Login attempt:', { emailOrUsername });

        try {
            const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: emailOrUsername, // Backend akan mendeteksi ini sebagai email atau username
                    password: password
                })
            });

            const result = await response.json();
            console.log('📡 Login response:', result);

            if (response.ok && result.success) {
                const user = result.data;
                // Ambil role, default ke 'masyarakat' jika tidak ada
                const role = user.role ? user.role.toLowerCase() : 'masyarakat';

                // Simpan ke localStorage
                localStorage.setItem('sipkj_token', result.token);
                localStorage.setItem('sipkj_user', JSON.stringify(user));
                localStorage.setItem('sipkj_role', role);

                console.log('💾 Saved to localStorage. Role:', role);

                // 🚀 REDIRECT OTOMATIS BERDASARKAN ROLE
                if (role === 'admin') {
                    console.log('🚀 Redirecting to ADMIN dashboard...');
                    window.location.href = '../admin/dashboard.html';
                } else {
                    console.log('🚀 Redirecting to MASYARAKAT dashboard...');
                    window.location.href = '../masyarakat/dashboard.html';
                }
            } else {
                throw new Error(result.message || 'Username/Email atau kata sandi salah');
            }
            
        } catch (error) {
            console.error('❌ Login error:', error);
            
            if (errorMsg) {
                errorMsg.textContent = error.message;
                errorMsg.style.display = 'flex';
            } else {
                alert('❌ Login gagal: ' + error.message);
            }
            
            // Reset button
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// ========================================
// REGISTER FORM HANDLER
// ========================================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('registerBtn');
        if (!btn) return;
        
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Memproses...';
        btn.disabled = true;

        const password = document.getElementById('regPassword')?.value || '';
        const confirmPassword = document.getElementById('regPasswordConfirm')?.value || '';
        
        if (password !== confirmPassword) {
            alert('❌ Kata sandi tidak cocok!');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        if (password.length < 6) {
            alert('❌ Kata sandi minimal 6 karakter!');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        const agreeTerms = document.getElementById('agreeTerms');
        if (agreeTerms && !agreeTerms.checked) {
            alert('❌ Anda harus menyetujui Syarat dan Ketentuan!');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        const activeRole = document.querySelector('.role-option.active');
        const role = activeRole ? activeRole.dataset.role : 'masyarakat';

        const formData = {
            email: document.getElementById('regEmail').value.trim(),
            username: document.getElementById('regUsername').value.trim(),
            telepon: document.getElementById('regTelepon')?.value.trim() || '',
            password: password,
            role: role
        };

        try {
            const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.REGISTER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert('✅ ' + (result.message || 'Pendaftaran berhasil! Silakan login.'));
                window.location.href = 'login.html';
            } else {
                throw new Error(result.message || 'Pendaftaran gagal');
            }
        } catch (error) {
            console.error('❌ Register error:', error);
            alert('❌ Pendaftaran gagal: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// ========================================
// ROLE SELECTOR (Untuk Halaman Register)
// ========================================
function selectRole(el) {
    document.querySelectorAll('.role-option').forEach(r => r.classList.remove('active'));
    el.classList.add('active');
}