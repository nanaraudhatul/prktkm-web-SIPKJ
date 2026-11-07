// ========================================
// AUTH.JS - Login, Register & Toggle Password
// ========================================

// ========================================
// 1. TOGGLE PASSWORD VISIBILITY (FITUR MATA)
// ========================================
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const iconSvg = btn.querySelector('.eye-icon');
    
    if (!input || !iconSvg) return;

    if (input.type === 'password') {
        input.type = 'text'; // Tampilkan password
        iconSvg.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        `;
        btn.setAttribute('title', 'Sembunyikan kata sandi');
    } else {
        input.type = 'password'; // Sembunyikan password
        iconSvg.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        `;
        btn.setAttribute('title', 'Lihat kata sandi');
    }
}

// ========================================
// 2. HELPER FUNCTIONS FOR MESSAGES (BARU)
// ========================================
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (successDiv) successDiv.classList.remove('show');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 5000);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    const errorDiv = document.getElementById('errorMessage');
    
    if (errorDiv) errorDiv.classList.remove('show');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.classList.add('show');
    }
}

// ========================================
// 3. LOGIN FORM HANDLER
// ========================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('loginBtn');
        const errorMsg = document.getElementById('errorMessage');
        
        if (!btn) {
            console.error('❌ Tombol login tidak ditemukan!');
            return;
        }
        
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Memproses...';
        btn.disabled = true;

        if (errorMsg) {
            errorMsg.style.display = 'none';
            errorMsg.textContent = '';
        }

        const emailOrUsername = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        const targetUrl = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.LOGIN;
        console.log('🔐 Login attempt:', { emailOrUsername });
        console.log('🌐 Mengirim request ke URL:', targetUrl);

        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: emailOrUsername,
                    password: password
                })
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server tidak merespon dengan JSON. Pastikan XAMPP Apache sudah START dan URL benar.");
            }

            const result = await response.json();
            console.log('📡 Login response:', result);

            if (response.ok && result.success) {
                const user = result.data;
                const role = user.role ? user.role.toLowerCase().trim() : 'masyarakat';

                localStorage.setItem('sipkj_token', result.token);
                localStorage.setItem('sipkj_user', JSON.stringify(user));
                localStorage.setItem('sipkj_role', role);

                console.log('🔍 Nilai role sebelum redirect: |' + role + '|');

                if (role === 'admin') {
                    console.log('🚀 Redirecting to ADMIN dashboard...');
                    window.location.href = '../admin/dashboard.html';
                } else if (role === 'petugas') {
                    console.log('🚀 Redirecting to PETUGAS dashboard...');
                    window.location.href = '../petugas/dashboard.html';
                } else {
                    console.log('🚀 Redirecting to MASYARAKAT dashboard...');
                    window.location.href = '../masyarakat/dashboard.html';
                }
            } else {
                throw new Error(result.message || 'Username/Email atau kata sandi salah');
            }
            
        } catch (error) {
            console.error('❌ Login error:', error);
            
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = "Gagal terhubung ke server. Pastikan: 1) XAMPP Apache sudah START (Hijau), 2) Nama folder 'sipkj' benar.";
            }

            if (errorMsg) {
                errorMsg.textContent = errorMessage;
                errorMsg.style.display = 'flex';
            } else {
                alert('❌ Login gagal: ' + errorMessage);
            }
            
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// ========================================
// 4. REGISTER FORM HANDLER (DIPERBARUI SESUAI HTML BARU)
// ========================================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('registerBtn');
        if (!btn) return;
        
        const originalText = btn.textContent;
        btn.textContent = 'MEMPROSES...';
        btn.disabled = true;

        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regPasswordConfirm').value;

        // Validasi Password
        if (password !== confirmPassword) {
            showError('Kata sandi konfirmasi tidak cocok!');
            btn.textContent = originalText;
            btn.disabled = false;
            return;
        }

        if (password.length < 8) {
            showError('Kata sandi minimal 8 karakter!');
            btn.textContent = originalText;
            btn.disabled = false;
            return;
        }

        if (!document.getElementById('agreeTerms').checked) {
            showError('Anda harus menyetujui Syarat dan Ketentuan!');
            btn.textContent = originalText;
            btn.disabled = false;
            return;
        }

        // Data Form (Role di-hardcode menjadi 'masyarakat')
        const formData = {
            email: document.getElementById('regEmail').value.trim(),
            username: document.getElementById('regUsername').value.trim(),
            telepon: document.getElementById('regTelepon').value.trim(),
            password: password,
            role: 'masyarakat'
        };

        const targetUrl = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.REGISTER;
        console.log('🌐 Register URL:', targetUrl);
        console.log('📦 Data yang dikirim:', formData);

        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error('Server response (bukan JSON):', text);
                throw new Error('Server mengembalikan HTML error. Cek console untuk detail.');
            }

            console.log('📡 Register response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Pendaftaran gagal');
            }

            showSuccess(data.message || 'Pendaftaran berhasil! Mengalihkan ke halaman login...');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            
        } catch (error) {
            console.error('❌ Register error:', error);
            
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = "Gagal terhubung ke server. Pastikan XAMPP Apache sudah START (Hijau).";
            }
            
            showError(errorMessage);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}