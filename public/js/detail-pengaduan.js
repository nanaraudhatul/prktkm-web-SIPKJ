// ========================================
// DETAIL PENGADUAN - JavaScript
// ========================================

const USE_DUMMY_DATA = true;

// Mapping nama pelapor
const NAMA_PELAPOR = [
    "Budi Santoso", "Siti Aminah", "Ahmad Fauzi", "Dewi Lestari", "Rizky Pratama",
    "Nurul Hidayah", "Eko Prasetyo", "Rina Wulandari", "Agus Setiawan", "Maya Sari",
    "Hendra Gunawan", "Fitriani", "Doni Kusuma", "Lina Marlina", "Yudi Hermawan",
    "Ani Suryani", "Bambang Sutrisno", "Citra Dewi", "Dedi Kurniawan", "Eka Putri"
];

// Status order untuk timeline
const STATUS_ORDER = ['diajukan', 'verifikasi', 'proses', 'selesai'];

const STATUS_LABELS = {
    'diajukan': 'Diajukan',
    'verifikasi': 'Verifikasi',
    'proses': 'Proses',
    'selesai': 'Selesai',
    'ditolak': 'Ditolak',
    'baru': 'Diajukan'
};

(function() {
    const token = localStorage.getItem('sipkj_token');
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }
})();

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
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
    const options = { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('id-ID', options);
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Render timeline status
function renderStatusTimeline(status, createdAt) {
    const container = document.getElementById('statusTimeline');
    if (!container) return;
    
    container.innerHTML = '';
    
    const normalizedStatus = status ? status.toLowerCase().trim() : 'diajukan';
    let currentIndex = STATUS_ORDER.indexOf(normalizedStatus);
    
    // Jika status 'baru', anggap sebagai 'diajukan'
    if (normalizedStatus === 'baru') {
        currentIndex = 0;
    }
    
    // Jika ditolak, tampilkan semua pending
    if (normalizedStatus === 'ditolak') {
        STATUS_ORDER.forEach((statusItem, index) => {
            const item = createTimelineItem(statusItem, 'pending', '-');
            container.appendChild(item);
        });
        
        // Tambah item ditolak
        const ditolakItem = document.createElement('div');
        ditolakItem.className = 'timeline-item rejected';
        ditolakItem.innerHTML = `
            <div class="timeline-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </div>
            <div class="timeline-content">
                <div class="timeline-title" style="color: #dc2626;">Ditolak</div>
                <div class="timeline-date">${formatDate(createdAt)}</div>
            </div>
        `;
        container.appendChild(ditolakItem);
        return;
    }
    
    // Render timeline normal
    STATUS_ORDER.forEach((statusItem, index) => {
        let stateClass = 'pending';
        let dateText = '-';
        
        if (currentIndex >= 0) {
            if (index < currentIndex) {
                // Sudah dilewati
                stateClass = 'completed';
                dateText = formatDate(createdAt);
            } else if (index === currentIndex) {
                // Status saat ini
                stateClass = 'active';
                dateText = formatDate(createdAt);
            }
        }
        
        const item = createTimelineItem(statusItem, stateClass, dateText);
        container.appendChild(item);
    });
}

function createTimelineItem(status, stateClass, dateText) {
    const item = document.createElement('div');
    item.className = `timeline-item ${stateClass}`;
    
    let iconHtml = '';
    if (stateClass === 'completed' || stateClass === 'active') {
        iconHtml = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        `;
    }
    
    item.innerHTML = `
        <div class="timeline-icon">${iconHtml}</div>
        <div class="timeline-content">
            <div class="timeline-title">${STATUS_LABELS[status] || status}</div>
            <div class="timeline-date">${dateText}</div>
        </div>
    `;
    
    return item;
}

// Render foto
function renderFoto(fotoData) {
    const fotoGrid = document.getElementById('fotoGrid');
    const fotoSection = document.getElementById('fotoSection');
    
    if (!fotoGrid || !fotoSection) return;
    
    fotoGrid.innerHTML = '';
    
    let fotoList = [];
    
    if (fotoData) {
        if (Array.isArray(fotoData)) {
            fotoList = fotoData;
        } else if (typeof fotoData === 'string' && fotoData.trim() !== '') {
            if (fotoData.includes(',')) {
                fotoList = fotoData.split(',').map(f => f.trim());
            } else {
                fotoList = [fotoData];
            }
        }
    }
    
    if (fotoList.length === 0 || (fotoList.length === 1 && !fotoList[0])) {
        fotoSection.style.display = 'none';
        return;
    }
    
    fotoSection.style.display = 'block';
    
    fotoList.forEach((foto, index) => {
        if (!foto) return;
        
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
        img.onclick = () => window.open(fotoUrl, '_blank');
        
        img.onerror = function() {
            this.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f1f5f9;color:#94a3b8;font-size:12px;">Gagal memuat foto</div>';
        };
        
        fotoItem.appendChild(img);
        fotoGrid.appendChild(fotoItem);
    });
}

// Load detail pengaduan
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
        
        const endpoint = USE_DUMMY_DATA 
            ? API_CONFIG.ENDPOINTS.DETAIL_PENGADUAN_DUMMY 
            : API_CONFIG.ENDPOINTS.DETAIL_PENGADUAN;
        
        const response = await fetch(API_CONFIG.BASE_URL + endpoint + '?id=' + id, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            alert(result.message || 'Gagal memuat detail pengaduan');
            window.history.back();
            return;
        }
        
        const data = result.data;
        
        // Update Status Badge
        const statusBadge = document.getElementById('statusBadge');
        const statusColors = {
            'diajukan': '#1e3a5f',
            'baru': '#1e3a5f',
            'verifikasi': '#d97706',
            'proses': '#f59e0b',
            'selesai': '#059669',
            'ditolak': '#dc2626'
        };
        
        const currentStatus = data.status || 'diajukan';
        statusBadge.textContent = STATUS_LABELS[currentStatus] || capitalize(currentStatus);
        statusBadge.style.backgroundColor = statusColors[currentStatus] || '#1e3a5f';
        
        // Update Nama Pelapor
        const pelaporName = document.getElementById('pelaporName');
        if (pelaporName) {
            if (data.nama_pelapor) {
                pelaporName.textContent = data.nama_pelapor;
            } else {
                // Generate dari user_id
                const userId = parseInt(data.user_id) || 7;
                const index = Math.abs(userId - 7) % NAMA_PELAPOR.length;
                pelaporName.textContent = NAMA_PELAPOR[index];
            }
        }
        
        // Update Tanggal
        const detailDate = document.getElementById('detailDate');
        if (detailDate) {
            detailDate.textContent = formatDate(data.created_at);
        }
        
        // Update Judul
        document.getElementById('detailJudul').textContent = data.judul || '-';
        
        // Update Kategori
        const kategoriBadge = document.getElementById('detailKategori');
        if (kategoriBadge) {
            kategoriBadge.textContent = capitalize(data.kategori);
        }
        
        // Update Deskripsi
        document.getElementById('detailDeskripsi').textContent = data.deskripsi || 'Tidak ada deskripsi';
        
        // Update Lokasi
        document.getElementById('detailLokasi').textContent = data.lokasi || '-';
        
        // Update Maps Link
        const mapsLink = document.getElementById('mapsLink');
        if (mapsLink) {
            if (data.maps_link) {
                mapsLink.href = data.maps_link;
                mapsLink.style.display = 'inline-flex';
            } else {
                mapsLink.style.display = 'none';
            }
        }
        
        // Render Foto
        renderFoto(data.foto);
        
        // Render Timeline Status
        renderStatusTimeline(data.status, data.created_at);
        
        console.log('✅ Detail loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading detail:', error);
        alert('Gagal terhubung ke server');
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    console.log(' Detail Pengaduan page loaded');
    console.log('🎮 Mode:', USE_DUMMY_DATA ? 'DUMMY' : 'REAL DATABASE');
    updateUserInfo();
    loadDetailPengaduan();
});