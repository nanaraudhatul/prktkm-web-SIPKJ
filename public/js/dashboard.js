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
    }
})();

let allPengaduan = [];
let filteredPengaduan = [];

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

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
            allPengaduan = result.data;
            console.log('✅ Total data loaded:', allPengaduan.length);
        } else {
            console.warn('⚠️ Data kosong');
            allPengaduan = [];
        }
        
        applyFilters();
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
}

// ========================================
// FILTER FUNCTIONS
// ========================================

function getFilterValues() {
    const searchInput = document.getElementById('searchInput');
    const kategoriSelect = document.getElementById('filterKategori');
    const statusSelect = document.getElementById('filterStatus');
    
    return {
        search: searchInput ? searchInput.value.toLowerCase().trim() : '',
        kategori: kategoriSelect ? kategoriSelect.value.toLowerCase().trim() : '',
        status: statusSelect ? statusSelect.value.toLowerCase().trim() : ''
    };
}

function applyFilters() {
    const filters = getFilterValues();
    console.log(' Filter aktif:', filters);
    
    // Debug: Log semua data
    console.log(' Semua data:', allPengaduan);
    
    filteredPengaduan = allPengaduan.filter(item => {
        // Handle status yang mungkin kosong atau undefined
        const itemStatus = ((item.status || item.status_label || '') + '').toLowerCase().trim();
        const itemKategori = ((item.kategori || item.kategori_key || '') + '').toLowerCase().trim();
        const itemJudul = (item.judul || '').toLowerCase();
        const itemLokasi = (item.lokasi || '').toLowerCase();
        const itemDeskripsi = (item.deskripsi || '').toLowerCase();
        
        console.log(`\n📋 Cek: "${item.judul}"`);
        console.log('   Status:', itemStatus || '(kosong)');
        console.log('   Kategori:', itemKategori || '(kosong)');
        
        // Filter search
        const matchSearch = !filters.search || 
            itemJudul.includes(filters.search) ||
            itemKategori.includes(filters.search) ||
            itemLokasi.includes(filters.search) ||
            itemDeskripsi.includes(filters.search);
        
        // Filter kategori
        const matchKategori = !filters.kategori || (itemKategori === filters.kategori);
        
        // Filter status - lebih fleksibel
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
            // Jika filter ada tapi status kosong, tidak match
            matchStatus = false;
        }
        
        console.log('   Match:', matchSearch && matchKategori && matchStatus);
        
        return matchSearch && matchKategori && matchStatus;
    });
    
    console.log('\n📊 Hasil:', filteredPengaduan.length, 'dari', allPengaduan.length);
    
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
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada pengaduan yang cocok dengan filter</td></tr>';
        return;
    }

    filteredPengaduan.forEach(item => {
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

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding:16px;"><strong>${item.judul || '-'}</strong></td>
            <td style="padding:16px;">${item.kategori || '-'}</td>
            <td style="padding:16px;">
                <span style="display:inline-flex;align-items:center;padding:6px 16px;border-radius:50px;font-size:13px;font-weight:600;color:white;background-color:${statusInfo.bg};">
                    ${statusInfo.text}
                </span>
            </td>
            <td style="padding:16px;">${tanggal}</td>
            <td style="padding:16px;">
                <button onclick="viewDetail(${item.id})" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#1e3a5f;color:white;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Lihat Detail
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function viewDetail(id) {
    window.location.href = 'detail-pengaduan.html?id=' + id;
}

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 Masyarakat Dashboard loaded');
    updateUserInfo();
    loadPengaduan();
    
    const searchInput = document.getElementById('searchInput');
    const kategoriSelect = document.getElementById('filterKategori');
    const statusSelect = document.getElementById('filterStatus');
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(applyFilters, 300);
        });
    }
    
    if (kategoriSelect) kategoriSelect.addEventListener('change', applyFilters);
    if (statusSelect) statusSelect.addEventListener('change', applyFilters);
});