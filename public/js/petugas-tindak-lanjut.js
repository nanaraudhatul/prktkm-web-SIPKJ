// ============================================
// TINDAK LANJUT TUGAS - JavaScript (DUMMY MODE)
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

// 2. Utility Functions
function getPriorityInfo(kategori) {
    const kat = (kategori || '').toLowerCase();
    if (kat === 'drainase' || kat === 'fasilitas') return { text: 'Tinggi', class: 'high' };
    if (kat === 'marka') return { text: 'Rendah', class: 'low' };
    return { text: 'Sedang', class: 'medium' };
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

// 3. Load Task Detail menggunakan DataManager
async function loadTaskDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('id');

    if (!taskId) {
        alert('ID Tugas tidak ditemukan di URL.');
        window.location.href = 'tugas-saya.html';
        return;
    }

    try {
        console.log(`🔄 Memuat detail tugas ID: ${taskId}...`);
        
        // Pastikan data dummy sudah di-load ke localStorage
        await DataManager.init();
        
        // Ambil data spesifik dari localStorage
        const task = DataManager.getTaskById(taskId);

        if (!task) {
            alert('Data tugas tidak ditemukan.');
            window.location.href = 'tugas-saya.html';
            return;
        }

        console.log('✅ Data tugas ditemukan:', task);
        renderTaskDetail(task);

    } catch (error) {
        console.error('❌ Error loading task detail:', error);
        document.getElementById('taskTitle').textContent = 'Gagal memuat data tugas.';
        document.getElementById('taskDescription').textContent = error.message;
    }
}

// 4. Render Data to HTML
function renderTaskDetail(task) {
    document.getElementById('taskTitle').textContent = task.judul || 'Tanpa Judul';
    document.getElementById('taskDescription').textContent = task.deskripsi || 'Tidak ada deskripsi yang diberikan.';

    const lokasiParts = task.lokasi ? task.lokasi.split(',') : [];
    document.getElementById('taskLocation').textContent = lokasiParts[0] ? lokasiParts[0].trim() : task.lokasi;
    document.getElementById('taskCity').textContent = lokasiParts[1] ? lokasiParts[1].trim() : 'Kota Ternate';
    
    const mapsQuery = encodeURIComponent(task.lokasi + ', Kota Ternate');
    document.getElementById('mapsLink').href = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

    const prio = getPriorityInfo(task.kategori);
    const badge = document.getElementById('priorityBadge');
    badge.textContent = `Prioritas ${prio.text}`;
    badge.className = `priority-badge ${prio.class}`;

    const date = new Date(task.created_at);
    date.setDate(date.getDate() + 7);
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('taskDeadline').textContent = date.toLocaleDateString('id-ID', options) + ' WIB';

    updateStatusAndTimeline(task.status);

    const workButton = document.getElementById('workButton');
    if (workButton) {
        workButton.onclick = () => {
            window.location.href = `proses-penanganan.html?id=${task.id}`;
        };
    }
}

// 5. Update Timeline Visuals based on Status
function updateStatusAndTimeline(status) {
    const s = (status || '').toLowerCase();
    const statusBadge = document.getElementById('currentStatusBadge');
    
    const steps = [
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3'),
        document.getElementById('step4')
    ];
    
    steps.forEach(step => {
        step.className = 'progress-step pending';
        const circle = step.querySelector('.step-circle');
        circle.innerHTML = '<span class="step-dot"></span>';
    });

    if (s === 'verifikasi') {
        statusBadge.innerHTML = '<span class="status-dot"></span> Diverifikasi (Siap Dikerjakan)';
        statusBadge.className = 'received-badge';
        steps[0].className = 'progress-step completed';
        steps[0].querySelector('.step-circle').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>';
        steps[1].className = 'progress-step completed';
        steps[1].querySelector('.step-circle').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>';
        steps[2].className = 'progress-step pending active';
    } 
    else if (s === 'proses') {
        statusBadge.innerHTML = '<span class="status-dot" style="background:#f59e0b;"></span> Dalam Proses';
        statusBadge.className = 'received-badge';
        steps[0].className = 'progress-step completed';
        steps[0].querySelector('.step-circle').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>';
        steps[1].className = 'progress-step completed';
        steps[1].querySelector('.step-circle').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>';
        steps[2].className = 'progress-step completed';
        steps[2].querySelector('.step-circle').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>';
        steps[3].className = 'progress-step pending active';
    }
    else if (s === 'selesai') {
        statusBadge.innerHTML = '<span class="status-dot" style="background:#10b981;"></span> Selesai';
        statusBadge.className = 'received-badge';
        steps.forEach((step) => {
            step.className = 'progress-step completed';
            step.querySelector('.step-circle').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>';
        });
        const workButton = document.getElementById('workButton');
        if (workButton) workButton.style.display = 'none';
    }
}

// 6. Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('🛠️ Halaman Tindak Lanjut Tugas dimuat');
    updatePetugasInfo();
    loadTaskDetail();
});