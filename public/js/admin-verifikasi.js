// ========================================
// ADMIN VERIFIKASI - JavaScript (DUMMY MODE)
// ========================================

// Check admin access
(function() {
    const token = localStorage.getItem('sipkj_token');
    const role = localStorage.getItem('sipkj_role');
    
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    if (role !== 'admin') {
        alert('Anda tidak memiliki akses sebagai admin');
        window.location.href = '../auth/login.html';
    }
})();

let allPengaduan = [];
let filteredPengaduan = [];
let currentDetailId = null;
let selectedVerifikasi = 'valid';

// ========================================
// PAGINATION VARIABLES
// ========================================
let currentPage = 1;
const itemsPerPage = 10;

// ========================================
// FUNGSI TOGGLE SIDEBAR
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

// Tutup sidebar ketika klik di luar area sidebar (khusus mobile)
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
            document.getElementById('adminName').textContent = user.username || 'Admin';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

function setCurrentDate() {
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', options);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('id-ID', options);
}

// ========================================
// ⭐ LOAD DATA DUMMY & FILTER 'DIAJUKAN' / 'BARU'
// ========================================
async function loadVerifikasiData() {
    try {
        console.log('🔄 Memuat data dummy untuk verifikasi...');
        
        const response = await fetch('../../data/dummy.json');

        if (!response.ok) {
            throw new Error(`Gagal memuat file: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📋 Total data dummy ditemukan:', result.length);

        // ⭐ HITUNG STATISTIK UNTUK CARD ATAS
        const totalPengaduan = result.length;
        const menungguVerifikasi = result.filter(d => d.status === 'diajukan' || d.status === 'baru').length;
        const dalamProses = result.filter(d => d.status === 'proses' || d.status === 'verifikasi').length;
        const selesai = result.filter(d => d.status === 'selesai').length;

        // ⭐ UPDATE CARD STATISTIK
        document.getElementById('statTotal').textContent = totalPengaduan;
        document.getElementById('statPending').textContent = menungguVerifikasi;
        document.getElementById('statProcess').textContent = dalamProses;
        document.getElementById('statDone').textContent = selesai;

        console.log('📊 Statistik:', { totalPengaduan, menungguVerifikasi, dalamProses, selesai });

        // Filter hanya yang menunggu verifikasi untuk ditampilkan di tabel
        allPengaduan = result.filter(item => {
            const status = (item.status || '').toLowerCase();
            return status === 'diajukan' || status === 'baru';
        });

        console.log('✅ Data yang menunggu verifikasi:', allPengaduan.length);

        if (allPengaduan.length === 0) {
            document.getElementById('verifikasiTableBody').innerHTML = 
                '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada pengaduan yang menunggu verifikasi</td></tr>';
            renderPagination(0);
        } else {
            applyFilters();
        }

    } catch (error) {
        console.error('❌ Error loading data:', error);
        document.getElementById('verifikasiTableBody').innerHTML = 
            `<tr><td colspan="8" style="text-align:center;padding:40px;color:#ef4444;">
                Gagal memuat data dummy.<br>
                <small>Pastikan file ada di: public/data/dummy.json</small><br>
                <small>Error: ${error.message}</small>
            </td></tr>`;
        renderPagination(0);
    }
}

// Apply filters
function applyFilters() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const kategori = document.getElementById('filterKategori')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';

    filteredPengaduan = allPengaduan.filter(item => {
        const matchSearch = !search || 
            (item.judul && item.judul.toLowerCase().includes(search)) ||
            (item.lokasi && item.lokasi.toLowerCase().includes(search)) ||
            (item.nama_pelapor && item.nama_pelapor.toLowerCase().includes(search)) ||
            (item.id && item.id.toString().includes(search));
            
        const matchKategori = !kategori || (item.kategori && item.kategori.toLowerCase() === kategori);
        
        // Filter status (default sudah diajukan/baru, tapi bisa difilter lagi)
        const matchStatus = !status || (item.status && item.status.toLowerCase() === status);
        
        return matchSearch && matchKategori && matchStatus;
    });

    currentPage = 1; // Reset ke halaman 1 saat filter berubah
    renderTable();
}

// Render table dengan Pagination
function renderTable() {
    const tbody = document.getElementById('verifikasiTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (filteredPengaduan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada data yang cocok</td></tr>';
        renderPagination(0);
        return;
    }

    const statusConfig = {
        'diajukan': { text: 'Menunggu Verifikasi', class: 'menunggu' },
        'baru': { text: 'Menunggu Verifikasi', class: 'menunggu' },
        'verifikasi': { text: 'Dalam Proses', class: 'proses' },
        'proses': { text: 'Dalam Proses', class: 'proses' },
        'selesai': { text: 'Selesai', class: 'selesai' },
        'ditolak': { text: 'Ditolak', class: 'ditolak' }
    };

    // ⭐ PAGINATION LOGIC
    const totalPages = Math.ceil(filteredPengaduan.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredPengaduan.slice(startIndex, endIndex);

    pageData.forEach((item, index) => {
        const status = statusConfig[item.status] || statusConfig['diajukan'];
        const kategoriText = item.kategori ? item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1) : '-';
        const pelapor = item.nama_pelapor || 'Masyarakat';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="row-checkbox" data-id="${item.id}"></td>
            <td>${startIndex + index + 1}</td>
            <td>
                <strong>${item.judul || '-'}</strong><br>
                <small style="color:#64748b;">Oleh: ${pelapor}</small>
            </td>
            <td>${kategoriText}</td>
            <td>${item.lokasi || '-'}</td>
            <td>${formatDateTime(item.created_at)}</td>
            <td><span class="status-badge-verif ${status.class}">${status.text}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-verifikasi" onclick="openVerifikasiModal(${item.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                        Verifikasi
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    renderPagination(totalPages);
}

// ⭐ RENDER PAGINATION BUTTONS
function renderPagination(totalPages) {
    let paginationContainer = document.getElementById('verifikasiPagination');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'verifikasiPagination';
        paginationContainer.className = 'pagination-container';
        
        const tableCard = document.querySelector('.table-card');
        if (tableCard) {
            tableCard.appendChild(paginationContainer);
        }
    }
    
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
            renderTable();
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
            renderTable();
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
            renderTable();
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
            renderTable();
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
            renderTable();
            paginationContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };
    paginationContainer.appendChild(nextBtn);
}

// Open verifikasi modal
async function openVerifikasiModal(id) {
    currentDetailId = id;
    const modal = document.getElementById('verifikasiModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">Memuat data...</div>';
    modal.classList.add('show');

    try {
        // Cari data dari array yang sudah dimuat (tidak perlu fetch ulang ke API)
        const data = allPengaduan.find(item => item.id === id);
        
        if (data) {
            renderModalContent(data);
        } else {
            modalBody.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">Data tidak ditemukan</div>';
        }
    } catch (error) {
        console.error('❌ Error:', error);
        modalBody.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">Gagal memuat data</div>';
    }
}

// Render modal content
function renderModalContent(data) {
    const modalBody = document.getElementById('modalBody');
    
    const statusConfig = {
        'diajukan': { text: 'Menunggu Verifikasi', class: 'menunggu' },
        'baru': { text: 'Menunggu Verifikasi', class: 'menunggu' },
        'verifikasi': { text: 'Dalam Proses', class: 'proses' },
        'proses': { text: 'Dalam Proses', class: 'proses' },
        'selesai': { text: 'Selesai', class: 'selesai' },
        'ditolak': { text: 'Ditolak', class: 'ditolak' }
    };

    const statusInfo = statusConfig[data.status] || statusConfig['diajukan'];
    const kategoriText = data.kategori ? data.kategori.charAt(0).toUpperCase() + data.kategori.slice(1) : '-';
    const pelaporName = data.nama_pelapor || 'Masyarakat';
    const initial = pelaporName.charAt(0).toUpperCase();

    // Handle foto (bisa null, string, atau array)
    let fotoHtml = '';
    let fotoList = [];
    if (data.foto) {
        if (Array.isArray(data.foto)) fotoList = data.foto;
        else if (typeof data.foto === 'string' && data.foto.includes(',')) fotoList = data.foto.split(',').map(f => f.trim());
        else fotoList = [data.foto];
    }

    if (fotoList.length > 0) {
        const mainFoto = fotoList[0];
        fotoHtml = `
            <div class="foto-grid-modal">
                <div class="foto-main">
                    <img src="${mainFoto}" alt="Foto Bukti" onerror="this.src='../../images/no-image.png'">
                </div>
            </div>
        `;
    } else {
        fotoHtml = '<div style="padding:40px;text-align:center;color:#94a3b8;background:#f8fafc;border-radius:10px;">Tidak ada foto</div>';
    }

    modalBody.innerHTML = `
        <span class="modal-status-badge ${statusInfo.class}">${statusInfo.text}</span>
        <h2 class="modal-judul">${data.judul}</h2>
        
        <div class="modal-meta">
            <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                </svg>
                ${data.lokasi || '-'}
            </span>
            <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                ${formatDateTime(data.created_at)}
            </span>
        </div>

        <span class="modal-kategori-badge">${kategoriText}</span>
        ${fotoHtml}

        <div class="info-section">
            <div class="info-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                PELAPOR
            </div>
            <div class="pelapor-info">
                <div class="pelapor-avatar">${initial}</div>
                <div class="pelapor-details">
                    <div class="pelapor-name">${pelaporName}</div>
                </div>
            </div>
        </div>

        <div class="info-section">
            <div class="info-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                </svg>
                DESKRIPSI
            </div>
            <div class="deskripsi-box">${data.deskripsi || '-'}</div>
        </div>

        <div class="modal-divider"></div>

        <div class="verifikasi-form">
            <div class="verifikasi-form-title">VERIFIKASI ADMIN</div>
            <label class="radio-option selected" id="optionValid" onclick="selectVerifikasi('valid')">
                <input type="radio" name="verifikasi" value="valid" checked>
                <div class="radio-option-content">
                    <div class="radio-option-title">Valid</div>
                    <div class="radio-option-desc">Pengaduan sesuai dan layak diproses</div>
                </div>
            </label>
            <label class="radio-option" id="optionInvalid" onclick="selectVerifikasi('invalid')">
                <input type="radio" name="verifikasi" value="invalid">
                <div class="radio-option-content">
                    <div class="radio-option-title">Tidak Valid</div>
                    <div class="radio-option-desc">Data tidak sesuai / duplikat</div>
                </div>
            </label>
            <div class="catatan-verifikasi">
                <label>Catatan Verifikasi (opsional)</label>
                <textarea id="catatanVerifikasi" placeholder="Tulis catatan..."></textarea>
            </div>
        </div>

        <div class="modal-footer">
            <button class="btn-tolak" onclick="submitVerifikasi('ditolak')">Tolak</button>
            <button class="btn-verifikasi-final" onclick="submitVerifikasi('proses')">Verifikasi & Proses</button>
        </div>
    `;
}

function selectVerifikasi(value) {
    selectedVerifikasi = value;
    document.getElementById('optionValid').classList.toggle('selected', value === 'valid');
    document.getElementById('optionInvalid').classList.toggle('selected', value === 'invalid');
    document.querySelector('#optionValid input').checked = value === 'valid';
    document.querySelector('#optionInvalid input').checked = value === 'invalid';
}

function submitVerifikasi(newStatus) {
    if (!currentDetailId) return;
    alert(`Simulasi: Pengaduan ID ${currentDetailId} berhasil diubah statusnya menjadi '${newStatus}'.\n\n(Di sistem nyata, ini akan mengirim request ke API)`);
    closeModal();
    // Di sistem nyata, panggil loadVerifikasiData() di sini untuk refresh tabel
}

function closeModal() {
    document.getElementById('verifikasiModal').classList.remove('show');
    currentDetailId = null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Admin Verifikasi page loaded');
    updateAdminInfo();
    setCurrentDate();
    
    // Muat data dummy
    loadVerifikasiData();

    const searchInput = document.getElementById('searchInput');
    const filterKategori = document.getElementById('filterKategori');
    const filterStatus = document.getElementById('filterStatus');

    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(applyFilters, 300);
        });
    }
    if (filterKategori) filterKategori.addEventListener('change', applyFilters);
    if (filterStatus) filterStatus.addEventListener('change', applyFilters);

    document.getElementById('selectAll')?.addEventListener('change', function() {
        document.querySelectorAll('.row-checkbox').forEach(cb => {
            cb.checked = this.checked;
        });
    });

    document.getElementById('verifikasiModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
});