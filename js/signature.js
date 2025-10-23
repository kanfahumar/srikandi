// ========================================
// SRIKANDI - Signature Module
// ========================================

let signatureId = null;
let signatureData = null;

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initSignaturePage();
});

// ========================================
// Inisialisasi Halaman Signature
// ========================================
function initSignaturePage() {
    // Get signature ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    signatureId = urlParams.get('id');
    
    if (!signatureId) {
        showError('Link tidak valid');
        return;
    }
    
    // Setup form verification
    const verificationForm = document.getElementById('verificationForm');
    if (verificationForm) {
        verificationForm.addEventListener('submit', handleVerification);
    }
    
    // Auto uppercase passcode input
    const passcodeInput = document.getElementById('passcodeInput');
    if (passcodeInput) {
        passcodeInput.addEventListener('input', function(e) {
            this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
    }
    
    // Auto focus
    const nipInput = document.getElementById('nipInput');
    if (nipInput) {
        nipInput.focus();
    }
}

// ========================================
// Handle Verification
// ========================================
async function handleVerification(event) {
    event.preventDefault();
    
    const nipInput = document.getElementById('nipInput');
    const passcodeInput = document.getElementById('passcodeInput');
    const verifyButton = document.getElementById('verifyButton');
    
    const nip = nipInput.value.trim();
    const passcode = passcodeInput.value.trim().toUpperCase();
    
    // Validasi input
    if (!nip || !passcode) {
        showAlert('verificationAlert', 'Mohon lengkapi NIP dan Kode Verifikasi', 'error');
        return;
    }
    
    if (passcode.length !== 8) {
        showAlert('verificationAlert', 'Kode Verifikasi harus 8 karakter', 'error');
        return;
    }
    
    // Set loading state
    setLoadingState(verifyButton, 'verifyButtonText', true, 'Memverifikasi...');
    hideAlert('verificationAlert');
    
    try {
        // Call API untuk verify
        const response = await callAPI('verifySignature', {
            signatureId: signatureId,
            nip: nip,
            passcode: passcode
        });
        
        if (response.success) {
            signatureData = response;
            showSignStep();
        } else {
            showAlert('verificationAlert', response.message || 'Verifikasi gagal', 'error');
            setLoadingState(verifyButton, 'verifyButtonText', false, 'Verifikasi');
        }
    } catch (error) {
        console.error('Verification error:', error);
        showAlert('verificationAlert', 'Terjadi kesalahan. Mohon coba lagi.', 'error');
        setLoadingState(verifyButton, 'verifyButtonText', false, 'Verifikasi');
    }
}

// ========================================
// Show Sign Step
// ========================================
function showSignStep() {
    // Hide verification step
    document.getElementById('verificationStep').classList.add('hidden');
    
    // Show sign step
    const signStep = document.getElementById('signStep');
    signStep.classList.remove('hidden');
    
    // Render document preview
    renderDocumentPreview();
}

// ========================================
// Render Document Preview
// ========================================
function renderDocumentPreview() {
    const signStep = document.getElementById('signStep');
    const { document, signature, salaryData } = signatureData;
    
    const date = formatDateIndo(new Date());
    
    let previewHTML = `
        <h3 class="text-center mb-3">Preview Dokumen</h3>
        <p class="text-center text-sm text-gray mb-4">
            Silakan periksa dokumen di bawah ini dengan teliti sebelum menandatangani.
        </p>
        
        <div class="document-preview">
            <div class="document-info">
                <h4 style="margin-bottom: var(--spacing-md); color: var(--primary-600);">
                    ${document.doc_title}
                </h4>
                
                <div class="document-info-row">
                    <span class="document-info-label">Nama:</span>
                    <span class="document-info-value">${signature.nama}</span>
                </div>
                
                <div class="document-info-row">
                    <span class="document-info-label">NIP:</span>
                    <span class="document-info-value">${signature.nip}</span>
                </div>
                
                <div class="document-info-row">
                    <span class="document-info-label">Periode:</span>
                    <span class="document-info-value">${document.doc_month} ${document.doc_year}</span>
                </div>
    `;
    
    // Jika ada data gaji, tampilkan
    if (salaryData) {
        previewHTML += `
                <table class="salary-table">
                    <tr>
                        <td>Gaji Pokok</td>
                        <td>${formatRupiah(salaryData.gaji_pokok || 0)}</td>
                    </tr>
                    <tr>
                        <td>Tunjangan</td>
                        <td>${formatRupiah(salaryData.tunjangan || 0)}</td>
                    </tr>
                    <tr>
                        <td>Insentif</td>
                        <td>${formatRupiah(salaryData.insentif || 0)}</td>
                    </tr>
                    <tr>
                        <td>Potongan</td>
                        <td style="color: var(--error);">- ${formatRupiah(salaryData.potongan || 0)}</td>
                    </tr>
                    <tr class="total">
                        <td>Total Gaji Diterima</td>
                        <td>${formatRupiah(salaryData.total_gaji || 0)}</td>
                    </tr>
                </table>
        `;
    }
    
    previewHTML += `
            </div>
        </div>
        
        <div class="checkbox-group">
            <div class="checkbox-item">
                <input type="checkbox" id="check1" required>
                <label for="check1">
                    Saya telah memeriksa dokumen tersebut dengan teliti dan data yang tercantum sudah sesuai.
                </label>
            </div>
            
            <div class="checkbox-item">
                <input type="checkbox" id="check2" required>
                <label for="check2">
                    Saya dengan sadar dan tanpa paksaan dari pihak manapun menandatangani dokumen ini secara digital.
                </label>
            </div>
            
            <div class="checkbox-item">
                <input type="checkbox" id="check3" required>
                <label for="check3">
                    Saya memahami bahwa tanda tangan digital ini memiliki kekuatan hukum yang sama dengan tanda tangan basah.
                </label>
            </div>
        </div>
        
        <div id="signAlert" class="login-alert hidden"></div>
        
        <button 
            type="button" 
            id="signButton" 
            class="login-submit"
            onclick="handleSign()"
            disabled
        >
            <span id="signButtonText">✍️ Tanda Tangani Dokumen</span>
        </button>
        
        <p class="text-center text-xs text-gray mt-3">
            Dengan menandatangani dokumen ini, Anda menyetujui bahwa informasi yang tercantum adalah benar dan sah.
        </p>
    `;
    
    signStep.innerHTML = previewHTML;
    
    // Setup checkbox validation
    setupCheckboxValidation();
}

// ========================================
// Setup Checkbox Validation
// ========================================
function setupCheckboxValidation() {
    const checkboxes = ['check1', 'check2', 'check3'];
    const signButton = document.getElementById('signButton');
    
    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                const allChecked = checkboxes.every(checkId => {
                    const cb = document.getElementById(checkId);
                    return cb && cb.checked;
                });
                
                if (signButton) {
                    signButton.disabled = !allChecked;
                }
            });
        }
    });
}

// ========================================
// Handle Sign Document
// ========================================
async function handleSign() {
    const signButton = document.getElementById('signButton');
    
    if (signButton.disabled) return;
    
    // Konfirmasi final
    if (!confirm('Apakah Anda yakin ingin menandatangani dokumen ini? Tindakan ini tidak dapat dibatalkan.')) {
        return;
    }
    
    setLoadingState(signButton, 'signButtonText', true, 'Menandatangani...');
    hideAlert('signAlert');
    
    try {
        // Get IP address (optional, untuk audit trail)
        const ipAddress = await getClientIP();
        
        // Call API untuk sign document
        const response = await callAPI('signDocument', {
            signatureId: signatureId,
            ipAddress: ipAddress
        });
        
        if (response.success) {
            showSuccessStep(response.signedAt);
        } else {
            showAlert('signAlert', response.message || 'Gagal menandatangani dokumen', 'error');
            setLoadingState(signButton, 'signButtonText', false, '✍️ Tanda Tangani Dokumen');
        }
    } catch (error) {
        console.error('Sign error:', error);
        showAlert('signAlert', 'Terjadi kesalahan. Mohon coba lagi.', 'error');
        setLoadingState(signButton, 'signButtonText', false, '✍️ Tanda Tangani Dokumen');
    }
}

// ========================================
// Show Success Step
// ========================================
function showSuccessStep(signedAt) {
    // Hide sign step
    document.getElementById('signStep').classList.add('hidden');
    
    // Show success step
    const successStep = document.getElementById('successStep');
    successStep.classList.remove('hidden');
    
    // Update signed date time
    const signedDateTime = document.getElementById('signedDateTime');
    if (signedDateTime && signedAt) {
        const date = formatDateIndo(new Date(signedAt));
        signedDateTime.textContent = date.full;
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
// Get Client IP Address
// ========================================
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || '';
    } catch (error) {
        console.error('Get IP error:', error);
        return '';
    }
}

// ========================================
// UI Helper Functions
// ========================================
function showAlert(elementId, message, type = 'info') {
    const alertEl = document.getElementById(elementId);
    if (!alertEl) return;
    
    alertEl.textContent = message;
    alertEl.className = `login-alert login-alert-${type}`;
    alertEl.classList.remove('hidden');
}

function hideAlert(elementId) {
    const alertEl = document.getElementById(elementId);
    if (alertEl) {
        alertEl.classList.add('hidden');
    }
}

function setLoadingState(button, textElementId, isLoading, loadingText) {
    const buttonText = document.getElementById(textElementId);
    
    if (isLoading) {
        button.disabled = true;
        if (buttonText) {
            buttonText.innerHTML = `<span class="login-loading"><span class="login-spinner"></span> ${loadingText}</span>`;
        }
    } else {
        button.disabled = false;
        if (buttonText) {
            buttonText.textContent = loadingText;
        }
    }
}

function showError(message) {
    const content = document.getElementById('signatureContent');
    if (content) {
        content.innerHTML = `
            <div class="expired-message">
                <div class="expired-icon">❌</div>
                <h2 style="margin-bottom: var(--spacing-md);">Terjadi Kesalahan</h2>
                <p class="text-gray">${message}</p>
            </div>
        `;
    }
}