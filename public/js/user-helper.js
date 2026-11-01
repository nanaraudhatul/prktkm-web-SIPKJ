// ========================================
// USER HELPER - Update Topbar di Semua Halaman
// ========================================

function updateTopbar() {
    const userData = localStorage.getItem('sipkj_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const username = user.username || 'User';
            const role = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Masyarakat';
            
            document.querySelectorAll('.user-name').forEach(el => {
                el.textContent = username;
            });
            document.querySelectorAll('.user-role').forEach(el => {
                el.textContent = role;
            });
            
            console.log('✅ Topbar updated:', username, role);
        } catch (e) {
            console.error('❌ Error parsing user data:', e);
        }
    } else {
        console.warn('⚠️ No user data in localStorage');
    }
}

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.removeItem('sipkj_token');
        localStorage.removeItem('sipkj_user');
        localStorage.removeItem('sipkj_role');
        console.log(' User logged out');
        window.location.href = '../auth/login.html';
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

// Auto-run saat DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateTopbar);
} else {
    updateTopbar();
}