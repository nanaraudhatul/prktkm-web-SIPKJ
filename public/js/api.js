// ===== API Object =====
const API = {
    getToken() {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        console.log('🔑 Token:', token ? 'ADA (' + token.substring(0, 20) + '...)' : 'TIDAK ADA');
        return token;
    },

    setToken(token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        console.log('✅ Token disimpan');
    },

    clearToken() {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
        console.log('🗑️ Token dihapus');
    },

    getUserData() {
        const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        return data ? JSON.parse(data) : null;
    },

    setUserData(data) {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
    },

    async request(endpoint, options = {}) {
        const url = API_CONFIG.BASE_URL + endpoint;
        console.log('📡 Request ke:', url);
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };

        const token = API.getToken(); // ← PERBAIKAN: gunakan API.getToken() bukan this.getToken()
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('🔐 Token dikirim');
        } else {
            console.warn('⚠️ Tidak ada token!');
        }

        try {
            const response = await fetch(url, config);
            console.log('📥 Status:', response.status);
            
            const contentType = response.headers.get('content-type');
            
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('❌ Bukan JSON:', text.substring(0, 100));
                throw new Error('Server response bukan JSON');
            }
            
            const data = await response.json();
            console.log('📦 Data:', data);
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP Error ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('❌ Error:', error.message);
            
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Tidak dapat terhubung ke server');
            }
            
            throw error;
        }
    },

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async upload(endpoint, formData) {
        const url = API_CONFIG.BASE_URL + endpoint;
        const token = API.getToken();
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Upload gagal');
            }
            
            return data;
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    }
};

// ===== Auth Object =====
const Auth = {
    isLoggedIn() {
        return !!API.getToken(); // ← PERBAIKAN: gunakan API.getToken() bukan this.getToken()
    },

    getUserRole() {
        return localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    },

    setUserRole(role) {
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    },

    redirectByRole() {
        const role = Auth.getUserRole();
        const pages = {
            'masyarakat': 'dashboard.html',
            'admin': '../admin/dashboard.html',
            'petugas': '../petugas/dashboard.html'
        };
        
        if (role && pages[role]) {
            window.location.href = pages[role];
        } else {
            window.location.href = 'dashboard.html';
        }
    },

    logout() {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            API.clearToken();
            window.location.href = '../auth/login.html';
        }
    },

    protectPage() {
        if (!Auth.isLoggedIn()) { // ← PERBAIKAN: gunakan Auth.isLoggedIn()
            console.warn('⚠️ Belum login, redirect...');
            window.location.href = '../auth/login.html';
        }
    },

    updateUI() {
        const userData = API.getUserData();
        if (userData) {
            document.querySelectorAll('.user-name').forEach(el => {
                el.textContent = userData.username || 'User';
            });
            document.querySelectorAll('.user-role').forEach(el => {
                el.textContent = userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'Masyarakat';
            });
        }
    }
};