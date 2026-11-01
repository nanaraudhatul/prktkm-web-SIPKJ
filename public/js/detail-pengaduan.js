// ========================================
// DETAIL PENGADUAN - JavaScript (FIXED v2)
// ========================================

(function() {
    const token = localStorage.getItem('sipkj_token');
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }
})();

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
            const el = document.getElementById('userName');
            if (el) el.textContent = user.username || 'User';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('id-ID', options);
}

// ========================================
// STATUS TIMELINE - PERBAIKAN TOTAL
// ========================================

const STATUS_ORDER = ['diajukan', 'verifikasi', 'proses', 'selesai'];

const STATUS_LABELS = {
    'diajukan': 'Diajukan',
    'verifikasi': 'Verifikasi',
    'proses': 'Proses',
    'selesai': 'Selesai',
    'ditolak': 'Ditolak',
    'baru': 'Diajukan'
};

const CHECK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>`;

const STATUS_ICONS = {
    'diajukan': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    'verifikasi': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>`,
    'proses': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
    'selesai': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    'ditolak': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
};

function getStatusIndex(status) {
    if (!status) return -1;
    const normalized = status.toLowerCase().trim();
    if (normalized === 'baru') return 0;
    return STATUS_ORDER.indexOf(normalized);
}

function renderStatusTimeline(currentStatus) {
    const container = document.getElementById('statusTimeline');
    if (!container) {
        console.error('❌ Container #statusTimeline tidak ditemukan!');
        return;
    }
    
    // Hapus semua child
    container.innerHTML = '';
    
    const normalizedStatus = currentStatus ? currentStatus.toLowerCase().trim() : 'diajukan';
    const currentIndex = getStatusIndex(normalizedStatus);
    
    console.log('🎯 Render Timeline:', {
        currentStatus: normalizedStatus,
        currentIndex: currentIndex,
        totalSteps: STATUS_ORDER.length
    });
    
    const isDitolak = normalizedStatus === 'ditolak';
    
    // Handle status ditolak
    if (isDitolak) {
        STATUS_ORDER.forEach((status, index) => {
            const item = document.createElement('div');
            item.className = 'timeline-item pending';
            item.dataset.index = index;
            item.innerHTML = `
                <div class="timeline-icon">${STATUS_ICONS[status] || ''}</div>
                <div class="timeline-content">
                    <div class="timeline-title">${STATUS_LABELS[status]}</div>
                    <div class="timeline-date">-</div>
                </div>
            `;
            container.appendChild(item);
        });
        
        // Tambah item ditolak
        const ditolakItem = document.createElement('div');
        ditolakItem.className = 'timeline-item rejected';
        ditolakItem.innerHTML = `
            <div class="timeline-icon icon-rejected">${STATUS_ICONS['ditolak']}</div>
            <div class="timeline-content">
                <div class="timeline-title title-rejected">Ditolak</div>
                <div class="timeline-date">Pengaduan tidak valid</div>
            </div>
        `;
        container.appendChild(ditolakItem);
        return;
    }
    
    // Render timeline normal
    STATUS_ORDER.forEach((status, index) => {
        const item = document.createElement('div');
        item.dataset.index = index;
        
        let stateClass = 'pending';
        let iconHtml = STATUS_ICONS[status] || '';
        let dateText = '-';
        let titleText = STATUS_LABELS[status] || status;
        
        if (currentIndex >= 0) {
            if (index < currentIndex) {
                // Sudah dilewati
                stateClass = 'completed';
                iconHtml = CHECK_ICON;
                dateText = 'Selesai';
            } else if (index === currentIndex) {
                // Status saat ini
                stateClass = 'active';
                iconHtml = CHECK_ICON;
                dateText = 'Saat ini';
            }
        } else {
            // Jika status tidak dikenali, tampilkan semua pending
            stateClass = 'pending';
        }
        
        item.className = `timeline-item ${stateClass}`;
        item.innerHTML = `
            <div class="timeline-icon">${iconHtml}</div>
            <div class="timeline-content">
                <div class="timeline-title">${titleText}</div>
                <div class="timeline-date">${dateText}</div>
            </div>
        `;
        
        container.appendChild(item);
    });
    
    console.log('✅ Timeline rendered:', container.children.length, 'items');
}

// ========================================
// LOAD FOTO - PERBAIKAN
// ========================================

function loadFoto(data) {
    const fotoGrid = document.getElementById('fotoGrid');
    const fotoSection = document.getElementById('fotoSection');
    
    if (!fotoGrid || !fotoSection) {
        console.warn('⚠️ Foto container tidak ditemukan');
        return;
    }
    
    fotoGrid.innerHTML = '';
    
    // Cek berbagai format data foto
    let fotoList = [];
    
    if (data.foto_array && Array.isArray(data.foto_array)) {
        fotoList = data.foto_array;
    } else if (data.foto) {
        if (Array.isArray(data.foto)) {
            fotoList = data.foto;
        } else if (typeof data.foto === 'string' && data.foto.trim() !== '') {
            fotoList = [data.foto];
        } else if (typeof data.foto === 'string' && data.foto.includes(',')) {
            fotoList = data.foto.split(',').map(f => f.trim());
        }
    }
    
    console.log('📸 Foto list:', fotoList);
    
    if (fotoList.length === 0) {
        fotoSection.style.display = 'none';
        console.log('ℹ️ Tidak ada foto');
        return;
    }
    
    fotoSection.style.display = 'block';
    
    fotoList.forEach((foto, index) => {
        if (!foto) return;
        
        // Build URL foto
        let fotoUrl = foto;
        if (foto.startsWith('/sipkj/')) {
            fotoUrl = 'http://localhost' + foto;
        } else if (!foto.startsWith('http') && !foto.startsWith('data:')) {
            fotoUrl = 'http://localhost/sipkj/backend/uploads/' + foto;
        }
        
        const fotoItem = document.createElement('div');
        fotoItem.className = 'foto-item';
        
        const img = document.createElement('img');
        img.src = fotoUrl;
        img.alt = `Foto ${index + 1}`;
        img.style.cursor = 'pointer';
        img.onclick = () => window.open(fotoUrl, '_blank');
        
        img.onerror = function() {
            console.warn('⚠️ Gagal load foto:', fotoUrl);
            this.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f1f5f9;color:#94a3b8;font-size:13px;">Gagal memuat foto</div>';
        };
        
        img.onload = function() {
            console.log('✅ Foto loaded:', fotoUrl);
        };
        
        fotoItem.appendChild(img);
        fotoGrid.appendChild(fotoItem);
    });
}

// ========================================
// LOAD DETAIL PENGADUAN
// ========================================

async function loadDetailPengaduan() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) {
        alert('ID pengaduan tidak ditemukan');
        window.history.back();
        return;
    }
    
    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/pengaduan/detail.php?id=' + id, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        const result = await response.json();
        console.log('📋 Detail pengaduan response:', result);
        
        if (!response.ok || !result.success) {
            alert(result.message || 'Gagal memuat detail pengaduan');
            window.history.back();
            return;
        }
        
        const data = result.data;
        console.log('📦 Data detail:', data);
        console.log('📍 Status:', data.status, '| Kategori:', data.kategori);
        
        // Update header
        const statusBadge = document.getElementById('statusBadge');
        if (statusBadge) {
            statusBadge.textContent = data.status_label || 'Diajukan';
            statusBadge.className = 'status-badge ' + (data.status || 'diajukan');
        }
        
        const elPelapor = document.getElementById('pelaporName');
        if (elPelapor) elPelapor.textContent = data.pelapor || '-';
        
        const elDate = document.getElementById('detailDate');
        if (elDate) elDate.textContent = formatDate(data.created_at);
        
        const elJudul = document.getElementById('detailJudul');
        if (elJudul) elJudul.textContent = data.judul || '-';
        
        const elKategori = document.getElementById('detailKategori');
        if (elKategori) elKategori.textContent = data.kategori || '-';
        
        const elDeskripsi = document.getElementById('detailDeskripsi');
        if (elDeskripsi) elDeskripsi.textContent = data.deskripsi || 'Tidak ada deskripsi';
        
        const elLokasi = document.getElementById('detailLokasi');
        if (elLokasi) elLokasi.textContent = data.lokasi || '-';
        
        const mapsLink = document.getElementById('mapsLink');
        if (mapsLink) {
            if (data.maps_link) {
                mapsLink.href = data.maps_link;
                mapsLink.style.display = 'inline-flex';
            } else {
                mapsLink.style.display = 'none';
            }
        }
        
        // Load foto
        loadFoto(data);
        
        // ✅ Render timeline
        console.log('🎨 Memanggil renderStatusTimeline...');
        renderStatusTimeline(data.status);
        
    } catch (error) {
        console.error('❌ Error loading detail:', error);
        alert('Gagal terhubung ke server');
    }
}

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 Detail Pengaduan page loaded');
    updateUserInfo();
    loadDetailPengaduan();
});