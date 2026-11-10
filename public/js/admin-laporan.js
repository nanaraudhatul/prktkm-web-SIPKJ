// ========================================
// ADMIN LAPORAN - JavaScript (DUMMY MODE)
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
let allLaporanData = [];

// Daftar Kecamatan
const KECAMATAN_LIST = [
    'Ternate Utara',
    'Ternate Tengah',
    'Ternate Selatan',
    'Ternate Barat',
    'Pulau Ternate',
];

// ========================================
// UTILITY & SIDEBAR FUNCTIONS
// ========================================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const overlay = document.getElementById('sidebarOverlay');
    
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
    } else {
        sidebar.classList.toggle('closed');
        if (mainContent) mainContent.classList.toggle('expanded');
    }
}

document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const overlay = document.getElementById('sidebarOverlay');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile && sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('show');
        }
    }
});

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
    console.log('🔍 Applying filters:', getFilterValues());
    loadLaporanStats();
}

function resetFilter() {
    document.getElementById('filterTanggal').value = 'this-year';
    document.getElementById('filterWilayah').value = '';
    document.getElementById('filterKategori').value = '';
    document.getElementById('filterStatus').value = '';
    console.log('🔄 Filters reset to Tahun Ini');
    loadLaporanStats();
}

// ========================================
// LOAD DATA & PROCESS STATS (DUMMY MODE)
// ========================================

async function loadLaporanStats() {
    try {
        const filters = getFilterValues();
        
        // Fetch data dummy langsung dari file JSON
        const response = await fetch('../../data/dummy.json');
        if (!response.ok) throw new Error('Gagal memuat file dummy.json');
        
        const rawData = await response.json();
        
        // 1. Filter Data berdasarkan pilihan user
        const filteredData = rawData.filter(item => {
            let match = true;
            const itemDate = new Date(item.created_at);
            const now = new Date();
            
            // Filter Tanggal
            if (filters.tanggal === 'this-month') {
                match = match && (itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear());
            } else if (filters.tanggal === 'last-month') {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                match = match && (itemDate.getMonth() === lastMonth.getMonth() && itemDate.getFullYear() === lastMonth.getFullYear());
            } else if (filters.tanggal === 'this-year') {
                match = match && (itemDate.getFullYear() === now.getFullYear());
            }
            
            // Filter Wilayah
            if (filters.wilayah) {
                const kec = normalizeKecamatan(item.lokasi);
                match = match && (kec === filters.wilayah);
            }
            
            // Filter Kategori
            if (filters.kategori) {
                match = match && (item.kategori === filters.kategori);
            }
            
            // Filter Status
            if (filters.status) {
                match = match && (item.status === filters.status);
            }
            
            return match;
        });
        
        allLaporanData = filteredData;
        processAndRenderStats(filteredData, filters.tanggal);
        
    } catch (error) {
        console.error('❌ Error loading stats:', error);
        document.getElementById('chartTotalLabel').textContent = 'Gagal memuat data';
    }
}

function processAndRenderStats(data, periodeFilter) {
    const total = data.length;
    
    // Period Label
    let periodLabel = 'Semua Periode';
    const now = new Date();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    if (periodeFilter === 'this-month') periodLabel = `${months[now.getMonth()]} ${now.getFullYear()}`;
    else if (periodeFilter === 'last-month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodLabel = `${months[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`;
    } else if (periodeFilter === 'this-year') {
        periodLabel = `Tahun ${now.getFullYear()}`;
    }

    // 1. Trend Data (6 bulan terakhir)
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = months[d.getMonth()].substring(0, 3); // e.g., 'Jan'
        
        const masuk = data.filter(item => {
            const itemDate = new Date(item.created_at);
            return itemDate.getMonth() === d.getMonth() && itemDate.getFullYear() === d.getFullYear();
        }).length;
        
        const selesai = data.filter(item => {
            const itemDate = new Date(item.created_at);
            return item.status === 'selesai' && itemDate.getMonth() === d.getMonth() && itemDate.getFullYear() === d.getFullYear();
        }).length;
        
        trendData.push({ bulan: monthName, masuk, selesai });
    }

    // 2. Kategori Data
    const kategoriCount = {};
    data.forEach(item => {
        const kat = item.kategori || 'lainnya';
        kategoriCount[kat] = (kategoriCount[kat] || 0) + 1;
    });
    
    const kategoriLabels = {
        'permukaan': 'Permukaan Jalan',
        'fasilitas': 'Fasilitas Umum',
        'drainase': 'Drainase',
        'marka': 'Marka Jalan',
        'lainnya': 'Lainnya'
    };
    
    const kategoriData = Object.entries(kategoriCount).map(([key, value]) => ({
        kategori: key,
        kategori_label: kategoriLabels[key] || key,
        jumlah: value
    })).sort((a, b) => b.jumlah - a.jumlah);

    // 3. Top Wilayah
    const wilayahCount = {};
    data.forEach(item => {
        const kec = normalizeKecamatan(item.lokasi) || 'Lainnya';
        wilayahCount[kec] = (wilayahCount[kec] || 0) + 1;
    });
    
    const topWilayah = Object.entries(wilayahCount)
        .map(([nama, jumlah]) => ({ nama, jumlah }))
        .sort((a, b) => b.jumlah - a.jumlah)
        .slice(0, 5);

    // 4. Efisiensi & Insight
    const currentMonthData = data.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    });
    
    const currentMonthMasuk = currentMonthData.length;
    const currentMonthSelesai = currentMonthData.filter(d => d.status === 'selesai').length;
    const efisiensi = currentMonthMasuk > 0 ? Math.round((currentMonthSelesai / currentMonthMasuk) * 100) : 0;
    
    let insight = `Total ${total} laporan ditemukan.`;
    if (total > 0 && kategoriData.length > 0) {
        const maxKat = kategoriData[0];
        insight = `Kategori paling banyak dilaporkan adalah ${maxKat.kategori_label} (${maxKat.jumlah} laporan).`;
    }

    // Update UI Elements
    document.getElementById('chartPeriod').textContent = periodLabel;
    document.getElementById('chartTotalLabel').textContent = `${total} Laporan Total`;
    document.getElementById('donutTotal').textContent = total;
    document.getElementById('insightText').textContent = insight;
    document.getElementById('efisiensiValue').textContent = `${efisiensi}%`;
    document.getElementById('efisiensiBulan').textContent = months[now.getMonth()];

    // Load Charts
    loadTrendChart(trendData);
    loadCategoryChart(kategoriData, total);
    loadTopWilayah(topWilayah);
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
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    ticks: { stepSize: 1 }
                },
                x: {
                    grid: { display: false }
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
    
    // ✅ WARNA YANG DISESUAIKAN DENGAN GAMBAR
    const colors = ['#1e3a5f', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
    const classes = ['permukaan', 'fasilitas', 'drainase', 'marka', 'lainnya'];

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
                legend: { display: false }
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
// INIT & EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Admin Laporan page loaded (Dummy Mode)');
    updateAdminInfo();
    
    // 1. Set default filter ke Tahun Ini
    document.getElementById('filterTanggal').value = 'this-year';
    
    // 2. Load data pertama kali dengan filter default
    loadLaporanStats();
    
    // 3. Tambahkan event listener agar filter otomatis apply saat diubah
    document.getElementById('filterTanggal').addEventListener('change', applyFilter);
    document.getElementById('filterWilayah').addEventListener('change', applyFilter);
    document.getElementById('filterKategori').addEventListener('change', applyFilter);
    document.getElementById('filterStatus').addEventListener('change', applyFilter);

    // 4. Trigger animasi stagger saat halaman dimuat
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.animation = 'contentFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    }
});

// ========================================
// MAIN CONTENT TRANSITION
// ========================================

function smoothContentTransition(targetUrl) {
    const mainContent = document.getElementById('mainContent') || document.querySelector('.main-content');
    
    if (mainContent) {
        mainContent.classList.add('page-transition-out');
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 300);
    } else {
        window.location.href = targetUrl;
    }
}

document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    
    if (link && link.tagName === 'A' && link.href) {
        const isInternal = link.href.startsWith(window.location.origin);
        const isHash = link.getAttribute('href').startsWith('#') || link.getAttribute('href') === '';
        const isJavascript = link.getAttribute('href').startsWith('javascript:');
        const isNewTab = link.getAttribute('target') === '_blank';
        const isDownload = link.hasAttribute('download');
        const isNoTransition = link.classList.contains('no-transition');
        
        if (isInternal && !isHash && !isJavascript && !isNewTab && !isDownload && !isNoTransition) {
            e.preventDefault();
            smoothContentTransition(link.href);
        }
    }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});