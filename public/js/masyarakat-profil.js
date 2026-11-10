// ========================================
// PROFIL.JS - LENGKAP & ANTI-STUCK
// ========================================

// Protect page - cek login
if (typeof Auth !== 'undefined' && Auth.protectPage) {
    Auth.protectPage();
}

// ========================================
// SIDEBAR TOGGLE - DESKTOP & MOBILE
// ========================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const overlay = document.getElementById('sidebarOverlay');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mode mobile: gunakan class 'open'
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
    } else {
        // Mode desktop: gunakan class 'closed'
        sidebar.classList.toggle('closed');
        if (mainContent) mainContent.classList.toggle('expanded');
    }
}

// Tutup sidebar ketika klik di luar (mobile)
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const overlay = document.getElementById('sidebarOverlay');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile && sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('show');
        }
    }
});

let currentUser = null;

// 🚀 FALLBACK: Update topbar INSTAN dari localStorage
function updateTopbarFromStorage() {
    const userDataStr = localStorage.getItem('sipkj_user');
    if (userDataStr) {
        try {
            const user = JSON.parse(userDataStr);
            
            const topbarName = document.querySelector('.user-profile .user-name');
            const topbarRole = document.querySelector('.user-profile .user-role');

            if (topbarName) topbarName.textContent = user.username || 'User';
            if (topbarRole) topbarRole.textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Masyarakat';
            
            console.log('✅ Topbar updated instantly from localStorage');
        } catch (e) {
            console.error('❌ Error parsing localStorage user:', e);
        }
    }
}

// Load profile dari database
async function loadProfile() {
    console.log('🔄 Memuat profil dari API...');
    updateTopbarFromStorage();

    try {
        if (typeof API === 'undefined' || typeof API_CONFIG === 'undefined') {
            throw new Error('API atau API_CONFIG belum dimuat.');
        }

        const response = await API.get(API_CONFIG.ENDPOINTS.GET_PROFILE);
        console.log('✅ Response dari API:', response);
        
        if (response && response.success && response.data) {
            currentUser = response.data;
            console.log('👤 Data user terbaru:', currentUser);
            updateAllUI();
        } else {
            console.error('❌ Response API tidak valid:', response);
            showError('Gagal memuat data profil dari server.');
        }
    } catch (error) {
        console.error('❌ Error load profile:', error);
        showError('Tidak dapat terhubung ke server.');
    }
}

// Update semua UI dengan data user
function updateAllUI() {
    if (!currentUser) {
        console.error('❌ currentUser is null');
        return;
    }
    
    // 1. UPDATE TOPBAR
    const topbarName = document.querySelector('.user-profile .user-name');
    const topbarRole = document.querySelector('.user-profile .user-role');
    
    if (topbarName) topbarName.textContent = currentUser.username || 'User';
    if (topbarRole) topbarRole.textContent = currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Masyarakat';
    
    // 2. UPDATE VIEW PROFILE
    const profileName = document.getElementById('profileName');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const profileRole = document.getElementById('profileRole');
    const profileInitials = document.getElementById('profileInitials');
    
    if (profileName) profileName.textContent = currentUser.username || 'User';
    if (profileUsername) profileUsername.textContent = '@' + (currentUser.username || 'username');
    if (profileEmail) profileEmail.textContent = currentUser.email || '-';
    if (profilePhone) profilePhone.textContent = currentUser.telepon || 'Belum diisi';
    if (profileRole) profileRole.textContent = currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Masyarakat';
    
    if (profileInitials) {
        const initials = (currentUser.username || 'U').substring(0, 2).toUpperCase();
        profileInitials.textContent = initials;
    }
    
    // 3. UPDATE EDIT PROFILE HEADER
    const editDisplayName = document.getElementById('editDisplayName');
    const editDisplayUsername = document.getElementById('editDisplayUsername');
    const editInitials = document.getElementById('editInitials');
    const editRoleBadge = document.getElementById('editRoleBadge');
    
    if (editDisplayName) editDisplayName.textContent = currentUser.username || 'User';
    if (editDisplayUsername) editDisplayUsername.textContent = '@' + (currentUser.username || 'username');
    
    if (editInitials) {
        const initials = (currentUser.username || 'U').substring(0, 1).toUpperCase();
        editInitials.textContent = initials;
    }
    
    if (editRoleBadge) {
        editRoleBadge.textContent = (currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Masyarakat') + ' Pelapor';
    }
    
    // 4. UPDATE FORM FIELDS
    const editUsername = document.getElementById('editUsername');
    const editEmail = document.getElementById('editEmail');
    const editTelepon = document.getElementById('editTelepon');
    
    if (editUsername) editUsername.value = currentUser.username || '';
    if (editEmail) editEmail.value = currentUser.email || '';
    if (editTelepon) editTelepon.value = currentUser.telepon || '';
    
    // Update localStorage
    if (typeof API !== 'undefined') API.setUserData(currentUser);
    if (typeof Auth !== 'undefined') Auth.setUserRole(currentUser.role);
    
    console.log('✅ UI updated successfully');
}

function showError(message) {
    const profileName = document.getElementById('profileName');
    if (profileName) profileName.textContent = 'Error';
    
    const profileEmail = document.getElementById('profileEmail');
    if (profileEmail) profileEmail.textContent = message;
}

// Switch view
function showEditProfile() {
    const viewProfile = document.getElementById('viewProfile');
    const editProfile = document.getElementById('editProfile');
    const editMessage = document.getElementById('editMessage');
    
    if (viewProfile) viewProfile.style.display = 'none';
    if (editProfile) editProfile.style.display = 'block';
    if (editMessage) {
        editMessage.classList.remove('show', 'success', 'error');
        editMessage.style.display = 'none';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showViewProfile() {
    const viewProfile = document.getElementById('viewProfile');
    const editProfile = document.getElementById('editProfile');
    const editMessage = document.getElementById('editMessage');
    
    if (editProfile) editProfile.style.display = 'none';
    if (viewProfile) viewProfile.style.display = 'block';
    if (editMessage) {
        editMessage.classList.remove('show', 'success', 'error');
        editMessage.style.display = 'none';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.textContent = message;
    el.className = 'message-box show ' + type;
    el.style.display = 'block';
    
    setTimeout(() => {
        el.classList.remove('show');
        el.style.display = 'none';
    }, 4000);
}

// Handle Edit Profile Form Submit
const editForm = document.getElementById('editProfileForm');
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('saveProfileBtn');
        if (!btn) return;
        
        const originalHTML = btn.innerHTML;
        btn.innerHTML = 'Menyimpan...';
        btn.disabled = true;
        
        const formData = {
            username: document.getElementById('editUsername').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            telepon: document.getElementById('editTelepon').value.trim()
        };
        
        console.log('📤 Mengirim data update:', formData);
        
        try {
            const token = localStorage.getItem('sipkj_token');
            if (!token) {
                throw new Error('Token tidak ditemukan. Silakan login ulang.');
            }
            
            const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.UPDATE_PROFILE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(formData)
            });
            
            console.log('Response status:', response.status);
            
            // Cek content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Response bukan JSON:', text.substring(0, 200));
                throw new Error('Server response bukan JSON. Periksa error PHP.');
            }
            
            const result = await response.json();
            console.log('✅ Response update:', result);
            
            if (response.ok && result.success) {
                showMessage('editMessage', result.message || 'Profil berhasil diperbarui!', 'success');
                
                // Update data lokal
                if (currentUser) {
                    currentUser.username = formData.username;
                    currentUser.email = formData.email;
                    currentUser.telepon = formData.telepon;
                }
                
                // Refresh UI
                updateAllUI();
                
                // Kembali ke view profile setelah 1.5 detik
                setTimeout(() => {
                    showViewProfile();
                }, 1500);
            } else {
                throw new Error(result.message || 'Gagal memperbarui profil');
            }
        } catch (error) {
            console.error('❌ Error update profile:', error);
            showMessage('editMessage', error.message || 'Gagal memperbarui profil', 'error');
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    console.log('🟢 DOM loaded, starting profile load...');
    loadProfile();
});

// ========================================
// MAIN CONTENT TRANSITION
// ========================================

function smoothContentTransition(targetUrl) {
    const mainContent = document.getElementById('mainContent') || document.querySelector('.main-content');
    
    if (mainContent) {
        // Tambahkan class animasi keluar ke main content
        mainContent.classList.add('page-transition-out');
        
        // Tunggu animasi selesai, lalu pindah halaman
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 300); // Sesuaikan dengan durasi animasi CSS (0.3s = 300ms)
    } else {
        // Fallback jika main content tidak ditemukan
        window.location.href = targetUrl;
    }
}

// Intercept semua klik pada link navigasi
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    
    if (link && link.tagName === 'A' && link.href) {
        const isInternal = link.href.startsWith(window.location.origin);
        const isHash = link.getAttribute('href').startsWith('#') || link.getAttribute('href') === '';
        const isJavascript = link.getAttribute('href').startsWith('javascript:');
        const isNewTab = link.getAttribute('target') === '_blank';
        const isDownload = link.hasAttribute('download');
        const isNoTransition = link.classList.contains('no-transition');
        
        // Hanya jalankan animasi untuk link internal yang valid
        if (isInternal && !isHash && !isJavascript && !isNewTab && !isDownload && !isNoTransition) {
            e.preventDefault();
            smoothContentTransition(link.href);
        }
    }
});

// Tambahkan smooth scroll untuk anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Trigger animasi stagger saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.animation = 'contentFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    }
});