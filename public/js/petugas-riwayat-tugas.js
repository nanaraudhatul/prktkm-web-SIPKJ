// ============================================
// RIWAYAT TUGAS - JavaScript (HANYA STATUS SELESAI)
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Halaman Riwayat Tugas dimuat');
    
    // 1. Inisialisasi DataManager
    if (typeof DataManager !== 'undefined') {
        await DataManager.init();
    } else {
        console.error('DataManager tidak ditemukan! Pastikan data-manager.js sudah di-load.');
    }
    
    // 2. Muat nama petugas
    updatePetugasInfo();
    
    // 2b. Normalkan select status agar sesuai Figma ("Semua Status", abu, aktif)
    normalizeStatusFilter();
    
    // 3. Muat data awal (Hanya yang Selesai)
    await loadRiwayatTugas();
    
    // 4. Setup Event Listeners untuk Filter
    setupFilterListeners();
});

function updatePetugasInfo() {
    
}

// Helper: Normalkan select status (hapus disabled, ubah opsi jadi "Semua Status")
function normalizeStatusFilter() {
    const sel = document.getElementById('statusFilter');
    if (!sel) return;
    sel.removeAttribute('disabled');
    sel.style.color = '#1e293b';
    sel.style.background = '#f8fafc';
    sel.style.cursor = 'pointer';
    sel.innerHTML =
        '<option value="semua">Semua Status</option>' +
        '<option value="Selesai" selected>Selesai</option>';
}

// Helper untuk mendapatkan info prioritas (dengan Icon SVG, bukan titik)
function getPriorityInfo(kategori) {
    const kat = (kategori || '').toLowerCase();

    // Icon Segitiga Peringatan
    const iconWarning = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    // Icon Info (untuk rendah)
    const iconInfo = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

    if (kat === 'drainase' || kat === 'fasilitas') {
        return {
            text: 'Prioritas Tinggi',
            color: '#e11d48',
            bg: '#fff0f2',
            border: '#ffdae1',
            icon: iconWarning
        };
    }
    if (kat === 'marka') {
        return {
            text: 'Prioritas Rendah',
            color: '#059669',
            bg: '#eafff5',
            border: '#cdf5e3',
            icon: iconInfo
        };
    }
    return {
        text: 'Prioritas Sedang',
        color: '#c17a00',
        bg: '#fff8e8',
        border: '#ffedc5',
        icon: iconWarning
    };
}

async function loadRiwayatTugas() {
    console.log('Memuat riwayat tugas (Status: Selesai)...');
    
    const tbody = document.getElementById('historyTable');
    const emptyMessage = document.getElementById('emptyMessage');
    
    if (!tbody) return;

    try {
        // Ambil data dari DataManager
        const data = typeof DataManager !== 'undefined' ? DataManager.getData() : [];
        
        // ⭐ PERBARUAN: HANYA ambil tugas yang statusnya 'selesai'
        const riwayatData = data.filter(item => {
            const status = (item.status || '').toLowerCase();
            return status === 'selesai';
        });
        
        // Urutkan dari yang paling baru selesai
        riwayatData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        tbody.innerHTML = '';
        
        if (riwayatData.length === 0) {
            if (emptyMessage) emptyMessage.hidden = false;
            return;
        }
        
        if (emptyMessage) emptyMessage.hidden = true;
        
        riwayatData.forEach((item, index) => {
            const prio = getPriorityInfo(item.kategori);
            const dateObj = new Date(item.created_at);
            
            // Format tanggal: "20 Okt 2025"
            const tanggalStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            // Format waktu: "14:30"
            const waktuStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            
            const row = document.createElement('tr');
            // Tambahkan data attribute agar fungsi filterHistory() bisa bekerja
            row.setAttribute('data-id', item.id);
            row.setAttribute('data-status', 'Selesai'); // Hardcode karena halaman ini khusus Selesai
            row.setAttribute('data-priority', prio.text);
            row.style.borderBottom = '1px solid #e2e8f0';
            
            row.innerHTML = `
                <td style="padding: 16px; font-size: 13px; color: #64748b;">${index + 1}</td>
                <td style="padding: 16px; font-size: 13px; font-weight: 600; color: #1e293b;">${item.judul}</td>
                <td style="padding: 16px; font-size: 13px; color: #64748b;">${item.lokasi}</td>
                <td style="padding: 16px;">
                    <span style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; background: ${prio.bg}; color: ${prio.color}; border: 1px solid ${prio.border}; border-radius: 20px; font-size: 11px; font-weight: 600;">
                        ${prio.icon}
                        ${prio.text}
                    </span>
                </td>
                <td style="padding: 16px;">
                    <span style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; background: #d1fae5; color: #059669; border: 1px solid #c9f4e2; border-radius: 20px; font-size: 11px; font-weight: 600;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Selesai
                    </span>
                </td>
                <td style="padding: 16px; font-size: 13px; color: #64748b;">
                    <div>${tanggalStr}</div>
                    <small style="display: block; color: #94a3b8; font-size: 11px; margin-top: 2px;">${waktuStr}</small>
                </td>
                <td style="padding: 16px; text-align: center;">
                    <button onclick="viewDetail(${item.id})" 
                            style="padding: 7px 16px; border: 1.5px solid #e2e8f0; background: white; color: #1e3a5f; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Lihat
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Gagal memuat riwayat tugas:', error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: #ef4444;">Gagal memuat data riwayat.<br><small>${error.message}</small></td></tr>`;
    }
}

// Setup Event Listeners untuk Filter
function setupFilterListeners() {
    const btnCari = document.getElementById('btnFilter');
    if (btnCari) {
        btnCari.addEventListener('click', filterHistory);
    }
}

// Fungsi Filter (Hanya memfilter berdasarkan Prioritas, karena Status sudah pasti 'Selesai')
function filterHistory() {
    const priority = document.getElementById("priorityFilter")?.value || "semua";
    const rows = document.querySelectorAll("#historyTable tr");
    let visible = 0;

    rows.forEach(row => {
        const rowPriority = row.dataset.priority || "";
        
        // Karena halaman ini khusus "Selesai", kita hanya filter berdasarkan Prioritas
        const priorityMatch = priority === "semua" || rowPriority === priority;
        
        if (priorityMatch) {
            row.style.display = "";
            visible++;
        } else {
            row.style.display = "none";
        }
    });

    const emptyMessage = document.getElementById("emptyMessage");
    if (emptyMessage) {
        emptyMessage.hidden = visible !== 0;
    }
}

function viewDetail(taskId) {
    window.location.href = `detail-pengaduan.html?id=${taskId}`;
}

function handleLogout() {
    if(confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('sipkj_token');
        localStorage.removeItem('sipkj_user');
        localStorage.removeItem('sipkj_role');
        window.location.href = '../auth/login.html';
    }
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

document.addEventListener('click', function(e) {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    if (window.innerWidth <= 992) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});