// ========================================
// ADMIN DASHBOARD - JavaScript
// ========================================

// Variabel global untuk menyimpan data
let allPengaduanData = [];

// Check admin access
(function() {
    const token = localStorage.getItem('sipkj_token');
    const role = localStorage.getItem('sipkj_role');
    
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    if (role !== 'admin') {
        alert('Akses ditolak. Halaman ini khusus untuk administrator.');
        window.location.href = '../auth/login.html';
    }
})();

// ✅ FUNGSI TOGGLE SIDEBAR (Desktop & Mobile)
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

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.removeItem('sipkj_token');
        localStorage.removeItem('sipkj_user');
        localStorage.removeItem('sipkj_role');
        window.location.href = '../auth/login.html';
    }
}

function updateAdminInfo() {
    const userData = localStorage.getItem('sipkj_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const el = document.getElementById('adminName');
            if (el) el.textContent = user.username || 'Administrator';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

function updateCurrentDate() {
    const dateEl = document.querySelector('#currentDate span');
    if (dateEl) {
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const formatted = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
        dateEl.textContent = formatted;
    }
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/admin/dashboard-stats.php', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        if (result.success && result.data) {
            const stats = result.data;
            document.getElementById('statTotal').textContent = stats.total || 0;
            document.getElementById('statPending').textContent = stats.menunggu_verifikasi || 0;
            document.getElementById('statProcess').textContent = stats.proses || 0;
            document.getElementById('statDone').textContent = stats.selesai || 0;
        }
    } catch (error) {
        console.error('❌ Error loading stats:', error);
    }
}

// Load data pengaduan
async function loadRecentPengaduan() {
    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/pengaduan/list.php?limit=100', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            allPengaduanData = result.data.map((item, index) => ({
                ...item,
                noUrut: index + 1
            }));
            applyFilters();
        } else {
            allPengaduanData = [];
            renderTable([]);
        }
    } catch (error) {
        console.error('❌ Error loading recent:', error);
        document.getElementById('recentTableBody').innerHTML = 
            '<tr><td colspan="6" style="text-align:center;padding:40px;color:#ef4444;">Gagal memuat data</td></tr>';
    }
}

// Render tabel
function renderTable(dataToRender) {
    const tbody = document.getElementById('recentTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (!dataToRender || dataToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada data yang cocok dengan filter</td></tr>';
        return;
    }

    const statusConfig = {
        'diajukan': { text: 'Diajukan', class: 'menunggu' },
        'verifikasi': { text: 'Verifikasi', class: 'menunggu' },
        'proses': { text: 'Proses', class: 'proses' },
        'selesai': { text: 'Selesai', class: 'selesai' },
        'ditolak': { text: 'Ditolak', class: 'ditolak' }
    };

    dataToRender.forEach(pengaduan => {
        const status = statusConfig[pengaduan.status] || statusConfig['diajukan'];
        const row = document.createElement('tr');
        const tanggal = formatDate(pengaduan.created_at);
        const noUrut = pengaduan.noUrut || '-';
        
        row.innerHTML = `
            <td style="text-align:center;font-weight:600;color:#64748b;">${noUrut}</td>
            <td><strong>${pengaduan.judul || '-'}</strong></td>
            <td>${pengaduan.kategori || '-'}</td>
            <td>${pengaduan.lokasi || '-'}</td>
            <td><span class="status-badge ${status.class}">${status.text}</span></td>
            <td>${tanggal}</td>
        `;
        tbody.appendChild(row);
    });
}

// Fungsi filter utama
function applyFilters() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase().trim();
    const kategoriValue = document.getElementById('filterKategori').value.toLowerCase().trim();
    const statusValue = document.getElementById('filterStatus').value.toLowerCase().trim();

    const filteredData = allPengaduanData.filter(item => {
        const noUrut = item.noUrut ? item.noUrut.toString() : '';
        const idStr = item.id ? item.id.toString() : '';
        
        let matchSearch = true;
        if (searchValue) {
            matchSearch = 
                noUrut === searchValue ||
                idStr === searchValue ||
                (item.judul && item.judul.toLowerCase().includes(searchValue)) || 
                (item.lokasi && item.lokasi.toLowerCase().includes(searchValue));
        }

        let matchKategori = true;
        if (kategoriValue) {
            matchKategori = item.kategori && item.kategori.toLowerCase() === kategoriValue;
        }

        let matchStatus = true;
        if (statusValue) {
            matchStatus = item.status && item.status.toLowerCase() === statusValue;
        }

        return matchSearch && matchKategori && matchStatus;
    });

    renderTable(filteredData);
}

// Reset filter
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterKategori').value = '';
    document.getElementById('filterStatus').value = '';
    applyFilters();
}

// Helper: Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('👨‍💼 Admin Dashboard loaded');
    updateAdminInfo();
    updateCurrentDate();
    loadDashboardStats();
    loadRecentPengaduan();

    const searchInput = document.getElementById('searchInput');
    const filterKategori = document.getElementById('filterKategori');
    const filterStatus = document.getElementById('filterStatus');

    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(applyFilters, 300);
        });
    }

    if (filterKategori) filterKategori.addEventListener('change', applyFilters);
    if (filterStatus) filterStatus.addEventListener('change', applyFilters);
});