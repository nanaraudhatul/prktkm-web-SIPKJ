// ========================================
// PENGADUAN SAYA - JavaScript
// ========================================

// Protect page - cek login
(function() {
    const token = localStorage.getItem('sipkj_token');
    if (!token) {
        console.warn('️ No token, redirecting to login');
        window.location.href = '../auth/login.html';
    }
})();

// Toggle sidebar
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

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
                // Dapatkan status - jika kosong gunakan 'diajukan'
                const status = item.status || 'diajukan';
                
                // Mapping status dengan inline style
                const statusConfig = {
                    'diajukan': { text: 'Diajukan', color: '#1e3a5f', bg: '#1e3a5f' },
                    'baru': { text: 'Diajukan', color: '#1e3a5f', bg: '#1e3a5f' },
                    'verifikasi': { text: 'Verifikasi', color: '#d97706', bg: '#d97706' },
                    'proses': { text: 'Proses', color: '#d97706', bg: '#d97706' },
                    'selesai': { text: 'Selesai', color: '#059669', bg: '#059669' },
                    'ditolak': { text: 'Ditolak', color: '#dc2626', bg: '#dc2626' }
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
                    <button onclick="window.location.href='detail-pengaduan.html?id=${item.id}'" 
                            class="action-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        console.error(' Error loading pengaduan:', error);
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