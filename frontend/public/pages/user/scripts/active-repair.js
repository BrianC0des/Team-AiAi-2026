import { auth, onAuthStateChanged } from "../../../config.js";

// ─────────────────────────────────────────────────────────────────────────────
//  active-repair.js — Logic for managing repair stages
// ─────────────────────────────────────────────────────────────────────────────

// --- State ---
let loggedInUser = JSON.parse(localStorage.getItem('scannableUser') || 'null');
let uploadedItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
let repairItems = [];
let currentItemId = null;

// --- Data Sync ---
const syncData = () => {
  repairItems = uploadedItems
    .filter(item => item.action === 'repair')
    .map((item, index) => ({
      id: item.id || `rep-${item.createdAt || index}`,
      name: item.name,
      category: item.category,
      image: item.imageData || '../../../assets/Pictures/Green-tech-what-it-is-about-and-why-you-should-keep-an-eye-on-its-development-in-2022.jpg',
      // Status pipeline: 'recommendation' → 'ongoing' → 'finished'
      // Items sent here via Repair button are already 'ongoing'
      status: item.repairStatus || 'ongoing',
      aiSuggestion: item.aiSuggestion || 'Based on the item type and condition, we recommend a standard inspection.',
      aiDiyTips: item.aiDiyTips || [],
      canRepair: item.canRepair !== undefined ? item.canRepair : true,
      createdAt: item.createdAt,
      imageData: item.imageData,
    }));
};

const syncWithFirebase = async () => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const idToken = await user.getIdToken();
    const localItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
    const res = await fetch('/api/items/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, items: localItems }),
    });
    const data = await res.json();
    if (data.success) {
      uploadedItems = data.items;
      localStorage.setItem('scannableItems', JSON.stringify(uploadedItems));
    }
  } catch (err) {
    console.error('[active-repair] Firebase sync error:', err);
  }
};

const persistStatus = (repItem) => {
  const original = uploadedItems.find(
    i => i.id === repItem.id || (i.createdAt && i.createdAt === repItem.createdAt)
  );
  if (original) original.repairStatus = repItem.status;
  localStorage.setItem('scannableItems', JSON.stringify(uploadedItems));
  syncWithFirebase();
};

// --- DOM ---
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const recommendationsGrid = document.getElementById('recommendationsGrid');
const ongoingGrid = document.getElementById('ongoingGrid');
const finishedGrid = document.getElementById('finishedGrid');
const headerAvatar = document.getElementById('headerAvatar');
const repairDetailModal = document.getElementById('repairDetailModal');
const finishRepairModal = document.getElementById('finishRepairModal');
const modalItemName = document.getElementById('modalItemName');
const modalAiSuggestion = document.getElementById('modalAiSuggestion');
const modalToolsList = document.getElementById('modalToolsList');
const modalStepsList = document.getElementById('modalStepsList');
const repairStationSection = document.getElementById('repairStationSection');
const startRepairBtn = document.getElementById('startRepairBtn');

// --- Avatar ---
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
        const initials = parts.length === 1
          ? parts[0].substring(0, 2).toUpperCase()
          : (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        headerAvatar.textContent = initials;
      }
    }
  } else {
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (signInBtn) signInBtn.classList.remove('hidden');
    if (profileLink) profileLink.classList.add('hidden');
  }
};

// --- Render ---
const renderRepairs = () => {
  if (recommendationsGrid) recommendationsGrid.innerHTML = '';
  if (ongoingGrid) ongoingGrid.innerHTML = '';
  if (finishedGrid) finishedGrid.innerHTML = '';

  repairItems.forEach(item => {
    const card = createRepairCard(item);
    if (item.status === 'recommendation' && recommendationsGrid) {
      recommendationsGrid.appendChild(card);
    } else if (item.status === 'ongoing' && ongoingGrid) {
      ongoingGrid.appendChild(card);
    } else if (item.status === 'finished' && finishedGrid) {
      finishedGrid.appendChild(card);
    }
  });

  if (recommendationsGrid && recommendationsGrid.innerHTML === '') {
    recommendationsGrid.innerHTML = '<div class="empty-msg-container"><p class="empty-msg">No repair recommendations yet.</p><button class="btn-primary" onclick="window.location.href=\'userHome.html\'">Go to Dashboard</button></div>';
  }
  if (ongoingGrid && ongoingGrid.innerHTML === '') {
    ongoingGrid.innerHTML = '<p class="empty-msg">No ongoing repairs. Start one from Recommendations!</p>';
  }
  if (finishedGrid && finishedGrid.innerHTML === '') {
    finishedGrid.innerHTML = '<p class="empty-msg">No finished repairs yet. Complete an ongoing repair to see it here.</p>';
  }
};

const createRepairCard = (item) => {
  const card = document.createElement('div');
  card.className = 'repair-card';
  const truncated = (item.aiSuggestion || '').substring(0, 90);
  card.innerHTML = `
    <img src="${item.image}" alt="${item.name}" class="card-image">
    <div class="card-info">
      <span class="card-category">${item.category}</span>
      <h3>${item.name}</h3>
      <p class="card-suggestion">${truncated}${item.aiSuggestion && item.aiSuggestion.length > 90 ? '\u2026' : ''}</p>
      <div class="card-actions">${getActionButtons(item)}</div>
    </div>`;
  return card;
};

const getActionButtons = (item) => {
  if (item.status === 'recommendation') {
    return `<button class="card-btn btn-primary" onclick="openRepairDetail('${item.id}')">View Steps & Start</button>`;
  } else if (item.status === 'ongoing') {
    return `
      <button class="card-btn btn-primary" onclick="openFinishRepair('${item.id}')">Mark Complete</button>
      <button class="card-btn btn-secondary" onclick="pauseRepair('${item.id}')">Pause</button>`;
  } else if (item.status === 'finished') {
    return `<button class="card-btn btn-secondary" onclick="openRepairDetail('${item.id}')">View Summary</button>`;
  }
  return '';
};

// --- Modals ---
window.openRepairDetail = (id) => {
  const item = repairItems.find(i => i.id === id);
  if (!item) return;
  currentItemId = id;
  if (modalItemName) modalItemName.textContent = item.name;
  if (modalAiSuggestion) modalAiSuggestion.textContent = item.aiSuggestion;

  const tips = item.aiDiyTips.length
    ? item.aiDiyTips
    : ['Inspect the item for visible damage', 'Clean and test components', 'Check all connections'];

  if (modalToolsList) modalToolsList.innerHTML = tips.map(t => `<li>${t}</li>`).join('');
  if (modalStepsList) modalStepsList.innerHTML = tips.map(s => `<li>${s}</li>`).join('');
  if (repairStationSection) repairStationSection.classList.add('hidden');

  if (startRepairBtn) {
    if (item.status === 'finished') {
      startRepairBtn.classList.add('hidden');
    } else {
      startRepairBtn.classList.remove('hidden');
      startRepairBtn.textContent = item.status === 'ongoing' ? 'Keep Fixing' : 'Start Repair Now';
    }
  }
  if (repairDetailModal) repairDetailModal.classList.add('active');
};

window.openFinishRepair = (id) => {
  currentItemId = id;
  const form = document.getElementById('finishRepairForm');
  if (form) form.reset();
  const previewWrapper = document.getElementById('finishPreviewWrapper');
  if (previewWrapper) previewWrapper.classList.add('hidden');
  const verifyStatus = document.getElementById('verifyStatus');
  if (verifyStatus) { verifyStatus.classList.add('hidden'); verifyStatus.textContent = ''; }
  const confirmBtn = document.getElementById('confirmFinishBtn');
  if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'Confirm & Verify with AI'; }
  if (finishRepairModal) finishRepairModal.classList.add('active');
};

window.pauseRepair = (id) => {
  const item = repairItems.find(i => i.id === id);
  if (item && confirm('Move this repair back to Recommendations?')) {
    item.status = 'recommendation';
    persistStatus(item);
    renderRepairs();
  }
};

const closeModals = () => {
  if (repairDetailModal) repairDetailModal.classList.remove('active');
  if (finishRepairModal) finishRepairModal.classList.remove('active');
  const previewWrapper = document.getElementById('finishPreviewWrapper');
  if (previewWrapper) previewWrapper.classList.add('hidden');
  const form = document.getElementById('finishRepairForm');
  if (form) form.reset();
};

// --- AI Verification on Finish ---
const confirmFinishBtn = document.getElementById('confirmFinishBtn');
if (confirmFinishBtn) {
  confirmFinishBtn.addEventListener('click', async () => {
    const item = repairItems.find(i => i.id === currentItemId);
    const fileInput = document.getElementById('finishImage');
    const verifyStatus = document.getElementById('verifyStatus');

    if (!fileInput || !fileInput.files.length) {
      alert('Please upload a photo of the repaired item so AI can verify.');
      return;
    }

    confirmFinishBtn.disabled = true;
    confirmFinishBtn.textContent = '\uD83D\uDD0D AI is verifying\u2026';
    if (verifyStatus) {
      verifyStatus.classList.remove('hidden');
      verifyStatus.textContent = 'Sending photo to AI for verification\u2026';
      verifyStatus.style.color = '#0066cc';
    }

    try {
      const file = fileInput.files[0];
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const parts = dataUrl.split(',');
      const imageBase64 = parts[1];
      const mimeType = file.type || 'image/jpeg';

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          category: item ? item.category : 'General',
          name: item ? item.name : 'Item',
          description: `AFTER-REPAIR VERIFICATION: Please assess whether the item "${item ? item.name : 'item'}" appears to be repaired, functional, and in working condition based on the photo. If it looks repaired or operational, severity should NOT be "Severely Damaged". If it still looks visibly broken, rate it "Severely Damaged".`,
        }),
      });

      const data = await res.json();
      const isRepaired = !(data.severity === 'Severely Damaged' && data.recommendedAction === 'recycle');

      if (isRepaired) {
        if (item) {
          item.status = 'finished';
          const original = uploadedItems.find(i => i.id === item.id || (i.createdAt && i.createdAt === item.createdAt));
          if (original) {
            original.repairStatus = 'finished';
            localStorage.setItem('scannableItems', JSON.stringify(uploadedItems));
            await syncWithFirebase();
          }
        }
        closeModals();
        syncData();
        renderRepairs();

        // Switch to Finished tab
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        const finishedTab = document.querySelector('[data-tab="finished"]');
        const finishedSection = document.getElementById('finished');
        if (finishedTab) finishedTab.classList.add('active');
        if (finishedSection) finishedSection.classList.add('active');

        // Show impact card
        const original = uploadedItems.find(i => item && (i.id === item.id || (i.createdAt && i.createdAt === item.createdAt)));
        if (original && window.showImpactCard) {
          window.showImpactCard(original, 'repair');
        } else {
          alert('\u2705 Repair verified by AI! Item moved to Finished Repairs. Great job!');
        }
      } else {
        if (verifyStatus) {
          verifyStatus.textContent = '\u274C AI could not confirm the repair. The item may still appear damaged. Try a clearer photo or continue working on it.';
          verifyStatus.style.color = '#cc0000';
        }
        confirmFinishBtn.disabled = false;
        confirmFinishBtn.textContent = 'Try Again';
      }
    } catch (err) {
      console.error('[finish-repair] AI verification error:', err);
      if (verifyStatus) {
        verifyStatus.textContent = '\u26A0\uFE0F Verification failed due to a network error. Please try again.';
        verifyStatus.style.color = '#cc6600';
      }
      confirmFinishBtn.disabled = false;
      confirmFinishBtn.textContent = 'Retry Verification';
    }
  });
}

// --- Start Repair Button ---
if (startRepairBtn) {
  startRepairBtn.addEventListener('click', () => {
    const item = repairItems.find(i => i.id === currentItemId);
    if (item && item.status === 'recommendation') {
      item.status = 'ongoing';
      persistStatus(item);
      renderRepairs();
    }
    closeModals();
  });
}

// --- Image Preview ---
const finishImageInput = document.getElementById('finishImage');
if (finishImageInput) {
  finishImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const preview = document.getElementById('finishPreview');
      const wrapper = document.getElementById('finishPreviewWrapper');
      if (preview) preview.src = evt.target.result;
      if (wrapper) wrapper.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });
}

// --- Tab Switching ---
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const content = document.getElementById(tab.dataset.tab);
    if (content) content.classList.add('active');
  });
});

// --- Modal Close Buttons ---
document.getElementById('closeRepairDetail')?.addEventListener('click', closeModals);
document.getElementById('closeFinishRepair')?.addEventListener('click', closeModals);
document.getElementById('cancelRepairBtn')?.addEventListener('click', closeModals);
document.getElementById('cancelFinishBtn')?.addEventListener('click', closeModals);

// --- Navigation & Init ---
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderAvatar(loggedInUser);
  syncData();
  renderRepairs();

  document.getElementById('DashboardBtn')?.addEventListener('click', () => window.location.href = 'userHome.html');
  document.getElementById('UploadItem')?.addEventListener('click', () => window.location.href = 'userHome.html?openUpload=true');
  document.getElementById('ActiveRepair')?.addEventListener('click', () => window.location.href = 'activeRepair.html');
  document.getElementById('DonationStash')?.addEventListener('click', () => window.location.href = 'donationStash.html');
  document.getElementById('login')?.addEventListener('click', () => window.location.href = 'userHome.html?openLogin=true');
  document.getElementById('Sign-in')?.addEventListener('click', () => window.location.href = 'userHome.html?openSignup=true');
});

// --- Auth State ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const idToken = await user.getIdToken();
      const profileRes = await fetch('/api/auth/login-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const profileData = await profileRes.json();
      if (profileData.success) {
        loggedInUser = profileData.user;
        localStorage.setItem('scannableUser', JSON.stringify(loggedInUser));
        updateHeaderAvatar(loggedInUser);
      }
      const localItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
      const syncRes = await fetch('/api/items/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, items: localItems }),
      });
      const syncResult = await syncRes.json();
      if (syncResult.success) {
        uploadedItems = syncResult.items;
        localStorage.setItem('scannableItems', JSON.stringify(uploadedItems));
        syncData();
        renderRepairs();
      }
    } catch (err) {
      console.error('[active-repair] Auth sync error:', err);
    }
  } else {
    loggedInUser = null;
    localStorage.removeItem('scannableUser');
    updateHeaderAvatar(null);
  }
});
