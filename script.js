// ============================================================
// 🔥 FIREBASE CONFIGURATION
// ============================================================
// ⬇️⬇️⬇️ PASTE CONFIG FIREBASE ANDA DI SINI ⬇️⬇️⬇️

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

// ⬆️⬆️⬆️ PASTE CONFIG FIREBASE ANDA DI ATAS ⬆️⬆️⬆️
// ============================================================

const ADMIN_PASSWORD = 'admin123'; // Ganti password admin di sini

// ============================================================
// INITIALIZATION
// ============================================================
let database = null;
let portfolioRef = null;
let profile = null;
let experiences = [];
let currentPhotoBase64 = null;
let isConnected = false;

// Initialize Firebase
function initFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        portfolioRef = database.ref('portfolio');
        console.log('✅ Firebase initialized');
        return true;
    } catch (error) {
        console.error('❌ Firebase init error:', error);
        return false;
    }
}

// ============================================================
// UI HELPERS
// ============================================================
function showLoading(text = 'Memuat...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
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
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateConnectionUI(connected, message = '') {
    isConnected = connected;
    
    // Login page indicator
    const dbDot = document.getElementById('dbDot');
    const dbStatus = document.getElementById('dbStatus');
    if (dbDot && dbStatus) {
        dbDot.className = `db-dot ${connected ? 'connected' : 'error'}`;
        dbStatus.textContent = connected ? 'Terhubung ke Firebase ✓' : (message || 'Tidak terhubung');
    }

    // Edit page indicator
    const editDot = document.getElementById('editDbDot');
    const editStatus = document.getElementById('editDbStatus');
    if (editDot && editStatus) {
        editDot.style.background = connected ? '#4ade80' : '#f87171';
        editStatus.textContent = connected ? 'Firebase Connected' : 'Disconnected';
    }
}

function updateLastSaved() {
    const el = document.getElementById('lastSaved');
    if (el) {
        el.textContent = `Terakhir disimpan: ${new Date().toLocaleString('id-ID')}`;
    }
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
// PASSWORD MODAL
// ============================================================
function showPasswordModal() {
    document.getElementById('passwordModal').classList.add('show');
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordError').style.display = 'none';
    document.getElementById('passwordInput').focus();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function checkPassword(e) {
    e.preventDefault();
    const input = document.getElementById('passwordInput').value;
    
    if (input === ADMIN_PASSWORD) {
        closeModal('passwordModal');
        adminMode();
    } else {
        document.getElementById('passwordError').style.display = 'block';
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
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
        }
        
        console.log('✅ Data loaded from Firebase');
        return true;
    } catch (error) {
        console.error('❌ Load error:', error);
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
        console.error('❌ Save error:', error);
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

            // Update current page
            const activePage = document.querySelector('.page.active');
            if (activePage) {
                if (activePage.id === 'loginPage') updateLoginPageUI();
                else if (activePage.id === 'viewPage') renderViewPage();
                else if (activePage.id === 'editPage') renderEditPage();
            }
        }
        updateConnectionUI(true);
    }, (error) => {
        console.error('Realtime error:', error);
        updateConnectionUI(false, 'Connection lost');
    });

    // Connection state
    database.ref('.info/connected').on('value', (snap) => {
        updateConnectionUI(snap.val() === true);
    });
}

// ============================================================
// PROFILE FUNCTIONS
// ============================================================
function openProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.classList.add('show');

    // Fill form with existing data
    document.getElementById('nameInput').value = profile?.name || '';
    document.getElementById('jobInput').value = profile?.jobTitle || '';
    document.getElementById('bioInput').value = profile?.bio || '';
    document.getElementById('emailInput').value = profile?.email || '';
    document.getElementById('phoneInput').value = profile?.phone || '';
    document.getElementById('locationInput').value = profile?.location || '';
    document.getElementById('linkedinInput').value = profile?.linkedin || '';

    // Photo preview
    const preview = document.getElementById('photoPreview');
    const removeBtn = document.getElementById('removePhotoBtn');
    
    if (profile?.photo) {
        preview.src = profile.photo;
        preview.style.display = 'block';
        removeBtn.style.display = 'block';
        currentPhotoBase64 = profile.photo;
    } else {
        preview.style.display = 'none';
        removeBtn.style.display = 'none';
        currentPhotoBase64 = null;
    }

    document.getElementById('photoInput').value = '';
}

function previewPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 500KB before compression)
    if (file.size > 500 * 1024) {
        showToast('Gambar terlalu besar! Maksimal 500KB', 'error');
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        // Compress image
        compressImage(event.target.result, 200, 0.7, (compressed) => {
            currentPhotoBase64 = compressed;
            document.getElementById('photoPreview').src = compressed;
            document.getElementById('photoPreview').style.display = 'block';
            document.getElementById('removePhotoBtn').style.display = 'block';
        });
    };
    reader.readAsDataURL(file);
}

function compressImage(base64, maxSize, quality, callback) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large
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

async function saveProfile(e) {
    e.preventDefault();

    const btn = document.getElementById('profileSubmitBtn');
    btn.disabled = true;
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loading').style.display = 'inline';

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

    btn.disabled = false;
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-loading').style.display = 'none';

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
    const modal = document.getElementById('experienceModal');
    modal.classList.add('show');

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

    document.getElementById('positionInput').focus();
}

async function saveExperience(e) {
    e.preventDefault();

    const btn = document.getElementById('expSubmitBtn');
    btn.disabled = true;
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loading').style.display = 'inline';

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

    btn.disabled = false;
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-loading').style.display = 'none';

    if (success) {
        closeModal('experienceModal');
        renderEditPage();
        showToast(index >= 0 ? 'Pengalaman diperbarui!' : 'Pengalaman ditambahkan!', 'success');
    }
}

async function deleteExperience(index) {
    if (!confirm('Hapus pengalaman ini?')) return;

    showLoading('Menghapus...');
    experiences.splice(index, 1);
    
    const success = await saveData();
    hideLoading();

    if (success) {
        renderEditPage();
        showToast('Pengalaman dihapus!', 'success');
    }
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================
function updateLoginPageUI() {
    const photoEl = document.getElementById('loginPhoto');
    const nameEl = document.getElementById('loginName');
    const titleEl = document.getElementById('loginTitle');

    if (profile) {
        nameEl.textContent = profile.name || 'Welcome';
        titleEl.textContent = profile.jobTitle || 'Portfolio Website';
        
        if (profile.photo) {
            photoEl.innerHTML = `<img src="${profile.photo}" alt="Profile">`;
        } else {
            const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '👤';
            photoEl.innerHTML = initials;
            photoEl.style.fontSize = profile.name ? '2em' : '3.5em';
        }
    } else {
        nameEl.textContent = 'Welcome';
        titleEl.textContent = 'Portfolio Website';
        photoEl.innerHTML = '👤';
        photoEl.style.fontSize = '3.5em';
    }
}

function renderViewPage() {
    const profileSection = document.getElementById('viewProfileSection');
    const expList = document.getElementById('viewExperienceList');

    // Profile
    if (!profile) {
        profileSection.innerHTML = `<div class="empty-state"><h3>Profil belum tersedia</h3><p>Silakan kembali lagi nanti</p></div>`;
    } else {
        const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';
        const photoHTML = profile.photo 
            ? `<img src="${profile.photo}" alt="Profile">`
            : initials;

        let contacts = '';
        if (profile.email) contacts += `<span class="contact-item">📧 ${profile.email}</span>`;
        if (profile.phone) contacts += `<span class="contact-item">📱 ${profile.phone}</span>`;
        if (profile.location) contacts += `<span class="contact-item">📍 ${profile.location}</span>`;
        if (profile.linkedin) contacts += `<span class="contact-item"><a href="${profile.linkedin}" target="_blank">💼 LinkedIn</a></span>`;

        profileSection.innerHTML = `
            <div class="profile-display">
                <div class="profile-photo">${photoHTML}</div>
                <div class="profile-info">
                    <div class="profile-name">${profile.name || 'Nama'}</div>
                    <div class="profile-job">${profile.jobTitle || 'Jabatan'}</div>
                    ${profile.bio ? `<div class="profile-bio">${profile.bio}</div>` : ''}
                    <div class="profile-contacts">${contacts}</div>
                </div>
            </div>
        `;
    }

    // Experiences
    if (!experiences || experiences.length === 0) {
        expList.innerHTML = `<div class="empty-state"><h3>Belum ada pengalaman</h3></div>`;
    } else {
        expList.innerHTML = experiences.map(exp => `
            <div class="experience-card">
                <h3>${exp.position}</h3>
                <div class="company">${exp.company}</div>
                <div class="period">${exp.period}</div>
                ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
            </div>
        `).join('');
    }
}

function renderEditPage() {
    const profileSection = document.getElementById('editProfileSection');
    const expList = document.getElementById('editExperienceList');

    // Profile
    if (!profile) {
        profileSection.innerHTML = `<div class="empty-state"><h3>Belum ada profil</h3><p>Klik "Edit Profil" untuk menambahkan</p></div>`;
    } else {
        const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';
        const photoHTML = profile.photo 
            ? `<img src="${profile.photo}" alt="Profile">`
            : initials;

        let contacts = '';
        if (profile.email) contacts += `<span class="contact-item">📧 ${profile.email}</span>`;
        if (profile.phone) contacts += `<span class="contact-item">📱 ${profile.phone}</span>`;
        if (profile.location) contacts += `<span class="contact-item">📍 ${profile.location}</span>`;
        if (profile.linkedin) contacts += `<span class="contact-item"><a href="${profile.linkedin}" target="_blank">💼 LinkedIn</a></span>`;

        profileSection.innerHTML = `
            <div class="profile-display">
                <div class="profile-photo">${photoHTML}</div>
                <div class="profile-info">
                    <div class="profile-name">${profile.name || 'Nama'}</div>
                    <div class="profile-job">${profile.jobTitle || 'Jabatan'}</div>
                    ${profile.bio ? `<div class="profile-bio">${profile.bio}</div>` : ''}
                    <div class="profile-contacts">${contacts}</div>
                </div>
            </div>
        `;
    }

    // Experiences
    if (!experiences || experiences.length === 0) {
        expList.innerHTML = `<div class="empty-state"><h3>Belum ada pengalaman</h3><p>Klik tombol "Tambah Pengalaman"</p></div>`;
    } else {
        expList.innerHTML = experiences.map((exp, i) => `
            <div class="experience-card">
                <h3>${exp.position}</h3>
                <div class="company">${exp.company}</div>
                <div class="period">${exp.period}</div>
                ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
                <div class="card-actions">
                    <button class="edit" onclick="openExperienceModal(${i})">Edit</button>
                    <button class="delete" onclick="deleteExperience(${i})">Hapus</button>
                </div>
            </div>
        `).join('');
    }
}

// ============================================================
// EXPORT / IMPORT
// ============================================================
function exportData() {
    if (!profile && experiences.length === 0) {
        showToast('Tidak ada data untuk di-export!', 'error');
        return;
    }

    const data = {
        profile: profile,
        experiences: experiences,
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Data berhasil di-export!', 'success');
}

async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const data = JSON.parse(event.target.result);
            
            if (!data.profile && !data.experiences) {
                showToast('Format file tidak valid!', 'error');
                return;
            }

            showLoading('Mengimport data...');
            
            profile = data.profile || null;
            experiences = data.experiences || [];
            currentPhotoBase64 = profile?.photo || null;

            await saveData();
            
            hideLoading();
            renderEditPage();
            updateLoginPageUI();
            showToast('Data berhasil di-import!', 'success');
        } catch (error) {
            hideLoading();
            showToast('File tidak valid!', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

async function clearAllData() {
    if (!confirm('⚠️ HAPUS SEMUA DATA?\n\nSemua profil dan pengalaman akan dihapus permanen!')) return;
    if (!confirm('Ini tidak dapat dibatalkan. Lanjutkan?')) return;

    showLoading('Menghapus data...');
    
    profile = null;
    experiences = [];
    currentPhotoBase64 = null;

    await saveData();
    
    hideLoading();
    renderEditPage();
    updateLoginPageUI();
    showToast('Semua data telah dihapus!', 'success');
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async function() {
    showLoading('Menghubungkan ke database...');

    // Initialize Firebase
    const firebaseReady = initFirebase();
    
    if (!firebaseReady) {
        hideLoading();
        updateConnectionUI(false, 'Firebase error');
        showToast('Gagal menghubungkan ke database!', 'error');
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

    // Event listeners
    document.getElementById('importFileInput').addEventListener('change', handleImport);

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });

    // Escape key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
        }
    });
});
