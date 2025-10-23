// ========================================
// SRIKANDI - Authentication Module
// ========================================

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initLoginPage();
});

// ========================================
// Inisialisasi Halaman Login
// ========================================
function initLoginPage() {
    // Load konfigurasi agency
    loadAgencyInfo();
    
    // Cek apakah sudah login
    if (isLoggedIn()) {
        redirectToDashboard();
        return;
    }
    
    // Setup form login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Auto focus ke NIP input
    const nipInput = document.getElementById('nipInput');
    if (nipInput) {
        nipInput.focus();
    }
    
    // Format PIN input (hanya angka)
    const pinInput = document.getElementById('pinInput');
    if (pinInput) {
        pinInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
}

// ========================================
// Load Informasi Agency
// ========================================
function loadAgencyInfo() {
    const agencyNameEl = document.getElementById('agencyName');
    if (agencyNameEl) {
        agencyNameEl.textContent = CONFIG.AGENCY.name;
    }
    
    // Load logo jika ada
    const logoImg = document.getElementById('logoImage');
    if (logoImg) {
        logoImg.onerror = function() {
            // Jika logo tidak ada, tampilkan placeholder
            this.style.display = 'none';
            this.parentElement.innerHTML = '<span style="font-size: 36px;">🔐</span>';
        };
    }
}

// ========================================
// Handle Login Form Submit
// ========================================
async function handleLogin(event) {
    event.preventDefault();
    
    const nipInput = document.getElementById('nipInput');
    const pinInput = document.getElementById('pinInput');
    const loginButton = document.getElementById('loginButton');
    
    const nip = nipInput.value.trim();
    const pin = pinInput.value.trim();
    
    // Validasi input
    if (!nip || !pin) {
        showAlert('Mohon lengkapi NIP dan PIN', 'error');
        return;
    }
    
    if (pin.length !== 6) {
        showAlert('PIN harus 6 digit', 'error');
        return;
    }
    
    // Disable button dan tampilkan loading
    setLoadingState(loginButton, true);
    hideAlert();
    
    try {
        // Panggil API login
        const response = await callAPI('login', { nip, pin });
        
        if (response.success) {
            // Simpan session
            saveSession(response.user);
            
            // Tampilkan pesan sukses
            showAlert('Login berhasil! Mengalihkan...', 'success');
            
            // Redirect ke dashboard sesuai role
            setTimeout(() => {
                redirectToDashboard();
            }, 1000);
        } else {
            showAlert(response.message || 'Login gagal', 'error');
            setLoadingState(loginButton, false);
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Terjadi kesalahan. Mohon coba lagi.', 'error');
        setLoadingState(loginButton, false);
    }
}

// ========================================
// API Call Function
// ========================================
async function callAPI(action, data) {
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                data: data
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// ========================================
// Session Management
// ========================================
function saveSession(user) {
    // Simpan user data ke sessionStorage
    sessionStorage.setItem('srikandi_user', JSON.stringify(user));
    sessionStorage.setItem('srikandi_login_time', new Date().getTime());
}

function getSession() {
    const userStr = sessionStorage.getItem('srikandi_user');
    return userStr ? JSON.parse(userStr) : null;
}

function clearSession() {
    sessionStorage.removeItem('srikandi_user');
    sessionStorage.removeItem('srikandi_login_time');
}

function isLoggedIn() {
    const user = getSession();
    if (!user) return false;
    
    // Cek session timeout (1 jam)
    const loginTime = sessionStorage.getItem('srikandi_login_time');
    if (loginTime) {
        const elapsed = new Date().getTime() - parseInt(loginTime);
        if (elapsed > CONFIG.SECURITY.sessionTimeout) {
            clearSession();
            return false;
        }
    }
    
    return true;
}

function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = './login.html';
        return false;
    }
    return true;
}

function logout() {
    clearSession();
    window.location.href = './login.html';
}

// ========================================
// Redirect ke Dashboard
// ========================================
function redirectToDashboard() {
    const user = getSession();
    if (!user) return;
    
    switch(user.role) {
        case CONFIG.ROLES.SUPER_ADMIN:
            window.location.href = './admin-dashboard.html';
            break;
        case CONFIG.ROLES.BENDAHARA:
            window.location.href = './bendahara-dashboard.html';
            break;
        case CONFIG.ROLES.USER:
            window.location.href = './user-dashboard.html';
            break;
        default:
            window.location.href = './user-dashboard.html';
    }
}

// ========================================
// UI Helper Functions
// ========================================
function showAlert(message, type = 'info') {
    const alertEl = document.getElementById('loginAlert');
    if (!alertEl) return;
    
    alertEl.textContent = message;
    alertEl.className = `login-alert login-alert-${type}`;
    alertEl.classList.remove('hidden');
}

function hideAlert() {
    const alertEl = document.getElementById('loginAlert');
    if (alertEl) {
        alertEl.classList.add('hidden');
    }
}

function setLoadingState(button, isLoading) {
    const buttonText = button.querySelector('#loginButtonText');
    
    if (isLoading) {
        button.disabled = true;
        buttonText.innerHTML = '<span class="login-loading"><span class="login-spinner"></span> Memproses...</span>';
    } else {
        button.disabled = false;
        buttonText.textContent = 'Masuk';
    }
}

// ========================================
// Export untuk digunakan di halaman lain
// ========================================
if (typeof window !== 'undefined') {
    window.authModule = {
        getSession,
        isLoggedIn,
        requireAuth,
        logout,
        callAPI
    };
}