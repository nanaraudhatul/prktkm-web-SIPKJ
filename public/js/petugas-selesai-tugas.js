document.addEventListener('DOMContentLoaded', function() {
    console.log('Halaman Selesai Tugas dimuat');
    
    setupFormSelesai();
});

function setupFormSelesai() {
    const form = document.querySelector('#formSelesai');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        console.log('Data penyelesaian:', formData);
        
        alert('Tugas berhasil diselesaikan!');
        window.location.href = 'tugas-saya.html';
    });
}