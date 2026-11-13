// ============================================
// SELESAI TUGAS - JavaScript (ROBUST VERSION)
// ============================================

// Helper: ambil data dari DataManager ATAU fallback ke fetch dummy.json
async function getTaskData(taskId) {
    if (typeof DataManager !== 'undefined' && DataManager.getData) {
        await DataManager.init();
        return DataManager.getData();
    }
    // Fallback jika DataManager belum ter-load
    const response = await fetch('../../data/dummy.json');
    const data = await response.json();
    localStorage.setItem('sipkj_dummy_data', JSON.stringify(data));
    return data;
}

// Helper: update status dengan fallback
async function updateStatusFallback(taskId, newStatus) {
    // Cara 1: pakai DataManager
    if (typeof DataManager !== 'undefined' && DataManager.updateTaskStatus) {
        return DataManager.updateTaskStatus(taskId, newStatus);
    }
    // Cara 2: manual ke localStorage
    const data = JSON.parse(localStorage.getItem('sipkj_dummy_data') || '[]');
    const index = data.findIndex(t => t.id == taskId);
    if (index !== -1) {
        data[index].status = newStatus;
        const user = JSON.parse(localStorage.getItem('sipkj_user')) || {};
        data[index].petugas_id = user.id || 99;
        data[index].petugas_nama = user.username || 'Petugas Lapangan';
        localStorage.setItem('sipkj_dummy_data', JSON.stringify(data));
        return true;
    }
    return false;
}

// Helper: restore tombol ke kondisi awal
function restoreButton() {
    const btn = document.querySelector('.btn-primary');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Konfirmasi & Selesaikan Tugas
        `;
    }
}

// Fungsi utama tombol "Konfirmasi & Selesaikan Tugas"
async function konfirmasiSelesai() {
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('id');

    if (!taskId) {
        alert('ID Tugas tidak ditemukan.');
        window.location.href = 'tugas-saya.html';
        return;
    }

    if (!confirm('Apakah Anda yakin ingin menyelesaikan tugas ini?')) {
        return; // User cancel → tombol tetap normal
    }

    const btn = document.querySelector('.btn-primary');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Memproses...';
    }

    try {
        // Simulasi delay jaringan
        await new Promise(resolve => setTimeout(resolve, 800));

        const success = await updateStatusFallback(taskId, 'selesai');

        if (success) {
            alert('✅ Tugas berhasil diselesaikan dan dilaporkan ke Admin!');
            window.location.href = 'tugas-saya.html';
        } else {
            alert('⚠️ Tugas tidak ditemukan di data. Kembali ke daftar tugas.');
            restoreButton();
            window.location.href = 'tugas-saya.html';
        }
    } catch (error) {
        console.error('❌ Error konfirmasi selesai:', error);
        alert('Gagal memproses: ' + error.message);
        restoreButton(); // ✅ Tombol kembali normal, tidak stuck
    }
}

// Load data saat halaman dibuka (isi info box dinamis)
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Halaman Selesai Tugas dimuat');
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const taskId = urlParams.get('id');
        if (!taskId) return;

        const data = await getTaskData(taskId);
        const task = data.find(t => t.id == taskId);
        if (!task) return;

        // Isi info boxes dinamis
        const kendalaEl = document.querySelector('.info-grid .info-box:nth-child(1) .info-value');
        const lokasiEl = document.querySelector('.info-grid .info-box:nth-child(2) .info-value');
        const pelaporEl = document.querySelector('.info-grid .info-box:nth-child(3) .info-value');

        if (kendalaEl) kendalaEl.textContent = task.kategori
            ? task.kategori.charAt(0).toUpperCase() + task.kategori.slice(1) : '-';
        if (lokasiEl) lokasiEl.textContent = task.lokasi || '-';
        if (pelaporEl) pelaporEl.textContent = task.nama_pelapor || 'Masyarakat';
    } catch (e) {
        console.error('Error load detail:', e);
    }
});

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.removeItem('sipkj_token');
        localStorage.removeItem('sipkj_user');
        localStorage.removeItem('sipkj_role');
        window.location.href = '../auth/login.html';
    }
}