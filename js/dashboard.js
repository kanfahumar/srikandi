// ========================================
// SRIKANDI - Dashboard Module
// ========================================

let currentUser = null;
let dashboardData = null;

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Cek autentikasi
    if (!window.authModule.requireAuth()) {
        return;
    }
    
    // Load user session
    currentUser = window.authModule.getSession();
    
    // Inisialisasi dashboard
    initDashboard();
});

// ========================================
// Inisialisasi Dashboard
// ========================================
function initDashboard() {
    // Update user info di sidebar
    updateUserInfo();
    
    // Update tanggal
    updateCurrentDate();
    
    // Load dashboard data
    loadDashboardData();
    
    // Setup navigation
    setupNavigation();
    
    // Setup search
    setupSearch();
}

// ========================================
// Update User Info
// ========================================
function updateUserInfo() {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userRole = document.getElementById('userRole');
    
    if (userName) userName.textContent = currentUser.nama;
    if (userRole) {
        const roleText = {
            'super_admin': 'Super Admin',
            'bendahara': 'Bendahara',
            'user': 'User'
        };
        userRole.textContent = roleText[currentUser.role] || 'User';
    }
    if (userAvatar) {
        userAvatar.textContent = currentUser.nama.charAt(0).toUpperCase();
    }
}

// ========================================
// Update Current Date
// ========================================
function updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const date = formatDateIndo(new Date());
        dateEl.textContent = date.full;
    }
}

// ========================================
// Load Dashboard Data
// ========================================
async function loadDashboardData() {
    showLoading();
    
    try {
        const response = await window.authModule.callAPI('getDashboardData', {
            userId: currentUser.user_id,
            role: currentUser.role
        });
        
        if (response.success) {
            dashboardData = response;
            updateDashboardStats(response);
            renderDocumentsTable(response.recentDocuments || []);
        } else {
            showError('Gagal memuat data dashboard');
        }
    } catch (error) {
        console.error('Load dashboard error:', error);
        showError('Terjadi kesalahan saat memuat data');
    } finally {
        hideLoading();
    }
}

// ========================================
// Update Dashboard Stats
// ========================================
function updateDashboardStats(data) {
    // Update stats cards
    const totalUsers = document.getElementById('totalUsers');
    const totalDocuments = document.getElementById('totalDocuments');
    const totalSigned = document.getElementById('totalSigned');
    const totalPending = document.getElementById('totalPending');
    
    if (totalUsers) totalUsers.textContent = data.totalUsers || 0;
    if (totalDocuments) totalDocuments.textContent = data.totalDocuments || 0;
    if (totalSigned) totalSigned.textContent = data.totalSignatures || data.signedDocuments || 0;
    if (totalPending) totalPending.textContent = data.pendingSignatures || data.pendingDocuments || 0;
}

// ========================================
// Render Documents Table
// ========================================
function renderDocumentsTable(documents) {
    const container = document.getElementById('documentsTableContainer');
    if (!container) return;
    
    if (documents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <h3 class="empty-state-title">Belum Ada Dokumen</h3>
                <p class="empty-state-text">Mulai dengan mengupload data gaji atau membuat dokumen baru</p>
                <button class="btn btn-primary" onclick="showPage('upload')">Upload Data Gaji</button>
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Judul Dokumen</th>
                        <th>Tipe</th>
                        <th>Periode</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Tanggal</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    documents.forEach(doc => {
        const docTypeLabels = {
            'penerimaan_gaji': 'Penerimaan Gaji',
            'slip_gaji': 'Slip Gaji',
            'dokumen_umum': 'Dokumen Umum'
        };
        
        const statusBadges = {
            'draft': '<span class="badge badge-gray">Draft</span>',
            'sent': '<span class="badge badge-primary">Terkirim</span>',
            'completed': '<span class="badge badge-success">Selesai</span>',
            'expired': '<span class="badge badge-error">Kadaluarsa</span>'
        };
        
        const progress = doc.total_signers > 0 
            ? Math.round((doc.signed_count / doc.total_signers) * 100) 
            : 0;
        
        const periode = doc.doc_month && doc.doc_year 
            ? `${doc.doc_month} ${doc.doc_year}` 
            : '-';
        
        const date = doc.created_at ? formatDateIndo(new Date(doc.created_at)).date : '-';
        
        tableHTML += `
            <tr>
                <td><strong>${doc.doc_title || 'Tanpa Judul'}</strong></td>
                <td>${docTypeLabels[doc.doc_type] || doc.doc_type}</td>
                <td>${periode}</td>
                <td>${statusBadges[doc.status] || doc.status}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="flex: 1; background: var(--gray-200); border-radius: 9999px; height: 6px; overflow: hidden;">
                            <div style="width: ${progress}%; background: var(--success); height: 100%;"></div>
                        </div>
                        <span class="text-sm">${doc.signed_count || 0}/${doc.total_signers || 0}</span>
                    </div>
                </td>
                <td class="text-sm">${date}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewDocument('${doc.doc_id}')">
                        👁️ Lihat
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tableHTML;
}

// ========================================
// Navigation Setup
// ========================================
function setupNavigation() {
    const menuLinks = document.querySelectorAll('.sidebar-menu-link[data-page]');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
        });
    });
}

// ========================================
// Show Page (Navigation)
// ========================================
function showPage(page) {
    // Update active menu
    document.querySelectorAll('.sidebar-menu-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-page="${page}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'users': 'Manajemen User',
        'documents': 'Dokumen',
        'upload': 'Upload Data Gaji',
        'settings': 'Pengaturan'
    };
    
    const breadcrumbs = {
        'dashboard': 'Home / Dashboard',
        'users': 'Home / Manajemen User',
        'documents': 'Home / Dokumen',
        'upload': 'Home / Upload Data Gaji',
        'settings': 'Home / Pengaturan'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    const pageBreadcrumb = document.getElementById('pageBreadcrumb');
    
    if (pageTitle) pageTitle.textContent = titles[page] || page;
    if (pageBreadcrumb) pageBreadcrumb.textContent = breadcrumbs[page] || page;
    
    // Load page content
    loadPageContent(page);
}

// ========================================
// Load Page Content
// ========================================
function loadPageContent(page) {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    
    switch(page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            renderUsersPage();
            break;
        case 'documents':
            renderDocumentsPage();
            break;
        case 'upload':
            renderUploadPage();
            break;
        case 'settings':
            renderSettingsPage();
            break;
        default:
            contentArea.innerHTML = '<div class="card"><p>Halaman dalam pengembangan</p></div>';
    }
}

// ========================================
// Render Users Page
// ========================================
async function renderUsersPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="action-buttons">
            <button class="btn btn-primary" onclick="openModal('addUserModal')">
                ➕ Tambah User Baru
            </button>
            <button class="btn btn-outline" onclick="importUsersFromExcel()">
                📥 Import dari Excel
            </button>
        </div>
        
        <div class="data-section">
            <div class="data-section-header">
                <h3 class="data-section-title">Daftar User</h3>
                <div class="search-box">
                    <input type="text" placeholder="Cari user..." id="searchUser">
                </div>
            </div>
            <div id="usersTableContainer">
                <div class="text-center" style="padding: 40px;">
                    <div class="spinner" style="margin: 0 auto;"></div>
                    <p class="mt-3">Memuat data user...</p>
                </div>
            </div>
        </div>
    `;
    
    // Load users
    try {
        const response = await window.authModule.callAPI('getUsers', {});
        if (response.success) {
            renderUsersTable(response.users);
        }
    } catch (error) {
        console.error('Load users error:', error);
    }
}

// ========================================
// Render Users Table
// ========================================
function renderUsersTable(users) {
    const container = document.getElementById('usersTableContainer');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h3 class="empty-state-title">Belum Ada User</h3>
                <p class="empty-state-text">Tambahkan user baru untuk mulai menggunakan sistem</p>
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>NIP</th>
                        <th>Nama</th>
                        <th>Email</th>
                        <th>Jabatan</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    users.forEach(user => {
        const roleLabels = {
            'super_admin': '<span class="badge badge-error">Super Admin</span>',
            'bendahara': '<span class="badge badge-primary">Bendahara</span>',
            'user': '<span class="badge badge-gray">User</span>'
        };
        
        const statusBadges = {
            'active': '<span class="badge badge-success">Aktif</span>',
            'inactive': '<span class="badge badge-gray">Nonaktif</span>'
        };
        
        tableHTML += `
            <tr>
                <td><strong>${user.nip}</strong></td>
                <td>${user.nama}</td>
                <td>${user.email || '-'}</td>
                <td>${user.jabatan || '-'}</td>
                <td>${roleLabels[user.role] || user.role}</td>
                <td>${statusBadges[user.status] || user.status}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="editUser('${user.user_id}')">
                        ✏️ Edit
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tableHTML;
}

// ========================================
// Render Upload Page
// ========================================
function renderUploadPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Upload Data Gaji</h3>
            </div>
            <div class="card-body">
                <p class="mb-4">Upload file Excel yang berisi data gaji karyawan. File harus memiliki kolom: NIP, Nama, Gaji Pokok, Tunjangan, Insentif, Potongan.</p>
                
                <div class="alert alert-info mb-4">
                    <strong>📝 Format Excel:</strong><br>
                    Kolom: NIP | Nama | Gaji Pokok | Tunjangan | Insentif | Potongan
                </div>
                
                <form id="uploadSalaryForm">
                    <div class="form-group">
                        <label class="form-label form-label-required">Judul Dokumen</label>
                        <input type="text" class="form-input" id="docTitle" placeholder="Contoh: Daftar Penerimaan Gaji Pegawai" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label form-label-required">Bulan</label>
                        <select class="form-select" id="docMonth" required>
                            <option value="">Pilih Bulan</option>
                            <option value="Januari">Januari</option>
                            <option value="Februari">Februari</option>
                            <option value="Maret">Maret</option>
                            <option value="April">April</option>
                            <option value="Mei">Mei</option>
                            <option value="Juni">Juni</option>
                            <option value="Juli">Juli</option>
                            <option value="Agustus">Agustus</option>
                            <option value="September">September</option>
                            <option value="Oktober">Oktober</option>
                            <option value="November">November</option>
                            <option value="Desember">Desember</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label form-label-required">Tahun</label>
                        <input type="number" class="form-input" id="docYear" value="2025" min="2020" max="2030" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label form-label-required">File Excel (.xlsx, .xls)</label>
                        <input type="file" class="form-input" id="salaryFile" accept=".xlsx,.xls" required>
                        <span class="form-help">Maksimal ukuran file: 5MB</span>
                    </div>
                    
                    <div id="uploadAlert" class="alert hidden"></div>
                    
                    <button type="submit" class="btn btn-primary btn-lg">
                        📤 Upload dan Proses
                    </button>
                </form>
            </div>
        </div>
    `;
    
    // Setup form submit
    const uploadForm = document.getElementById('uploadSalaryForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUploadSalary);
    }
}

// ========================================
// Handle Upload Salary
// ========================================
async function handleUploadSalary(e) {
    e.preventDefault();
    
    showAlert('uploadAlert', 'Fitur ini akan segera tersedia. Untuk saat ini, Anda dapat menggunakan Google Sheets untuk input data.', 'info');
    
    // TODO: Implement Excel upload and parsing
    // Akan menggunakan library seperti SheetJS untuk parse Excel
}

// ========================================
// Render Documents Page
// ========================================
async function renderDocumentsPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="data-section">
            <div class="data-section-header">
                <h3 class="data-section-title">Semua Dokumen</h3>
                <div class="search-box">
                    <input type="text" placeholder="Cari dokumen..." id="searchDoc">
                </div>
            </div>
            <div id="allDocumentsContainer">
                <div class="text-center" style="padding: 40px;">
                    <div class="spinner" style="margin: 0 auto;"></div>
                    <p class="mt-3">Memuat dokumen...</p>
                </div>
            </div>
        </div>
    `;
    
    // Load all documents
    if (dashboardData && dashboardData.recentDocuments) {
        const container = document.getElementById('allDocumentsContainer');
        if (container) {
            renderDocumentsTable(dashboardData.recentDocuments);
        }
    }
}

// ========================================
// Render Settings Page
// ========================================
function renderSettingsPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Pengaturan Aplikasi</h3>
            </div>
            <div class="card-body">
                <p>Halaman pengaturan akan tersedia di versi berikutnya.</p>
            </div>
        </div>
    `;
}

// ========================================
// Modal Functions
// ========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ========================================
// Submit Add User
// ========================================
async function submitAddUser() {
    const nip = document.getElementById('newUserNip').value.trim();
    const nama = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const no_hp = document.getElementById('newUserPhone').value.trim();
    const jabatan = document.getElementById('newUserJabatan').value.trim();
    const pangkat = document.getElementById('newUserPangkat').value.trim();
    const role = document.getElementById('newUserRole').value;
    
    if (!nip || !nama || !email || !role) {
        showModalAlert('addUserAlert', 'Mohon lengkapi semua field yang wajib diisi', 'error');
        return;
    }
    
    try {
        const response = await window.authModule.callAPI('createUser', {
            nip, nama, email, no_hp, jabatan, pangkat, role
        });
        
        if (response.success) {
            showModalAlert('addUserAlert', `User berhasil dibuat! PIN: ${response.pin}`, 'success');
            
            setTimeout(() => {
                closeModal('addUserModal');
                renderUsersPage();
            }, 2000);
        } else {
            showModalAlert('addUserAlert', response.message, 'error');
        }
    } catch (error) {
        console.error('Add user error:', error);
        showModalAlert('addUserAlert', 'Terjadi kesalahan', 'error');
    }
}

// ========================================
// Utility Functions
// ========================================
function showLoading() {
    // Bisa ditambahkan loading indicator global
}

function hideLoading() {
    // Hide loading indicator
}

function showError(message) {
    alert(message);
}

function showAlert(elementId, message, type) {
    const alertEl = document.getElementById(elementId);
    if (alertEl) {
        alertEl.textContent = message;
        alertEl.className = `alert alert-${type}`;
        alertEl.classList.remove('hidden');
    }
}

function showModalAlert(elementId, message, type) {
    showAlert(elementId, message, type);
}

function refreshDashboard() {
    loadDashboardData();
}

function viewDocument(docId) {
    alert('Fitur view document akan tersedia di versi berikutnya. Doc ID: ' + docId);
}

function editUser(userId) {
    alert('Fitur edit user akan tersedia di versi berikutnya. User ID: ' + userId);
}

function importUsersFromExcel() {
    alert('Fitur import Excel akan tersedia di versi berikutnya.');
}

function setupSearch() {
    // Search functionality akan ditambahkan nanti
}

function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        window.authModule.logout();
    }
}