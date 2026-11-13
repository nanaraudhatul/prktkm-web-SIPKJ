// ============================================
// PROSES PENANGANAN - JavaScript
// ============================================

// 1. Check petugas access
(function() {
    const token = localStorage.getItem('sipkj_token');
    const role = localStorage.getItem('sipkj_role');
    if (!token || role !== 'petugas') {
        window.location.href = '../auth/login.html';
    }
})();

// 2. Load Data saat halaman dibuka
document.addEventListener('DOMContentLoaded', async function() {
    await DataManager.init();
    
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('id');
    
    if (!taskId) {
        window.location.href = 'tugas-saya.html';
        return;
    }

    const task = DataManager.getTaskById(taskId);
    if (task) {
        // Isi data ke HTML
        document.getElementById('taskIdBadge').textContent = `ID: ${task.id}`;
        document.getElementById('taskTitle').textContent = task.judul || 'Tanpa Judul';
        document.getElementById('taskKendala').textContent = task.kategori ? task.kategori.charAt(0).toUpperCase() + task.kategori.slice(1) : '-';
        document.getElementById('taskLocation').textContent = task.lokasi || '-';
        document.getElementById('taskPelapor').textContent = task.nama_pelapor || 'Masyarakat';
    }

    // 3. Setup Tombol Konfirmasi
    const btnKonfirmasi = document.getElementById('btnKonfirmasiProses');
    if (btnKonfirmasi) {
        btnKonfirmasi.addEventListener('click', async function() {
            // Efek loading
            const originalText = btnKonfirmasi.innerHTML;
            btnKonfirmasi.innerHTML = `<svg class="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12" stroke-linecap="round"></circle></svg> Memproses...`;
            btnKonfirmasi.disabled = true;

            // Simulasi delay jaringan (800ms)
            setTimeout(() => {
                // UPDATE STATUS DI LOCALSTORAGE
                const success = DataManager.updateTaskStatus(taskId, 'proses');
                
                if (success) {
                    alert('✅ Status berhasil diperbarui menjadi "Dalam Proses"!\nAnda akan diarahkan kembali ke daftar Tugas Saya.');
                    window.location.href = 'tugas-saya.html';
                } else {
                    alert('❌ Gagal memperbarui status. Silakan coba lagi.');
                    btnKonfirmasi.innerHTML = originalText;
                    btnKonfirmasi.disabled = false;
                }
            }, 800);
        });
    }
});

function handleLogout() {
    if(confirm('Apakah Anda yakin ingin logout?')) {
        localStorage.clear();
        window.location.href = '../auth/login.html';
    }
}