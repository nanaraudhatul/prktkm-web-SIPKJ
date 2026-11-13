// ========================================
// DASHBOARD PETUGAS - JavaScript (DUMMY MODE)
// ========================================

// Check petugas access
(function() {
    const token = localStorage.getItem('sipkj_token');
    const role = localStorage.getItem('sipkj_role');
    
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    if (role !== 'petugas') {
        alert('Akses ditolak. Halaman ini khusus untuk petugas lapangan.');
        window.location.href = '../auth/login.html';
    }
})();

let allTugas = [];
let filteredTugas = [];
let currentPage = 1;
const itemsPerPage = 10;

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.removeItem('sipkj_token');
        localStorage.removeItem('sipkj_user');
        localStorage.removeItem('sipkj_role');
        window.location.href = '../auth/login.html';
    }
}

function updatePetugasInfo() {
    const userData = localStorage.getItem('sipkj_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const el = document.getElementById('petugasName');
            if (el) el.textContent = user.username || 'Petugas';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========================================
// LOAD DATA DUMMY
// ========================================
async function loadTugasData() {
    try {
        console.log('🔄 Memuat data tugas petugas...');
        const response = await fetch('../../data/dummy.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // ⭐ SIMULASI DIPERBARUI:
        // Petugas melihat SEMUA tugas yang SUDAH DIVERIFIKASI oleh admin.
        // Artinya: status BUKAN 'diajukan'/'baru' (belum diverifikasi)
        // dan BUKAN 'ditolak'.
        // Termasuk yang petugas_id-nya masih null (tugas yang bisa "diambil").
        allTugas = data.filter(item => {
            const status = (item.status || '').toLowerCase();
            const sudahDiverifikasi = (status === 'verifikasi' || status === 'proses' || status === 'selesai');
            return sudahDiverifikasi;
        });
        
        console.log(`✅ Berhasil memuat ${allTugas.length} tugas terverifikasi untuk petugas`);
        
        updateStats(allTugas);
        applyFilters();
        
    } catch (error) {
        console.error('❌ Error loading tugas:', error);
        const tbody = document.getElementById('tugasTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#ef4444;">
                Gagal memuat data.<br><small>${error.message}</small>
            </td></tr>`;
        }
    }
}

// ========================================
// UPDATE STATS (DIPERBAIKI)
// ========================================
function updateStats(data) {
    const total = data.length;
    
    // ⭐ Verifikasi = status 'verifikasi' ATAU sudah ditugaskan tapi belum diproses/selesai
    const verifikasi = data.filter(d => {
        const s = (d.status || '').toLowerCase();
        return s === 'verifikasi' || (s === 'proses' && d.petugas_id === null);
    }).length;
    
    const proses = data.filter(d => (d.status || '').toLowerCase() === 'proses').length;
    const selesai = data.filter(d => (d.status || '').toLowerCase() === 'selesai').length;
    
    const elTotal = document.getElementById('statTotal');
    const elVerifikasi = document.getElementById('statVerifikasi');
    const elProses = document.getElementById('statProses');
    const elSelesai = document.getElementById('statSelesai');
    
    if (elTotal) elTotal.textContent = total;
    if (elVerifikasi) elVerifikasi.textContent = verifikasi;
    if (elProses) elProses.textContent = proses;
    if (elSelesai) elSelesai.textContent = selesai;
}

// ========================================
// FILTER & SEARCH (SMART SEARCH)
// ========================================
function applyFilters() {
    const status = document.getElementById('filterStatus')?.value || '';
    const search = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    
    // Deteksi apakah input pencarian murni angka
    const isNumeric = /^\d+$/.test(search);

    filteredTugas = allTugas.filter(item => {
        // 1. Filter Status
        let matchStatus = true;
        if (status) {
            const itemStatus = (item.status || '').toLowerCase();
            if (status === 'verifikasi') {
                // 'verifikasi' di dropdown = status verifikasi ATAU tugas yang belum diambil
                matchStatus = itemStatus === 'verifikasi' || (itemStatus === 'proses' && item.petugas_id === null);
            } else {
                matchStatus = itemStatus === status;
            }
        }
        
        // 2. Filter Pencarian
        let matchSearch = true;
        if (search) {
            if (isNumeric) {
                matchSearch = item.id.toString().includes(search);
            } else {
                matchSearch = 
                    (item.judul && item.judul.toLowerCase().includes(search)) ||
                    (item.lokasi && item.lokasi.toLowerCase().includes(search)) ||
                    (item.kategori && item.kategori.toLowerCase().includes(search));
            }
        }
        
        return matchStatus && matchSearch;
    });
    
    currentPage = 1;
    renderTable();
}

// ========================================
// RENDER TABLE
// ========================================
function renderTable() {
    const tbody = document.getElementById('tugasTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (filteredTugas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada tugas yang cocok dengan filter</td></tr>';
        renderPagination(0);
        return;
    }

    // Pagination Logic
    const totalPages = Math.ceil(filteredTugas.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredTugas.slice(startIndex, endIndex);

    pageData.forEach(item => {
        // Map Status
        const itemStatus = (item.status || '').toLowerCase();
        let statusText = 'Diterima';
        let statusClass = 'status-accepted';
        if (itemStatus === 'proses') { statusText = 'Dalam Proses'; statusClass = 'status-process'; }
        else if (itemStatus === 'selesai') { statusText = 'Selesai'; statusClass = 'status-done'; }
        else if (itemStatus === 'verifikasi') { statusText = 'Diterima'; statusClass = 'status-accepted'; }

        // Simulasi Prioritas berdasarkan Kategori
        let prioText = 'Sedang';
        let prioClass = 'priority-medium';
        if (item.kategori === 'drainase' || item.kategori === 'fasilitas') {
            prioText = 'Tinggi';
            prioClass = 'priority-high';
        } else if (item.kategori === 'marka') {
            prioText = 'Rendah';
            prioClass = 'priority-low';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="td-title">${item.judul}</td>
            <td>
                <span class="problem-tag">
                    <svg viewBox="0 0 16 16" fill="none" stroke="#6366f1" stroke-width="1.5" width="14" height="14">
                        <circle cx="8" cy="3" r="1" fill="#6366f1"/>
                        <circle cx="12" cy="5" r="1" fill="#6366f1"/>
                        <circle cx="13" cy="9" r="1" fill="#6366f1"/>
                        <circle cx="11" cy="13" r="1" fill="#6366f1"/>
                        <circle cx="5" cy="13" r="1" fill="#6366f1"/>
                        <circle cx="3" cy="9" r="1" fill="#6366f1"/>
                        <circle cx="4" cy="5" r="1" fill="#6366f1"/>
                    </svg>
                    ${capitalize(item.kategori)}
                </span>
            </td>
            <td><span class="priority-badge ${prioClass}">● ${prioText}</span></td>
            <td>
                <span class="location-cell">
                    <svg viewBox="0 0 16 16" fill="#3b82f6" width="14" height="14">
                        <path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z"/>
                    </svg>
                    ${item.lokasi}
                </span>
            </td>
            <td><span class="status-badge ${statusClass}">● ${statusText}</span></td>
            <td>
                <button class="btn-view" onclick="viewDetail(${item.id})" title="Lihat Detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    renderPagination(totalPages);
}

// ========================================
// RENDER PAGINATION
// ========================================
function renderPagination(totalPages) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = `page-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '&lt;';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderTable(); } };
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => { currentPage = i; renderTable(); };
        container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = `page-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '&gt;';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderTable(); } };
    container.appendChild(nextBtn);
}

function viewDetail(id) {
    window.location.href = `detail-pengaduan.html?id=${id}`;
}

// ========================================
// EVENT LISTENERS
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('👷 Dashboard Petugas loaded');
    updatePetugasInfo();
    loadTugasData();
    
    document.getElementById('filterStatus')?.addEventListener('change', applyFilters);
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(applyFilters, 300);
        });
    }

    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.querySelector('.menu-toggle');
        if (window.innerWidth <= 900 && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
});