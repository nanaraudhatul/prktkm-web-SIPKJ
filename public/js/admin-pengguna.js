// ========================================
// ADMIN PENGGUNA - JavaScript (DUMMY MODE)
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

let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
const itemsPerPage = 10;

// ========================================
// GENERATE DUMMY USERS (36 Users)
// ========================================
function generateDummyUsers() {
    const users = [];
    
    // 1. Admin (1 orang)
    users.push({
        id: 1,
        username: 'admin',
        email: 'admin@sipkj.go.id',
        telepon: '081234567890',
        role: 'admin',
        is_verified: 1,
        created_at: '2026-09-01 08:00:00',
        nama_lengkap: 'Administrator SIPKJ'
    });
    
    // 2. Petugas (5 orang)
    const kecamatanList = ['utara', 'tengah', 'selatan', 'barat', 'pulau'];
    kecamatanList.forEach((kec, index) => {
        users.push({
            id: 2 + index,
            username: `petugas_${kec}`,
            email: `petugas.${kec}@sipkj.go.id`,
            telepon: `08123456789${index + 1}`,
            role: 'petugas',
            is_verified: 1,
            created_at: '2026-09-01 08:00:00',
            nama_lengkap: `Petugas ${capitalizeFirst(kec)}`
        });
    });
    
    // 3. Masyarakat (30 orang)
    const namaDepan = ['Budi', 'Siti', 'Ahmad', 'Dewi', 'Rizky', 'Nurul', 'Eko', 'Rina', 'Agus', 'Maya', 'Hendra', 'Fitriani', 'Doni', 'Lina', 'Yudi', 'Ani', 'Bambang', 'Citra', 'Dedi', 'Eka', 'Rahmat', 'Indah', 'Joko', 'Sri', 'Tono', 'Umi', 'Vina', 'Wawan', 'Yuni', 'Zainal'];
    const namaBelakang = ['Santoso', 'Aminah', 'Fauzi', 'Lestari', 'Pratama', 'Hidayah', 'Prasetyo', 'Wulandari', 'Setiawan', 'Sari', 'Gunawan', 'Kusuma', 'Marlina', 'Hermawan', 'Suryani', 'Sutrisno', 'Dewi', 'Kurniawan', 'Putri', 'Hidayat', 'Permata', 'Widodo', 'Wahyuni', 'Supriyadi', 'Kalsum', 'Garut', 'Setiawan', 'Shara', 'Abidin'];
    
    for (let i = 0; i < 30; i++) {
        const id = 7 + i;
        const username = `masyarakat${String(i + 1).padStart(2, '0')}`;
        const nama = `${namaDepan[i]} ${namaBelakang[i]}`;
        users.push({
            id: id,
            username: username,
            email: `${username}@email.com`,
            telepon: `0812345679${String(i).padStart(2, '0')}`,
            role: 'masyarakat',
            is_verified: 1,
            created_at: `2026-09-${String(i + 1).padStart(2, '0')} 08:00:00`,
            nama_lengkap: nama
        });
    }
    
    return users;
}

// ========================================
// FUNGSI TOGGLE SIDEBAR
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

function setCurrentDate() {
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', options);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========================================
// LOAD DATA & STATS
// ========================================
function loadUsers() {
    // Generate dummy users secara lokal
    allUsers = generateDummyUsers();
    applyFilters();
    updateStats();
}

function updateStats() {
    const total = allUsers.length;
    const masyarakat = allUsers.filter(u => u.role === 'masyarakat').length;
    const petugas = allUsers.filter(u => u.role === 'petugas').length;
    const admin = allUsers.filter(u => u.role === 'admin').length;
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statMasyarakat').textContent = masyarakat;
    document.getElementById('statPetugas').textContent = petugas;
    document.getElementById('statAdmin').textContent = admin;
}

// ========================================
// FILTER & RENDER
// ========================================
function applyFilters() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const role = document.getElementById('filterRole')?.value || '';
    
    filteredUsers = allUsers.filter(user => {
        const matchSearch = !search || 
            (user.username && user.username.toLowerCase().includes(search)) ||
            (user.email && user.email.toLowerCase().includes(search)) ||
            (user.nama_lengkap && user.nama_lengkap.toLowerCase().includes(search));
            
        const matchRole = !role || user.role === role;
        
        return matchSearch && matchRole;
    });
    
    currentPage = 1;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada data pengguna yang cocok</td></tr>';
        renderPagination(0);
        return;
    }
    
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageUsers = filteredUsers.slice(startIndex, endIndex);
    
    pageUsers.forEach((user, index) => {
        const row = document.createElement('tr');
        const statusClass = user.is_verified ? 'aktif' : 'nonaktif';
        const statusText = user.is_verified ? 'Aktif' : 'Nonaktif';
        const namaTampil = user.nama_lengkap || user.username;
        
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td><strong>${namaTampil}</strong><br><small style="color:#64748b;">@${user.username}</small></td>
            <td>${user.email}</td>
            <td>${user.telepon || '-'}</td>
            <td><span class="role-badge ${user.role}">${capitalizeFirst(user.role)}</span></td>
            <td><span class="status-badge-user ${statusClass}">${statusText}</span></td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="openEditUserModal(${user.id})" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-delete" onclick="deleteUser(${user.id})" title="Hapus">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('tablePagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous
    const prevBtn = document.createElement('button');
    prevBtn.className = `pagination-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '‹';
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    };
    pagination.appendChild(prevBtn);
    
    // Numbers
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => {
            currentPage = i;
            renderTable();
        };
        pagination.appendChild(btn);
    }
    
    // Next
    const nextBtn = document.createElement('button');
    nextBtn.className = `pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '›';
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    };
    pagination.appendChild(nextBtn);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterRole').value = '';
    applyFilters();
}

// ========================================
// MODAL FUNCTIONS (SIMULASI)
// ========================================
function openAddUserModal() {
    document.getElementById('modalTitle').textContent = 'Tambah Pengguna';
    document.getElementById('userId').value = '';
    document.getElementById('formUsername').value = '';
    document.getElementById('formEmail').value = '';
    document.getElementById('formTelepon').value = '';
    document.getElementById('formRole').value = 'masyarakat';
    document.getElementById('formPassword').value = '';
    document.getElementById('formStatus').value = 'aktif';
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('formMessage').style.display = 'none';
    document.getElementById('userModal').classList.add('show');
}

function openEditUserModal(id) {
    const user = allUsers.find(u => u.id === id);
    if (!user) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Pengguna';
    document.getElementById('userId').value = user.id;
    document.getElementById('formUsername').value = user.username;
    document.getElementById('formEmail').value = user.email;
    document.getElementById('formTelepon').value = user.telepon || '';
    document.getElementById('formRole').value = user.role;
    document.getElementById('formStatus').value = user.is_verified ? 'aktif' : 'nonaktif';
    document.getElementById('passwordGroup').style.display = 'none'; // Hide password on edit
    document.getElementById('formMessage').style.display = 'none';
    document.getElementById('userModal').classList.add('show');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
}

function saveUser() {
    const id = document.getElementById('userId').value;
    const username = document.getElementById('formUsername').value.trim();
    const email = document.getElementById('formEmail').value.trim();
    const telepon = document.getElementById('formTelepon').value.trim();
    const role = document.getElementById('formRole').value;
    const password = document.getElementById('formPassword').value;
    const status = document.getElementById('formStatus').value;
    const msgBox = document.getElementById('formMessage');
    
    if (!username || !email || !role) {
        msgBox.textContent = 'Username, email, dan role wajib diisi!';
        msgBox.className = 'message-box error';
        msgBox.style.display = 'block';
        return;
    }
    
    if (!id && !password) {
        msgBox.textContent = 'Password wajib diisi untuk pengguna baru!';
        msgBox.className = 'message-box error';
        msgBox.style.display = 'block';
        return;
    }
    
    // Simulasi simpan berhasil
    msgBox.textContent = id ? 'Pengguna berhasil diperbarui! (Mode Dummy)' : 'Pengguna berhasil ditambahkan! (Mode Dummy)';
    msgBox.className = 'message-box success';
    msgBox.style.display = 'block';
    
    setTimeout(() => {
        closeUserModal();
        // Di sistem nyata, panggil loadUsers() di sini untuk refresh tabel
    }, 1000);
}

function deleteUser(id) {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
        alert('Pengguna berhasil dihapus! (Mode Dummy)');
        // Di sistem nyata, panggil API delete lalu loadUsers()
    }
}

// ========================================
// INIT
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('👥 Admin Pengguna page loaded (Dummy Mode)');
    updateAdminInfo();
    setCurrentDate();
    loadUsers();
    
    const searchInput = document.getElementById('searchInput');
    const filterRole = document.getElementById('filterRole');
    
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(applyFilters, 300);
        });
    }
    
    if (filterRole) {
        filterRole.addEventListener('change', applyFilters);
    }
    
    document.getElementById('userModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeUserModal();
    });
});