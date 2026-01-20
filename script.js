// ==================== DATABASE CLASS ====================
class PortfolioDatabase {
    constructor() {
        this.DB_KEY = 'portfolio_data';
        this.SETTINGS_KEY = 'portfolio_settings';
    }

    // Save all data to LocalStorage
    save(profile, experiences) {
        const data = {
            profile: profile,
            experiences: experiences,
            lastSaved: new Date().toISOString(),
            version: '1.0'
        };
        
        try {
            localStorage.setItem(this.DB_KEY, JSON.stringify(data));
            return { success: true, message: 'Data berhasil disimpan!' };
        } catch (error) {
            console.error('Error saving data:', error);
            return { success: false, message: 'Gagal menyimpan data: ' + error.message };
        }
    }

    // Load all data from LocalStorage
    load() {
        try {
            const data = localStorage.getItem(this.DB_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    // Clear all data
    clear() {
        try {
            localStorage.removeItem(this.DB_KEY);
            return { success: true, message: 'Semua data berhasil dihapus!' };
        } catch (error) {
            return { success: false, message: 'Gagal menghapus data: ' + error.message };
        }
    }

    // Export data as JSON file
    exportJSON(profile, experiences) {
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
        a.download = `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { success: true, message: 'Data berhasil di-export!' };
    }

    // Import data from JSON file
    importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (!data.profile && !data.experiences) {
                        reject({ success: false, message: 'Format file tidak valid!' });
                        return;
                    }

                    resolve({ 
                        success: true, 
                        data: data,
                        message: 'Data berhasil di-import!' 
                    });
                } catch (error) {
                    reject({ success: false, message: 'File JSON tidak valid!' });
                }
            };

            reader.onerror = () => {
                reject({ success: false, message: 'Gagal membaca file!' });
            };

            reader.readAsText(file);
        });
    }

    // Get last saved time
    getLastSaved() {
        const data = this.load();
        if (data && data.lastSaved) {
            return new Date(data.lastSaved);
        }
        return null;
    }

    // Check if database has data
    hasData() {
        const data = this.load();
        return data !== null && (data.profile !== null || (data.experiences && data.experiences.length > 0));
    }

    // Get storage size
    getStorageSize() {
        const data = localStorage.getItem(this.DB_KEY);
        if (data) {
            const bytes = new Blob([data]).size;
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
        return '0 B';
    }
}

// ==================== INITIALIZE DATABASE ====================
const db = new PortfolioDatabase();

// ==================== DATA STORAGE ====================
let profile = null;
let experiences = [];
let editIndex = -1;
const ADMIN_PASSWORD = 'admin123';
let uploadedProfileImage = null;

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== AUTO-SAVE FUNCTION ====================
function autoSave() {
    const result = db.save(profile, experiences);
    if (result.success) {
        updateDbStatus();
        console.log('Auto-saved at', new Date().toLocaleTimeString());
    }
}

// ==================== UPDATE DATABASE STATUS ====================
function updateDbStatus() {
    const statusElement = document.getElementById('dbStatus');
    if (!statusElement) return;

    const lastSaved = db.getLastSaved();
    const storageSize = db.getStorageSize();
    const hasData = db.hasData();

    let lastSavedText = 'Belum ada data tersimpan';
    if (lastSaved) {
        lastSavedText = `Terakhir disimpan: ${lastSaved.toLocaleString('id-ID')}`;
    }

    statusElement.innerHTML = `
        <div class="db-status-info">
            <div class="db-status-dot" style="background: ${hasData ? '#4ade80' : '#ff6b6b'}"></div>
            <span class="db-status-text">
                <strong>Database:</strong> LocalStorage (${storageSize})
            </span>
        </div>
        <span class="last-saved">${lastSavedText}</span>
    `;
}

// ==================== LOAD DATA ON STARTUP ====================
function loadSavedData() {
    const savedData = db.load();
    if (savedData) {
        profile = savedData.profile || null;
        experiences = savedData.experiences || [];
        
        // Update uploaded image if profile has image
        if (profile && profile.profileImage) {
            uploadedProfileImage = profile.profileImage;
        }

        showToast('Data berhasil dimuat dari database', 'success');
        return true;
    }
    return false;
}

// ==================== EXPORT DATA ====================
function exportData() {
    if (!profile && experiences.length === 0) {
        showToast('Tidak ada data untuk di-export!', 'error');
        return;
    }
    
    const result = db.exportJSON(profile, experiences);
    showToast(result.message, result.success ? 'success' : 'error');
}

// ==================== IMPORT DATA ====================
function importData() {
    document.getElementById('importFileInput').click();
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    db.importJSON(file)
        .then((result) => {
            if (result.success) {
                profile = result.data.profile || null;
                experiences = result.data.experiences || [];
                
                if (profile && profile.profileImage) {
                    uploadedProfileImage = profile.profileImage;
                }

                // Save imported data to LocalStorage
                autoSave();
                
                // Re-render
                renderProfile();
                renderExperiences();
                updateLoginPageProfilePhoto();
                
                showToast(result.message, 'success');
            }
        })
        .catch((error) => {
            showToast(error.message, 'error');
        });

    // Reset file input
    event.target.value = '';
}

// ==================== CLEAR ALL DATA ====================
function clearAllData() {
    if (confirm('⚠️ PERINGATAN!\n\nSemua data portfolio akan dihapus permanen.\nApakah Anda yakin ingin melanjutkan?')) {
        if (confirm('Ini adalah konfirmasi terakhir.\nData yang dihapus tidak dapat dikembalikan.\n\nLanjutkan?')) {
            const result = db.clear();
            
            if (result.success) {
                profile = null;
                experiences = [];
                uploadedProfileImage = null;
                
                renderProfile();
                renderExperiences();
                updateLoginPageProfilePhoto();
                updateDbStatus();
                
                showToast(result.message, 'success');
            } else {
                showToast(result.message, 'error');
            }
        }
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

    const profileImagePreview = document.getElementById('profileImagePreviewTest');
    const profileImageUpload = document.getElementById('profileImageUploadTest');

    if (profile) {
        document.getElementById('profileName').value = profile.name || '';
        document.getElementById('profileJobTitle').value = profile.jobTitle || '';
        document.getElementById('profileBio').value = profile.bio || '';
        document.getElementById('profileEmail').value = profile.email || '';
        document.getElementById('profilePhone').value = profile.phone || '';
        document.getElementById('profileLocation').value = profile.location || '';
        document.getElementById('profileLinkedin').value = profile.linkedin || '';

        if (profile.profileImage) {
            profileImagePreview.src = profile.profileImage;
            profileImagePreview.style.display = 'block';
        } else {
            profileImagePreview.src = '';
            profileImagePreview.style.display = 'none';
        }
        uploadedProfileImage = profile.profileImage;
    } else {
        document.getElementById('profileForm').reset();
        profileImagePreview.src = '';
        profileImagePreview.style.display = 'none';
        uploadedProfileImage = null;
    }
    profileImageUpload.value = '';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
    document.getElementById('profileImageUploadTest').value = '';
    document.getElementById('profileImagePreviewTest').src = '';
    document.getElementById('profileImagePreviewTest').style.display = 'none';
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

    renderProfile();
    updateLoginPageProfilePhoto();
    closeProfileModal();
    
    // Auto-save to database
    autoSave();
    showToast('Profil berhasil disimpan!', 'success');
}

function renderProfile() {
    const display = document.getElementById('profileDisplay');

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

    let profilePhotoHtml = '';
    if (profile.profileImage) {
        profilePhotoHtml = `<div class="profile-photo"><img src="${profile.profileImage}" alt="Profile Photo"></div>`;
    } else {
        profilePhotoHtml = `<div class="profile-photo">${initials}</div>`;
    }

    let contactItems = '';
    if (profile.email) contactItems += `<div class="profile-contact-item">📧 ${profile.email}</div>`;
    if (profile.phone) contactItems += `<div class="profile-contact-item">📱 ${profile.phone}</div>`;
    if (profile.location) contactItems += `<div class="profile-contact-item">📍 ${profile.location}</div>`;
    if (profile.linkedin) contactItems += `<div class="profile-contact-item">💼 <a href="${profile.linkedin}" target="_blank" style="color: white; text-decoration: underline;">LinkedIn</a></div>`;

    display.innerHTML = `
        <div class="profile-display">
            <div class="profile-photo-container">
                ${profilePhotoHtml}
            </div>
            <div class="profile-info">
                <div class="profile-name">${profile.name}</div>
                <div class="profile-title">${profile.jobTitle}</div>
                <div class="profile-bio">${profile.bio || ''}</div>
                <div class="profile-contact">
                    ${contactItems}
                </div>
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
        document.getElementById('description').value = exp.description;
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
        showToast('Pengalaman berhasil diperbarui!', 'success');
    } else {
        experiences.push(data);
        showToast('Pengalaman berhasil ditambahkan!', 'success');
    }

    renderExperiences();
    closeExperienceModal();
    
    // Auto-save to database
    autoSave();
}

function deleteExperience(index) {
    if (confirm('Yakin ingin menghapus pengalaman ini?')) {
        experiences.splice(index, 1);
        renderExperiences();
        
        // Auto-save to database
        autoSave();
        showToast('Pengalaman berhasil dihapus!', 'success');
    }
}

function renderExperiences() {
    const list = document.getElementById('experienceList');
    list.innerHTML = '';

    if (experiences.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>Belum ada pengalaman</h3>
                <p>Klik tombol tambah pengalaman untuk mengisi</p>
            </div>
        `;
        return;
    }

    experiences.forEach((exp, index) => {
        list.innerHTML += `
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
        `;
    });
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

        let profilePhotoHtml = '';
        if (profile.profileImage) {
            profilePhotoHtml = `<div class="profile-photo"><img src="${profile.profileImage}" alt="Profile Photo"></div>`;
        } else {
            profilePhotoHtml = `<div class="profile-photo">${initials}</div>`;
        }

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

    experienceDisplay.innerHTML = '';
    if (experiences.length === 0) {
        experienceDisplay.innerHTML = `
            <div class="empty-state">
                <h3>Belum ada pengalaman</h3>
            </div>
        `;
    } else {
        experiences.forEach(exp => {
            experienceDisplay.innerHTML += `
                <div class="view-experience-card">
                    <h3>${exp.position}</h3>
                    <div class="company">${exp.company}</div>
                    <div class="period">${exp.period}</div>
                    <div class="description">${exp.description || ''}</div>
                </div>
            `;
        });
    }
}

// ==================== UPDATE LOGIN PAGE PHOTO ====================
function updateLoginPageProfilePhoto() {
    const loginProfilePhotoLarge = document.querySelector('.profile-photo-large');
    if (profile && profile.profileImage) {
        loginProfilePhotoLarge.innerHTML = `<img src="${profile.profileImage}" alt="Profile Photo">`;
        loginProfilePhotoLarge.style.fontSize = 'initial';
    } else {
        loginProfilePhotoLarge.innerHTML = '👤';
        loginProfilePhotoLarge.style.fontSize = '4em';
    }
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    // Load saved data
    loadSavedData();
    updateLoginPageProfilePhoto();

    // Password form
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

    // Profile form
    document.getElementById('profileForm').addEventListener('submit', saveProfile);

    // Profile image upload
    document.getElementById('profileImageUploadTest').addEventListener('change', function(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('profileImagePreviewTest');
        if (file) {
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

    // Experience form
    document.getElementById('experienceForm').addEventListener('submit', saveExperience);

    // Import file input
    document.getElementById('importFileInput').addEventListener('change', handleImportFile);
});// Add JS here