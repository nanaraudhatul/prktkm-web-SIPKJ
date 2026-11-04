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
        alert('Akses ditolak. Halaman ini khusus untuk administrator.');
        window.location.href = '../auth/login.html';
    }
})();

let trendChartInstance = null;
let categoryChartInstance = null;

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.removeItem('sipkj_token');
        localStorage.removeItem('sipkj_user');
        localStorage.removeItem('sipkj_role');
        window.location.href = '../auth/login.html';
    }
}

// Update admin info di topbar
function updateAdminInfo() {
    const userData = localStorage.getItem('sipkj_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const el = document.getElementById('adminName');
            if (el) el.textContent = user.username || 'Administrator';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// ✅ Update tanggal saat ini di header
function updateCurrentDate() {
    const dateEl = document.querySelector('#currentDate span');
    if (dateEl) {
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const formatted = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
        dateEl.textContent = formatted;
    }
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
            const stats = result.data;
            document.getElementById('statTotal').textContent = stats.total || 0;
            document.getElementById('statPending').textContent = stats.menunggu_verifikasi || 0;
            document.getElementById('statProcess').textContent = stats.proses || 0;
            document.getElementById('statDone').textContent = stats.selesai || 0;
            
            // Load charts and table
            await loadTrendChart();
            await loadCategoryChart();
            await loadRecentPengaduan();
        }
    } catch (error) {
        console.error('❌ Error loading stats:', error);
    }
}

// Load Trend Chart (7 Hari Terakhir)
async function loadTrendChart() {
    try {
        const token = localStorage.getItem('sipkj_token');
        
        const response = await fetch(API_CONFIG.BASE_URL + '/admin/trend-pengaduan.php', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        console.log('📈 Trend data:', result);

        if (result.success && result.data) {
            renderTrendChart(result.data);
        }
    } catch (error) {
        console.error('❌ Error loading trend:', error);
    }
}

// Render Trend Chart dengan Smooth Curve
function renderTrendChart(data) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Destroy existing chart
    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    // Extract labels and data
    const labels = data.map(item => {
        const date = new Date(item.tanggal);
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const dayName = days[date.getDay()];
        return `${dayName}, ${date.getDate()} ${getMonthName(date.getMonth())}`;
    });
    
    const values = data.map(item => item.jumlah || 0);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(30, 58, 95, 0.3)');
    gradient.addColorStop(1, 'rgba(30, 58, 95, 0.0)');

    // Create chart
    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Pengaduan',
                data: values,
                borderColor: '#1e3a5f',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#1e3a5f',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4 // Smooth curve
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#64748b',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Jumlah: ' + context.parsed.y + ' pengaduan';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 2,
                        color: '#94a3b8',
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    },
                    grid: {
                        color: '#f1f5f9',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Load Category Chart
async function loadCategoryChart() {
    try {
        const token = localStorage.getItem('sipkj_token');
        
        const response = await fetch(API_CONFIG.BASE_URL + '/admin/kategori-pengaduan.php', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        console.log('📊 Category data:', result);

        if (result.success && result.data) {
            renderCategoryChart(result.data);
        }
    } catch (error) {
        console.error('❌ Error loading category:', error);
    }
}

// Render Category Chart
function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Destroy existing chart
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    const labels = data.map(item => item.kategori || 'Lainnya');
    const values = data.map(item => item.jumlah || 0);

    // Warna disesuaikan dengan tema Navy
    const colors = [
        '#1e3a5f', // Navy (Utama)
        '#3b82f6', // Biru
        '#f59e0b', // Kuning/Oranye
        '#10b981', // Hijau
        '#ef4444', // Merah
        '#8b5cf6'  // Ungu
    ];

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            family: 'Inter',
                            size: 12
                        },
                        color: '#64748b'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#64748b',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// Load Recent Pengaduan
async function loadRecentPengaduan() {
    try {
        const token = localStorage.getItem('sipkj_token');
        
        const response = await fetch(API_CONFIG.BASE_URL + '/pengaduan/list.php?limit=5', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        console.log('📋 Recent pengaduan:', result);

        if (result.success && result.data) {
            renderRecentTable(result.data);
        }
    } catch (error) {
        console.error('❌ Error loading recent:', error);
    }
}

// Render Recent Table
function renderRecentTable(pengaduanList) {
    const tbody = document.getElementById('recentTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (pengaduanList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#94a3b8;">Belum ada pengaduan</td></tr>';
        return;
    }

    // ✅ Updated to match the latest CSS classes (.menunggu, .proses, .selesai, .ditolak)
    const statusConfig = {
        'diajukan': { text: 'Diajukan', class: 'menunggu' },
        'verifikasi': { text: 'Verifikasi', class: 'menunggu' },
        'proses': { text: 'Proses', class: 'proses' },
        'selesai': { text: 'Selesai', class: 'selesai' },
        'ditolak': { text: 'Ditolak', class: 'ditolak' }
    };

    pengaduanList.forEach(pengaduan => {
        const status = statusConfig[pengaduan.status] || statusConfig['diajukan'];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding:16px;"><strong>${pengaduan.judul || '-'}</strong></td>
            <td style="padding:16px;">${pengaduan.kategori || '-'}</td>
            <td style="padding:16px;">${pengaduan.lokasi || '-'}</td>
            <td style="padding:16px;"><span class="status-badge ${status.class}">${status.text}</span></td>
            <td style="padding:16px;">${formatDate(pengaduan.created_at)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Helper: Get month name
function getMonthName(monthIndex) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[monthIndex];
}

// Helper: Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('👨‍💼 Admin Dashboard loaded');
    updateAdminInfo();
    updateCurrentDate(); // ✅ Menampilkan tanggal hari ini di header
    loadDashboardStats();
});