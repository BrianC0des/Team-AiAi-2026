import { auth, onAuthStateChanged } from "../../../config.js";

// ─────────────────────────────────────────────────────────────────────────────
//  donation-stash.js — Logic for managing the donation box
// ─────────────────────────────────────────────────────────────────────────────

// --- State Management ---
let loggedInUser = JSON.parse(localStorage.getItem('scannableUser') || 'null');
let uploadedItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
let donationBox = [];
let selectedOrg = null;

// --- Auth Guard ---
const checkAuth = () => {
    return true; // Accessible to guests without gates
};

// --- DOM Elements ---
const availableItemsGrid = document.getElementById('availableItemsGrid');
const boxContent = document.getElementById('boxContent');
const boxCount = document.getElementById('boxCount');
const resetBoxBtn = document.getElementById('resetBoxBtn');
const donateAllBtn = document.getElementById('donateAllBtn');
const headerAvatar = document.getElementById('headerAvatar');
const donationHistoryList = document.getElementById('donationHistoryList');

// Modal Elements
const orgModal = document.getElementById('orgModal');
const closeOrgModal = document.getElementById('closeOrgModal');
const confirmDonationBtn = document.getElementById('confirmDonationBtn');

// --- Functions ---

const updateHeaderAvatar = (user) => {
    const loginBtn = document.getElementById('login');
    const signInBtn = document.getElementById('Sign-in');
    const profileLink = document.getElementById('profileLink');

    if (user) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (signInBtn) signInBtn.classList.add('hidden');
        if (profileLink) profileLink.classList.remove('hidden');

        if (headerAvatar) {
            if (user.profilePicture) {
                headerAvatar.innerHTML = `<img src="${user.profilePicture}" alt="Profile">`;
            } else if (user.email) {
                const parts = user.email.split('@')[0].split(/[._-]/);
                let initials = parts.length === 1 ? parts[0].substring(0, 2).toUpperCase() : (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
                headerAvatar.textContent = initials;
            }
        }
    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (signInBtn) signInBtn.classList.remove('hidden');
        if (profileLink) profileLink.classList.add('hidden');
    }
};

const renderAvailableItems = () => {
    if (!availableItemsGrid) return;
    availableItemsGrid.innerHTML = '';

    const itemsToShow = uploadedItems.filter(item =>
        item.action === 'donate' &&
        !item.donated &&
        !donationBox.some(boxItem => boxItem.createdAt === item.createdAt)
    );

    if (itemsToShow.length === 0) {
        availableItemsGrid.innerHTML = `
            <div class="empty-msg-container" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p class="empty-msg">No items marked for donation yet.</p>
            </div>
        `;
        return;
    }

    itemsToShow.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <img src="${item.imageData || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'}" alt="${item.name}">
            <p class="item-name">${item.name}</p>
            <button class="add-to-box-btn" onclick="addToBox('${item.createdAt}')">+ Add</button>
        `;
        availableItemsGrid.appendChild(card);
    });
};

const renderDonationBox = () => {
    if (!boxContent) return;
    boxContent.innerHTML = '';

    if (donationBox.length === 0) {
        boxContent.innerHTML = '<p class="empty-box-message">No items added yet.</p>';
        if (boxCount) boxCount.textContent = '0 items';
        if (donateAllBtn) donateAllBtn.disabled = true;
        return;
    }

    if (boxCount) boxCount.textContent = `${donationBox.length} item${donationBox.length === 1 ? '' : 's'}`;
    if (donateAllBtn) donateAllBtn.disabled = false;

    donationBox.forEach(item => {
        const div = document.createElement('div');
        div.className = 'box-item';
        div.innerHTML = `
            <img src="${item.imageData || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'}" alt="${item.name}">
            <div class="box-item-info">
                <h4>${item.name}</h4>
                <span>${item.category}</span>
            </div>
            <button class="remove-item-btn" onclick="removeFromBox('${item.createdAt}')"><i class="fas fa-trash"></i></button>
        `;
        boxContent.appendChild(div);
    });
};

const renderHistory = () => {
    if (!donationHistoryList) return;
    donationHistoryList.innerHTML = '';

    const donatedItems = uploadedItems.filter(item => item.donated);

    if (donatedItems.length === 0) {
        donationHistoryList.innerHTML = '<p class="history-empty">No donations yet.</p>';
        return;
    }

    donatedItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'box-item';
        div.innerHTML = `
            <img src="${item.imageData || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'}" alt="${item.name}">
            <div class="box-item-info">
                <h4>${item.name}</h4>
                <p>Donated to ${item.donatedTo} on ${new Date(item.donatedAt).toLocaleDateString()}</p>
            </div>
        `;
        donationHistoryList.appendChild(div);
    });
};

window.addToBox = (createdAt) => {
    const item = uploadedItems.find(i => i.createdAt === createdAt);
    if (item) {
        donationBox.push(item);
        renderAvailableItems();
        renderDonationBox();
    }
};

window.removeFromBox = (createdAt) => {
    donationBox = donationBox.filter(i => i.createdAt !== createdAt);
    renderAvailableItems();
    renderDonationBox();
};

const resetBox = () => {
    donationBox = [];
    renderAvailableItems();
    renderDonationBox();
};

const openOrgModal = () => {
    if (orgModal) orgModal.classList.add('active');
};

const closeModals = () => {
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(o => o.classList.remove('active'));
    
    // Clear selection
    const radio = document.querySelector('input[name="org"]:checked');
    if (radio) radio.checked = false;
    
    selectedOrg = null;
    if (confirmDonationBtn) confirmDonationBtn.disabled = true;
};

// --- Event Listeners ---

if (resetBoxBtn) resetBoxBtn.addEventListener('click', resetBox);
if (donateAllBtn) donateAllBtn.addEventListener('click', openOrgModal);
if (closeOrgModal) closeOrgModal.addEventListener('click', closeModals);

// Setup radio button listener
document.querySelectorAll('input[name="org"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        selectedOrg = e.target.value;
        if (confirmDonationBtn) confirmDonationBtn.disabled = false;
    });
});

const syncWithFirebase = async () => {
    const user = auth.currentUser;
    if (user) {
        try {
            const idToken = await user.getIdToken();
            const localItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
            const response = await fetch('/api/items/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken, items: localItems })
            });
            const data = await response.json();
            if (data.success) {
                uploadedItems = data.items;
                localStorage.setItem('scannableItems', JSON.stringify(uploadedItems));
                renderAvailableItems();
                renderDonationBox();
                renderHistory();
            }
        } catch (error) {
            console.error("Error syncing with Firebase:", error);
        }
    }
};

if (confirmDonationBtn) {
    confirmDonationBtn.addEventListener('click', async () => {
        if (!selectedOrg) return;

        donationBox.forEach(boxItem => {
            const item = uploadedItems.find(i => i.createdAt === boxItem.createdAt);
            if (item) {
                item.donated = true;
                item.donatedTo = selectedOrg;
                item.donatedAt = new Date().toISOString();
            }
        });

        localStorage.setItem('scannableItems', JSON.stringify(uploadedItems));
        alert(`🎉 Success! Your box has been donated to ${selectedOrg}.`);
        donationBox = [];
        closeModals();
        renderAvailableItems();
        renderDonationBox();
        renderHistory();
        await syncWithFirebase();
    });
}

// Navigation Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderAvatar(loggedInUser);

    // Tab switching
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
            if (tab.dataset.tab === 'available') document.getElementById('donationBoxSection').classList.add('active');
        });
    });

    const dbBtn = document.getElementById('DashboardBtn');
    if (dbBtn) dbBtn.addEventListener('click', () => window.location.href = 'userHome.html');

    const arBtn = document.getElementById('ActiveRepair');
    if (arBtn) arBtn.addEventListener('click', () => window.location.href = 'activeRepair.html');

    const dsBtn = document.getElementById('DonationStash');
    if (dsBtn) dsBtn.addEventListener('click', () => window.location.href = 'donationStash.html');

    const upBtn = document.getElementById('UploadItem');
    if (upBtn) upBtn.addEventListener('click', () => window.location.href = 'userHome.html?openUpload=true');

    renderAvailableItems();
    renderDonationBox();
    renderHistory();

    // Bind login/signup redirects for guests
    const loginBtn = document.getElementById('login');
    const signInBtn = document.getElementById('Sign-in');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'userHome.html?openLogin=true';
        });
    }
    if (signInBtn) {
        signInBtn.addEventListener('click', () => {
            window.location.href = 'userHome.html?openSignup=true';
        });
    }
});

// --- Auth State Listener ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User is logged in:", user.email);
        try {
            const idToken = await user.getIdToken();
            
            // Sync profile
            const profileResponse = await fetch('/api/auth/login-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });
            const profileData = await profileResponse.json();
            if (profileData.success) {
                loggedInUser = profileData.user;
                localStorage.setItem('scannableUser', JSON.stringify(loggedInUser));
                updateHeaderAvatar(loggedInUser);
            }

            // Sync items
            const localItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
            const syncResponse = await fetch('/api/items/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken, items: localItems })
            });
            const syncData = await syncResponse.json();
            if (syncData.success) {
                uploadedItems = syncData.items;
                localStorage.setItem('scannableItems', JSON.stringify(uploadedItems));
                renderAvailableItems();
                renderDonationBox();
                renderHistory();
            }
        } catch (error) {
            console.error("Error during donation stash sync:", error);
        }
    } else {
        console.log("No user logged in.");
        loggedInUser = null;
        localStorage.removeItem('scannableUser');
        updateHeaderAvatar(null);
    }
});
