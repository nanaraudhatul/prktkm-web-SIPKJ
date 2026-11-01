// ========================================
// BUAT PENGADUAN - JavaScript
// ========================================

// Protect page - cek login
if (typeof Auth !== 'undefined' && Auth.protectPage) {
    Auth.protectPage();
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
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
            alert(' Wajib mengunggah minimal 1 foto bukti kerusakan!');
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

        console.log(' Mengirim data pengaduan...');

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

// Init
document.addEventListener('DOMContentLoaded', () => {
    console.log(' Halaman Buat Pengaduan siap');
});