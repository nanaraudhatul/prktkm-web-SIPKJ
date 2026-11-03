// ========================================
// DASHBOARD PETUGAS - JavaScript
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

async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/petugas/dashboard-stats.php', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        if (result.success && result.data) {
            document.getElementById('statTotal').textContent = result.data.total || 0;
            document.getElementById('statDiterima').textContent = result.data.diterima || 0;
            document.getElementById('statProses').textContent = result.data.proses || 0;
            document.getElementById('statSelesai').textContent = result.data.selesai || 0;
            await loadTugasList();
        }
    } catch (error) {
        console.error('❌ Error loading stats:', error);
    }
}

async function loadTugasList() {
    try {
        const token = localStorage.getItem('sipkj_token');
        const statusFilter = document.getElementById('filterStatus').value;
        const prioritasFilter = document.getElementById('filterPrioritas').value;
        const searchQuery = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
        
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        if (prioritasFilter) params.append('prioritas', prioritasFilter);
        
        const response = await fetch(API_CONFIG.BASE_URL + '/petugas/tugas-list.php?' + params.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success && result.data) {
            // Filter pencarian di sisi client (judul, lokasi, atau ID)
            let filteredData = result.data;
            if (searchQuery) {
                filteredData = result.data.filter(tugas => 
                    (tugas.judul && tugas.judul.toLowerCase().includes(searchQuery)) ||
                    (tugas.lokasi && tugas.lokasi.toLowerCase().includes(searchQuery)) ||
                    (tugas.id && tugas.id.toString().includes(searchQuery))
                );
            }
            
            allTugas = filteredData;
            renderTugasTable(allTugas);
            renderPriorityTask(result.data); // Gunakan data asli untuk prioritas
        }
    } catch (error) {
        console.error('❌ Error loading tugas:', error);
    }
}

function renderTugasTable(tugasList) {
    const tbody = document.getElementById('tugasTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (tugasList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada tugas yang cocok</td></tr>';
        return;
    }

    const statusConfig = {
        'diterima': { text: 'Diterima', class: 'verifikasi' },
        'proses': { text: 'Dalam Proses', class: 'proses' },
        'selesai': { text: 'Selesai', class: 'selesai' }
    };

    const prioritasConfig = {
        'tinggi': { text: 'Tinggi', class: 'tinggi' },
        'sedang': { text: 'Sedang', class: 'sedang' },
        'rendah': { text: 'Rendah', class: 'rendah' }
    };

    tugasList.forEach(tugas => {
        const status = statusConfig[tugas.status] || statusConfig['diterima'];
        const prioritas = prioritasConfig[tugas.prioritas] || prioritasConfig['sedang'];
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding:16px;"><strong>${tugas.judul || '-'}</strong></td>
            <td style="padding:16px;">${tugas.pola_masalah || '-'}</td>
            <td style="padding:16px;"><span class="priority-badge ${prioritas.class}">${prioritas.text}</span></td>
            <td style="padding:16px;">${tugas.lokasi || '-'}</td>
            <td style="padding:16px;"><span class="status-badge ${status.class}">${status.text}</span></td>
            <td style="padding:16px;">
                <button class="btn-detail" onclick="viewDetail(${tugas.id})" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#1e3a5f;color:white;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">
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

function renderPriorityTask(tugasList) {
    const container = document.getElementById('priorityTaskContainer');
    if (!container) return;
    
    const tugasPrioritas = tugasList.find(t => t.prioritas === 'tinggi') || tugasList[0];
    
    if (!tugasPrioritas) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:13px;">Belum ada tugas</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="priority-compact-item">
            <div class="priority-compact-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
            </div>
            <div class="priority-compact-info">
                <div class="priority-compact-title">${tugasPrioritas.judul || 'Tanpa Judul'}</div>
                <div class="priority-compact-location">${tugasPrioritas.lokasi || 'Lokasi tidak diketahui'}</div>
            </div>
        </div>
        <button class="btn-view-detail-compact" onclick="viewDetail(${tugasPrioritas.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
            Lihat Detail Tugas
        </button>
    `;
}

function viewDetail(id) {
    window.location.href = `detail-tugas.html?id=${id}`;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('👷 Dashboard Petugas loaded');
    updatePetugasInfo();
    loadDashboardStats();
    
    document.getElementById('filterStatus')?.addEventListener('change', loadTugasList);
    document.getElementById('filterPrioritas')?.addEventListener('change', loadTugasList);
    
    // Search functionality dengan debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadTugasList();
            }, 300);
        });
    }
});