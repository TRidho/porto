// ==================== CONFIGURATION ====================
const DATA_FILE = 'data.json';  // Nama file JSON data Anda
const ADMIN_PASSWORD = 'admin123';

// ==================== DATA STORAGE ====================
let profile = null;
let experiences = [];
let editIndex = -1;
let uploadedProfileImage = null;
let isDataLoaded = false;

// ==================== LOADING FUNCTIONS ====================
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== LOAD DATA FROM JSON FILE ====================
async function loadDataFromJSON() {
    try {
        const response = await fetch(DATA_FILE);
        
        if (!response.ok) {
            throw new Error('File data.json tidak ditemukan');
        }
        
        const data = await response.json();
        
        if (data) {
            profile = data.profile || null;
            experiences = data.experiences || [];
            
            if (profile && profile.profileImage) {
                uploadedProfileImage = profile.profileImage;
            }
            
            isDataLoaded = true;
            updateConnectionStatus(true);
            console.log('Data loaded from JSON file');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error loading JSON:', error);
        updateConnectionStatus(false, error.message);
        
        // Try to load from localStorage as fallback
        return loadFromLocalStorage();
    }
}

// ==================== LOCAL STORAGE (FALLBACK & ADMIN EDIT) ====================
function saveToLocalStorage() {
    const data = {
        profile: profile,
        experiences: experiences,
        lastSaved: new Date().toISOString()
    };
    localStorage.setItem('portfolio_data', JSON.stringify(data));
    updateDbStatus();
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('portfolio_data');
        if (saved) {
            const data = JSON.parse(saved);
            profile = data.profile || null;
            experiences = data.experiences || [];
            
            if (profile && profile.profileImage) {
                uploadedProfileImage = profile.profileImage;
            }
            
            isDataLoaded = true;
            return true;
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
    return false;
}

// ==================== CONNECTION STATUS ====================
function updateConnectionStatus(connected, errorMsg = '') {
    const dot = document.querySelector('.db-dot');
    const status = document.getElementById('dbConnectionStatus');
    
    if (!dot || !status) return;
    
    if (connected) {
        dot.className = 'db-dot connected';
        status.textContent = 'Data Loaded ✓';
    } else {
        dot.className = 'db-dot error';
        status.textContent = errorMsg || 'Gagal memuat data';
    }
}

// ==================== DATABASE STATUS ====================
function updateDbStatus() {
    const statusElement = document.getElementById('dbStatus');
    if (!statusElement) return;

    const lastSaved = localStorage.getItem('portfolio_data');
    let lastSavedText = 'Data dari file JSON';
    
    if (lastSaved) {
        try {
            const data = JSON.parse(lastSaved);
            if (data.lastSaved) {
                lastSavedText = `Terakhir diedit: ${new Date(data.lastSaved).toLocaleString('id-ID')}`;
            }
        } catch (e) {}
    }

    statusElement.innerHTML = `
        <div class="db-status-info">
            <div class="db-status-dot" style="background: ${isDataLoaded ? '#4ade80' : '#ff6b6b'}"></div>
            <span class="db-status-text">
                <strong>Sumber:</strong> ${isDataLoaded ? 'data.json + LocalStorage' : 'Tidak tersedia'}
            </span>
        </div>
        <span class="last-saved">${lastSavedText}</span>
    `;
}

// ==================== EXPORT DATA ====================
function exportData() {
    if (!profile && experiences.length === 0) {
        showToast('Tidak ada data untuk di-export!', 'error');
        return;
    }

    const data = {
        profile: profile,
        experiences: experiences,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';  // Langsung nama data.json untuk kemudahan
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Data berhasil di-export! Upload file data.json ke GitHub untuk update.', 'success');
}

// ==================== IMPORT DATA ====================
function importData() {
    document.getElementById('importFileInput').click();
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.profile && !data.experiences) {
                showToast('Format file tidak valid!', 'error');
                return;
            }

            profile = data.profile || null;
            experiences = data.experiences || [];
            
            if (profile && profile.profileImage) {
                uploadedProfileImage = profile.profileImage;
            }

            saveToLocalStorage();
            renderProfile();
            renderExperiences();
            updateLoginPageProfilePhoto();
            
            showToast('Data berhasil di-import!', 'success');
        } catch (error) {
            showToast('File JSON tidak valid!', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ==================== CLEAR ALL DATA ====================
function clearAllData() {
    if (confirm('⚠️ PERINGATAN!\n\nSemua data akan dihapus dari browser.\nData di file JSON tetap aman.\n\nLanjutkan?')) {
        localStorage.removeItem('portfolio_data');
        
        profile = null;
        experiences = [];
        uploadedProfileImage = null;
        
        renderProfile();
        renderExperiences();
        updateLoginPageProfilePhoto();
        updateDbStatus();
        
        showToast('Data browser berhasil dihapus! Refresh untuk load ulang dari JSON.', 'success');
    }
}

// ==================== NAVIGATION FUNCTIONS ====================
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageName + 'Page').classList.add('active');
}

function viewMode() {
    showPage('view');
    renderViewPage();
}

function logout() {
    showPage('login');
    updateLoginPageProfilePhoto();
}

// ==================== PASSWORD MODAL ====================
function showPasswordModal() {
    document.getElementById('passwordModal').style.display = 'block';
    document.getElementById('adminPassword').value = '';
    document.getElementById('errorMessage').style.display = 'none';
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
}

function adminMode() {
    showPage('edit');
    renderProfile();
    renderExperiences();
    updateDbStatus();
}

// ==================== PROFILE FUNCTIONS ====================
function openProfileModal() {
    document.getElementById('profileModal').style.display = 'block';

    const preview = document.getElementById('profileImagePreview');
    const upload = document.getElementById('profileImageUpload');

    if (profile) {
        document.getElementById('profileName').value = profile.name || '';
        document.getElementById('profileJobTitle').value = profile.jobTitle || '';
        document.getElementById('profileBio').value = profile.bio || '';
        document.getElementById('profileEmail').value = profile.email || '';
        document.getElementById('profilePhone').value = profile.phone || '';
        document.getElementById('profileLocation').value = profile.location || '';
        document.getElementById('profileLinkedin').value = profile.linkedin || '';

        if (profile.profileImage) {
            preview.src = profile.profileImage;
            preview.style.display = 'block';
            uploadedProfileImage = profile.profileImage;
        } else {
            preview.src = '';
            preview.style.display = 'none';
        }
    } else {
        document.getElementById('profileForm').reset();
        preview.src = '';
        preview.style.display = 'none';
        uploadedProfileImage = null;
    }
    upload.value = '';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

function saveProfile(e) {
    e.preventDefault();

    profile = {
        name: document.getElementById('profileName').value,
        jobTitle: document.getElementById('profileJobTitle').value,
        bio: document.getElementById('profileBio').value,
        email: document.getElementById('profileEmail').value,
        phone: document.getElementById('profilePhone').value,
        location: document.getElementById('profileLocation').value,
        linkedin: document.getElementById('profileLinkedin').value,
        profileImage: uploadedProfileImage
    };

    saveToLocalStorage();
    renderProfile();
    updateLoginPageProfilePhoto();
    closeProfileModal();
    showToast('Profil disimpan! Klik Export untuk update file JSON.', 'success');
}

function renderProfile() {
    const display = document.getElementById('profileDisplay');
    if (!display) return;

    if (!profile) {
        display.innerHTML = `
            <div class="empty-profile">
                <h3>Belum ada profil</h3>
                <p>Klik tombol "Edit Profil" untuk menambahkan informasi Anda</p>
            </div>
        `;
        return;
    }

    const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'N/A';

    let profilePhotoHtml = profile.profileImage 
        ? `<div class="profile-photo"><img src="${profile.profileImage}" alt="Profile Photo"></div>`
        : `<div class="profile-photo">${initials}</div>`;

    let contactItems = '';
    if (profile.email) contactItems += `<div class="profile-contact-item">📧 ${profile.email}</div>`;
    if (profile.phone) contactItems += `<div class="profile-contact-item">📱 ${profile.phone}</div>`;
    if (profile.location) contactItems += `<div class="profile-contact-item">📍 ${profile.location}</div>`;
    if (profile.linkedin) contactItems += `<div class="profile-contact-item">💼 <a href="${profile.linkedin}" target="_blank" style="color: white;">LinkedIn</a></div>`;

    display.innerHTML = `
        <div class="profile-display">
            <div class="profile-photo-container">${profilePhotoHtml}</div>
            <div class="profile-info">
                <div class="profile-name">${profile.name}</div>
                <div class="profile-title">${profile.jobTitle}</div>
                <div class="profile-bio">${profile.bio || ''}</div>
                <div class="profile-contact">${contactItems}</div>
            </div>
        </div>
    `;
}

// ==================== EXPERIENCE FUNCTIONS ====================
function openExperienceModal(index = -1) {
    editIndex = index;
    document.getElementById('experienceModal').style.display = 'block';

    if (index >= 0) {
        const exp = experiences[index];
        document.getElementById('experienceModalTitle').innerText = 'EDIT PENGALAMAN';
        document.getElementById('position').value = exp.position;
        document.getElementById('company').value = exp.company;
        document.getElementById('period').value = exp.period;
        document.getElementById('description').value = exp.description || '';
    } else {
        document.getElementById('experienceModalTitle').innerText = 'TAMBAH PENGALAMAN';
        document.getElementById('experienceForm').reset();
    }
}

function closeExperienceModal() {
    document.getElementById('experienceModal').style.display = 'none';
    editIndex = -1;
}

function saveExperience(e) {
    e.preventDefault();

    const data = {
        id: editIndex >= 0 ? experiences[editIndex].id : Date.now(),
        position: document.getElementById('position').value,
        company: document.getElementById('company').value,
        period: document.getElementById('period').value,
        description: document.getElementById('description').value,
        createdAt: editIndex >= 0 ? experiences[editIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (editIndex >= 0) {
        experiences[editIndex] = data;
        showToast('Pengalaman diperbarui! Klik Export untuk update file JSON.', 'success');
    } else {
        experiences.push(data);
        showToast('Pengalaman ditambahkan! Klik Export untuk update file JSON.', 'success');
    }

    saveToLocalStorage();
    renderExperiences();
    closeExperienceModal();
}

function deleteExperience(index) {
    if (confirm('Yakin ingin menghapus pengalaman ini?')) {
        experiences.splice(index, 1);
        saveToLocalStorage();
        renderExperiences();
        showToast('Pengalaman dihapus! Klik Export untuk update file JSON.', 'success');
    }
}

function renderExperiences() {
    const list = document.getElementById('experienceList');
    if (!list) return;

    if (experiences.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>Belum ada pengalaman</h3>
                <p>Klik tombol tambah pengalaman untuk mengisi</p>
            </div>
        `;
        return;
    }

    list.innerHTML = experiences.map((exp, index) => `
        <div class="experience-card">
            <h3>${exp.position}</h3>
            <div class="company">${exp.company}</div>
            <div class="period">${exp.period}</div>
            <div class="description">${exp.description || ''}</div>
            <div class="card-actions">
                <button class="edit-btn" onclick="openExperienceModal(${index})">Edit</button>
                <button class="delete-btn" onclick="deleteExperience(${index})">Hapus</button>
            </div>
        </div>
    `).join('');
}

// ==================== VIEW PAGE RENDER ====================
function renderViewPage() {
    const profileDisplay = document.getElementById('viewProfileDisplay');
    const experienceDisplay = document.getElementById('viewExperienceList');

    if (!profile) {
        profileDisplay.innerHTML = `
            <div class="empty-state">
                <h3>Profil belum tersedia</h3>
                <p>Silakan kembali lagi nanti</p>
            </div>
        `;
    } else {
        const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'N/A';
        
        let profilePhotoHtml = profile.profileImage 
            ? `<div class="profile-photo"><img src="${profile.profileImage}" alt="Profile Photo"></div>`
            : `<div class="profile-photo">${initials}</div>`;

        let contacts = '';
        if (profile.email) contacts += `<div>📧 ${profile.email}</div>`;
        if (profile.phone) contacts += `<div>📱 ${profile.phone}</div>`;
        if (profile.location) contacts += `<div>📍 ${profile.location}</div>`;
        if (profile.linkedin) contacts += `<div>💼 <a href="${profile.linkedin}" target="_blank" style="color:white">LinkedIn</a></div>`;

        profileDisplay.innerHTML = `
            <div class="view-profile">
                ${profilePhotoHtml}
                <div>
                    <h2>${profile.name}</h2>
                    <h4>${profile.jobTitle}</h4>
                    <p>${profile.bio || ''}</p>
                    <div class="view-contacts">${contacts}</div>
                </div>
            </div>
        `;
    }

    if (experiences.length === 0) {
        experienceDisplay.innerHTML = `<div class="empty-state"><h3>Belum ada pengalaman</h3></div>`;
    } else {
        experienceDisplay.innerHTML = experiences.map(exp => `
            <div class="view-experience-card">
                <h3>${exp.position}</h3>
                <div class="company">${exp.company}</div>
                <div class="period">${exp.period}</div>
                <div class="description">${exp.description || ''}</div>
            </div>
        `).join('');
    }
}

// ==================== UPDATE LOGIN PAGE PHOTO ====================
function updateLoginPageProfilePhoto() {
    const el = document.querySelector('.profile-photo-large');
    if (!el) return;

    if (profile && profile.profileImage) {
        el.innerHTML = `<img src="${profile.profileImage}" alt="Profile Photo">`;
        el.style.fontSize = 'initial';
    } else {
        el.innerHTML = '👤';
        el.style.fontSize = '4em';
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async function() {
    showLoading();

    // Load data from JSON file first, then localStorage as fallback
    await loadDataFromJSON();
    
    // Check if there's newer data in localStorage
    const localData = localStorage.getItem('portfolio_data');
    if (localData) {
        try {
            const parsed = JSON.parse(localData);
            // Use localStorage if it has data and JSON file was loaded
            if (parsed.profile || (parsed.experiences && parsed.experiences.length > 0)) {
                profile = parsed.profile || profile;
                experiences = parsed.experiences || experiences;
                if (profile && profile.profileImage) {
                    uploadedProfileImage = profile.profileImage;
                }
            }
        } catch (e) {}
    }
    
    updateLoginPageProfilePhoto();
    hideLoading();

    // Event Listeners
    document.getElementById('passwordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;

        if (password === ADMIN_PASSWORD) {
            closePasswordModal();
            adminMode();
        } else {
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('adminPassword').value = '';
        }
    });

    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    
    document.getElementById('profileImageUpload').addEventListener('change', function(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('profileImagePreview');
        
        if (file) {
            if (file.size > 500 * 1024) {
                showToast('Ukuran gambar maksimal 500KB!', 'error');
                event.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                uploadedProfileImage = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            preview.src = '';
            preview.style.display = 'none';
            uploadedProfileImage = null;
        }
    });

    document.getElementById('experienceForm').addEventListener('submit', saveExperience);
    document.getElementById('importFileInput').addEventListener('change', handleImportFile);
});
