// ========================================
// PENGADUAN SAYA - JavaScript
// ========================================

// Protect page - cek login
(function() {
    const token = localStorage.getItem('sipkj_token');
    if (!token) {
        console.warn('⚠️ No token, redirecting to login');
        window.location.href = '../auth/login.html';
    }
})();

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

// Logout
function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.removeItem('sipkj_token');
        localStorage.removeItem('sipkj_user');
        localStorage.removeItem('sipkj_role');
        console.log('🚪 Logged out');
        window.location.href = '../auth/login.html';
    }
}

// Update UI dengan data user login
function updateUserInfo() {
    const userData = localStorage.getItem('sipkj_user');
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const username = user.username || 'User';
            const role = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Masyarakat';
            
            // Update topbar
            document.querySelectorAll('.user-name').forEach(el => {
                el.textContent = username;
            });
            document.querySelectorAll('.user-role').forEach(el => {
                el.textContent = role;
            });
            
            // Update nama di info bar
            const displayName = document.getElementById('displayUserName');
            if (displayName) {
                displayName.textContent = username;
            }
            
            console.log('✅ User info updated:', username, role);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// Load pengaduan dari database
async function loadPengaduanSaya() {
    const tbody = document.getElementById('pengaduanTableBody');
    const totalDisplay = document.getElementById('totalLaporanDisplay');
    const token = localStorage.getItem('sipkj_token');

    try {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.LIST_PENGADUAN + '?saya=true', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        console.log('📋 Pengaduan response:', result);

        if (!response.ok) {
            throw new Error(result.message || 'Gagal memuat data');
        }

        tbody.innerHTML = '';

        if (result.data && result.data.length > 0) {
            if (totalDisplay) {
                totalDisplay.textContent = `Total ${result.data.length} Laporan Terdaftar`;
            }

            result.data.forEach(item => {
                const status = item.status || 'diajukan';
                
                const statusConfig = {
                    'diajukan': { text: 'Diajukan', bg: '#1e3a5f' },
                    'baru': { text: 'Diajukan', bg: '#1e3a5f' },
                    'verifikasi': { text: 'Verifikasi', bg: '#d97706' },
                    'proses': { text: 'Proses', bg: '#d97706' },
                    'selesai': { text: 'Selesai', bg: '#059669' },
                    'ditolak': { text: 'Ditolak', bg: '#dc2626' }
                };
                
                const config = statusConfig[status] || statusConfig['diajukan'];
                const tanggal = formatDate(item.tanggal || item.created_at);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding:18px 20px;"><strong>${item.judul}</strong></td>
                    <td style="padding:18px 20px;">${item.kategori}</td>
                    <td style="padding:18px 20px;">
                        <span style="display:inline-flex;align-items:center;padding:6px 16px;border-radius:50px;font-size:13px;font-weight:600;color:white;background-color:${config.bg};">
                            ${config.text}
                        </span>
                    </td>
                    <td style="padding:18px 20px;">${tanggal}</td>
                    <td style="padding:18px 20px;">
                        <button onclick="window.location.href='detail-pengaduan.html?id=${item.id}'" class="action-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Lihat Detail
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            if (totalDisplay) {
                totalDisplay.textContent = 'Total 0 Laporan Terdaftar';
            }
            tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div style="text-align:center;padding:40px;color:#94a3b8;">
                            <h3>Belum Ada Pengaduan</h3>
                            <p>Anda belum membuat pengaduan. Klik "Buat Pengaduan" untuk mulai melapor.</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('❌ Error loading pengaduan:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div style="text-align:center;padding:40px;color:#ef4444;">
                        <h3>Gagal Memuat Data</h3>
                        <p>${error.message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Format tanggal helper
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateUserInfo();
    loadPengaduanSaya();
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