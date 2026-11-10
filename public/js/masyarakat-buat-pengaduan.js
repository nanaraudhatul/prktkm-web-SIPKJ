// ========================================
// BUAT PENGADUAN - JavaScript
// ========================================

// Protect page - cek login
if (typeof Auth !== 'undefined' && Auth.protectPage) {
    Auth.protectPage();
}

// ========================================
// SIDEBAR TOGGLE - DESKTOP & MOBILE
// ========================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const overlay = document.getElementById('sidebarOverlay');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mode mobile: gunakan class 'open'
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
    } else {
        // Mode desktop: gunakan class 'closed'
        sidebar.classList.toggle('closed');
        if (mainContent) mainContent.classList.toggle('expanded');
    }
}

// Tutup sidebar ketika klik di luar (mobile)
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

// Update character counter
function updateCharCount(textarea) {
    const counter = document.getElementById('charCount');
    if (counter) {
        counter.textContent = textarea.value.length;
    }
}

// Setup upload area
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
let selectedFile = null;

if (uploadArea && fileInput) {
    // Click to upload
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

function handleFileSelect(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        alert('❌ Format file tidak valid! Hanya JPG, JPEG, atau PNG yang diperbolehkan.');
        fileInput.value = '';
        return;
    }

    if (file.size > maxSize) {
        alert('❌ Ukuran file terlalu besar! Maksimal 5MB.');
        fileInput.value = '';
        return;
    }

    selectedFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const container = document.getElementById('uploadedFiles');
        const status = document.getElementById('fileStatus');
        
        container.innerHTML = `
            <div class="file-preview">
                <img src="${e.target.result}" alt="Preview">
                <div class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
                <button class="remove-file" onclick="removeFile()">✕</button>
            </div>
        `;
        
        if (status) {
            status.textContent = `✅ ${file.name} siap diunggah`;
            status.style.color = '#059669';
        }
    };
    reader.readAsDataURL(file);
}

function removeFile() {
    selectedFile = null;
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
    
    const container = document.getElementById('uploadedFiles');
    if (container) container.innerHTML = '';
    
    const status = document.getElementById('fileStatus');
    if (status) {
        status.textContent = '';
        status.style.color = '';
    }
}

// Handle form submit
const pengaduanForm = document.getElementById('pengaduanForm');
if (pengaduanForm) {
    pengaduanForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            alert('⚠️ Wajib mengunggah minimal 1 foto bukti kerusakan!');
            return;
        }

        const btn = document.getElementById('submitBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = 'Mengirim...';
        btn.disabled = true;

        // Gunakan FormData untuk mengirim data + file
        const formData = new FormData();
        formData.append('judul', document.getElementById('judul').value.trim());
        formData.append('kategori', document.getElementById('kategori').value);
        formData.append('deskripsi', document.getElementById('deskripsi').value.trim());
        formData.append('lokasi', document.getElementById('lokasi').value.trim());
        formData.append('maps_link', document.getElementById('maps_link').value.trim());
        formData.append('foto', selectedFile);

        console.log('📤 Mengirim data pengaduan...');

        try {
            const token = localStorage.getItem('sipkj_token');
            if (!token) {
                throw new Error('Token tidak ditemukan. Silakan login ulang.');
            }

            // PENTING: Jangan set Content-Type saat pakai FormData!
            const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.CREATE_PENGADUAN, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                body: formData
            });

            console.log('Status:', response.status);
            
            // Cek content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Response bukan JSON:', text.substring(0, 200));
                throw new Error('Server response bukan JSON. Periksa error PHP.');
            }

            const result = await response.json();
            console.log('✅ Response:', result);

            if (response.ok && result.success) {
                alert('✅ ' + result.message);
                // Redirect ke halaman Pengaduan Saya
                window.location.href = 'pengaduan-saya.html';
            } else {
                throw new Error(result.message || 'Gagal mengirim pengaduan');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            alert('❌ Error: ' + error.message);
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    });
}

// Init - Update user info
document.addEventListener('DOMContentLoaded', () => {
    console.log('📝 Halaman Buat Pengaduan siap');
    
    // Update user name
    const userData = localStorage.getItem('sipkj_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const nameEl = document.getElementById('userName');
            if (nameEl) nameEl.textContent = user.username || 'User';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
});

// ========================================
// MAIN CONTENT TRANSITION
// ========================================

function smoothContentTransition(targetUrl) {
    const mainContent = document.getElementById('mainContent') || document.querySelector('.main-content');
    
    if (mainContent) {
        // Tambahkan class animasi keluar ke main content
        mainContent.classList.add('page-transition-out');
        
        // Tunggu animasi selesai, lalu pindah halaman
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 300); // Sesuaikan dengan durasi animasi CSS (0.3s = 300ms)
    } else {
        // Fallback jika main content tidak ditemukan
        window.location.href = targetUrl;
    }
}

// Intercept semua klik pada link navigasi
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    
    if (link && link.tagName === 'A' && link.href) {
        const isInternal = link.href.startsWith(window.location.origin);
        const isHash = link.getAttribute('href').startsWith('#') || link.getAttribute('href') === '';
        const isJavascript = link.getAttribute('href').startsWith('javascript:');
        const isNewTab = link.getAttribute('target') === '_blank';
        const isDownload = link.hasAttribute('download');
        const isNoTransition = link.classList.contains('no-transition');
        
        // Hanya jalankan animasi untuk link internal yang valid
        if (isInternal && !isHash && !isJavascript && !isNewTab && !isDownload && !isNoTransition) {
            e.preventDefault();
            smoothContentTransition(link.href);
        }
    }
});

// Tambahkan smooth scroll untuk anchor links
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

// Trigger animasi stagger saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.animation = 'contentFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    }
});