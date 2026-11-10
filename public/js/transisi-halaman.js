// ============================================
// ANIMASI HALUS SAAT HALAMAN DIMUAT (TANPA SPLASH SCREEN)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Animasi fade-in halus saat halaman selesai dimuat
    const pageContent = document.querySelector('.page-content');
    if (pageContent) {
        // Delay 50ms agar browser merender layout dulu
        setTimeout(() => {
            pageContent.classList.add('loaded');
        }, 50);
    }
});