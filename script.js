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
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    // Show animation
    setTimeout(() => toast.classList.add('show'), 50);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, 3000);
}

function updateConnectionUI(connected, message = '') {
    isConnected = connected;
    
    // Login page indicator
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

    // Edit page indicator
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

    // Listen for data changes (realtime sync)
    portfolioRef.on('value', (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
            profile = data.profile || null;
            experiences = data.experiences || [];
            currentPhotoBase64 = profile?.photo || null;

            // Update current page
            const activePage = document.querySelector('.page.active');
            if (activePage) {
                if (activePage.id === 'loginPage') 
