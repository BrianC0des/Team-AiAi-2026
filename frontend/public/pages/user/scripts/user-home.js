import { auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from "../../../config.js";
import { initSharedModals, promptSyncMigration } from './shared-components.js';

const uploadModal = document.getElementById('uploadModal');
const loginModal = document.getElementById('loginModal');
const signInModal = document.getElementById('signinModal');
const uploadButton = document.getElementById('UploadItem');
const loginButton = document.getElementById('login');
const signInButton = document.getElementById('Sign-in');
const closeUpload = document.getElementById('closeUpload');
const closeLogin = document.getElementById('closeLogin');
const closeSignin = document.getElementById('closeSignin');
const cancelUpload = document.getElementById('cancelUpload');
const uploadForm = document.getElementById('uploadForm');
const loginForm = document.getElementById('loginForm');
const signinForm = document.getElementById('signinForm');
const uploadImage = document.getElementById('uploadImage');
const suggestionModal = document.getElementById('suggestionModal');
const closeSuggestion = document.getElementById('closeSuggestion');
const closeSuggestionButton = document.getElementById('closeSuggestionButton');
const detailModal = document.getElementById('detailModal');
const closeDetail = document.getElementById('closeDetail');
const closeDetailButton = document.getElementById('closeDetailButton');
const detailImage = document.getElementById('detailImage');
const detailName = document.getElementById('detailName');
const detailCategory = document.getElementById('detailCategory');
const detailSeverity = document.getElementById('detailSeverity');
const detailAction = document.getElementById('detailAction');
const detailSuggestion = document.getElementById('detailSuggestion');
const detailDescription = document.getElementById('detailDescription');
const detailUploaded = document.getElementById('detailUploaded');
const suggestionAction = document.getElementById('suggestionAction');
const suggestionName = document.getElementById('suggestionName');
const suggestionCategory = document.getElementById('suggestionCategory');
const suggestionSeverity = document.getElementById('suggestionSeverity');
const suggestionText = document.getElementById('suggestionText');
const suggestionActionButtons = document.querySelectorAll('.action-choice-btn');
const cameraButton = document.getElementById('cameraButton');
const cameraPanel = document.getElementById('cameraPanel');
const cameraVideo = document.getElementById('cameraPreview');
const capturePhotoButton = document.getElementById('capturePhoto');
const closeCameraButton = document.getElementById('closeCamera');
const imagePreview = document.getElementById('imagePreview');
const historyBody = document.getElementById('historyBody');
const itemTotal = document.getElementById('itemTotal');
const countRecycle = document.getElementById('countRecycle');
const countReuse = document.getElementById('countReuse');
const countRepair = document.getElementById('countRepair');
const countDonate = document.getElementById('countDonate');
const filterButtons = document.querySelectorAll('#filterButtons .filter-btn');
const userAccount = document.getElementById('UserAccount');
const profileLink = document.getElementById('profileLink');
const headerAvatar = document.getElementById('headerAvatar');

const activeRepairButton = document.getElementById('ActiveRepair');
const donationStashButton = document.getElementById('DonationStash');
const dashboardButton = document.getElementById('DashboardBtn');

let currentFilter = 'all';
let cameraStream = null;
let capturedImageDataUrl = null;
let uploadedItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
let currentSuggestionItem = null;
let isAnalyzing = false;

const actionLabels = {
  recycle: 'Recyclable',
  reuse: 'Reuse',
  repair: 'Repair',
  donate: 'Donate',
};

const severityColors = {
  'Severely Damaged': '#ff4d4d',
  'Slightly Damaged': '#ffaa00',
  'Repairable': '#00cc66',
};

let loggedInUser = JSON.parse(localStorage.getItem('scannableUser') || 'null');

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
        renderDashboard();
      }
    } catch (error) {
      console.error("Error syncing with Firebase:", error);
    }
  }
};

window.addEventListener('itemUploaded', (e) => {
  // Pull latest array of items since shared-components.js already pushed the item
  uploadedItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
  renderDashboard();
  openSuggestionModal(e.detail);
  syncWithFirebase();
});

// --- Auth State Listener ---
// This runs automatically whenever the page loads or the user logs in/out
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User is logged in:", user.email);
    
    // 1. Fetch the full profile from your backend
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/auth/login-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      const data = await response.json();
      
      if (data.success) {
        // 2. Update the UI with real data
        setLoggedInUser(data.user);
        await syncWithFirebase();
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Fallback: just use the email from Firebase
      setLoggedInUser({ email: user.email });
      await syncWithFirebase();
    }
  } else {
    console.log("No user logged in.");
    clearLoggedInUser();
  }
});

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
        const identifier = user.email;
        const parts = identifier.split('@')[0].split(/[._-]/);
        let initials = '??';
        if (parts.length === 1) {
          initials = parts[0].substring(0, 2).toUpperCase();
        } else {
          initials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        headerAvatar.textContent = initials;
        headerAvatar.innerHTML = initials; // Ensure text only if no image
      }
    }
  } else {
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (signInBtn) signInBtn.classList.remove('hidden');
    if (profileLink) profileLink.classList.add('hidden');
  }
};

const setLoggedInUser = (user) => {
  loggedInUser = user;
  localStorage.setItem('scannableUser', JSON.stringify(user));
  updateHeaderAvatar(user);
  if (profileLink) {
    profileLink.classList.remove('hidden');
  }
  if (loginButton) {
    loginButton.style.display = 'none';
  }
  if (signInButton) {
    signInButton.style.display = 'none';
  }
};

const clearLoggedInUser = () => {
  loggedInUser = null;
  localStorage.removeItem('scannableUser');
  if (profileLink) {
    profileLink.classList.add('hidden');
  }
  if (loginButton) {
    loginButton.style.display = '';
  }
  if (signInButton) {
    signInButton.style.display = '';
  }
};

const renderAuthState = () => {
  if (loggedInUser) {
    setLoggedInUser(loggedInUser);
  } else {
    clearLoggedInUser();
  }
};

const openUploadModal = () => {
  if (!uploadModal) return;
  uploadModal.classList.add('active');
};

const closeUploadModal = () => {
  if (!uploadModal) return;
  uploadModal.classList.remove('active');
};

const openAuthModal = (modal) => {
  if (!modal) return;
  modal.classList.add('active');
};

const closeAuthModal = (modal) => {
  if (!modal) return;
  modal.classList.remove('active');
};

const bindOverlayClose = (modal) => {
  if (!modal) return;
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeAuthModal(modal);
    }
  });
};

const stopCameraStream = () => {
  if (!cameraStream) return;
  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
};

const closeCameraCapture = () => {
  if (cameraPanel) {
    cameraPanel.classList.add('hidden');
  }
  stopCameraStream();
};

const resetUploadForm = () => {
  if (!uploadForm) return;
  uploadForm.reset();
  if (imagePreview) {
    imagePreview.src = '';
    imagePreview.style.display = 'none';
  }
  capturedImageDataUrl = null;
  closeCameraCapture();
};

const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// ─────────────────────────────────────────────────────────────────────────────
//  analyzeItemWithAI
//  Sends image + metadata to the backend /api/analyze route (Gemini 2.5 Flash).
//  Returns the structured AI result or throws on failure.
// ─────────────────────────────────────────────────────────────────────────────
const analyzeItemWithAI = async ({ imageBase64, mimeType, category, name, description }) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType, category, name, description }),
  });

  const data = await response.json();

  if (!response.ok) {
    const err = new Error(
      typeof data.error === 'string'
        ? data.error
        : 'Analysis failed. Please try again.'
    );
    err.needsImage = data.needsImage || false;
    err.retryable = data.retryable || response.status === 503;
    throw err;
  }

  return data;
};


const openSuggestionModal = (item) => {
  if (!suggestionModal) return;
  currentSuggestionItem = item;

  const notAnItemEl = document.getElementById('suggestionNotAnItem');
  const notAnItemText = document.getElementById('suggestionNotAnItemText');
  const unrecognizableEl = document.getElementById('suggestionUnrecognizable');
  const resultEl = document.getElementById('suggestionResult');
  const confidenceEl = document.getElementById('suggestionConfidence');

  // Hide all states first
  if (notAnItemEl) notAnItemEl.classList.add('hidden');
  if (unrecognizableEl) unrecognizableEl.classList.add('hidden');
  if (resultEl) resultEl.classList.add('hidden');

  // ── Not a physical item (selfie, food, etc.) ──────────────────
  if (item.notAnItem) {
    if (notAnItemEl) notAnItemEl.classList.remove('hidden');
    if (notAnItemText) {
      notAnItemText.textContent = `This looks like ${item.detectedAs || 'a non-item'}. Please upload a photo of a physical item.`;
    }
    suggestionModal.classList.add('active');
    return;
  }

  // ── Unrecognizable (blurry/unclear image) ─────────────────────
  if (item.unrecognizable) {
    if (unrecognizableEl) unrecognizableEl.classList.remove('hidden');
    suggestionModal.classList.add('active');
    return;
  }

  // ── Normal result ─────────────────────────────────────────────
  if (resultEl) resultEl.classList.remove('hidden');

  if (suggestionName) suggestionName.textContent = item.name || 'Unnamed item';
  if (suggestionCategory) suggestionCategory.textContent = item.category || 'Uncategorized';

  if (suggestionSeverity) {
    suggestionSeverity.textContent = item.conditionSeverity || '';
    suggestionSeverity.style.color = severityColors[item.conditionSeverity] || '#333';
  }

  if (suggestionAction) {
    suggestionAction.textContent = actionLabels[item.aiAction] || item.aiAction || '';
  }

  if (confidenceEl) {
    confidenceEl.textContent = item.aiConfidence ? `${item.aiConfidence}%` : 'N/A';
  }

  if (suggestionText) suggestionText.textContent = item.aiSuggestion || '';

  // ── Highlight recommended action button ──────────────────────
  document.querySelectorAll('.action-choice-btn').forEach((btn) => {
    btn.classList.toggle('recommended', btn.dataset.action === item.aiAction);
  });

  suggestionModal.classList.add('active');
};

const closeSuggestionModal = () => {
  if (!suggestionModal) return;
  suggestionModal.classList.remove('active');
  currentSuggestionItem = null;
};

// ─────────────────────────────────────────────────────────────────────────────
//  openActionModal — Modal 2, shown after user picks an action
// ─────────────────────────────────────────────────────────────────────────────
const actionModal = document.getElementById('actionModal');

const openActionModal = (item, action) => {
  if (!actionModal) return;

  // Hide all content sections
  ['actionRepairContent', 'actionDonateContent', 'actionRecycleContent', 'actionReuseContent'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  const titleEl = document.getElementById('actionModalTitle');

  if (action === 'repair') {
    if (titleEl) titleEl.textContent = '🔧 Repair Guide';
    const section = document.getElementById('actionRepairContent');
    if (section) section.classList.remove('hidden');

    // Reset tabs
    const tabDiy    = document.getElementById('tabDiy');
    const tabExpert = document.getElementById('tabExpert');
    const panelDiy    = document.getElementById('panelDiy');
    const panelExpert = document.getElementById('panelExpert');
    if (tabDiy && tabExpert && panelDiy && panelExpert) {
      tabDiy.classList.add('active');    tabExpert.classList.remove('active');
      panelDiy.classList.remove('hidden'); panelExpert.classList.add('hidden');
      tabDiy.onclick    = () => { tabDiy.classList.add('active');    tabExpert.classList.remove('active');    panelDiy.classList.remove('hidden');    panelExpert.classList.add('hidden'); };
      tabExpert.onclick = () => { tabExpert.classList.add('active'); tabDiy.classList.remove('active');    panelExpert.classList.remove('hidden'); panelDiy.classList.add('hidden'); };
    }

    fetchRepairGuide(item);

    const findShopsBtn = document.getElementById('findShopsBtn');
    if (findShopsBtn) findShopsBtn.onclick = () => fetchNearbyShops(item);

  } else if (action === 'donate') {
    if (titleEl) titleEl.textContent = '🤝 Donate This Item';
    const section = document.getElementById('actionDonateContent');
    if (section) section.classList.remove('hidden');
    ['donateIdle','donateLoading','donateContent','donateError'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', id !== 'donateIdle');
    });
    const findDonateBtn = document.getElementById('findDonateBtn');
    if (findDonateBtn) findDonateBtn.onclick = () => fetchNearbyCenter(item, 'donate');

  } else if (action === 'recycle') {
    if (titleEl) titleEl.textContent = '♻️ Recycle This Item';
    const section = document.getElementById('actionRecycleContent');
    if (section) section.classList.remove('hidden');
    ['recycleIdle','recycleLoading','recycleContent','recycleError'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', id !== 'recycleIdle');
    });
    const findRecycleBtn = document.getElementById('findRecycleBtn');
    if (findRecycleBtn) findRecycleBtn.onclick = () => fetchNearbyCenter(item, 'recycle');

  } else {
    // reuse
    if (titleEl) titleEl.textContent = '♻ Reuse This Item';
    const section = document.getElementById('actionReuseContent');
    if (section) section.classList.remove('hidden');
  }

  actionModal.classList.add('active');
};

const applyUserSelectedAction = (action) => {
  if (!currentSuggestionItem || !['reuse', 'recycle', 'repair', 'donate'].includes(action)) return;

  // Find the actual item in the uploadedItems array by matching its unique createdAt timestamp
  const originalItem = uploadedItems.find(
    item => item.createdAt === currentSuggestionItem.createdAt
  );

  if (originalItem) {
    originalItem.action = action;
    if (action === 'repair') {
      originalItem.repairStatus = 'recommendation';
    }
  }

  // Also update the currentSuggestionItem reference for correct button redirect behavior
  currentSuggestionItem.action = action;
  if (action === 'repair') {
    currentSuggestionItem.repairStatus = 'recommendation';
  }

  setActiveFilter(action === 'repair' ? 'all' : action);
  renderDashboard();
  // Note: modal closing + redirect handled by the button click handler in Event Listeners
};

const openDetailModal = (item) => {
  if (!detailModal) return;
  if (detailImage) {
    detailImage.src = item.imageData || '';
    detailImage.style.display = item.imageData ? 'block' : 'none';
  }
  if (detailName) detailName.textContent = item.name;
  if (detailCategory) detailCategory.textContent = item.category;
  if (detailSeverity) detailSeverity.textContent = item.conditionSeverity;
  if (detailAction) {
    detailAction.textContent = item.action ? actionLabels[item.action] : `Suggested: ${actionLabels[item.aiAction] || actionLabels[inferAction(item.category, item.description)]}`;
  }
  if (detailSuggestion) detailSuggestion.textContent = item.aiSuggestion || 'No suggestion available yet.';
  if (detailDescription) detailDescription.textContent = item.description || '-';
  if (detailUploaded) detailUploaded.textContent = formatDate(item.createdAt);
  detailModal.classList.add('active');
};

const closeDetailModal = () => {
  if (!detailModal) return;
  detailModal.classList.remove('active');
};

const bindModalOverlayClose = (modal, closeFn) => {
  if (!modal) return;
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeFn();
    }
  });
};

const openCameraCapture = async () => {
  if (!cameraPanel || !cameraVideo) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    cameraStream = stream;
    cameraVideo.srcObject = stream;
    cameraPanel.classList.remove('hidden');
  } catch (error) {
    console.warn('Camera failed to open', error);
    alert('Could not open the camera. Please allow camera access or use file upload.');
  }
};

const capturePhoto = () => {
  if (!cameraVideo || !imagePreview) return;
  const canvas = document.createElement('canvas');
  const width = cameraVideo.videoWidth;
  const height = cameraVideo.videoHeight;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(cameraVideo, 0, 0, width, height);
  capturedImageDataUrl = canvas.toDataURL('image/jpeg');
  imagePreview.src = capturedImageDataUrl;
  imagePreview.style.display = 'block';
  closeCameraCapture();
};

// inferAction removed — replaced by Gemini AI analysis via /api/analyze

// ─────────────────────────────────────────────────────────────────────────────
//  Impact Card Logic — Sustainability Score & Social Sharing
// ─────────────────────────────────────────────────────────────────────────────

// Shared components will handle the Impact Card modal now.
initSharedModals();

const loadUploadedItems = () => uploadedItems;

const buildCounts = (items) => {
  return items.reduce(
    (acc, item) => {
      if (!item.action) return acc;
      // Repair only counts when the repair is fully FINISHED (verified by AI)
      if (item.action === 'repair' && item.repairStatus !== 'finished') return acc;
      acc[item.action] = (acc[item.action] || 0) + 1;
      return acc;
    },
    { recycle: 0, reuse: 0, repair: 0, donate: 0 }
  );
};

const renderSummary = (counts) => {
  if (countRecycle) countRecycle.textContent = counts.recycle;
  if (countReuse) countReuse.textContent = counts.reuse;
  if (countRepair) countRepair.textContent = counts.repair;
  if (countDonate) countDonate.textContent = counts.donate;
};

const formatDate = (isoString) => {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const renderHistory = (items, filter = 'all') => {
  if (!historyBody) return;

  const filteredItems = filter === 'all' ? items : items.filter((item) => item.action === filter);
  historyBody.innerHTML = '';

  if (!filteredItems.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.className = 'empty-row';
    cell.textContent = 'No uploaded items match this filter yet.';
    row.appendChild(cell);
    historyBody.appendChild(row);
    return;
  }

  filteredItems.forEach((item, index) => {
    const row = document.createElement('tr');
    const actionDisplay = item.action
      ? actionLabels[item.action]
      : item.aiAction
        ? `AI: ${actionLabels[item.aiAction] || item.aiAction}`
        : '—';
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${actionDisplay}</td>
      <td>${item.description || '-'}</td>
      <td>${formatDate(item.createdAt)}</td>
      <td><button type="button" class="btn-secondary detail-button" data-index="${index}">View</button></td>
    `;
    const detailButton = row.querySelector('.detail-button');
    if (detailButton) {
      detailButton.addEventListener('click', () => openDetailModal(filteredItems[index]));
    }
    historyBody.appendChild(row);
  });
};

const updateTotals = (items) => {
  if (itemTotal) {
    itemTotal.textContent = `${items.length} item${items.length === 1 ? '' : 's'}`;
  }
};

const setActiveFilter = (filter) => {
  currentFilter = filter;
  filterButtons.forEach((button) => {
    const buttonFilter = button.dataset.filter;
    button.classList.toggle('active', buttonFilter === filter);
  });
};

const renderDashboard = () => {
  const allItems = loadUploadedItems();
  // Exclude items that are in-progress repairs from the dashboard view
  const dashboardItems = allItems.filter(
    (item) => !(item.action === 'repair' && item.repairStatus === 'ongoing')
  );
  renderSummary(buildCounts(allItems));
  updateTotals(dashboardItems);
  renderHistory(dashboardItems, currentFilter);
};

const updateUploadedItems = () => {
  try {
    localStorage.setItem('scannableItems', JSON.stringify(uploadedItems));
  } catch (e) {
    console.warn('LocalStorage quota exceeded. Updates might not persist.', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  fetchRepairGuide — calls /api/repair-guide using Gemini Search grounding
// ─────────────────────────────────────────────────────────────────────────────
const fetchRepairGuide = async (item) => {
  const diyLoading = document.getElementById('diyLoading');
  const diyContent = document.getElementById('diyContent');
  const diyMeta = document.getElementById('diyMeta');
  const diySteps = document.getElementById('diySteps');
  const diyLinks = document.getElementById('diyLinks');

  if (!diyContent) return;

  // ── Step 1: Show analyze tips immediately (no wait) ───────────
  const fallbackSteps = item.aiDiyTips || [];
  if (diySteps) {
    diySteps.innerHTML = fallbackSteps.length
      ? fallbackSteps.map((s) => `<li>${s}</li>`).join('')
      : '<li>No tips available yet.</li>';
  }
  if (diyMeta) {
    diyMeta.innerHTML = `<span class="repair-badge">💡 AI Tips</span>`;
  }
  if (diyLoading) diyLoading.classList.add('hidden');
  diyContent.classList.remove('hidden');

  // ── Step 2: Enrich in background with web search ──────────────
  // Show a subtle "searching for more…" badge
  if (diyMeta) {
    diyMeta.innerHTML = `
      <span class="repair-badge"> AI Tips</span>
      <span class="repair-badge" style="background:#eef6ff;color:#0066cc;"> Searching web…</span>
    `;
  }

  try {
    const res = await fetch('/api/repair-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: item.name,
        category: item.category,
        description: item.description,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error('Enrichment failed');

    // ── Upgrade content with web search results ───────────────
    if (diyMeta) {
      diyMeta.innerHTML = `
        <span class="repair-badge">⏱ ${data.estimatedTime || 'Unknown'}</span>
        <span class="repair-badge difficulty-${(data.difficulty || 'medium').toLowerCase()}">${data.difficulty || 'Medium'}</span>
      `;
    }

    if (diySteps && (data.steps || []).length > 0) {
      diySteps.innerHTML = data.steps.map((s) => `<li>${s}</li>`).join('');
    }

    if (diyLinks) {
      const allLinks = [...(data.youtubeLinks || []), ...(data.guideLinks || [])];
      diyLinks.innerHTML = allLinks.length
        ? `<p class="repair-links-title">📚 Resources</p>` +
          allLinks.map((link) => {
            const isYt = link.url.includes('youtube') || link.url.includes('youtu.be');
            return `
              <a class="repair-link-card ${isYt ? 'yt-card' : 'guide-card'}" href="${link.url}" target="_blank" rel="noopener">
                <span class="repair-link-icon">${isYt ? '▶' : '📄'}</span>
                <span class="repair-link-title">${link.title}</span>
              </a>`;
          }).join('')
        : '';
    }
  } catch (err) {
    // Enrichment failed — keep showing the analyze tips, just remove the searching badge
    console.warn('[repair-guide] Web enrichment failed, using analyze tips:', err.message);
    if (diyMeta) {
      diyMeta.innerHTML = `<span class="repair-badge">💡 AI Tips</span>`;
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  fetchNearbyShops — calls /api/nearby-shops using Google Maps Places API
// ─────────────────────────────────────────────────────────────────────────────
const fetchNearbyShops = (item) => {
  const expertIdle = document.getElementById('expertIdle');
  const expertLoading = document.getElementById('expertLoading');
  const expertContent = document.getElementById('expertContent');
  const expertError = document.getElementById('expertError');
  const shopList = document.getElementById('shopList');
  const shopSearchLink = document.getElementById('shopSearchLink');

  if (!expertLoading) return;

  // Show loading, hide everything else
  if (expertIdle) expertIdle.classList.add('hidden');
  if (expertError) expertError.classList.add('hidden');
  if (expertContent) expertContent.classList.add('hidden');
  expertLoading.classList.remove('hidden');

  const onError = () => {
    expertLoading.classList.add('hidden');
    if (expertError) expertError.classList.remove('hidden');
    if (shopSearchLink) {
      const query = encodeURIComponent(`${item.category || ''} repair shop near me`);
      shopSearchLink.href = `https://www.google.com/maps/search/${query}`;
    }
  };

  if (!navigator.geolocation) {
    onError();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      try {
        const res = await fetch('/api/nearby-shops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, category: item.category, name: item.name }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load shops.');

        expertLoading.classList.add('hidden');

        if (!data.shops || data.shops.length === 0) {
          onError();
          return;
        }

        if (shopList) {
          shopList.innerHTML = data.shops
            .map((shop) => {
              const stars = shop.rating
                ? '★'.repeat(Math.round(shop.rating)) + '☆'.repeat(5 - Math.round(shop.rating))
                : 'No rating';
              const openBadge =
                shop.open === true
                  ? '<span class="shop-badge open">Open</span>'
                  : shop.open === false
                    ? '<span class="shop-badge closed">Closed</span>'
                    : '';
              return `
                <a class="shop-card" href="${shop.mapsUrl}" target="_blank" rel="noopener">
                  <div class="shop-card-header">
                    <span class="shop-name">${shop.name}</span>
                    ${openBadge}
                  </div>
                  <div class="shop-rating">${stars} <span class="shop-reviews">(${shop.reviews} reviews)</span></div>
                  <div class="shop-address">📍 ${shop.address}</div>
                  ${shop.phone ? `<div class="shop-phone">📞 ${shop.phone}</div>` : ''}
                </a>`;
            })
            .join('');
        }

        if (expertContent) expertContent.classList.remove('hidden');
      } catch (err) {
        console.error('[nearby-shops] Error:', err);
        onError();
      }
    },
    () => onError(),
    { timeout: 8000 }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  fetchNearbyCenter — finds donation OR recycling centers via Maps API
// ─────────────────────────────────────────────────────────────────────────────
const fetchNearbyCenter = (item, action) => {
  const prefix = action; // 'donate' or 'recycle'
  const idleEl    = document.getElementById(`${prefix}Idle`);
  const loadingEl = document.getElementById(`${prefix}Loading`);
  const contentEl = document.getElementById(`${prefix}Content`);
  const errorEl   = document.getElementById(`${prefix}Error`);
  const listEl    = document.getElementById(`${prefix}List`);
  const linkEl    = document.getElementById(`${prefix}SearchLink`);

  if (!loadingEl) return;

  if (idleEl)    idleEl.classList.add('hidden');
  if (errorEl)   errorEl.classList.add('hidden');
  if (contentEl) contentEl.classList.add('hidden');
  loadingEl.classList.remove('hidden');

  const label = action === 'donate' ? 'donation center' : 'recycling center';

  const onError = () => {
    loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
    if (linkEl) linkEl.href = `https://www.google.com/maps/search/${encodeURIComponent(label + ' near me')}`;
  };

  if (!navigator.geolocation) { onError(); return; }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      try {
        const res = await fetch('/api/nearby-shops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, category: item.category, name: item.name, action }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');

        loadingEl.classList.add('hidden');
        if (!data.shops || data.shops.length === 0) { onError(); return; }

        if (listEl) {
          listEl.innerHTML = data.shops.map((shop) => {
            const stars = shop.rating ? '★'.repeat(Math.round(shop.rating)) + '☆'.repeat(5 - Math.round(shop.rating)) : 'No rating';
            const openBadge = shop.open === true ? '<span class="shop-badge open">Open</span>' : shop.open === false ? '<span class="shop-badge closed">Closed</span>' : '';
            return `<a class="shop-card" href="${shop.mapsUrl}" target="_blank" rel="noopener">
              <div class="shop-card-header"><span class="shop-name">${shop.name}</span>${openBadge}</div>
              <div class="shop-rating">${stars} <span class="shop-reviews">(${shop.reviews} reviews)</span></div>
              <div class="shop-address"> ${shop.address}</div>
              ${shop.phone ? `<div class="shop-phone"> ${shop.phone}</div>` : ''}
            </a>`;
          }).join('');
        }
        if (contentEl) contentEl.classList.remove('hidden');
      } catch (err) {
        console.error(`[${prefix}-center]`, err);
        onError();
      }
    },
    () => onError(),
    { timeout: 8000 }
  );
};

// Event Listeners

const switchToSignin = document.getElementById('switchToSignin');
const switchToLogin = document.getElementById('switchToLogin');

if (switchToSignin) {
  switchToSignin.addEventListener('click', () => {
    closeAuthModal(loginModal);
    openAuthModal(signInModal);
  });
}

if (switchToLogin) {
  switchToLogin.addEventListener('click', () => {
    closeAuthModal(signInModal);
    openAuthModal(loginModal);
  });
}


if (uploadButton) {
  uploadButton.addEventListener('click', openUploadModal);
}

if (dashboardButton) {
  dashboardButton.addEventListener('click', () => {
    window.location.href = 'userHome.html';
  });
}

const joinUsModal = document.getElementById('joinUsModal');
const closeJoinUs = document.getElementById('closeJoinUs');
const triggerLoginFromJoin = document.getElementById('triggerLoginFromJoin');
const triggerSigninFromJoin = document.getElementById('triggerSigninFromJoin');

// ... (keep existing definitions)

if (activeRepairButton) {
  activeRepairButton.addEventListener('click', () => {
    window.location.href = 'activeRepair.html';
  });
}

if (donationStashButton) {
  donationStashButton.addEventListener('click', () => {
    window.location.href = 'donationStash.html';
  });
}

if (closeJoinUs) {
  closeJoinUs.addEventListener('click', () => closeAuthModal(joinUsModal));
}

if (joinUsModal) {
  bindModalOverlayClose(joinUsModal, () => closeAuthModal(joinUsModal));
}

if (triggerLoginFromJoin) {
  triggerLoginFromJoin.addEventListener('click', () => {
    closeAuthModal(joinUsModal);
    openAuthModal(loginModal);
  });
}

if (triggerSigninFromJoin) {
  triggerSigninFromJoin.addEventListener('click', () => {
    closeAuthModal(joinUsModal);
    openAuthModal(signInModal);
  });
}

// ... (keep existing event listener logic)

if (loginButton) {
  loginButton.addEventListener('click', () => openAuthModal(loginModal));
}

if (signInButton) {
  signInButton.addEventListener('click', () => openAuthModal(signInModal));
}

if (closeUpload) {
  closeUpload.addEventListener('click', () => {
    closeUploadModal();
    resetUploadForm();
  });
}

if (closeLogin) {
  closeLogin.addEventListener('click', () => closeAuthModal(loginModal));
}

if (closeSignin) {
  closeSignin.addEventListener('click', () => closeAuthModal(signInModal));
}

if (cancelUpload) {
  cancelUpload.addEventListener('click', () => {
    closeUploadModal();
    resetUploadForm();
  });
}

if (uploadModal) {
  uploadModal.addEventListener('click', (event) => {
    if (event.target === uploadModal) {
      closeUploadModal();
      resetUploadForm();
    }
  });
}

if (loginModal) {
  bindModalOverlayClose(loginModal, () => closeAuthModal(loginModal));
}

if (signInModal) {
  bindModalOverlayClose(signInModal, () => closeAuthModal(signInModal));
}

if (suggestionModal) {
  bindModalOverlayClose(suggestionModal, closeSuggestionModal);
}

if (detailModal) {
  bindModalOverlayClose(detailModal, closeDetailModal);
}

const showPreview = (fileOrDataUrl) => {
  if (!imagePreview) return;
  if (!fileOrDataUrl) {
    imagePreview.style.display = 'none';
    return;
  }

  if (typeof fileOrDataUrl === 'string') {
    imagePreview.src = fileOrDataUrl;
    imagePreview.style.display = 'block';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.src = reader.result;
    imagePreview.style.display = 'block';
  };
  reader.readAsDataURL(fileOrDataUrl);
};

if (uploadImage && imagePreview) {
  uploadImage.addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    capturedImageDataUrl = null;
    showPreview(file);
  });
}

if (cameraButton) {
  cameraButton.addEventListener('click', openCameraCapture);
}



if (closeSuggestion) {
  closeSuggestion.addEventListener('click', closeSuggestionModal);
}

if (closeSuggestionButton) {
  closeSuggestionButton.addEventListener('click', closeSuggestionModal);
}

if (closeDetail) {
  closeDetail.addEventListener('click', closeDetailModal);
}

if (closeDetailButton) {
  closeDetailButton.addEventListener('click', closeDetailModal);
}

// Helper function to map Firebase error codes to clean, user-friendly messages
function getFriendlyErrorMessage(error) {
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }
  
  const code = error.code || error.message;
  if (!code) {
    return "An unexpected error occurred. Please try again.";
  }

  // Firebase auth error codes
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return "Invalid email or password. Please try again.";
  }
  if (code.includes('email-already-in-use')) {
    return "This email is already registered. Please log in instead.";
  }
  if (code.includes('weak-password')) {
    return "Your password is too weak. It must be at least 6 characters long.";
  }
  if (code.includes('invalid-email')) {
    return "Please enter a valid email address.";
  }
  if (code.includes('user-disabled')) {
    return "This account has been disabled. Please contact support.";
  }
  if (code.includes('network-request-failed')) {
    return "A network error occurred. Please check your internet connection.";
  }
  if (code.includes('popup-blocked')) {
    return "The Google login popup was blocked by your browser. Please allow popups/redirects for this site in your browser settings (or disable adblocker/shields) and try again.";
  }
  if (code.includes('cancelled-popup-request') || code.includes('popup-closed-by-user')) {
    return "The Google sign-in window was closed or cancelled before completion. Please try again.";
  }

  // Strip out "Firebase: " prefix if present
  let message = error.message || String(error);
  if (message.startsWith("Firebase: ")) {
    message = message.replace("Firebase: ", "");
  }
  return message;
}

if (loginForm) {
  const loginError = document.getElementById('loginError');
  const loginSuccess = document.getElementById('loginSuccess');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    // Reset messages
    loginError.style.display = 'none';
    loginSuccess.style.display = 'none';

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();
      
      // 2. Sync with your Backend to get the profile data
      const response = await fetch('/api/auth/login-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      
      const data = await response.json();
      
      if (data.success) {
        loginSuccess.textContent = "Success! Logging you in...";
        loginSuccess.style.display = "block";
        
        // Save user state
        setLoggedInUser(data.user);
        
        // Sync local items with optional migration prompt
        try {
          const localItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
          let itemsToSync = localItems;
          
          if (localItems.length > 0) {
            const shouldMigrate = await promptSyncMigration();
            if (!shouldMigrate) {
              itemsToSync = [];
            }
          }
          
          const syncResponse = await fetch('/api/items/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken, items: itemsToSync })
          });
          const syncData = await syncResponse.json();
          if (syncData.success) {
            localStorage.setItem('scannableItems', JSON.stringify(syncData.items));
          }
        } catch (syncError) {
          console.error("Error syncing items on login:", syncError);
        }

        setTimeout(() => {
          closeAuthModal(loginModal);
          location.reload();
        }, 1000);
      } else {
        loginError.textContent = data.error || 'Login failed';
        loginError.style.display = "block";
      }
    } catch (error) {
      console.error("Login Error:", error);
      loginError.textContent = getFriendlyErrorMessage(error);
      loginError.style.display = "block";
    }
  });
}

// Google auth is handled globally by shared-components.js

if (signinForm) {
    const signinError = document.getElementById('signinError');
    const signinSuccess = document.getElementById('signinSuccess');

    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Hide previous messages
        signinError.style.display = "none";
        signinSuccess.style.display = "none";

        const email = document.getElementById('signinEmail').value.trim();
        const password = document.getElementById('signinPassword').value;
        const confirmPassword = document.getElementById('signinConfirmPassword').value;

        if(password !== confirmPassword) {
            signinError.textContent = "Passwords do not match!";
            signinError.style.display = "block";
            return;
        }

        try{
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const response = await fetch('/api/auth/signup', {
                method : 'POST',
                headers : { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email
                })
            });

            const data = await response.json();

            if(data.success){
                signinSuccess.textContent = "Welcome to Scannable! Account created.";
                signinSuccess.style.display = "block";

                e.target.querySelector('button[type="submit"]').style.display = 'none';
                
                // Sync local items with optional migration prompt
                try {
                  const idToken = await user.getIdToken();
                  const localItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
                  let itemsToSync = localItems;
                  
                  if (localItems.length > 0) {
                    const shouldMigrate = await promptSyncMigration();
                    if (!shouldMigrate) {
                      itemsToSync = [];
                    }
                  }
                  
                  const syncResponse = await fetch('/api/items/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken, items: itemsToSync })
                  });
                  const syncData = await syncResponse.json();
                  if (syncData.success) {
                    localStorage.setItem('scannableItems', JSON.stringify(syncData.items));
                  }
                } catch (syncError) {
                  console.error("Error syncing items on signup:", syncError);
                }

                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        }catch(error){
            signinError.textContent = getFriendlyErrorMessage(error);
            signinError.style.display = "block";
        }
    });
}

if (capturePhotoButton) {
  capturePhotoButton.addEventListener('click', capturePhoto);
}

if (closeCameraButton) {
  closeCameraButton.addEventListener('click', closeCameraCapture);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Upload Form Submit — AI-powered analysis flow
// ─────────────────────────────────────────────────────────────────────────────
const setUploadLoading = (loading) => {
  const submitBtn = document.getElementById('uploadSubmitBtn');
  const label = document.getElementById('uploadSubmitLabel');
  const spinner = document.getElementById('uploadSubmitSpinner');
  isAnalyzing = loading;
  if (submitBtn) submitBtn.disabled = loading;
  if (label) label.classList.toggle('hidden', loading);
  if (spinner) spinner.classList.toggle('hidden', !loading);
};



if (suggestionActionButtons) {
  suggestionActionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      const itemSnapshot = currentSuggestionItem; // capture before modal closes
      applyUserSelectedAction(action);
      updateUploadedItems();
      syncWithFirebase();

      // Close Suggestion Modal
      if (suggestionModal) suggestionModal.classList.remove('active');

      if (itemSnapshot) {
        if (action === 'repair') {
          // Send straight to Active Repair page — no action modal, no impact card yet
          window.location.href = 'activeRepair.html';
        } else if (action === 'reuse') {
          // Instant action — show impact card immediately
          showImpactCard(itemSnapshot, action);
        } else {
          // Donate / Recycle — open Action Modal 2 (map/center finder)
          openActionModal(itemSnapshot, action);
        }
      }
    });
  });
}


// Close Action Modal
const closeActionBtn = document.getElementById('closeAction');
const closeActionButton = document.getElementById('closeActionButton');
const closeActionModal = () => { if (actionModal) actionModal.classList.remove('active'); };
if (closeActionBtn) closeActionBtn.addEventListener('click', closeActionModal);
if (closeActionButton) closeActionButton.addEventListener('click', closeActionModal);



if (filterButtons) {
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter || 'all';
      setActiveFilter(filter);
      renderDashboard();
    });
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;

  if (uploadModal && uploadModal.classList.contains('active')) {
    closeUploadModal();
    resetUploadForm();
    return;
  }

  if (loginModal && loginModal.classList.contains('active')) {
    closeAuthModal(loginModal);
    return;
  }

  if (signInModal && signInModal.classList.contains('active')) {
    closeAuthModal(signInModal);
    return;
  }

  if (actionModal && actionModal.classList.contains('active')) {
    closeActionModal();
    return;
  }

  if (suggestionModal && suggestionModal.classList.contains('active')) {
    closeSuggestionModal();
    return;
  }

  if (detailModal && detailModal.classList.contains('active')) {
    closeDetailModal();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  renderAuthState();
  renderDashboard();

  // Check for URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const shouldOpenUpload = urlParams.get('openUpload') === 'true';
  const shouldOpenLogin = urlParams.get('openLogin') === 'true';
  const shouldOpenSignup = urlParams.get('openSignup') === 'true';

  // Clean up URL parameters immediately so they don't reload modal on refreshing
  if (urlParams.has('openLogin') || urlParams.has('openSignup') || urlParams.has('openUpload')) {
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
  }

  // Only open auth modals if not logged in
  if (!loggedInUser) {
    if (shouldOpenLogin) {
      openAuthModal(loginModal);
    } else if (shouldOpenSignup) {
      openAuthModal(signInModal);
    }
  }

  if (shouldOpenUpload) {
    openUploadModal();
  }
});
