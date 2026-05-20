import { auth, onAuthStateChanged } from "../../../config.js";

// ─────────────────────────────────────────────────────────────────────────────
//  donation-stash.js — Manages donate stash, recycle stash, and smart prompts
// ─────────────────────────────────────────────────────────────────────────────

const DONATE_THRESHOLD = 10;
const RECYCLE_THRESHOLD = 10;

let loggedInUser = JSON.parse(localStorage.getItem('scannableUser') || 'null');
let uploadedItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
let donationBox = [];
let recycleBox = [];
let selectedOrg = null;

// --- DOM ---
const availableItemsGrid = document.getElementById('availableItemsGrid');
const recycleItemsGrid   = document.getElementById('recycleItemsGrid');
const boxContent         = document.getElementById('boxContent');
const boxCount           = document.getElementById('boxCount');
const recycleBoxContent  = document.getElementById('recycleBoxContent');
const recycleBoxCount    = document.getElementById('recycleBoxCount');
const resetBoxBtn        = document.getElementById('resetBoxBtn');
const donateAllBtn       = document.getElementById('donateAllBtn');
const resetRecycleBoxBtn = document.getElementById('resetRecycleBoxBtn');
const findRecycleCenterBtn = document.getElementById('findRecycleCenterBtn');
const headerAvatar       = document.getElementById('headerAvatar');
const donationHistoryList = document.getElementById('donationHistoryList');
const donateThresholdBanner = document.getElementById('donateThresholdBanner');
const recycleThresholdBanner = document.getElementById('recycleThresholdBanner');

// Modal
const orgModal           = document.getElementById('orgModal');
const closeOrgModalBtn   = document.getElementById('closeOrgModal');
const confirmDonationBtn = document.getElementById('confirmDonationBtn');

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

// --- Threshold Banners ---
const checkThresholds = () => {
  const donateItems = uploadedItems.filter(i => i.action === 'donate' && !i.donated);
  const recycleItems = uploadedItems.filter(i => i.action === 'recycle' && !i.recycled);

  if (donateThresholdBanner) {
    donateThresholdBanner.classList.toggle('hidden', donateItems.length < DONATE_THRESHOLD);
  }
  if (recycleThresholdBanner) {
    recycleThresholdBanner.classList.toggle('hidden', recycleItems.length < RECYCLE_THRESHOLD);
  }
};

// --- Render: Donate Items ---
const renderAvailableItems = () => {
  if (!availableItemsGrid) return;
  availableItemsGrid.innerHTML = '';

  const items = uploadedItems.filter(i =>
    i.action === 'donate' && !i.donated &&
    !donationBox.some(b => b.createdAt === i.createdAt)
  );

  if (!items.length) {
    availableItemsGrid.innerHTML = `
      <div class="empty-msg-container" style="grid-column:1/-1;text-align:center;padding:40px;">
        <p class="empty-msg">No items marked for donation yet.</p>
        <button class="btn-primary" onclick="window.location.href='userHome.html'">Go to Dashboard</button>
      </div>`;
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <img src="${item.imageData || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'}" alt="${item.name}">
      <p class="item-name">${item.name}</p>
      <span class="item-category">${item.category}</span>
      <button class="add-to-box-btn" onclick="addToBox('${item.createdAt}')">+ Add to Box</button>`;
    availableItemsGrid.appendChild(card);
  });

  checkThresholds();
};

// --- Render: Recycle Items ---
const renderRecycleItems = () => {
  if (!recycleItemsGrid) return;
  recycleItemsGrid.innerHTML = '';

  const items = uploadedItems.filter(i =>
    i.action === 'recycle' && !i.recycled &&
    !recycleBox.some(b => b.createdAt === i.createdAt)
  );

  if (!items.length) {
    recycleItemsGrid.innerHTML = `
      <div class="empty-msg-container" style="grid-column:1/-1;text-align:center;padding:40px;">
        <p class="empty-msg">No items marked for recycling yet.</p>
        <button class="btn-primary" onclick="window.location.href='userHome.html'">Go to Dashboard</button>
      </div>`;
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <img src="${item.imageData || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'}" alt="${item.name}">
      <p class="item-name">${item.name}</p>
      <span class="item-category">${item.category}</span>
      <button class="add-to-box-btn" onclick="addToRecycleBox('${item.createdAt}')">+ Add to Recycle Box</button>`;
    recycleItemsGrid.appendChild(card);
  });

  checkThresholds();
};

// --- Render: Donation Box ---
const renderDonationBox = () => {
  if (!boxContent) return;
  if (!donationBox.length) {
    boxContent.innerHTML = '<p class="empty-box-message">No items added yet. Add items from the list!</p>';
    if (boxCount) boxCount.textContent = '0 items';
    if (donateAllBtn) donateAllBtn.disabled = true;
    return;
  }
  if (boxCount) boxCount.textContent = `${donationBox.length} item${donationBox.length !== 1 ? 's' : ''}`;
  if (donateAllBtn) donateAllBtn.disabled = false;
  boxContent.innerHTML = '';
  donationBox.forEach(item => {
    const div = document.createElement('div');
    div.className = 'box-item';
    div.innerHTML = `
      <img src="${item.imageData || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'}" alt="${item.name}">
      <div class="box-item-info"><h4>${item.name}</h4><span>${item.category}</span></div>
      <button class="remove-item-btn" onclick="removeFromBox('${item.createdAt}')"><i class="fas fa-trash"></i></button>`;
    boxContent.appendChild(div);
  });
};

// --- Render: Recycle Box ---
const renderRecycleBox = () => {
  if (!recycleBoxContent) return;
  if (!recycleBox.length) {
    recycleBoxContent.innerHTML = '<p class="empty-box-message">No items in recycle box yet.</p>';
    if (recycleBoxCount) recycleBoxCount.textContent = '0 items';
    if (findRecycleCenterBtn) findRecycleCenterBtn.disabled = true;
    return;
  }
  if (recycleBoxCount) recycleBoxCount.textContent = `${recycleBox.length} item${recycleBox.length !== 1 ? 's' : ''}`;
  if (findRecycleCenterBtn) findRecycleCenterBtn.disabled = false;
  recycleBoxContent.innerHTML = '';
  recycleBox.forEach(item => {
    const div = document.createElement('div');
    div.className = 'box-item';
    div.innerHTML = `
      <img src="${item.imageData || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'}" alt="${item.name}">
      <div class="box-item-info"><h4>${item.name}</h4><span>${item.category}</span></div>
      <button class="remove-item-btn" onclick="removeFromRecycleBox('${item.createdAt}')"><i class="fas fa-trash"></i></button>`;
    recycleBoxContent.appendChild(div);
  });
};

// --- Render: History ---
const renderHistory = () => {
  if (!donationHistoryList) return;
  const donated = uploadedItems.filter(i => i.donated || i.recycled);
  if (!donated.length) {
    donationHistoryList.innerHTML = '<p class="history-empty">No donations or recycling yet.</p>';
    return;
  }
  donationHistoryList.innerHTML = '';
  donated.forEach(item => {
    const div = document.createElement('div');
    div.className = 'box-item';
    const date = item.donatedAt || item.recycledAt;
    const action = item.donated ? `Donated to ${item.donatedTo}` : 'Recycled';
    div.innerHTML = `
      <img src="${item.imageData || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'}" alt="${item.name}">
      <div class="box-item-info">
        <h4>${item.name}</h4>
        <p>${action}${date ? ' on ' + new Date(date).toLocaleDateString() : ''}</p>
      </div>`;
    donationHistoryList.appendChild(div);
  });
};

const renderAll = () => {
  renderAvailableItems();
  renderDonationBox();
  renderRecycleItems();
  renderRecycleBox();
  renderHistory();
};

// --- Box Actions ---
window.addToBox = (createdAt) => {
  const item = uploadedItems.find(i => i.createdAt === createdAt);
  if (item) { donationBox.push(item); renderAvailableItems(); renderDonationBox(); }
};
window.removeFromBox = (createdAt) => {
  donationBox = donationBox.filter(i => i.createdAt !== createdAt);
  renderAvailableItems(); renderDonationBox();
};
window.addToRecycleBox = (createdAt) => {
  const item = uploadedItems.find(i => i.createdAt === createdAt);
  if (item) { recycleBox.push(item); renderRecycleItems(); renderRecycleBox(); }
};
window.removeFromRecycleBox = (createdAt) => {
  recycleBox = recycleBox.filter(i => i.createdAt !== createdAt);
  renderRecycleItems(); renderRecycleBox();
};

// --- Firebase Sync ---
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
      renderAll();
    }
  } catch (err) {
    console.error('[donation-stash] Firebase sync error:', err);
  }
};

// --- Donate Confirmation ---
const openOrgModal = () => { if (orgModal) orgModal.classList.add('active'); };
const closeModals = () => {
  document.querySelectorAll('.modal-overlay').forEach(o => o.classList.remove('active'));
  const radio = document.querySelector('input[name="org"]:checked');
  if (radio) radio.checked = false;
  selectedOrg = null;
  if (confirmDonationBtn) confirmDonationBtn.disabled = true;
};

if (resetBoxBtn) resetBoxBtn.addEventListener('click', () => {
  donationBox = []; renderAvailableItems(); renderDonationBox();
});
if (donateAllBtn) donateAllBtn.addEventListener('click', openOrgModal);
if (closeOrgModalBtn) closeOrgModalBtn.addEventListener('click', closeModals);

document.querySelectorAll('input[name="org"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    selectedOrg = e.target.value;
    if (confirmDonationBtn) confirmDonationBtn.disabled = false;
  });
});

if (confirmDonationBtn) {
  confirmDonationBtn.addEventListener('click', async () => {
    if (!selectedOrg) return;
    donationBox.forEach(boxItem => {
      const item = uploadedItems.find(i => i.createdAt === boxItem.createdAt);
      if (item) { item.donated = true; item.donatedTo = selectedOrg; item.donatedAt = new Date().toISOString(); }
    });
    localStorage.setItem('scannableItems', JSON.stringify(uploadedItems));
    alert(`🎉 Success! Your items have been donated to ${selectedOrg}.`);
    donationBox = [];
    closeModals();
    renderAll();
    await syncWithFirebase();
  });
}

// --- Threshold Button Actions ---
const donateThresholdBtn = document.getElementById('donateThresholdBtn');
if (donateThresholdBtn) donateThresholdBtn.addEventListener('click', () => {
  // Add all pending donate items to box then open org modal
  const items = uploadedItems.filter(i => i.action === 'donate' && !i.donated);
  items.forEach(item => {
    if (!donationBox.some(b => b.createdAt === item.createdAt)) donationBox.push(item);
  });
  renderAvailableItems(); renderDonationBox();
  openOrgModal();
});

// --- Recycle Box Actions ---
if (resetRecycleBoxBtn) resetRecycleBoxBtn.addEventListener('click', () => {
  recycleBox = []; renderRecycleItems(); renderRecycleBox();
});

if (findRecycleCenterBtn) {
  findRecycleCenterBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      window.open('https://www.google.com/maps/search/recycling+center+near+me', '_blank');
      return;
    }
    findRecycleCenterBtn.disabled = true;
    findRecycleCenterBtn.textContent = '📍 Finding centers…';
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/nearby-shops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              action: 'recycle',
              category: 'electronics',
              name: 'recycle',
            }),
          });
          const data = await res.json();
          if (data.shops && data.shops.length) {
            window.open(data.shops[0].mapsUrl, '_blank');
          } else {
            window.open('https://www.google.com/maps/search/recycling+center+near+me', '_blank');
          }
        } catch {
          window.open('https://www.google.com/maps/search/recycling+center+near+me', '_blank');
        } finally {
          findRecycleCenterBtn.disabled = recycleBox.length === 0;
          findRecycleCenterBtn.textContent = 'Find Recycling Center ♻️';
        }
      },
      () => {
        window.open('https://www.google.com/maps/search/recycling+center+near+me', '_blank');
        findRecycleCenterBtn.disabled = recycleBox.length === 0;
        findRecycleCenterBtn.textContent = 'Find Recycling Center ♻️';
      },
      { timeout: 8000 }
    );
  });
}

const recycleThresholdBtn = document.getElementById('recycleThresholdBtn');
if (recycleThresholdBtn) recycleThresholdBtn.addEventListener('click', () => {
  // Add all recyclable items to recycle box then trigger find
  const items = uploadedItems.filter(i => i.action === 'recycle' && !i.recycled);
  items.forEach(item => {
    if (!recycleBox.some(b => b.createdAt === item.createdAt)) recycleBox.push(item);
  });
  renderRecycleItems(); renderRecycleBox();
  if (findRecycleCenterBtn) findRecycleCenterBtn.click();
});

// --- Navigation & Init ---
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
      const content = document.getElementById(tab.dataset.tab);
      if (content) content.classList.add('active');
    });
  });

  document.getElementById('DashboardBtn')?.addEventListener('click', () => window.location.href = 'userHome.html');
  document.getElementById('ActiveRepair')?.addEventListener('click', () => window.location.href = 'activeRepair.html');
  document.getElementById('DonationStash')?.addEventListener('click', () => window.location.href = 'donationStash.html');
  document.getElementById('UploadItem')?.addEventListener('click', () => window.location.href = 'userHome.html?openUpload=true');
  document.getElementById('login')?.addEventListener('click', () => window.location.href = 'userHome.html?openLogin=true');
  document.getElementById('Sign-in')?.addEventListener('click', () => window.location.href = 'userHome.html?openSignup=true');

  renderAll();
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
        renderAll();
      }
    } catch (err) {
      console.error('[donation-stash] Auth sync error:', err);
    }
  } else {
    loggedInUser = null;
    localStorage.removeItem('scannableUser');
    updateHeaderAvatar(null);
  }
});
