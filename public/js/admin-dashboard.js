// ========================================
// ADMIN DASHBOARD - JavaScript
// ========================================

// Check admin access
(function() {
    const token = localStorage.getItem('sipkj_token');
    const role = localStorage.getItem('sipkj_role');
    
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    if (role !== 'admin') {
        alert('Anda tidak memiliki akses sebagai admin');
        window.location.href = '../auth/login.html';
    }
})();

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.removeItem('sipkj_token');
        localStorage.removeItem('sipkj_user');
        localStorage.removeItem('sipkj_role');
        window.location.href = '../auth/login.html';
    }
}

// Update admin info
function updateAdminInfo() {
    const userData = localStorage.getItem('sipkj_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const name = user.username || 'Admin';
            document.getElementById('adminName').textContent = name;
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// Format tanggal
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/admin/dashboard-stats.php', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        console.log('📊 Dashboard stats:', result);

        if (result.success && result.data) {
            const data = result.data;
            
            document.getElementById('statTotal').textContent = data.total || 0;
            document.getElementById('statPending').textContent = data.menunggu_verifikasi || 0;
            document.getElementById('statProcess').textContent = data.dalam_proses || 0;
            document.getElementById('statDone').textContent = data.selesai || 0;
            
            // Load charts
            if (data.trend && data.trend.length > 0) {
                loadTrendChart(data.trend);
            }
            if (data.kategori && data.kategori.length > 0) {
                loadCategoryChart(data.kategori);
            }
        }
    } catch (error) {
        console.error('❌ Error loading stats:', error);
    }
}

// Load recent pengaduan
async function loadRecentPengaduan() {
    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/admin/pengaduan-list.php?limit=5', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        console.log('📋 Recent pengaduan:', result);

        const tbody = document.getElementById('recentTableBody');
        tbody.innerHTML = '';

        if (result.success && result.data && result.data.length > 0) {
            result.data.forEach(item => {
                const statusConfig = {
                    'diajukan': { text: 'Diajukan', bg: '#1e3a5f' },
                    'baru': { text: 'Diajukan', bg: '#1e3a5f' },
                    'verifikasi': { text: 'Verifikasi', bg: '#d97706' },
                    'proses': { text: 'Proses', bg: '#d97706' },
                    'selesai': { text: 'Selesai', bg: '#059669' },
                    'ditolak': { text: 'Ditolak', bg: '#dc2626' }
                };
                
                const statusInfo = statusConfig[item.status] || statusConfig['diajukan'];
                const tanggal = formatDate(item.created_at);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding:16px;"><strong>${item.judul || '-'}</strong></td>
                    <td style="padding:16px;">${item.kategori || '-'}</td>
                    <td style="padding:16px;">${item.lokasi || '-'}</td>
                    <td style="padding:16px;">
                        <span style="display:inline-flex;align-items:center;padding:6px 16px;border-radius:50px;font-size:13px;font-weight:600;color:white;background-color:${statusInfo.bg};">
                            ${statusInfo.text}
                        </span>
                    </td>
                    <td style="padding:16px;">${tanggal}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada data pengaduan</td></tr>';
        }
    } catch (error) {
        console.error(' Error loading recent:', error);
    }
}

// Load trend chart
function loadTrendChart(trendData) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    const labels = trendData.map(d => {
        const date = new Date(d.tanggal);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    });
    const data = trendData.map(d => d.jumlah);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pengaduan',
                data: data,
                borderColor: '#1e3a5f',
                backgroundColor: 'rgba(30, 58, 95, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Load category chart
function loadCategoryChart(categoryData) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    const labels = categoryData.map(d => d.kategori);
    const data = categoryData.map(d => d.jumlah);
    const colors = ['#1e3a5f', '#d97706', '#059669', '#dc2626', '#8b5cf6'];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    console.log(' Admin Dashboard loaded');
    updateAdminInfo();
    loadDashboardStats();
    loadRecentPengaduan();
});