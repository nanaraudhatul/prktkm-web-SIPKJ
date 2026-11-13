// ============================================
// DATA MANAGER (Simulasi Database dengan LocalStorage)
// ============================================
const DataManager = {
    // 1. Inisialisasi: Salin dummy.json ke localStorage jika belum ada
    async init() {
        if (!localStorage.getItem('sipkj_dummy_data')) {
            try {
                const response = await fetch('../../data/dummy.json');
                const data = await response.json();
                localStorage.setItem('sipkj_dummy_data', JSON.stringify(data));
                console.log('✅ Data dummy berhasil dimuat ke penyimpanan lokal');
            } catch (error) {
                console.error('❌ Gagal memuat data dummy:', error);
            }
        }
    },

    // 2. Ambil semua data
    getData() {
        return JSON.parse(localStorage.getItem('sipkj_dummy_data')) || [];
    },

    // 3. Ambil satu tugas berdasarkan ID
    getTaskById(id) {
        return this.getData().find(t => t.id == id);
    },

    // 4. Update status tugas
    updateTaskStatus(id, newStatus) {
        let data = this.getData();
        const index = data.findIndex(t => t.id == id);
        
        if (index !== -1) {
            data[index].status = newStatus;
            
            // Simpan juga ID petugas yang mengerjakan (simulasi)
            const currentUser = JSON.parse(localStorage.getItem('sipkj_user')) || {};
            data[index].petugas_id = currentUser.id || 99;
            data[index].petugas_nama = currentUser.username || 'Petugas Lapangan';
            
            localStorage.setItem('sipkj_dummy_data', JSON.stringify(data));
            return true;
        }
        return false;
    }
};