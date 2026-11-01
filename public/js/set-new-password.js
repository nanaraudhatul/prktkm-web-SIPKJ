// ========================================
// SET NEW PASSWORD - JavaScript
// ========================================

// Ambil parameter dari URL
const urlParams = new URLSearchParams(window.location.search);
const userEmail = urlParams.get('email');
const resetToken = urlParams.get('token');

// Validasi parameter
if (!userEmail || !resetToken) {
    alert('Link tidak valid. Silakan ulangi proses reset password.');
    window.location.href = 'reset-password.html';
}

// ========================================
// TOGGLE PASSWORD VISIBILITY
// ========================================
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const iconSvg = btn.querySelector('.eye-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        iconSvg.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        `;
    } else {
        input.type = 'password';
        iconSvg.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        `;
    }
}

// ========================================
// PASSWORD STRENGTH CHECKER
// ========================================
document.getElementById('newPassword').addEventListener('input', function() {
    const password = this.value;
    const segments = [
        document.getElementById('seg1'),
        document.getElementById('seg2'),
        document.getElementById('seg3'),
        document.getElementById('seg4')
    ];
    const strengthText = document.getElementById('strengthText');
    
    // Reset
    segments.forEach(seg => {
        seg.className = 'strength-segment';
    });
    
    if (password.length === 0) {
        strengthText.textContent = 'Belum Diisi';
        strengthText.className = 'strength-text';
        checkPasswordMatch();
        return;
    }
    
    // Hitung kekuatan
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    // Update UI
    let level = '';
    let activeSegments = 0;
    
    if (strength <= 1) {
        level = 'weak';
        activeSegments = 1;
        strengthText.textContent = 'Lemah';
    } else if (strength <= 2) {
        level = 'weak';
        activeSegments = 2;
        strengthText.textContent = 'Lemah';
    } else if (strength <= 3) {
        level = 'medium';
        activeSegments = 3;
        strengthText.textContent = 'Sedang';
    } else {
        level = 'strong';
        activeSegments = 4;
        strengthText.textContent = 'Kuat';
    }
    
    strengthText.className = 'strength-text ' + level;
    
    for (let i = 0; i < activeSegments; i++) {
        segments[i].classList.add(level);
    }
    
    checkPasswordMatch();
});

// ========================================
// PASSWORD MATCH CHECKER
// ========================================
function checkPasswordMatch() {
    const password = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    const hint = document.getElementById('matchHint');
    
    if (confirm.length === 0) {
        hint.textContent = '';
        hint.className = 'match-hint';
        return;
    }
    
    if (password === confirm) {
        hint.textContent = '✓ Kata sandi cocok';
        hint.className = 'match-hint match';
    } else {
        hint.textContent = '✗ Kata sandi tidak cocok';
        hint.className = 'match-hint not-match';
    }
}

document.getElementById('confirmPassword').addEventListener('input', checkPasswordMatch);

// ========================================
// FORM SUBMIT
// ========================================
document.getElementById('setPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const btnSave = document.getElementById('btnSavePassword');
    
    if (newPassword.length < 8) {
        showMessage('Kata sandi minimal 8 karakter', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('Kata sandi tidak cocok', 'error');
        return;
    }
    
    // Loading state
    btnSave.disabled = true;
    btnSave.innerHTML = 'Memproses...';
    
    try {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.RESET_PASSWORD, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail,
                token: resetToken,
                new_password: newPassword
            })
        });
        
        const result = await response.json();
        console.log('✅ Reset password response:', result);
        
        if (result.success) {
            showMessage(result.message || 'Kata sandi berhasil diatur ulang!', 'success');
            
            // Redirect ke login setelah 2 detik
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(result.message || 'Gagal mengatur ulang kata sandi', 'error');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage('Gagal terhubung ke server', 'error');
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            SIMPAN KATA SANDI BARU
        `;
    }
});

// ========================================
// SHOW MESSAGE
// ========================================
function showMessage(message, type) {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;
    
    messageBox.textContent = message;
    messageBox.className = 'message-box show ' + type;
    messageBox.style.display = 'flex';
    
    setTimeout(() => {
        messageBox.classList.remove('show');
        messageBox.style.display = 'none';
    }, 5000);
}

// ========================================
// INIT
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 Set New Password page loaded');
    console.log(' Email:', userEmail);
    console.log(' Token:', resetToken);
});