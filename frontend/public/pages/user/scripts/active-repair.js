import { auth, onAuthStateChanged } from "../../../config.js";

// ─────────────────────────────────────────────────────────────────────────────
//  active-repair.js — Logic for managing repair stages
// ─────────────────────────────────────────────────────────────────────────────

// --- State Management ---
let loggedInUser = JSON.parse(localStorage.getItem('scannableUser') || 'null');
let uploadedItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
let repairItems = [];
let currentItemId = null;

// --- Auth Guard ---
const checkAuth = () => {
    return true; // Accessible to guests without gates
};

// --- Data Synchronization ---
const syncData = () => {
    const itemsFromStorage = uploadedItems.filter(item => item.action === 'repair');
    
    repairItems = itemsFromStorage.map((item, index) => {
        return {
            id: item.id || `rep-${item.createdAt || index}`,
            name: item.name,
            category: item.category,
            image: item.imageData || "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80",
            status: item.repairStatus || 'recommendation',
            aiSuggestion: item.aiSuggestion || "Based on the item type and condition, we recommend a standard inspection.",
            tools: item.repairTools || ["Screwdriver", "Cleaning Kit"],
            steps: item.repairSteps || [
                "Inspect the item for visible damage.",
                "Clean any debris from moving parts or connectors.",
                "Check for loose connections or screws.",
                "Test functionality after basic maintenance."
            ],
            canRepair: item.canRepair !== undefined ? item.canRepair : true,
            stationInfo: item.stationInfo || "Nearby Repair Station: 1.5 miles away."
        };
    });
};

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
                syncData();
                renderRepairs();
            }
        } catch (error) {
            console.error("Error syncing with Firebase:", error);
        }
    }
};

const updateStorage = () => {
    repairItems.forEach(repItem => {
        const originalItem = uploadedItems.find(item => item.name === repItem.name && item.createdAt === repItem.createdAt);
        if (originalItem) {
            originalItem.repairStatus = repItem.status;
        }
    });
    localStorage.setItem('scannableItems', JSON.stringify(uploadedItems));
    syncWithFirebase();
};

// --- DOM Elements ---
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const recommendationsGrid = document.getElementById('recommendationsGrid');
const ongoingGrid = document.getElementById('ongoingGrid');
const finishedGrid = document.getElementById('finishedGrid');
const headerAvatar = document.getElementById('headerAvatar');

// Modals
const repairDetailModal = document.getElementById('repairDetailModal');
const finishRepairModal = document.getElementById('finishRepairModal');

// Modal Elements
const modalItemName = document.getElementById('modalItemName');
const modalAiSuggestion = document.getElementById('modalAiSuggestion');
const modalToolsList = document.getElementById('modalToolsList');
const modalStepsList = document.getElementById('modalStepsList');
const repairStationSection = document.getElementById('repairStationSection');
const startRepairBtn = document.getElementById('startRepairBtn');

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
                headerAvatar.innerHTML = initials;
            }
        }
    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (signInBtn) signInBtn.classList.remove('hidden');
        if (profileLink) profileLink.classList.add('hidden');
    }
};

window.addSampleRepair = () => {
    const names = ["Faulty Toaster", "Wobbly Chair", "Dim Tablet", "Leaky Kettle", "Stuck Door Lock"];
    const categories = ["Electronics", "Household", "Hardware"];
    
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    const newItem = {
        name: randomName + " " + (uploadedItems.length + 1),
        category: randomCategory,
        imageData: null,
        action: 'repair',
        createdAt: new Date().toISOString(),
        repairStatus: 'recommendation'
    };
    
    uploadedItems.push(newItem);
    localStorage.setItem('scannableItems', JSON.stringify(uploadedItems));
    syncData();
    renderRepairs();
    syncWithFirebase();
};

const renderRepairs = () => {
    recommendationsGrid.innerHTML = '';
    ongoingGrid.innerHTML = '';
    finishedGrid.innerHTML = '';

    repairItems.forEach(item => {
        const card = createRepairCard(item);
        if (item.status === 'recommendation') {
            recommendationsGrid.appendChild(card);
        } else if (item.status === 'ongoing') {
            ongoingGrid.appendChild(card);
        } else if (item.status === 'finished') {
            finishedGrid.appendChild(card);
        }
    });

    if (recommendationsGrid.innerHTML === '') {
        recommendationsGrid.innerHTML = '<div class="empty-msg-container"><p class="empty-msg">No items marked for repair yet.</p><button class="btn-primary" onclick="window.location.href=\'userHome.html\'">Go to Dashboard</button></div>';
    }
    if (ongoingGrid.innerHTML === '') {
        ongoingGrid.innerHTML = '<p class="empty-msg">No ongoing repairs.</p>';
    }
    if (finishedGrid.innerHTML === '') {
        finishedGrid.innerHTML = '<p class="empty-msg">No finished repairs.</p>';
    }
};

const createRepairCard = (item) => {
    const card = document.createElement('div');
    card.className = 'repair-card';
    card.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="card-image">
        <div class="card-info">
            <span class="card-category">${item.category}</span>
            <h3>${item.name}</h3>
            <p class="card-suggestion">${item.aiSuggestion.substring(0, 80)}...</p>
            <div class="card-actions">
                ${getActionButtons(item)}
            </div>
        </div>
    `;
    return card;
};

const getActionButtons = (item) => {
    if (item.status === 'recommendation') {
        return `
            <button class="card-btn btn-primary" onclick="openRepairDetail('${item.id}')">View Steps</button>
            ${!item.canRepair ? `<button class="card-btn btn-outline" onclick="openRepairDetail('${item.id}')">Nearby Station</button>` : ''}
        `;
    } else if (item.status === 'ongoing') {
        return `
            <button class="card-btn btn-primary" onclick="openFinishRepair('${item.id}')">Complete</button>
            <button class="card-btn btn-secondary" onclick="pauseRepair('${item.id}')">Pause</button>
        `;
    } else if (item.status === 'finished') {
        return `
            <button class="card-btn btn-secondary" onclick="openRepairDetail('${item.id}')">View Summary</button>
        `;
    }
};

window.pauseRepair = (id) => {
    const item = repairItems.find(i => i.id === id);
    if (item) {
        if(confirm("Do you want to pause this repair and move it back to recommendations?")) {
            item.status = 'recommendation';
            updateStorage();
            renderRepairs();
        }
    }
};

window.openRepairDetail = (id) => {
    const item = repairItems.find(i => i.id === id);
    if (!item) return;

    currentItemId = id;
    modalItemName.textContent = item.name;
    modalAiSuggestion.textContent = item.aiSuggestion;
    
    modalToolsList.innerHTML = '';
    item.tools.forEach(tool => {
        const li = document.createElement('li');
        li.textContent = tool;
        modalToolsList.appendChild(li);
    });

    modalStepsList.innerHTML = '';
    item.steps.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        modalStepsList.appendChild(li);
    });

    if (item.canRepair) {
        repairStationSection.classList.add('hidden');
        startRepairBtn.classList.remove('hidden');
        startRepairBtn.textContent = item.status === 'recommendation' ? 'Start Repair Now' : 'Keep Fixing';
    } else {
        repairStationSection.classList.remove('hidden');
        startRepairBtn.classList.add('hidden');
        document.getElementById('modalStationInfo').textContent = item.stationInfo || "This repair might be too complex for DIY.";
    }

    if (item.status === 'finished') {
        startRepairBtn.classList.add('hidden');
    }

    repairDetailModal.classList.add('active');
};

window.openFinishRepair = (id) => {
    currentItemId = id;
    finishRepairModal.classList.add('active');
};

const closeModals = () => {
    repairDetailModal.classList.remove('active');
    finishRepairModal.classList.remove('active');
    const previewWrapper = document.getElementById('finishPreviewWrapper');
    if (previewWrapper) previewWrapper.classList.add('hidden');
    const form = document.getElementById('finishRepairForm');
    if (form) form.reset();
};

// --- Event Listeners ---

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const content = document.getElementById(tab.dataset.tab);
        content.classList.add('active');
    });
});

document.getElementById('closeRepairDetail').addEventListener('click', closeModals);
document.getElementById('closeFinishRepair').addEventListener('click', closeModals);
document.getElementById('cancelRepairBtn').addEventListener('click', closeModals);
document.getElementById('cancelFinishBtn').addEventListener('click', closeModals);

startRepairBtn.addEventListener('click', () => {
    const item = repairItems.find(i => i.id === currentItemId);
    if (item && item.status === 'recommendation') {
        item.status = 'ongoing';
        updateStorage();
        renderRepairs();
    }
    closeModals();
});

document.getElementById('confirmFinishBtn').addEventListener('click', () => {
    const item = repairItems.find(i => i.id === currentItemId);
    const fileInput = document.getElementById('finishImage');
    
    if (!fileInput.files.length) {
        alert("Please upload a photo of the working item.");
        return;
    }

    if (item) {
        item.status = 'finished';
        updateStorage();
        renderRepairs();
    }
    closeModals();
    alert("Repair confirmed! Item moved to Finished Repairs.");
});

// Image Preview for Finish Repair
const finishImageInput = document.getElementById('finishImage');
if (finishImageInput) {
    finishImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const preview = document.getElementById('finishPreview');
                preview.src = event.target.result;
                document.getElementById('finishPreviewWrapper').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
}

// Navigation Listeners
const dashboardBtn = document.getElementById('DashboardBtn');
if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => window.location.href = 'userHome.html');
}

document.getElementById('UploadItem').addEventListener('click', () => {
    window.location.href = 'userHome.html?openUpload=true';
});

document.getElementById('ActiveRepair').addEventListener('click', () => window.location.href = 'activeRepair.html');
document.getElementById('DonationStash').addEventListener('click', () => window.location.href = 'donationStash.html');

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderAvatar(loggedInUser);
    syncData();
    renderRepairs();

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
                syncData();
                renderRepairs();
            }
        } catch (error) {
            console.error("Error during active repairs sync:", error);
        }
    } else {
        console.log("No user logged in.");
        loggedInUser = null;
        localStorage.removeItem('scannableUser');
        updateHeaderAvatar(null);
    }
});
