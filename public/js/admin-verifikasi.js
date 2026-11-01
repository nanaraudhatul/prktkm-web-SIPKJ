// ========================================
// ADMIN VERIFIKASI - JavaScript
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

let allPengaduan = [];
let filteredPengaduan = [];
let currentDetailId = null;
let selectedVerifikasi = 'valid';

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
            document.getElementById('adminName').textContent = user.username || 'Admin';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// Set current date
function setCurrentDate() {
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('id-ID', options);
}

// Format tanggal
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('id-ID', options);
}

// Load stats
async function loadStats() {
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
        if (result.success && result.data) {
            document.getElementById('statTotal').textContent = result.data.total || 0;
            document.getElementById('statPending').textContent = result.data.menunggu_verifikasi || 0;
            document.getElementById('statProcess').textContent = result.data.dalam_proses || 0;
            document.getElementById('statDone').textContent = result.data.selesai || 0;
        }
    } catch (error) {
        console.error('❌ Error loading stats:', error);
    }
}

// Load verifikasi data
async function loadVerifikasiData() {
    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/admin/pengaduan-list.php', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        console.log('📋 Verifikasi data:', result);

        if (result.success && result.data) {
            allPengaduan = result.data;
            applyFilters();
        } else {
            document.getElementById('verifikasiTableBody').innerHTML = 
                '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada data</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
}

// Apply filters
function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const kategori = document.getElementById('filterKategori').value;
    const status = document.getElementById('filterStatus').value;

    filteredPengaduan = allPengaduan.filter(item => {
        const matchSearch = !search || 
            (item.judul && item.judul.toLowerCase().includes(search)) ||
            (item.lokasi && item.lokasi.toLowerCase().includes(search));
        const matchKategori = !kategori || item.kategori === kategori;
        const matchStatus = !status || item.status === status;
        return matchSearch && matchKategori && matchStatus;
    });

    renderTable();
}

// Render table
function renderTable() {
    const tbody = document.getElementById('verifikasiTableBody');
    tbody.innerHTML = '';

    if (filteredPengaduan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada data yang cocok</td></tr>';
        return;
    }

    filteredPengaduan.forEach((item, index) => {
        const statusConfig = {
            'diajukan': { text: 'Menunggu Verifikasi', class: 'menunggu' },
            'baru': { text: 'Menunggu Verifikasi', class: 'menunggu' },
            'verifikasi': { text: 'Dalam Proses', class: 'proses' },
            'proses': { text: 'Dalam Proses', class: 'proses' },
            'selesai': { text: 'Selesai', class: 'selesai' },
            'ditolak': { text: 'Ditolak', class: 'ditolak' }
        };
        
        const kategoriConfig = {
            'permukaan': { text: 'Permukaan Jalan', class: 'permukaan' },
            'fasilitas': { text: 'Fasilitas Umum', class: 'fasilitas' },
            'drainase': { text: 'Drainase', class: 'drainase' },
            'marka': { text: 'Marka Jalan', class: 'marka' },
            'lainnya': { text: 'Lainnya', class: 'lainnya' }
        };

        const statusInfo = statusConfig[item.status] || statusConfig['diajukan'];
        const kategoriInfo = kategoriConfig[item.kategori] || { text: item.kategori, class: 'lainnya' };

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="row-checkbox" data-id="${item.id}"></td>
            <td>${index + 1}</td>
            <td><strong>${item.judul || '-'}</strong></td>
            <td><span class="category-badge ${kategoriInfo.class}">${kategoriInfo.text}</span></td>
            <td>${item.lokasi || '-'}</td>
            <td>${formatDateTime(item.created_at)}</td>
            <td><span class="status-badge-verif ${statusInfo.class}">${statusInfo.text}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-verifikasi" onclick="openVerifikasiModal(${item.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                        Verifikasi
                    </button>
                    <button class="btn-more" onclick="openVerifikasiModal(${item.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="1"/>
                            <circle cx="12" cy="5" r="1"/>
                            <circle cx="12" cy="19" r="1"/>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Open verifikasi modal
async function openVerifikasiModal(id) {
    currentDetailId = id;
    const modal = document.getElementById('verifikasiModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">Memuat data...</div>';
    modal.classList.add('show');

    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/pengaduan/detail.php?id=' + id, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
            const data = result.data;
            renderModalContent(data);
        } else {
            modalBody.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">Gagal memuat data</div>';
        }
    } catch (error) {
        console.error(' Error:', error);
        modalBody.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">Gagal terhubung ke server</div>';
    }
}

// Render modal content dengan data pelapor yang benar
function renderModalContent(data) {
    const modalBody = document.getElementById('modalBody');
    
    const statusConfig = {
        'diajukan': { text: 'Menunggu Verifikasi', class: 'menunggu' },
        'baru': { text: 'Menunggu Verifikasi', class: 'menunggu' },
        'verifikasi': { text: 'Dalam Proses', class: 'proses' },
        'proses': { text: 'Dalam Proses', class: 'proses' },
        'selesai': { text: 'Selesai', class: 'selesai' },
        'ditolak': { text: 'Ditolak', class: 'ditolak' }
    };

    const kategoriConfig = {
        'permukaan': 'Permukaan Jalan',
        'fasilitas': 'Fasilitas Umum',
        'drainase': 'Drainase',
        'marka': 'Marka Jalan',
        'lainnya': 'Lainnya'
    };

    const statusInfo = statusConfig[data.status] || statusConfig['diajukan'];
    const kategoriText = kategoriConfig[data.kategori_key || data.kategori] || data.kategori;

    // Build foto grid
    let fotoHtml = '';
    const fotoList = Array.isArray(data.foto_array) ? data.foto_array : (data.foto ? [data.foto] : []);
    
    if (fotoList.length > 0) {
        if (fotoList.length === 1) {
            fotoHtml = `
                <div class="foto-grid-modal">
                    <div class="foto-main">
                        <img src="${buildFotoUrl(fotoList[0])}" alt="Foto Bukti" onerror="this.src='../../images/no-image.png'">
                    </div>
                </div>
            `;
        } else {
            const mainFoto = fotoList[0];
            const sideFotos = fotoList.slice(1, 3);
            fotoHtml = `
                <div class="foto-grid-modal">
                    <div class="foto-main">
                        <img src="${buildFotoUrl(mainFoto)}" alt="Foto Bukti" onerror="this.src='../../images/no-image.png'">
                    </div>
                    <div class="foto-side">
                        ${sideFotos.map(f => `
                            <div class="foto-side-item">
                                <img src="${buildFotoUrl(f)}" alt="Foto Bukti" onerror="this.src='../../images/no-image.png'">
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    } else {
        fotoHtml = '<div style="padding:40px;text-align:center;color:#94a3b8;background:#f8fafc;border-radius:10px;">Tidak ada foto</div>';
    }

    // ✅ Ambil data pelapor yang benar
    const pelaporName = data.pelapor || 'Unknown';
    const pelaporEmail = data.email_pelapor || data.email || '-';
    const pelaporTelepon = data.telepon_pelapor || data.telepon || '-';
    const pelaporRole = data.role_pelapor || 'Masyarakat';
    const initial = pelaporName.charAt(0).toUpperCase();

    modalBody.innerHTML = `
        <span class="modal-status-badge ${statusInfo.class}">${statusInfo.text}</span>
        <h2 class="modal-judul">${data.judul}</h2>
        
        <div class="modal-meta">
            <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                </svg>
                ${data.lokasi || '-'}
            </span>
            <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                ${formatDateTime(data.created_at)}
            </span>
        </div>

        <span class="modal-kategori-badge">${kategoriText}</span>

        ${fotoHtml}

        <div class="info-section">
            <div class="info-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                PELAPOR
            </div>
            <div class="pelapor-info">
                <div class="pelapor-avatar">${initial}</div>
                <div class="pelapor-details">
                    <div class="pelapor-name">
                        ${pelaporName}
                        <span class="pelapor-role">${pelaporRole}</span>
                    </div>
                    <div class="pelapor-contact">
                        <span>📞 ${pelaporTelepon}</span>
                        <span>✉️ ${pelaporEmail}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="info-section">
            <div class="info-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                DESKRIPSI
            </div>
            <div class="deskripsi-box">${data.deskripsi || '-'}</div>
        </div>

        <!-- AI Prediction Section -->
        <div class="ai-prediction-box" id="aiPredictionBox">
            <div class="ai-prediction-header">
                <div class="ai-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
                        <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/>
                        <circle cx="9" cy="18" r="1" fill="currentColor"/>
                        <circle cx="15" cy="18" r="1" fill="currentColor"/>
                    </svg>
                </div>
                <div>
                    <h4 class="ai-title">Prediksi AI (Naive Bayes)</h4>
                    <p class="ai-subtitle">Menganalisis pola teks secara otomatis...</p>
                </div>
            </div>
            
            <div class="ai-loading" id="aiLoading">
                <div class="ai-loading-dots">
                    <span></span><span></span><span></span>
                </div>
                <span style="font-size:13px;color:#64748b;">Sedang menganalisis deskripsi...</span>
            </div>
            
            <div id="aiResult" style="display:none;"></div>
        </div>

        <div class="modal-divider"></div>

        <div class="verifikasi-form">
            <div class="verifikasi-form-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="10"/>
                </svg>
                VERIFIKASI ADMIN
            </div>

            <label class="radio-option selected" id="optionValid" onclick="selectVerifikasi('valid')">
                <input type="radio" name="verifikasi" value="valid" checked>
                <div class="radio-option-content">
                    <div class="radio-option-title">Valid</div>
                    <div class="radio-option-desc">Pengaduan sesuai dan layak diproses</div>
                </div>
            </label>

            <label class="radio-option" id="optionInvalid" onclick="selectVerifikasi('invalid')">
                <input type="radio" name="verifikasi" value="invalid">
                <div class="radio-option-content">
                    <div class="radio-option-title">Tidak Valid</div>
                    <div class="radio-option-desc">Data tidak sesuai / duplikat</div>
                </div>
            </label>

            <div class="catatan-verifikasi">
                <label>Catatan Verifikasi (opsional)</label>
                <textarea id="catatanVerifikasi" placeholder="Tulis catatan verifikasi..."></textarea>
            </div>
        </div>

        <div class="modal-footer">
            <button class="btn-tolak" onclick="submitVerifikasi('ditolak')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Tolak
            </button>
            <button class="btn-verifikasi-final" onclick="submitVerifikasi('proses')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4"/>
                </svg>
                Verifikasi
            </button>
        </div>
    `;

    // Panggil Naive Bayes API
    runNaiveBayes(data);
}

// ========================================
// NAIVE BAYES CLASSIFIER
// ========================================
async function runNaiveBayes(data) {
    const aiLoading = document.getElementById('aiLoading');
    const aiResult = document.getElementById('aiResult');
    
    if (!aiLoading || !aiResult) return;

    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/admin/naive-bayes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                judul: data.judul || '',
                deskripsi: data.deskripsi || '',
                kategori: data.kategori || ''
            })
        });

        const result = await response.json();
        console.log('🤖 Naive Bayes result:', result);

        if (result.success && result.prediction) {
            const pred = result.prediction;
            
            // Hide loading
            aiLoading.style.display = 'none';
            aiResult.style.display = 'block';

            // Build match badge
            let matchBadge = '';
            if (pred.match_status === 'match') {
                matchBadge = `<span class="ai-match-badge match">✓ Sesuai dengan kategori user</span>`;
            } else if (pred.match_status === 'mismatch') {
                matchBadge = `<span class="ai-match-badge mismatch">⚠ Berbeda dengan kategori user (${pred.user_category})</span>`;
            }

            // Build scores breakdown
            let scoresHtml = '';
            if (result.all_scores) {
                const maxScore = Math.max(...Object.values(result.all_scores));
                const minScore = Math.min(...Object.values(result.all_scores));
                const range = maxScore - minScore || 1;
                
                const categoryLabels = {
                    'permukaan': 'Permukaan Jalan',
                    'drainase': 'Drainase',
                    'fasilitas': 'Fasilitas Umum',
                    'marka': 'Marka Jalan',
                    'lainnya': 'Lainnya'
                };

                const sortedScores = Object.entries(result.all_scores).sort((a, b) => b[1] - a[1]);
                
                scoresHtml = '<div class="ai-scores-breakdown">';
                sortedScores.forEach(([cat, score]) => {
                    const percentage = ((score - minScore) / range * 100).toFixed(0);
                    const isTop = cat === pred.category;
                    scoresHtml += `
                        <div class="ai-score-item">
                            <div class="ai-score-label" style="${isTop ? 'font-weight:700;color:#1e3a5f;' : ''}">
                                ${categoryLabels[cat] || cat}
                            </div>
                            <div class="ai-score-bar-container">
                                <div class="ai-score-bar" style="width:${percentage}%;${isTop ? 'background:#059669;' : ''}"></div>
                            </div>
                            <div class="ai-score-value" style="${isTop ? 'color:#059669;' : ''}">
                                ${percentage}%
                            </div>
                        </div>
                    `;
                });
                scoresHtml += '</div>';
            }

            aiResult.innerHTML = `
                <div class="ai-prediction-result">
                    <div class="ai-predicted-category">
                        <div class="ai-category-label">Kategori Terprediksi</div>
                        <div class="ai-category-value">${pred.category_label}</div>
                        ${matchBadge}
                    </div>
                    <div class="ai-confidence-box">
                        <div class="ai-confidence-label">Confidence</div>
                        <div class="ai-confidence-value">${pred.confidence}%</div>
                    </div>
                </div>
                <div class="ai-confidence-bar">
                    <div class="ai-confidence-fill" style="width:0%"></div>
                </div>
                ${scoresHtml}
            `;

            // Animate confidence bar
            setTimeout(() => {
                const fill = aiResult.querySelector('.ai-confidence-fill');
                if (fill) fill.style.width = pred.confidence + '%';
            }, 100);

        } else {
            aiLoading.style.display = 'none';
            aiResult.style.display = 'block';
            aiResult.innerHTML = '<div style="padding:16px;text-align:center;color:#94a3b8;">Gagal menganalisis</div>';
        }
    } catch (error) {
        console.error('❌ Naive Bayes error:', error);
        aiLoading.style.display = 'none';
        aiResult.style.display = 'block';
        aiResult.innerHTML = '<div style="padding:16px;text-align:center;color:#ef4444;">Gagal terhubung ke server</div>';
    }
}

function selectVerifikasi(value) {
    selectedVerifikasi = value;
    document.getElementById('optionValid').classList.toggle('selected', value === 'valid');
    document.getElementById('optionInvalid').classList.toggle('selected', value === 'invalid');
    document.querySelector('#optionValid input').checked = value === 'valid';
    document.querySelector('#optionInvalid input').checked = value === 'invalid';
}

// Build foto URL
function buildFotoUrl(fotoNama) {
    if (!fotoNama) return '';
    if (fotoNama.startsWith('http://') || fotoNama.startsWith('https://')) return fotoNama;
    if (fotoNama.startsWith('/sipkj/')) return 'http://localhost' + fotoNama;
    return 'http://localhost/sipkj/backend/uploads/' + fotoNama;
}

// Submit verifikasi
async function submitVerifikasi(newStatus) {
    if (!currentDetailId) return;

    const catatan = document.getElementById('catatanVerifikasi')?.value || '';
    const btnVerifikasi = document.querySelector('.btn-verifikasi-final');
    const btnTolak = document.querySelector('.btn-tolak');

    btnVerifikasi.disabled = true;
    btnTolak.disabled = true;
    btnVerifikasi.innerHTML = 'Memproses...';

    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/admin/verifikasi-pengaduan.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                pengaduan_id: currentDetailId,
                status: newStatus,
                catatan: catatan,
                valid: selectedVerifikasi === 'valid'
            })
        });

        const result = await response.json();
        console.log('✅ Verifikasi response:', result);

        if (result.success) {
            alert(result.message || 'Verifikasi berhasil!');
            closeModal();
            loadVerifikasiData();
            loadStats();
        } else {
            alert(result.message || 'Gagal memverifikasi');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Gagal terhubung ke server');
    } finally {
        btnVerifikasi.disabled = false;
        btnTolak.disabled = false;
        btnVerifikasi.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
            </svg>
            Verifikasi
        `;
    }
}

function closeModal() {
    document.getElementById('verifikasiModal').classList.remove('show');
    currentDetailId = null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    updateAdminInfo();
    setCurrentDate();
    loadStats();
    loadVerifikasiData();

    // Filter listeners
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 500));
    document.getElementById('filterKategori').addEventListener('change', applyFilters);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);

    // Select all checkbox
    document.getElementById('selectAll').addEventListener('change', function() {
        document.querySelectorAll('.row-checkbox').forEach(cb => {
            cb.checked = this.checked;
        });
    });

    // Close modal on overlay click
    document.getElementById('verifikasiModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
});

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}