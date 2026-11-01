// ========================================
// ADMIN LAPORAN - JavaScript
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

let trendChart = null;
let categoryChart = null;

// Daftar Kecamatan
const KECAMATAN_LIST = [
    'Ternate Utara',
    'Ternate Tengah',
    'Ternate Selatan',
    'Ternate Barat',
    'Pulau Ternate',
    'Moti',
    'Batang 2',
    'Hiri'
];

// ========================================
// UTILITY FUNCTIONS
// ========================================

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

function updateAdminInfo() {
    const userData = localStorage.getItem('sipkj_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            document.getElementById('adminName').textContent = user.username || 'Admin';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// Normalisasi nama kecamatan dari lokasi
function normalizeKecamatan(lokasi) {
    if (!lokasi) return null;
    const lokasiLower = lokasi.toLowerCase();
    
    for (const kec of KECAMATAN_LIST) {
        if (lokasiLower.includes(kec.toLowerCase())) {
            return kec;
        }
    }
    
    // Mapping alternatif
    if (lokasiLower.includes('melati') || lokasiLower.includes('tengah')) return 'Ternate Tengah';
    if (lokasiLower.includes('sudirman') || lokasiLower.includes('selatan')) return 'Ternate Selatan';
    if (lokasiLower.includes('anggrek') || lokasiLower.includes('utara')) return 'Ternate Utara';
    if (lokasiLower.includes('bastiong') || lokasiLower.includes('barat')) return 'Ternate Barat';
    if (lokasiLower.includes('pulau') || lokasiLower.includes('ternate')) return 'Pulau Ternate';
    if (lokasiLower.includes('moti')) return 'Moti';
    if (lokasiLower.includes('batang')) return 'Batang 2';
    if (lokasiLower.includes('hiri')) return 'Hiri';
    
    return null;
}

// ========================================
// FILTER FUNCTIONS
// ========================================

function getFilterValues() {
    return {
        tanggal: document.getElementById('filterTanggal').value,
        wilayah: document.getElementById('filterWilayah').value,
        kategori: document.getElementById('filterKategori').value,
        status: document.getElementById('filterStatus').value
    };
}

function applyFilter() {
    loadLaporanStats();
}

function resetFilter() {
    document.getElementById('filterTanggal').value = 'this-quarter';
    document.getElementById('filterWilayah').value = '';
    document.getElementById('filterKategori').value = '';
    document.getElementById('filterStatus').value = '';
    loadLaporanStats();
}

// ========================================
// LOAD DATA
// ========================================

async function loadLaporanStats() {
    try {
        const token = localStorage.getItem('sipkj_token');
        const filters = getFilterValues();
        
        const params = new URLSearchParams(filters).toString();
        const response = await fetch(API_CONFIG.BASE_URL + '/admin/laporan-stats.php?' + params, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        console.log('📊 Laporan stats:', result);

        if (!response.ok) {
            console.error('❌ API Error:', result.message);
            return;
        }

        if (result.success && result.data) {
            const data = result.data;
            
            // Update chart period
            document.getElementById('chartPeriod').textContent = data.period_label || 'Loading...';
            document.getElementById('chartTotalLabel').textContent = (data.total || 0) + ' Laporan Total';
            document.getElementById('donutTotal').textContent = data.total || 0;
            
            // Update insight
            if (data.insight) {
                document.getElementById('insightText').textContent = data.insight;
            }
            
            // Update efisiensi
            if (data.efisiensi_bulan) {
                document.getElementById('efisiensiValue').textContent = data.efisiensi + '%';
                document.getElementById('efisiensiBulan').textContent = data.efisiensi_bulan;
            }
            
            // Load charts
            if (data.trend) {
                loadTrendChart(data.trend);
            }
            if (data.kategori) {
                loadCategoryChart(data.kategori, data.total);
            }
            if (data.top_wilayah) {
                loadTopWilayah(data.top_wilayah);
            }
        }
    } catch (error) {
        console.error('❌ Error loading stats:', error);
    }
}

// ========================================
// CHART FUNCTIONS
// ========================================

function loadTrendChart(trendData) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    if (trendChart) {
        trendChart.destroy();
    }

    const labels = trendData.map(d => d.bulan);
    const laporanMasuk = trendData.map(d => d.masuk);
    const selesaiDiperbaiki = trendData.map(d => d.selesai);

    trendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Laporan Masuk',
                    data: laporanMasuk,
                    backgroundColor: '#cbd5e1',
                    borderRadius: 4,
                    barPercentage: 0.6
                },
                {
                    label: 'Selesai Diperbaiki',
                    data: selesaiDiperbaiki,
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                    barPercentage: 0.6
                }
            ]
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
                    grid: {
                        color: '#f1f5f9'
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function loadCategoryChart(kategoriData, total) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) {
        categoryChart.destroy();
    }

    const labels = kategoriData.map(d => d.kategori_label);
    const data = kategoriData.map(d => d.jumlah);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const classes = ['permukaan', 'fasilitas', 'drainase', 'marka', 'lainnya'];

    // Build custom legend
    const legendContainer = document.getElementById('categoryLegend');
    legendContainer.innerHTML = '';
    kategoriData.forEach((item, index) => {
        const pct = total > 0 ? Math.round((item.jumlah / total) * 100) : 0;
        const div = document.createElement('div');
        div.className = 'legend-item';
        div.innerHTML = `
            <div class="legend-color ${classes[index] || 'lainnya'}"></div>
            <div class="legend-label">${item.kategori_label}</div>
            <div class="legend-value">${pct}% (${item.jumlah})</div>
        `;
        legendContainer.appendChild(div);
    });

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function loadTopWilayah(wilayahData) {
    const container = document.getElementById('topWilayahList');
    container.innerHTML = '';
    
    if (!wilayahData || wilayahData.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;">Tidak ada data</div>';
        return;
    }
    
    const maxCount = Math.max(...wilayahData.map(w => w.jumlah));

    wilayahData.forEach((item, index) => {
        const pct = maxCount > 0 ? (item.jumlah / maxCount) * 100 : 0;
        const div = document.createElement('div');
        div.className = 'wilayah-item';
        div.innerHTML = `
            <div class="wilayah-rank">${index + 1}.</div>
            <div class="wilayah-name">${item.nama}</div>
            <div class="wilayah-bar-container">
                <div class="wilayah-bar" style="width: ${pct}%"></div>
            </div>
            <div class="wilayah-count">${item.jumlah} Laporan</div>
        `;
        container.appendChild(div);
    });
}

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Admin Laporan page loaded');
    updateAdminInfo();
    loadLaporanStats();
});