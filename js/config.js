// ========================================
// SRIKANDI - Konfigurasi Aplikasi
// ========================================

const CONFIG = {
    // Google Apps Script Web App URL (akan diisi setelah deploy)
    API_URL: 'https://script.google.com/macros/s/AKfycbyQ9OvL43EEfOrDigYAvlUVLMGd14VAXZsci3YshcvJUYeYnMw4kVFxBQNVWJTWiEKgxQ/exec',
    
    // Nama Aplikasi
    APP_NAME: 'SRIKANDI',
    APP_FULL_NAME: 'Sistem Tanda Tangan Digital',
    
    // Informasi Instansi (SESUAIKAN DENGAN INSTANSI ANDA)
    AGENCY: {
        name: 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu',
        address: 'Jalan Kesatrian 38 Wonosari',
        phone: '(0274) 7898798',
        email: 'dpmptspgk@gunungkidulkab.go.id',
        logo: './assets/logo/logo-perusahaan.png'
    },
    
    // Pengaturan Keamanan
    SECURITY: {
        passcodeLength: 8,
        linkExpiryDays: 2,
        maxLoginAttempts: 5,
        sessionTimeout: 3600000 // 1 jam dalam milidetik
    },
    
    // Role User
    ROLES: {
        SUPER_ADMIN: 'super_admin',
        BENDAHARA: 'bendahara',
        USER: 'user'
    },
    
    // Status Dokumen
    DOC_STATUS: {
        DRAFT: 'draft',
        SENT: 'sent',
        COMPLETED: 'completed',
        EXPIRED: 'expired'
    },
    
    // Status Tanda Tangan
    SIGN_STATUS: {
        PENDING: 'pending',
        SIGNED: 'signed',
        EXPIRED: 'expired'
    },
    
    // Tipe Dokumen
    DOC_TYPES: {
        SALARY_RECEIPT: 'penerimaan_gaji',
        SALARY_SLIP: 'slip_gaji',
        GENERAL: 'dokumen_umum'
    },
    
    // QR Code API
    QR_API: 'https://api.qrserver.com/v1/create-qr-code/',
    
    // Template Email
    EMAIL_TEMPLATE: {
        subject: 'Slip Gaji dan Link Tanda Tangan Digital - {month} {year}',
        greeting: 'Yth. Bapak/Ibu {name}',
        signature: 'Hormat kami,\nBendahara Gaji\n{agency_name}'
    }
};

// Fungsi Helper untuk Generate ID Unik
function generateUniqueId(prefix = '') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}${timestamp}${random}`;
}

// Fungsi Helper untuk Generate Passcode
function generatePasscode(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Hindari huruf/angka mirip (I,O,0,1)
    let passcode = '';
    for (let i = 0; i < length; i++) {
        passcode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return passcode;
}

// Fungsi Helper untuk Format Tanggal Indonesia
function formatDateIndo(date) {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const d = new Date(date);
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return {
        full: `${day} ${month} ${year} pukul ${hours}:${minutes} WIB`,
        date: `${day} ${month} ${year}`,
        monthYear: `${month} ${year}`
    };
}

// Fungsi Helper untuk Validasi Email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Fungsi Helper untuk Format Rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}