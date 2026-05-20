import { 
  auth, 
  googleProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  onAuthStateChanged 
} from "../../../config.js";

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
const cancelLogin = document.getElementById('cancelLogin');
const cancelSignin = document.getElementById('cancelSignin');
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

const actionLabels = {
  recycle: 'Recyclable',
  reuse: 'Reuse',
  repair: 'Repair',
  donate: 'Donate',
};

let loggedInUser = JSON.parse(localStorage.getItem('scannableUser') || 'null');

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
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Fallback: just use the email from Firebase
      setLoggedInUser({ email: user.email });
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

const getHardcodedSeverityFromImage = (imageData) => {
  if (!imageData) {
    return 'Good';
  }
  const hash = imageData.length % 4;
  switch (hash) {
    case 0:
      return 'Excellent';
    case 1:
      return 'Good';
    case 2:
      return 'Fair';
    default:
      return 'Poor';
  }
};

const getSuggestionForItem = (item) => {
  const condition = item.conditionSeverity || getHardcodedSeverityFromImage(item.imageData);
  const actionKey = item.aiAction || item.action || inferAction(item.category, item.description);
  const actionLabel = actionLabels[actionKey] || actionKey;
  let suggestionText = '';

  if (actionLabel.toLowerCase() === 'donate') {
    suggestionText = `This item looks like a good fit for donation, especially since its condition is ${condition}. Consider passing it on to someone who can reuse it.`;
  } else if (actionLabel.toLowerCase() === 'reuse') {
    suggestionText = `Reuse is the best choice here. With a ${condition} condition, the item can likely be used again or repurposed.`;
  } else if (actionLabel.toLowerCase() === 'recyclable' || actionLabel.toLowerCase() === 'recycle') {
    suggestionText = `Recycling is recommended since the item is in ${condition} condition and can be processed into new materials.`;
  } else {
    suggestionText = `This item could be reused, recycled, or donated depending on its specifics.`;
  }

  return {
    action: actionKey,
    actionLabel,
    text: suggestionText,
    severity: condition,
  };
};

const openSuggestionModal = (item) => {
  if (!suggestionModal || !suggestionAction || !suggestionText) return;
  currentSuggestionItem = item;
  if (suggestionName) {
    suggestionName.textContent = item.name || 'Unnamed item';
  }
  if (suggestionCategory) {
    suggestionCategory.textContent = item.category || 'Uncategorized';
  }
  if (suggestionSeverity) {
    suggestionSeverity.textContent = item.conditionSeverity || getHardcodedSeverityFromImage(item.imageData);
  }
  const suggestion = getSuggestionForItem(item);
  suggestionAction.textContent = suggestion.actionLabel;
  suggestionText.textContent = suggestion.text;
  suggestionModal.classList.add('active');
};

const closeSuggestionModal = () => {
  if (!suggestionModal) return;
  suggestionModal.classList.remove('active');
  currentSuggestionItem = null;
};

const applyUserSelectedAction = (action) => {
  if (!currentSuggestionItem || !['reuse', 'recycle', 'repair', 'donate'].includes(action)) return;
  currentSuggestionItem.action = action;
  setActiveFilter(action);
  renderDashboard();
  closeSuggestionModal();
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

const inferAction = (category, description) => {
  const normalized = category.trim().toLowerCase();
  const note = description.trim().toLowerCase();

  if (note.match(/donate|gift|give away|unused|new|unopened/)) {
    return 'donate';
  }

  if (note.match(/broken|damaged|repair|fix/)) {
    return 'repair';
  }

  if (normalized === 'electronics') {
    return 'recycle';
  }

  if (normalized === 'wearables' || normalized === 'household' || normalized === 'recreational' || normalized === 'supplies') {
    return 'reuse';
  }

  return 'reuse';
};

const loadUploadedItems = () => uploadedItems;

const buildCounts = (items) => {
  return items.reduce(
    (acc, item) => {
      if (!item.action) {
      return acc;
    }
    const action = item.action;
    acc[action] = (acc[action] || 0) + 1;
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
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.action ? actionLabels[item.action] : `Suggested: ${actionLabels[item.aiAction] || actionLabels[inferAction(item.category, item.description)]}`}</td>
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
  const items = loadUploadedItems();
  renderSummary(buildCounts(items));
  updateTotals(items);
  renderHistory(items, currentFilter);
};

const updateUploadedItems = () => {
  try {
    localStorage.setItem('scannableItems', JSON.stringify(uploadedItems));
  } catch (e) {
    console.warn('LocalStorage quota exceeded. Updates might not persist.', e);
  }
};

const switchToSignin = document.getElementById('switchToSignin');
const switchToLogin = document.getElementById('switchToLogin');

// Event Listeners
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
    if (loggedInUser) {
      window.location.href = 'activeRepair.html';
    } else {
      openAuthModal(joinUsModal);
    }
  });
}

if (donationStashButton) {
  donationStashButton.addEventListener('click', () => {
    if (loggedInUser) {
      window.location.href = 'donationStash.html';
    } else {
      openAuthModal(joinUsModal);
    }
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

if (cancelLogin) {
  cancelLogin.addEventListener('click', () => closeAuthModal(loginModal));
}

if (cancelSignin) {
  cancelSignin.addEventListener('click', () => closeAuthModal(signInModal));
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
  if (code.includes('popup-closed-by-user')) {
    return "Sign-in was cancelled before completion.";
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
        
        // Save user state and reload
        setLoggedInUser(data.user);
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

const googleBtn = document.querySelector('.google-btn');
if (googleBtn) {
  googleBtn.addEventListener('click', async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Sync Google user with Backend
      const response = await fetch('/api/auth/google-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      
      const data = await response.json();
      if (data.success) {
        setLoggedInUser(data.user);
        location.reload();
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      alert(getFriendlyErrorMessage(error));
    }
  });
}

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

if (uploadForm) {
  uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const categoryEl = document.getElementById('uploadCategory');
    const nameEl = document.getElementById('uploadName');
    const descriptionEl = document.getElementById('uploadDescription');
    
    if (!categoryEl || !nameEl || !descriptionEl) {
        console.error("Required form elements not found");
        return;
    }
    
    const category = categoryEl.value;
    const name = nameEl.value.trim();
    const description = descriptionEl.value.trim();
    const imageFile = uploadImage ? (uploadImage.files && uploadImage.files[0]) : null;
    const hasCapturedImage = Boolean(capturedImageDataUrl);

    if (!category || !name || (!imageFile && !hasCapturedImage)) {
      alert('Please select a category, add a name, and upload or capture an image.');
      return;
    }

    let imageData = null;
    if (hasCapturedImage) {
      imageData = capturedImageDataUrl;
    } else if (imageFile) {
      try {
        imageData = await readFileAsDataURL(imageFile);
      } catch (error) {
        console.warn('Could not read uploaded image file', error);
        alert('Could not process the image. Please try again.');
        return;
      }
    }

    const item = {
      category,
      name,
      description,
      imageName: imageFile ? imageFile.name : 'camera-photo.jpg',
      imageData,
      action: null,
      createdAt: new Date().toISOString(),
    };

    const suggestion = getSuggestionForItem(item);
    item.conditionSeverity = suggestion.severity;
    item.aiSuggestion = suggestion.text;
    item.aiAction = suggestion.action;

    uploadedItems.push(item);
    try {
      localStorage.setItem('scannableItems', JSON.stringify(uploadedItems));
    } catch (e) {
      console.warn('LocalStorage quota exceeded. Item added but might not persist after refresh.', e);
    }

    closeUploadModal();
    resetUploadForm();
    renderDashboard();
    openSuggestionModal(item);
  });
}

if (suggestionActionButtons) {
  suggestionActionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyUserSelectedAction(button.dataset.action);
      updateUploadedItems();
    });
  });
}

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
  if (urlParams.get('openUpload') === 'true') {
    openUploadModal();
  }
});
