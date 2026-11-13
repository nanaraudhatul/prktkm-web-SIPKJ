// ========================================
// ADMIN DASHBOARD - JavaScript (DUMMY MODE)
// ========================================

let allPengaduanData = [];
let filteredPengaduanData = [];
let currentPage = 1;
const itemsPerPage = 10;

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
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
    } else {
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

// ========================================
// LOAD DUMMY DATA
// ========================================
async function loadDummyData() {
    try {
        console.log('🔄 Memuat data dummy...');
        const response = await fetch('../../data/dummy.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Urutkan dari yang terbaru (descending)
        allPengaduanData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Tambahkan noUrut berdasarkan urutan terbaru
        allPengaduanData.forEach((item, index) => {
            item.noUrut = index + 1;
        });
        
        console.log(`✅ Berhasil memuat ${allPengaduanData.length} data dummy`);
        
        updateDashboardStats();
        applyFilters();
        
    } catch (error) {
        console.error('❌ Error loading dummy data:', error);
        const tbody = document.getElementById('recentTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#ef4444;">
                Gagal memuat data dummy.<br>
                <small>Pastikan file ada di: public/data/dummy.json</small>
            </td></tr>`;
        }
    }
}

// Update statistik dashboard
function updateDashboardStats() {
    const total = allPengaduanData.length;
    const menunggu = allPengaduanData.filter(d => d.status === 'diajukan' || d.status === 'baru').length;
    const proses = allPengaduanData.filter(d => d.status === 'verifikasi' || d.status === 'proses').length;
    const selesai = allPengaduanData.filter(d => d.status === 'selesai').length;
    
    const elTotal = document.getElementById('statTotal');
    const elPending = document.getElementById('statPending');
    const elProcess = document.getElementById('statProcess');
    const elDone = document.getElementById('statDone');

    if (elTotal) elTotal.textContent = total;
    if (elPending) elPending.textContent = menunggu;
    if (elProcess) elProcess.textContent = proses;
    if (elDone) elDone.textContent = selesai;
    
    console.log('📊 Stats:', { total, menunggu, proses, selesai });
}

// Render tabel dengan pagination
function renderTable(dataToRender) {
    const tbody = document.getElementById('recentTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (!dataToRender || dataToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada data yang cocok dengan filter</td></tr>';
        renderPagination(0);
        return;
    }

    const statusConfig = {
        'diajukan': { text: 'Diajukan', class: 'menunggu' },
        'baru': { text: 'Diajukan', class: 'menunggu' },
        'verifikasi': { text: 'Verifikasi', class: 'menunggu' },
        'proses': { text: 'Proses', class: 'proses' },
        'selesai': { text: 'Selesai', class: 'selesai' },
        'ditolak': { text: 'Ditolak', class: 'ditolak' }
    };

    // Pagination logic
    const totalPages = Math.ceil(dataToRender.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = dataToRender.slice(startIndex, endIndex);

    pageData.forEach(pengaduan => {
        const status = statusConfig[pengaduan.status] || statusConfig['diajukan'];
        const row = document.createElement('tr');
        const tanggal = formatDate(pengaduan.created_at);
        
        row.innerHTML = `
            <td style="text-align:center;font-weight:600;color:#64748b;">${pengaduan.noUrut}</td>
            <td><strong>${pengaduan.judul || '-'}</strong></td>
            <td>${capitalizeFirst(pengaduan.kategori) || '-'}</td>
            <td>${pengaduan.lokasi || '-'}</td>
            <td><span class="status-badge ${status.class}">${status.text}</span></td>
            <td>${tanggal}</td>
        `;
        tbody.appendChild(row);
    });

    renderPagination(totalPages);
}

// Render pagination buttons
function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = `pagination-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '‹';
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable(filteredPengaduanData);
            paginationContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };
    paginationContainer.appendChild(prevBtn);

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'pagination-btn';
        firstBtn.textContent = '1';
        firstBtn.onclick = () => {
            currentPage = 1;
            renderTable(filteredPengaduanData);
            paginationContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
        paginationContainer.appendChild(firstBtn);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => {
            currentPage = i;
            renderTable(filteredPengaduanData);
            paginationContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
        paginationContainer.appendChild(btn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
        
        const lastBtn = document.createElement('button');
        lastBtn.className = 'pagination-btn';
        lastBtn.textContent = totalPages;
        lastBtn.onclick = () => {
            currentPage = totalPages;
            renderTable(filteredPengaduanData);
            paginationContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
        paginationContainer.appendChild(lastBtn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = `pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '›';
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable(filteredPengaduanData);
            paginationContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };
    paginationContainer.appendChild(nextBtn);
}

// ========================================
// FUNGSI FILTER UTAMA (DIPERBARUI DENGAN PENCARIAN TANGGAL)
// ========================================
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterKategori = document.getElementById('filterKategori');
    const filterStatus = document.getElementById('filterStatus');

    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const kategoriValue = filterKategori ? filterKategori.value.toLowerCase().trim() : '';
    const statusValue = filterStatus ? filterStatus.value.toLowerCase().trim() : '';

    filteredPengaduanData = allPengaduanData.filter(item => {
        const idStr = item.id ? item.id.toString() : '';
        const noUrutStr = item.noUrut ? item.noUrut.toString() : '';
        
        let matchSearch = true;
        if (searchValue) {
            // ==========================================
            // LOGIKA PENCARIAN TANGGAL
            // ==========================================
            let matchDate = false;
            if (item.created_at) {
                const d = new Date(item.created_at);
                const yyyy = d.getFullYear().toString();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                
                const bulanIndonesia = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
                const mmm = bulanIndonesia[d.getMonth()];
                
                const dateFormats = [
                    `${yyyy}-${mm}-${dd}`, // 2026-10-30
                    `${dd}-${mm}-${yyyy}`, // 30-10-2026
                    `${dd}/${mm}/${yyyy}`, // 30/10/2026
                    `${dd} ${mmm} ${yyyy}`, // 30 okt 2026
                    `${mmm} ${yyyy}`,      // okt 2026
                    yyyy                   // 2026
                ];
                
                matchDate = dateFormats.some(format => format.includes(searchValue));
            }

            matchSearch = 
                idStr.includes(searchValue) ||
                noUrutStr.includes(searchValue) ||
                (item.judul && item.judul.toLowerCase().includes(searchValue)) || 
                (item.lokasi && item.lokasi.toLowerCase().includes(searchValue)) ||
                matchDate; // Tambahkan hasil pencarian tanggal
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

    currentPage = 1;
    renderTable(filteredPengaduanData);
}

// Reset filter
function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterKategori = document.getElementById('filterKategori');
    const filterStatus = document.getElementById('filterStatus');

    if (searchInput) searchInput.value = '';
    if (filterKategori) filterKategori.value = '';
    if (filterStatus) filterStatus.value = '';
    
    applyFilters();
}

// Helper: Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Helper: Capitalize first letter
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('👨‍💼 Admin Dashboard loaded (Dummy Mode)');
    updateAdminInfo();
    updateCurrentDate();
    loadDummyData();

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