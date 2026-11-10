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
// PAGINATION CONFIG
// ========================================
let currentPage = 1;
const itemsPerPage = 10;

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

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========================================
// LOAD DATA
// ========================================
const USE_DUMMY_DATA = true;

async function loadPengaduan() {
    try {
        const token = localStorage.getItem('sipkj_token');
        const endpoint = USE_DUMMY_DATA 
            ? API_CONFIG.ENDPOINTS.LIST_PENGADUAN_DUMMY 
            : API_CONFIG.ENDPOINTS.LIST_PENGADUAN;
        
        console.log('📡 Fetching from:', endpoint);
        
        const response = await fetch(API_CONFIG.BASE_URL + endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        console.log('📊 Pengaduan list:', result);

        if (result.success && result.data && Array.isArray(result.data)) {
            // Urutkan: terbaru di atas berdasarkan created_at
            allPengaduan = result.data.sort((a, b) => {
                return new Date(b.created_at) - new Date(a.created_at);
            });
        } else {
            allPengaduan = [];
        }
        
        currentPage = 1; // Reset ke halaman 1 saat data dimuat
        applyFilters();
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
}

// ========================================
// FILTER FUNCTIONS
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
    
    filteredPengaduan = allPengaduan.filter((item) => {
        const itemStatus = ((item.status || '') + '').toLowerCase().trim();
        const itemKategori = ((item.kategori || '') + '').toLowerCase().trim();
        const itemJudul = (item.judul || '').toLowerCase();
        const itemLokasi = (item.lokasi || '').toLowerCase();
        const itemDeskripsi = (item.deskripsi || '').toLowerCase();
        const itemId = (item.id || '').toString();
        
        // Format tanggal untuk pencarian
        let itemTanggalRaw = '';
        let itemTanggalFormatted = '';
        let itemTanggalMonth = '';
        
        if (item.created_at) {
            const dateObj = new Date(item.created_at);
            itemTanggalRaw = item.created_at.split(' ')[0]; // YYYY-MM-DD
            itemTanggalFormatted = formatDate(item.created_at).toLowerCase();
            const bulanIndonesia = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
            itemTanggalMonth = bulanIndonesia[dateObj.getMonth()];
        }
        
        const searchTerm = filters.search;
        const matchSearch = !searchTerm || 
            itemId.includes(searchTerm) ||
            itemJudul.includes(searchTerm) ||
            itemKategori.includes(searchTerm) ||
            itemLokasi.includes(searchTerm) ||
            itemDeskripsi.includes(searchTerm) ||
            itemTanggalRaw.includes(searchTerm) ||
            itemTanggalFormatted.includes(searchTerm) ||
            itemTanggalMonth.includes(searchTerm) ||
            searchTerm === '2026' || searchTerm === 'okt' || searchTerm === 'oktober';
        
        const matchKategori = !filters.kategori || (itemKategori === filters.kategori);
        
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
    
    currentPage = 1; // Reset ke halaman 1 saat filter berubah
    updateStats();
    renderTable();
    renderPagination();
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
// RENDER TABLE DENGAN PAGINATION
// ========================================
function renderTable() {
    const tbody = document.getElementById('pengaduanTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (filteredPengaduan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada pengaduan yang cocok dengan filter</td></tr>';
        renderPagination();
        return;
    }

    // Hitung pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredPengaduan.slice(startIndex, endIndex);

    paginatedData.forEach((item, index) => {
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
        const noUrut = startIndex + index + 1; // Nomor urut berdasarkan halaman

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding:16px; text-align: center; font-weight: 600;">${noUrut}</td>
            <td style="padding:16px;"><strong>${item.judul || '-'}</strong></td>
            <td style="padding:16px;">${capitalize(item.kategori) || '-'}</td>
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

    renderPagination();
}

// ========================================
// RENDER PAGINATION
// ========================================
function renderPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(filteredPengaduan.length / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button onclick="changePage(${currentPage - 1})" 
                class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                ${currentPage === 1 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
            </svg>
        </button>
    `;
    
    // Page numbers logic (show max 5 pages)
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        paginationHTML += `<button onclick="changePage(1)" class="pagination-btn">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="changePage(${i})" 
                    class="pagination-btn ${i === currentPage ? 'active' : ''}">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button onclick="changePage(${totalPages})" class="pagination-btn">${totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `
        <button onclick="changePage(${currentPage + 1})" 
                class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
            </svg>
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

// ========================================
// CHANGE PAGE
// ========================================
function changePage(page) {
    const totalPages = Math.ceil(filteredPengaduan.length / itemsPerPage);
    
    if (page < 1 || page > totalPages || page === currentPage) {
        return;
    }
    
    currentPage = page;
    renderTable();
    
    // Scroll ke atas tabel dengan smooth
    const tableContainer = document.querySelector('.card');
    if (tableContainer) {
        tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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