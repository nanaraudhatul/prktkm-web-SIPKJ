// ========================================
// RESET PASSWORD - JavaScript (FIXED)
// ========================================

let userEmail = '';
let currentOTP = '';
let timerInterval = null;
let timeLeft = 105; // 1:45 dalam detik

// ========================================
// SEND OTP
// ========================================
async function sendOTP() {
    const email = document.getElementById('resetEmail').value.trim();
    const btnSendCode = document.getElementById('btnSendCode');
    const otpSection = document.getElementById('otpSection');
    const codeSentHint = document.getElementById('codeSentHint');
    
    if (!email) {
        showMessage('Alamat email wajib diisi', 'error');
        return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage('Format email tidak valid', 'error');
        return;
    }
    
    userEmail = email;
    
    // Loading state
    btnSendCode.disabled = true;
    btnSendCode.innerHTML = 'Mengirim...';
    
    try {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SEND_OTP, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });
        
        const result = await response.json();
        console.log(' Send OTP response:', result);
        
        if (result.success) {
            // Untuk development, simpan OTP
            if (result.debug_otp) {
                currentOTP = result.debug_otp;
                console.log('🔑 OTP untuk testing:', currentOTP);
                alert('🔑 OTP untuk testing: ' + currentOTP);
            }
            
            // Tampilkan section OTP dan hint
            if (otpSection) otpSection.style.display = 'block';
            if (codeSentHint) codeSentHint.style.display = 'flex';
            
            // Focus ke input OTP pertama
            setTimeout(() => {
                const firstOtp = document.querySelector('.otp-box');
                if (firstOtp) firstOtp.focus();
            }, 300);
            
            // Start timer
            startTimer();
        } else {
            showMessage(result.message || 'Gagal mengirim kode OTP', 'error');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage('Gagal terhubung ke server', 'error');
    } finally {
        btnSendCode.disabled = false;
        btnSendCode.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Kirim Kode
        `;
    }
}

// ========================================
// OTP INPUT HANDLER
// ========================================
const otpBoxes = document.querySelectorAll('.otp-box');

otpBoxes.forEach((box, index) => {
    box.addEventListener('input', (e) => {
        const value = e.target.value;
        
        // Hanya angka
        if (!/^\d*$/.test(value)) {
            e.target.value = '';
            return;
        }
        
        // Auto focus ke box berikutnya
        if (value && index < otpBoxes.length - 1) {
            otpBoxes[index + 1].focus();
        }
        
        // Gabungkan semua OTP
        const otp = Array.from(otpBoxes).map(b => b.value).join('');
        currentOTP = otp;
    });
    
    box.addEventListener('keydown', (e) => {
        // Backspace ke box sebelumnya
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpBoxes[index - 1].focus();
        }
        
        // Arrow keys
        if (e.key === 'ArrowLeft' && index > 0) {
            otpBoxes[index - 1].focus();
        }
        if (e.key === 'ArrowRight' && index < otpBoxes.length - 1) {
            otpBoxes[index + 1].focus();
        }
    });
    
    // Paste handler
    box.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        
        pasteData.split('').forEach((char, i) => {
            if (otpBoxes[i]) {
                otpBoxes[i].value = char;
            }
        });
        
        // Focus ke box terakhir yang diisi
        const lastIndex = Math.min(pasteData.length - 1, otpBoxes.length - 1);
        otpBoxes[lastIndex].focus();
        
        // Update OTP
        currentOTP = Array.from(otpBoxes).map(b => b.value).join('');
    });
});

// ========================================
// TIMER
// ========================================
function startTimer() {
    timeLeft = 105; // 1:45
    const timerEl = document.getElementById('otpTimer');
    const resendLink = document.getElementById('resendLink');
    
    if (timerEl) timerEl.style.display = 'flex';
    if (resendLink) resendLink.style.display = 'none';
    
    if (timerInterval) clearInterval(timerInterval);
    
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (timerEl) timerEl.style.display = 'none';
            if (resendLink) resendLink.style.display = 'flex';
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timerText = document.getElementById('timerText');
    
    if (timerText) {
        timerText.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

function resendOTP() {
    if (timerInterval) clearInterval(timerInterval);
    sendOTP();
}

// ========================================
// VERIFY OTP
// ========================================
async function verifyOTP() {
    const btnVerifyReset = document.getElementById('btnVerifyReset');
    
    if (!currentOTP || currentOTP.length !== 6) {
        showMessage('Masukkan kode OTP 6 digit', 'error');
        return;
    }
    
    if (!userEmail) {
        showMessage('Email belum diisi', 'error');
        return;
    }
    
    // Loading state
    btnVerifyReset.disabled = true;
    btnVerifyReset.innerHTML = 'Memverifikasi...';
    
    try {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.VERIFY_OTP, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail,
                otp: currentOTP
            })
        });
        
        const result = await response.json();
        console.log('✅ Verify OTP response:', result);
        
        if (result.success) {
            // ✅ Redirect ke halaman set new password dengan parameter
            const redirectUrl = `set-new-password.html?email=${encodeURIComponent(userEmail)}&token=${encodeURIComponent(result.reset_token)}`;
            window.location.href = redirectUrl;
        } else {
            showMessage(result.message || 'OTP tidak valid', 'error');
            
            // Clear OTP inputs
            otpBoxes.forEach(box => {
                if (box) box.value = '';
            });
            if (otpBoxes[0]) otpBoxes[0].focus();
            currentOTP = '';
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage('Gagal terhubung ke server', 'error');
    } finally {
        btnVerifyReset.disabled = false;
        btnVerifyReset.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
            </svg>
            VERIFIKASI & ATUR ULANG KATA SANDI
        `;
    }
}

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
    console.log('🔄 Reset Password page loaded');
});