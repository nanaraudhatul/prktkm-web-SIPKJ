// ========================================
// AUTH.JS - Login, Register & Toggle Password
// ========================================

// ========================================
// 1. TOGGLE PASSWORD VISIBILITY (FITUR MATA)
// ========================================
function togglePasswordVisibility(inputId, btn) {
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
// 2. LOGIN FORM HANDLER
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

        // 🔍 DEBUG: Lihat URL apa yang sebenarnya dipanggil
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

            // Cek jika response bukan JSON (misal error 404 HTML dari Apache)
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server tidak merespon dengan JSON. Pastikan XAMPP Apache sudah START dan URL benar.");
            }

            const result = await response.json();
            console.log('📡 Login response:', result);

            if (response.ok && result.success) {
                const user = result.data;
                const role = user.role ? user.role.toLowerCase() : 'masyarakat';

                localStorage.setItem('sipkj_token', result.token);
                localStorage.setItem('sipkj_user', JSON.stringify(user));
                localStorage.setItem('sipkj_role', role);

                console.log('💾 Saved to localStorage. Role:', role);

                if (role === 'admin') {
                    window.location.href = '../admin/dashboard.html';
                } else {
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
// 3. REGISTER FORM HANDLER
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
            alert('❌ Kata sandi konfirmasi tidak cocok!');
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

        const targetUrl = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.REGISTER;
        console.log('🌐 Register URL:', targetUrl);

        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server tidak merespon dengan JSON. Pastikan XAMPP Apache sudah START.");
            }

            const result = await response.json();

            if (response.ok && result.success) {
                alert('✅ ' + (result.message || 'Pendaftaran berhasil! Silakan login.'));
                window.location.href = 'login.html';
            } else {
                throw new Error(result.message || 'Pendaftaran gagal');
            }
        } catch (error) {
            console.error('❌ Register error:', error);
            
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch')) {
                errorMessage = "Gagal terhubung ke server. Pastikan XAMPP Apache sudah START (Hijau).";
            }
            
            alert('❌ Pendaftaran gagal: ' + errorMessage);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// ========================================
// 4. ROLE SELECTOR (Untuk Halaman Register)
// ========================================
function selectRole(el) {
    document.querySelectorAll('.role-option').forEach(r => r.classList.remove('active'));
    el.classList.add('active');
}