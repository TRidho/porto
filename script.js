// ============================================================
// 🔥 FIREBASE CONFIG - TAUFIK'S PORTFOLIO
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyCF4eC3O9MebjCtb958m8RkSFyZwZH1AMk",
    authDomain: "portotaufik29.firebaseapp.com",
    databaseURL: "https://portotaufik29-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "portotaufik29",
    storageBucket: "portotaufik29.firebasestorage.app",
    messagingSenderId: "284054417267",
    appId: "1:284054417267:web:5669d4f9294395c5291f06",
    measurementId: "G-SZVQ1MQ4S0"
};

const ADMIN_PASSWORD = 'admin123';

// ============================================================
// GLOBAL VARIABLES
// ============================================================
let database = null;
let portfolioRef = null;
let profile = null;
let experiences = [];
let currentPhotoBase64 = null;
let isConnected = false;

// ============================================================
// FIREBASE INITIALIZATION
// ============================================================
function initFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        portfolioRef = database.ref('portfolio');
        console.log('✅ Firebase initialized successfully!');
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        return false;
    }
}

// ============================================================
// UI HELPER FUNCTIONS
// ============================================================
function showLoading(text = 'Memuat...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    if (loadingText) loadingText.textContent = text;
    if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, 3000);
}

function updateConnectionUI(connected, message = '') {
    isConnected = connected;
    
    const dbDot = document.getElementById('dbDot');
    const dbStatus = document.getElementById('dbStatus');
    
    if (dbDot) {
        dbDot.className = 'db-dot';
        if (connected) dbDot.classList.add('connected');
        else dbDot.classList.add('error');
    }
    
    if (dbStatus) {
        dbStatus.textContent = connected ? 'Firebase Connected ✓' : (message || 'Tidak terhubung');
    }

    const editDot = document.getElementById('editDbDot');
    const editStatus = document.getElementById('editDbStatus');
    
    if (editDot) {
        editDot.style.background = connected ? '#4ade80' : '#f87171';
    }
    
    if (editStatus) {
        editStatus.textContent = connected ? 'Firebase Connected' : 'Disconnected';
    }
}

function updateLastSaved() {
    const el = document.getElementById('lastSaved');
    if (el) {
        el.textContent = `Tersimpan: ${new Date().toLocaleString('id-ID')}`;
    }
}

// ============================================================
// FIREBASE DATA OPERATIONS
// ============================================================
async function loadData() {
    if (!portfolioRef) return false;

    try {
        const snapshot = await portfolioRef.once('value');
        const data = snapshot.val();
        
        if (data) {
            profile = data.profile || null;
            experiences = data.experiences || [];
            currentPhotoBase64 = profile?.photo || null;
            console.log('✅ Data loaded from Firebase');
        }
        return true;
    } catch (error) {
        console.error('❌ Error loading data:', error);
        return false;
    }
}

async function saveData() {
    if (!portfolioRef) {
        showToast('Database tidak terhubung!', 'error');
        return false;
    }

    try {
        await portfolioRef.set({
            profile: profile,
            experiences: experiences,
            updatedAt: new Date().toISOString()
        });
        updateLastSaved();
        console.log('✅ Data saved to Firebase');
        return true;
    } catch (error) {
        console.error('❌ Error saving data:', error);
        showToast('Gagal menyimpan: ' + error.message, 'error');
        return false;
    }
}

function setupRealtimeListener() {
    if (!portfolioRef) return;

    portfolioRef.on('value', (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
            profile = data.profile || null;
            experiences = data.experiences || [];
            currentPhotoBase64 = profile?.photo || null;

            const activePage = document.querySelector('.page.active');
            if (activePage) {
                if (activePage.id === 'loginPage') updateLoginPageUI();
                else if (activePage.id === 'viewPage') renderViewPage();
                else if (activePage.id === 'editPage') renderEditPage();
            }
        }
        
        updateConnectionUI(true);
    }, (error) => {
        console.error('Realtime listener error:', error);
        updateConnectionUI(false, 'Connection lost');
    });

    database.ref('.info/connected').on('value', (snap) => {
        const connected = snap.val() === true;
        updateConnectionUI(connected, connected ? '' : 'Offline');
    });
}

// ============================================================
// PAGE NAVIGATION
// ============================================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
}

function goToLogin() {
    showPage('loginPage');
    updateLoginPageUI();
}

function viewMode() {
    showPage('viewPage');
    renderViewPage();
}

function adminMode() {
    showPage('editPage');
    renderEditPage();
}

// ============================================================
// MODAL FUNCTIONS
// ============================================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// ============================================================
// PASSWORD FUNCTIONS
// ============================================================
function showPasswordModal() {
    openModal('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    
    if (passwordInput) {
        passwordInput.value = '';
        setTimeout(() => passwordInput.focus(), 100);
    }
    if (passwordError) {
        passwordError.style.display = 'none';
    }
}

function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    const inputValue = passwordInput ? passwordInput.value : '';
    
    console.log('Password submitted:', inputValue); // Debug
    
    if (inputValue === ADMIN_PASSWORD) {
        console.log('Password correct!'); // Debug
        closeModal('passwordModal');
        adminMode();
        showToast('Login berhasil! Selamat datang, Admin.', 'success');
    } else {
        console.log('Password incorrect!'); // Debug
        if (passwordError) {
            passwordError.style.display = 'block';
        }
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
}

// ============================================================
// PROFILE FUNCTIONS
// ============================================================
function openProfileModal() {
    openModal('profileModal');

    document.getElementById('nameInput').value = profile?.name || '';
    document.getElementById('jobInput').value = profile?.jobTitle || '';
    document.getElementById('bioInput').value = profile?.bio || '';
    document.getElementById('emailInput').value = profile?.email || '';
    document.getElementById('phoneInput').value = profile?.phone || '';
    document.getElementById('locationInput').value = profile?.location || '';
    document.getElementById('linkedinInput').value = profile?.linkedin || '';

    const preview = document.getElementById('photoPreview');
    const removeBtn = document.getElementById('removePhotoBtn');
    
    if (profile?.photo) {
        preview.src = profile.photo;
        preview.style.display = 'block';
        removeBtn.style.display = 'inline-block';
        currentPhotoBase64 = profile.photo;
    } else {
        preview.style.display = 'none';
        removeBtn.style.display = 'none';
        currentPhotoBase64 = null;
    }

    document.getElementById('photoInput').value = '';
}

function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
        showToast('Ukuran gambar maksimal 500KB!', 'error');
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        compressImage(event.target.result, 200, 0.7, (compressed) => {
            currentPhotoBase64 = compressed;
            document.getElementById('photoPreview').src = compressed;
            document.getElementById('photoPreview').style.display = 'block';
            document.getElementById('removePhotoBtn').style.display = 'inline-block';
        });
    };
    reader.readAsDataURL(file);
}

function compressImage(base64, maxSize, quality, callback) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
            if (width > height) {
                height = (height / width) * maxSize;
                width = maxSize;
            } else {
                width = (width / height) * maxSize;
                height = maxSize;
            }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        callback(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = base64;
}

function removePhoto() {
    currentPhotoBase64 = null;
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('removePhotoBtn').style.display = 'none';
    document.getElementById('photoInput').value = '';
}

async function handleProfileSubmit(e) {
    e.preventDefault();
    showLoading('Menyimpan profil...');

    profile = {
        name: document.getElementById('nameInput').value.trim(),
        jobTitle: document.getElementById('jobInput').value.trim(),
        bio: document.getElementById('bioInput').value.trim(),
        email: document.getElementById('emailInput').value.trim(),
        phone: document.getElementById('phoneInput').value.trim(),
        location: document.getElementById('locationInput').value.trim(),
        linkedin: document.getElementById('linkedinInput').value.trim(),
        photo: currentPhotoBase64
    };

    const success = await saveData();
    hideLoading();

    if (success) {
        closeModal('profileModal');
        renderEditPage();
        updateLoginPageUI();
        showToast('Profil berhasil disimpan!', 'success');
    }
}

// ============================================================
// EXPERIENCE FUNCTIONS
// ============================================================
function openExperienceModal(index = -1) {
    openModal('experienceModal');
    document.getElementById('expEditIndex').value = index;

    if (index >= 0 && experiences[index]) {
        const exp = experiences[index];
        document.getElementById('expModalTitle').textContent = 'EDIT PENGALAMAN';
        document.getElementById('positionInput').value = exp.position || '';
        document.getElementById('companyInput').value = exp.company || '';
        document.getElementById('periodInput').value = exp.period || '';
        document.getElementById('descInput').value = exp.description || '';
    } else {
        document.getElementById('expModalTitle').textContent = 'TAMBAH PENGALAMAN';
        document.getElementById('positionInput').value = '';
        document.getElementById('companyInput').value = '';
        document.getElementById('periodInput').value = '';
        document.getElementById('descInput').value = '';
    }

    setTimeout(() => document.getElementById('positionInput').focus(), 100);
}

async function handleExperienceSubmit(e) {
    e.preventDefault();
    showLoading('Menyimpan...');

    const index = parseInt(document.getElementById('expEditIndex').value);
    
    const expData = {
        id: index >= 0 ? experiences[index].id : Date.now(),
        position: document.getElementById('positionInput').value.trim(),
        company: document.getElementById('companyInput').value.trim(),
        period: document.getElementById('periodInput').value.trim(),
        description: document.getElementById('descInput').value.trim()
    };

    if (index >= 0) {
        experiences[index] = expData;
    } else {
        experiences.push(expData);
    }

    const success = await saveData();
    hideLoading();

    if (success) {
        closeModal('experienceModal');
        renderEditPage();
        showToast(index >= 0 ? 'Pengalaman diperbarui!' : 'Pengalaman ditambahkan!', 'success');
    }
}

async function deleteExperience(index) {
    if (!confirm('Yakin ingin menghapus pengalaman ini?')) return;

    showLoading('Menghapus...');
    experiences.splice(index, 1);
    
    const success = await saveData();
    hideLoading();

    if (success) {
        renderEditPage();
        showToast('Pengalaman berhasil dihapus!', 'success');
    }
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================
function updateLoginPageUI() {
    const photoEl = document.getElementById('loginPhoto');
    const nameEl = document.getElementById('loginName');
    const titleEl = document.getElementById('loginTitle');

    if (profile && profile.name) {
        nameEl.textContent = profile.name;
        titleEl.textContent = profile.jobTitle || 'Portfolio Website';
        
        if (profile.photo) {
            photoEl.innerHTML = `<img src="${profile.photo}" alt="Profile Photo">`;
        } else {
            const initials = profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            photoEl.innerHTML = initials;
            photoEl.style.fontSize = '2em';
        }
    } else {
        nameEl.textContent = 'Welcome';
        titleEl.textContent = 'Portfolio Website';
        photoEl.innerHTML = '👤';
        photoEl.style.fontSize = '3.5em';
    }
}

function renderProfileSection(containerId, showEmpty = true) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!profile || !profile.name) {
        if (showEmpty) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Belum ada profil</h3>
                    <p>Klik tombol "Edit Profil" untuk menambahkan informasi Anda</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Profil belum tersedia</h3>
                    <p>Silakan kembali lagi nanti</p>
                </div>
            `;
        }
        return;
    }

    const initials = profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const photoHTML = profile.photo 
        ? `<img src="${profile.photo}" alt="Profile Photo">` 
        : initials;

    let contacts = '';
    if (profile.email) contacts += `<span class="contact-item">📧 ${profile.email}</span>`;
    if (profile.phone) contacts += `<span class="contact-item">📱 ${profile.phone}</span>`;
    if (profile.location) contacts += `<span class="contact-item">📍 ${profile.location}</span>`;
    if (profile.linkedin) contacts += `<span class="contact-item"><a href="${profile.linkedin}" target="_blank">💼 LinkedIn</a></span>`;

    container.innerHTML = `
        <div class="profile-display">
            <div class="profile-photo" style="font-size: ${profile.photo ? 'inherit' : '2em'}">
                ${photoHTML}
            </div>
            <div class="profile-info">
                <div class="profile-name">${profile.name}</div>
                <div class="profile-job">${profile.jobTitle || ''}</div>
                ${profile.bio ? `<div class="profile-bio">${profile.bio}</div>` : ''}
                ${contacts ? `<div class="profile-contacts">${contacts}</div>` : ''}
            </div>
        </div>
    `;
}

function renderExperienceList(containerId, editable = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!experiences || experiences.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Belum ada pengalaman</h3>
                ${editable ? '<p>Klik tombol "Tambah Pengalaman" untuk mengisi</p>' : '<p>Silakan kembali lagi nanti</p>'}
            </div>
        `;
        return;
    }

    container.innerHTML = experiences.map((exp, index) => `
        <div class="experience-card">
            <h3>${exp.position || 'Posisi'}</h3>
            <div class="company">${exp.company || 'Perusahaan'}</div>
            <div class="period">${exp.period || 'Periode'}</div>
            ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
            ${editable ? `
                <div class="card-actions">
                    <button class="edit" data-index="${index}">Edit</button>
                    <button class="delete" data-index="${index}">Hapus</button>
                </div>
            ` : ''}
        </div>
    `).join('');

    // Add event listeners for edit/delete buttons
    if (editable) {
        container.querySelectorAll('.card-actions .edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                openExperienceModal(index);
            });
        });

        container.querySelectorAll('.card-actions .delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteExperience(index);
            });
        });
    }
}

function renderViewPage() {
    renderProfileSection('viewProfileSection', false);
    renderExperienceList('viewExperienceList', false);
}

function renderEditPage() {
    renderProfileSection('editProfileSection', true);
    renderExperienceList('editExperienceList', true);
}

// ============================================================
// EXPORT & IMPORT
// ============================================================
function exportData() {
    if (!profile && (!experiences || experiences.length === 0)) {
        showToast('Tidak ada data untuk di-export!', 'error');
        return;
    }

    const data = {
        profile: profile,
        experiences: experiences,
        exportedAt: new Date().toISOString(),
        source: 'Portfolio Taufik'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Data berhasil di-export!', 'success');
}

async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            if (!data.profile && (!data.experiences || data.experiences.length === 0)) {
                showToast('File tidak berisi data yang valid!', 'error');
                return;
            }

            showLoading('Mengimport data...');
            
            profile = data.profile || null;
            experiences = data.experiences || [];
            currentPhotoBase64 = profile?.photo || null;

            const success = await saveData();
            hideLoading();

            if (success) {
                renderEditPage();
                updateLoginPageUI();
                showToast('Data berhasil di-import!', 'success');
            }
        } catch (error) {
            hideLoading();
            showToast('File tidak valid!', 'error');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

async function clearAllData() {
    if (!confirm('⚠️ PERINGATAN!\n\nSemua data portfolio akan dihapus permanen.\nApakah Anda yakin?')) return;
    if (!confirm('Ini adalah konfirmasi terakhir.\nData yang dihapus tidak dapat dikembalikan.\n\nLanjutkan?')) return;

    showLoading('Menghapus semua data...');
    
    profile = null;
    experiences = [];
    currentPhotoBase64 = null;

    const success = await saveData();
    hideLoading();

    if (success) {
        renderEditPage();
        updateLoginPageUI();
        showToast('Semua data berhasil dihapus!', 'success');
    }
}

// ============================================================
// SETUP EVENT LISTENERS
// ============================================================
function setupEventListeners() {
    // Login Page Buttons
    const btnViewPortfolio = document.getElementById('btnViewPortfolio');
    const btnAdminLogin = document.getElementById('btnAdminLogin');
    
    if (btnViewPortfolio) {
        btnViewPortfolio.addEventListener('click', function() {
            console.log('View Portfolio clicked');
            viewMode();
        });
    }
    
    if (btnAdminLogin) {
        btnAdminLogin.addEventListener('click', function() {
            console.log('Admin Login clicked');
            showPasswordModal();
        });
    }

    // Back Buttons
    const btnBackFromView = document.getElementById('btnBackFromView');
    const btnBackFromEdit = document.getElementById('btnBackFromEdit');
    
    if (btnBackFromView) {
        btnBackFromView.addEventListener('click', goToLogin);
    }
    
    if (btnBackFromEdit) {
        btnBackFromEdit.addEventListener('click', goToLogin);
    }

    // Edit Page Buttons
    const btnExport = document.getElementById('btnExport');
    const btnImport = document.getElementById('btnImport');
    const btnClearAll = document.getElementById('btnClearAll');
    const btnEditProfile = document.getElementById('btnEditProfile');
    const btnAddExperience = document.getElementById('btnAddExperience');
    
    if (btnExport) btnExport.addEventListener('click', exportData);
    if (btnImport) btnImport.addEventListener('click', () => document.getElementById('importFileInput').click());
    if (btnClearAll) btnClearAll.addEventListener('click', clearAllData);
    if (btnEditProfile) btnEditProfile.addEventListener('click', openProfileModal);
    if (btnAddExperience) btnAddExperience.addEventListener('click', () => openExperienceModal(-1));

    // Import File Input
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
        importFileInput.addEventListener('change', handleImport);
    }

    // Password Modal
    const closePasswordModal = document.getElementById('closePasswordModal');
    const passwordForm = document.getElementById('passwordForm');
    
    if (closePasswordModal) {
        closePasswordModal.addEventListener('click', () => closeModal('passwordModal'));
    }
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordSubmit);
    }

    // Profile Modal
    const closeProfileModal = document.getElementById('closeProfileModal');
    const profileForm = document.getElementById('profileForm');
    const photoInput = document.getElementById('photoInput');
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    
    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', () => closeModal('profileModal'));
    }
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
    
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoChange);
    }
    
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', removePhoto);
    }

    // Experience Modal
    const closeExperienceModal = document.getElementById('closeExperienceModal');
    const experienceForm = document.getElementById('experienceForm');
    
    if (closeExperienceModal) {
        closeExperienceModal.addEventListener('click', () => closeModal('experienceModal'));
    }
    
    if (experienceForm) {
        experienceForm.addEventListener('submit', handleExperienceSubmit);
    }

    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => {
                modal.classList.remove('show');
            });
        }
    });

    console.log('✅ All event listeners attached');
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM Content Loaded - Starting initialization...');
    
    showLoading('Menghubungkan ke Firebase...');

    // Setup event listeners first
    setupEventListeners();

    // Initialize Firebase
    const firebaseOK = initFirebase();
    
    if (!firebaseOK) {
        hideLoading();
        updateConnectionUI(false, 'Firebase Error');
        showToast('Gagal menghubungkan ke Firebase!', 'error');
        return;
    }

    // Load data
    showLoading('Memuat data...');
    await loadData();
    
    // Setup realtime listener
    setupRealtimeListener();

    // Update UI
    updateLoginPageUI();
    hideLoading();

    console.log('✅ Portfolio Website Ready!');
    console.log('🔥 Firebase Project: portotaufik29');
});
