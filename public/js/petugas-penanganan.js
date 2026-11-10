document.addEventListener('DOMContentLoaded', function() {
    console.log('Halaman Proses Penanganan dimuat');
    
    setupFormPenanganan();
});

function setupFormPenanganan() {
    const form = document.querySelector('#formPenanganan');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        console.log('Data form:', formData);
    
        alert('Status berhasil diupdate!');
        window.location.href = 'tugas-saya.html';
    });
}