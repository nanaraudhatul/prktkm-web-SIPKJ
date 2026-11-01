// ========================================
// ADMIN PENGGUNA - JavaScript
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

// Load user stats
async function loadUserStats() {
    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/admin/user-stats.php', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        console.log('📊 User stats:', result);

        if (result.success && result.data) {
            const data = result.data;
            document.getElementById('statTotal').textContent = data.total || 0;
            document.getElementById('statMasyarakat').textContent = data.masyarakat || 0;
            document.getElementById('statPetugas').textContent = data.petugas || 0;
            document.getElementById('statAdmin').textContent = data.admin || 0;
        }
    } catch (error) {
        console.error('❌ Error loading stats:', error);
    }
}

// Load users
async function loadUsers() {
    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/admin/user-list.php', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        console.log('👥 Users data:', result);

        if (result.success && result.data) {
            allUsers = result.data;
            applyFilters();
        } else {
            document.getElementById('userTableBody').innerHTML = 
                '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada data</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error loading users:', error);
    }
}

// Apply filters
function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const role = document.getElementById('filterRole').value;

    filteredUsers = allUsers.filter(user => {
        const matchSearch = !search || 
            (user.username && user.username.toLowerCase().includes(search)) ||
            (user.email && user.email.toLowerCase().includes(search));
        const matchRole = !role || user.role === role;
        return matchSearch && matchRole;
    });

    currentPage = 1;
    renderTable();
}

// Render table
function renderTable() {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageUsers = filteredUsers.slice(startIndex, endIndex);

    if (pageUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada data yang cocok</td></tr>';
        renderPagination(0);
        return;
    }

    pageUsers.forEach((user, index) => {
        const roleClass = user.role || 'masyarakat';
        const statusClass = user.is_verified ? 'aktif' : 'nonaktif';
        const statusText = user.is_verified ? 'Aktif' : 'Nonaktif';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td><strong>${user.username || '-'}</strong></td>
            <td>${user.email || '-'}</td>
            <td>${user.telepon || '-'}</td>
            <td><span class="role-badge ${roleClass}">${capitalizeFirst(user.role)}</span></td>
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

    renderPagination(Math.ceil(filteredUsers.length / itemsPerPage));
}

// Render pagination
function renderPagination(totalPages) {
    const pagination = document.getElementById('tablePagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '‹';
    prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderTable(); } };
    pagination.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'pagination-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.onclick = () => { currentPage = i; renderTable(); };
        pagination.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = '›';
    nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderTable(); } };
    pagination.appendChild(nextBtn);
}

// Open add user modal
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

// Open edit user modal
function openEditUserModal(id) {
    const user = allUsers.find(u => u.id == id);
    if (!user) return;

    document.getElementById('modalTitle').textContent = 'Edit Pengguna';
    document.getElementById('userId').value = user.id;
    document.getElementById('formUsername').value = user.username || '';
    document.getElementById('formEmail').value = user.email || '';
    document.getElementById('formTelepon').value = user.telepon || '';
    document.getElementById('formRole').value = user.role || 'masyarakat';
    document.getElementById('formPassword').value = '';
    document.getElementById('formStatus').value = user.is_verified ? 'aktif' : 'nonaktif';
    document.getElementById('passwordGroup').style.display = 'none';
    document.getElementById('formMessage').style.display = 'none';
    document.getElementById('userModal').classList.add('show');
}

// Close user modal
function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
}

// Save user
async function saveUser() {
    const id = document.getElementById('userId').value;
    const username = document.getElementById('formUsername').value.trim();
    const email = document.getElementById('formEmail').value.trim();
    const telepon = document.getElementById('formTelepon').value.trim();
    const role = document.getElementById('formRole').value;
    const password = document.getElementById('formPassword').value;
    const status = document.getElementById('formStatus').value;

    if (!username || !email || !role) {
        showMessage('formMessage', 'Username, email, dan role wajib diisi', 'error');
        return;
    }

    if (!id && !password) {
        showMessage('formMessage', 'Password wajib diisi untuk pengguna baru', 'error');
        return;
    }

    const btnSave = document.getElementById('btnSaveUser');
    btnSave.disabled = true;
    btnSave.innerHTML = 'Menyimpan...';

    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/admin/user-save.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id: id ? parseInt(id) : null,
                username,
                email,
                telepon,
                role,
                password: password || null,
                is_verified: status === 'aktif' ? 1 : 0
            })
        });

        const result = await response.json();
        console.log('💾 Save user response:', result);

        if (result.success) {
            showMessage('formMessage', result.message || 'Pengguna berhasil disimpan', 'success');
            setTimeout(() => {
                closeUserModal();
                loadUsers();
                loadUserStats();
            }, 1000);
        } else {
            showMessage('formMessage', result.message || 'Gagal menyimpan pengguna', 'error');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage('formMessage', 'Gagal terhubung ke server', 'error');
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
            </svg>
            Simpan
        `;
    }
}

// Delete user
async function deleteUser(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;

    try {
        const token = localStorage.getItem('sipkj_token');
        const response = await fetch(API_CONFIG.BASE_URL + '/admin/user-delete.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id: id })
        });

        const result = await response.json();
        console.log('🗑️ Delete user response:', result);

        if (result.success) {
            alert(result.message || 'Pengguna berhasil dihapus');
            loadUsers();
            loadUserStats();
        } else {
            alert(result.message || 'Gagal menghapus pengguna');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Gagal terhubung ke server');
    }
}

// Reset filters
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterRole').value = '';
    applyFilters();
}

// Show message
function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.className = 'message-box ' + type;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// Capitalize first letter
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('👥 Admin Pengguna page loaded');
    updateAdminInfo();
    setCurrentDate();
    loadUserStats();
    loadUsers();

    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 500));
    document.getElementById('filterRole').addEventListener('change', applyFilters);

    document.getElementById('userModal').addEventListener('click', function(e) {
        if (e.target === this) closeUserModal();
    });
});

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}