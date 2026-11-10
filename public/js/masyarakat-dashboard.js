// ========================================
// MASYARAKAT DASHBOARD - JavaScript
// ========================================

(function() {
    const token = localStorage.getItem('sipkj_token');
    const role = localStorage.getItem('sipkj_role');
    
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    if (role === 'admin') {
        window.location.href = '../admin/dashboard.html';
    } else if (role === 'petugas') {
        window.location.href = '../petugas/dashboard.html';
    }
})();

let allPengaduan = [];
let filteredPengaduan = [];

// ========================================
// SIDEBAR TOGGLE
// ========================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const overlay = document.getElementById('sidebarOverlay');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
    } else {
        sidebar.classList.toggle('closed');
        if (mainContent) mainContent.classList.toggle('expanded');
    }
}

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

function updateUserInfo() {
    const userData = localStorage.getItem('sipkj_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const nameEl = document.getElementById('userName');
            if (nameEl) nameEl.textContent = user.username || 'User';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// ========================================
// LOAD DATA
// ========================================
async function loadPengaduan() {
    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/pengaduan/list.php', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        console.log('📊 Pengaduan list:', result);

        if (result.success && result.data && Array.isArray(result.data)) {
            // ✅ URUTKAN DATA: Terbaru di atas (descending by created_at)
            allPengaduan = result.data.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA; // Terbaru pertama
            });
        } else {
            allPengaduan = [];
        }
        applyFilters();
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
}

// ========================================
// FILTER FUNCTIONS - PENCARIAN UNIVERSAL
// ========================================
function getFilterValues() {
    const searchUniversal = document.getElementById('searchUniversal');
    const kategoriSelect = document.getElementById('filterKategori');
    const statusSelect = document.getElementById('filterStatus');
    
    return {
        search: searchUniversal ? searchUniversal.value.toLowerCase().trim() : '',
        kategori: kategoriSelect ? kategoriSelect.value.toLowerCase().trim() : '',
        status: statusSelect ? statusSelect.value.toLowerCase().trim() : ''
    };
}

function applyFilters() {
    const filters = getFilterValues();
    
    filteredPengaduan = allPengaduan.filter((item, index) => {
        const itemStatus = ((item.status || item.status_label || '') + '').toLowerCase().trim();
        const itemKategori = ((item.kategori || item.kategori_key || '') + '').toLowerCase().trim();
        const itemJudul = (item.judul || '').toLowerCase();
        const itemLokasi = (item.lokasi || '').toLowerCase();
        const itemDeskripsi = (item.deskripsi || '').toLowerCase();
        
        // Ambil ID dan format tanggal
        const itemId = (item.id || (index + 1)).toString();
        
        // Format tanggal dalam berbagai format untuk pencarian
        let itemTanggalRaw = '';
        let itemTanggalFormatted = '';
        let itemTanggalMonth = '';
        
        if (item.created_at) {
            const dateObj = new Date(item.created_at);
            itemTanggalRaw = item.created_at.split('T')[0]; // YYYY-MM-DD
            itemTanggalFormatted = formatDate(item.created_at).toLowerCase(); // 29 okt 2026
            
            // Ambil nama bulan untuk pencarian
            const bulanIndonesia = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
            itemTanggalMonth = bulanIndonesia[dateObj.getMonth()];
        }
        
        // Pencarian Universal - cek di SEMUA field
        const searchTerm = filters.search;
        const matchSearch = !searchTerm || 
            itemId.includes(searchTerm) ||                        // Cari di No/ID (2, 3, dll)
            itemJudul.includes(searchTerm) ||                     // Cari di Judul (lampu, jalan, rusak)
            itemKategori.includes(searchTerm) ||                  // Cari di Kategori (fasilitas, permukaan)
            itemLokasi.includes(searchTerm) ||                    // Cari di Lokasi
            itemDeskripsi.includes(searchTerm) ||                 // Cari di Deskripsi
            itemTanggalRaw.includes(searchTerm) ||                // Cari di Tanggal (2026-10-29)
            itemTanggalFormatted.includes(searchTerm) ||          // Cari di Tanggal (29 okt 2026)
            itemTanggalMonth.includes(searchTerm) ||              // Cari di Bulan (okt, okt 2026)
            searchTerm === '2026' ||                              // Cari tahun
            searchTerm === 'okt' || searchTerm === 'oktober';     // Cari bulan
        
        // Filter Kategori
        const matchKategori = !filters.kategori || (itemKategori === filters.kategori);
        
        // Filter Status
        let matchStatus = true;
        if (filters.status && itemStatus) {
            const filterStatus = filters.status.toLowerCase().trim();
            if (filterStatus === 'diajukan') {
                matchStatus = (itemStatus === 'diajukan' || itemStatus === 'baru');
            } else if (filterStatus === 'proses') {
                matchStatus = (itemStatus === 'proses' || itemStatus === 'verifikasi');
            } else if (filterStatus === 'selesai') {
                matchStatus = (itemStatus === 'selesai');
            } else if (filterStatus === 'ditolak') {
                matchStatus = (itemStatus === 'ditolak');
            } else {
                matchStatus = (itemStatus === filterStatus);
            }
        } else if (filters.status && !itemStatus) {
            matchStatus = false;
        }
        
        return matchSearch && matchKategori && matchStatus;
    });
    
    updateStats();
    renderTable();
}

// ========================================
// UPDATE STATS
// ========================================
function updateStats() {
    const total = filteredPengaduan.length;
    const diajukan = filteredPengaduan.filter(p => p.status === 'diajukan' || p.status === 'baru').length;
    const proses = filteredPengaduan.filter(p => p.status === 'proses' || p.status === 'verifikasi').length;
    const selesai = filteredPengaduan.filter(p => p.status === 'selesai').length;
    
    const elTotal = document.getElementById('statTotal');
    const elDiajukan = document.getElementById('statDiajukan');
    const elProses = document.getElementById('statProses');
    const elSelesai = document.getElementById('statSelesai');
    const elCounter = document.getElementById('totalCounter');
    
    if (elTotal) elTotal.textContent = total;
    if (elDiajukan) elDiajukan.textContent = diajukan;
    if (elProses) elProses.textContent = proses;
    if (elSelesai) elSelesai.textContent = selesai;
    if (elCounter) elCounter.textContent = `Total ${total} Laporan Terdata`;
}

// ========================================
// RENDER TABLE
// ========================================
function renderTable() {
    const tbody = document.getElementById('pengaduanTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (filteredPengaduan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada pengaduan yang cocok dengan filter</td></tr>';
        return;
    }

    filteredPengaduan.forEach((item, index) => {
        const statusConfig = {
            'diajukan': { text: 'Diajukan', bg: '#1e3a5f' },
            'baru': { text: 'Diajukan', bg: '#1e3a5f' },
            'verifikasi': { text: 'Verifikasi', bg: '#d97706' },
            'proses': { text: 'Proses', bg: '#d97706' },
            'selesai': { text: 'Selesai', bg: '#059669' },
            'ditolak': { text: 'Ditolak', bg: '#dc2626' }
        };
        
        const statusInfo = statusConfig[item.status] || statusConfig['diajukan'];
        const tanggal = formatDate(item.created_at);
        const noUrut = item.id || (index + 1);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding:16px; text-align: center; font-weight: 600;">${noUrut}</td>
            <td style="padding:16px;"><strong>${item.judul || '-'}</strong></td>
            <td style="padding:16px;">${item.kategori || '-'}</td>
            <td style="padding:16px;">
                <span style="display:inline-flex;align-items:center;padding:6px 16px;border-radius:50px;font-size:13px;font-weight:600;color:white;background-color:${statusInfo.bg};">
                    ${statusInfo.text}
                </span>
            </td>
            <td style="padding:16px;">${tanggal}</td>
            <td style="padding:16px;">
                <button onclick="window.location.href='detail-pengaduan.html?id=${item.id}'" class="action-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Detail
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ========================================
// INIT & EVENT LISTENERS
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 Masyarakat Dashboard loaded');
    updateUserInfo();
    loadPengaduan();
    
    const searchUniversal = document.getElementById('searchUniversal');
    const kategoriSelect = document.getElementById('filterKategori');
    const statusSelect = document.getElementById('filterStatus');
    
    // Search Universal dengan debounce
    if (searchUniversal) {
        let searchTimeout;
        searchUniversal.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(applyFilters, 300);
        });
    }
    
    // Filter Dropdowns
    if (kategoriSelect) kategoriSelect.addEventListener('change', applyFilters);
    if (statusSelect) statusSelect.addEventListener('change', applyFilters);
});