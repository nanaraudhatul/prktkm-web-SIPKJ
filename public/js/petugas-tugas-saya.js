// ============================================
// TUGAS SAYA - JavaScript (DUMMY MODE)
// ============================================

// 1. Check petugas access
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
let selectedTaskId = null;

// 2. Utility Functions
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getPriorityWeight(kategori) {
    const kat = (kategori || '').toLowerCase();
    if (kat === 'drainase' || kat === 'fasilitas') return 3;
    if (kat === 'permukaan' || kat === 'lainnya') return 2;
    if (kat === 'marka') return 1;
    return 2;
}

function getPriorityInfo(kategori) {
    const weight = getPriorityWeight(kategori);
    if (weight === 3) return { text: 'Tinggi', class: 'high', weight: 3 };
    if (weight === 1) return { text: 'Rendah', class: 'low', weight: 1 };
    return { text: 'Sedang', class: 'medium', weight: 2 };
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
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

// 3. Load Data menggunakan DataManager
async function loadTugasSaya() {
    try {
        console.log('🔄 Memuat daftar tugas petugas...');
        
        // Pastikan data dummy sudah di-load ke localStorage
        await DataManager.init();
        
        // Ambil data terbaru dari localStorage
        const data = DataManager.getData();
        
        // Filter: Tampilkan tugas yang statusnya 'verifikasi' ATAU 'proses'
        // (Agar Anda bisa melihat perubahan status setelah konfirmasi)
        let tugasAktif = data.filter(item => {
            const status = (item.status || '').toLowerCase();
            return status === 'verifikasi' || status === 'proses';
        });
        
        // SORTING: Urutkan berdasarkan Prioritas (Tertinggi dulu), lalu Tanggal (Terbaru dulu)
        allTugas = tugasAktif.sort((a, b) => {
            const weightA = getPriorityWeight(a.kategori);
            const weightB = getPriorityWeight(b.kategori);
            
            if (weightB !== weightA) {
                return weightB - weightA;
            }
            return new Date(b.created_at) - new Date(a.created_at);
        });
        
        console.log(`✅ Berhasil memuat ${allTugas.length} tugas aktif`);
        renderTable(allTugas);
        
        if (allTugas.length > 0) {
            selectTask(allTugas[0].id);
        } else {
            showEmptyDetail();
        }
        
    } catch (error) {
        console.error('❌ Error loading tugas:', error);
        const tbody = document.getElementById('taskTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:#ef4444;">Gagal memuat data.<br><small>${error.message}</small></td></tr>`;
        }
    }
}

// 4. Render Tabel
function renderTable(data) {
    const tbody = document.getElementById('taskTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada tugas yang cocok dengan filter</td></tr>';
        return;
    }
    
    data.forEach((tugas, index) => {
        const prio = getPriorityInfo(tugas.kategori);
        const lokasiParts = tugas.lokasi ? tugas.lokasi.split(',') : [];
        const street = lokasiParts[0] ? lokasiParts[0].trim() : tugas.lokasi;
        const area = lokasiParts[1] ? lokasiParts[1].trim() : 'Ternate';

        const row = document.createElement('tr');
        row.id = `row-${tugas.id}`;
        row.onclick = () => selectTask(tugas.id);
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${tugas.judul}</strong></td>
            <td>
                <div class="location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${street}
                </div>
                <small>${area}</small>
            </td>
            <td><span class="priority ${prio.class}">● ${prio.text}</span></td>
            <td style="text-align: center;">
                <button class="btn-kerjakan" onclick="event.stopPropagation(); kerjakanTask(${tugas.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                    </svg>
                    Kerjakan
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 5. Select Task & Update Detail Panel
function selectTask(id) {
    document.querySelectorAll('.data-table tbody tr').forEach(row => row.classList.remove('selected'));
    const selectedRow = document.getElementById(`row-${id}`);
    if (selectedRow) selectedRow.classList.add('selected');
    
    selectedTaskId = id;
    const task = allTugas.find(t => t.id === id);
    if (!task) return;

    document.getElementById('detailPriority').style.display = 'inline-block';
    document.getElementById('progressCard').style.display = 'flex';
    document.getElementById('detailInfoGrid').style.display = 'grid';
    document.getElementById('detailDescSection').style.display = 'block';
    document.getElementById('detailLocSection').style.display = 'block';
    document.getElementById('btnUpdateStatus').style.display = 'flex';

    document.getElementById('detailTitle').textContent = task.judul;
    
    const prio = getPriorityInfo(task.kategori);
    const priorityEl = document.getElementById('detailPriority');
    priorityEl.textContent = `● ${prio.text}`;
    priorityEl.className = `detail-priority ${prio.class}`;

    const date = new Date(task.created_at);
    date.setDate(date.getDate() + 7);
    const options = { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' };
    document.getElementById('detailDeadline').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align: middle; margin-right: 4px;">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        ${date.toLocaleDateString('id-ID', options)}
    `;

    // Update Status Badge di Detail Panel sesuai status asli
    const statusText = task.status === 'proses' ? 'Dalam Proses Pengerjaan' : 'Diverifikasi (Siap Dikerjakan)';
    const statusColor = task.status === 'proses' ? '#f59e0b' : '#10b981';
    document.getElementById('detailStatus').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="${statusColor}" stroke-width="2" width="14" height="14" style="vertical-align: middle; margin-right: 4px;">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span style="color:${statusColor}">${statusText}</span>
    `;

    document.getElementById('detailDesc').textContent = task.deskripsi || 'Tidak ada deskripsi yang diberikan.';
    
    const lokasiParts = task.lokasi ? task.lokasi.split(',') : [];
    document.getElementById('detailLocation').textContent = lokasiParts[0] ? lokasiParts[0].trim() : task.lokasi;
    document.getElementById('detailArea').textContent = lokasiParts[1] ? lokasiParts[1].trim() : 'Ternate';

    // Progress Bar Logic
    let progress = task.status === 'proses' ? 66 : 33; 
    updateProgress(progress);
}

function showEmptyDetail() {
    document.getElementById('detailTitle').textContent = 'Tidak ada tugas yang dipilih';
    document.getElementById('detailPriority').style.display = 'none';
    document.getElementById('progressCard').style.display = 'none';
    document.getElementById('detailInfoGrid').style.display = 'none';
    document.getElementById('detailDescSection').style.display = 'none';
    document.getElementById('detailLocSection').style.display = 'none';
    document.getElementById('btnUpdateStatus').style.display = 'none';
}

function updateProgress(progress) {
    const progressLine = document.getElementById('progressTrack');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');
    
    [step1, step2, step3, step4].forEach(step => {
        step.className = 'progress-step';
    });
    
    progressLine.style.width = progress + '%';
    
    if (progress >= 100) {
        step1.classList.add('done'); step2.classList.add('done'); step3.classList.add('done'); step4.classList.add('done');
    } else if (progress >= 66) {
        step1.classList.add('done'); step2.classList.add('done'); step3.classList.add('current');
    } else if (progress >= 33) {
        step1.classList.add('done'); step2.classList.add('current');
    } else {
        step1.classList.add('current');
    }
}

// 6. Actions
function kerjakanTask(id) {
    window.location.href = `tindak-lanjut-tugas.html?id=${id}`;
}

function updateStatus() {
    if (!selectedTaskId) return;
    console.log('Mengarahkan ke halaman penyelesaian tugas ID:', selectedTaskId);
    // Redirect ke halaman Selesai Tugas dengan membawa ID
    window.location.href = `selesai-tugas.html?id=${selectedTaskId}`;
}

function resetFilters() {
    document.getElementById('filterLokasi').value = '';
    document.getElementById('filterPrioritas').value = '';
    applyFilters();
}

function applyFilters() {
    const filterLokasi = document.getElementById('filterLokasi').value.toLowerCase();
    const filterPrioritas = document.getElementById('filterPrioritas').value.toLowerCase();
    
    const filtered = allTugas.filter(tugas => {
        let matchLokasi = true;
        if (filterLokasi) {
            matchLokasi = tugas.lokasi && tugas.lokasi.toLowerCase().includes(filterLokasi);
        }
        
        let matchPrioritas = true;
        if (filterPrioritas) {
            const prio = getPriorityInfo(tugas.kategori);
            matchPrioritas = prio.text.toLowerCase() === filterPrioritas;
        }
        
        return matchLokasi && matchPrioritas;
    });
    
    renderTable(filtered);
    if (filtered.length > 0) {
        selectTask(filtered[0].id);
    } else {
        showEmptyDetail();
    }
}

// 7. Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('👷 Halaman Tugas Saya dimuat');
    updatePetugasInfo();
    loadTugasSaya();
    
    document.getElementById('filterLokasi')?.addEventListener('change', applyFilters);
    document.getElementById('filterPrioritas')?.addEventListener('change', applyFilters);
    
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