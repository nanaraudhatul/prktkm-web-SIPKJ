// ============================================
// TUGAS SAYA - JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Halaman Tugas Saya dimuat');

    loadTugasSaya();
    setupFilters();
    setupKerjakanButton();
});

// Fungsi untuk load daftar tugas
function loadTugasSaya() {
 
    console.log('Memuat daftar tugas...');
    const tugasDummy = [
        { id: 1, judul: 'Lampu jalan mati', lokasi: 'Jl. Sudirman', prioritas: 'Tinggi' },
        { id: 2, judul: 'Rambu roboh', lokasi: 'Jl. Kastela', prioritas: 'Sedang' },
        { id: 3, judul: 'Jalan berlubang', lokasi: 'Jl. Maluku Utara', prioritas: 'Rendah' }
    ];
    
    tampilkanTugas(tugasDummy);
}
function tampilkanTugas(data) {
    const tbody = document.querySelector('#taskTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = ''; 
    
    data.forEach((tugas, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${tugas.judul}</strong></td>
            <td>${tugas.lokasi}</td>
            <td><span class="priority ${tugas.prioritas.toLowerCase()}">● ${tugas.prioritas}</span></td>
            <td>
                <button class="btn-kerjakan" onclick="kerjakanTask(${tugas.id})">
                    Kerjakan
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}
function setupFilters() {
    const filterSelects = document.querySelectorAll('.filter-control select');
    
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            console.log('Filter berubah:', this.value);
        });
    });
}

function setupKerjakanButton() {
}

function kerjakanTask(id) {
    console.log('Mengerjakan tugas ID:', id);
    window.location.href = `tindak-lanjut-tugas.html?id=${id}`;
}