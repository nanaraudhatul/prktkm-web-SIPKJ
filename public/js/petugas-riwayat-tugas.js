document.addEventListener('DOMContentLoaded', function() {
    console.log('Halaman Riwayat Tugas dimuat');
    
    loadRiwayatTugas();
});

function loadRiwayatTugas() {
    console.log('Memuat riwayat tugas...');
    
    // Data dummy - ganti dengan fetch API nanti
    const riwayatData = [
        { id: 1, judul: 'Lampu jalan mati', lokasi: 'Jl. Sudirman', tanggal: '14 Apr 2025', status: 'Selesai' },
        { id: 2, judul: 'Rambu roboh', lokasi: 'Jl. Kastela', tanggal: '10 Apr 2025', status: 'Selesai' }
    ];
    
    const tbody = document.querySelector('#riwayatTable tbody');
    if (tbody) {
        tbody.innerHTML = '';
        riwayatData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${item.judul}</strong></td>
                <td>${item.lokasi}</td>
                <td>${item.tanggal}</td>
                <td><span class="status-badge status-done">${item.status}</span></td>
            `;
            tbody.appendChild(row);
        });
    }
}