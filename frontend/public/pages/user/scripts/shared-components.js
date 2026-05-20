// shared-components.js
// Dynamically injects and manages global UI modals (Upload, Impact/Share)

const uploadModalHTML = `
<div class="modal-overlay" id="uploadModal">
  <div class="modal">
    <button class="close-modal" id="closeUpload" aria-label="Close">&times;</button>
    <h2>Upload Item</h2>
    <form id="uploadForm">
      <label for="uploadImage">Item Image</label>
      <input id="uploadImage" name="uploadImage" type="file" accept="image/*" />
      <button type="button" id="cameraButton" class="btn-secondary take-photo-btn">Open Camera</button>

      <div id="cameraPanel" class="camera-panel hidden">
        <video id="cameraPreview" autoplay playsinline></video>
        <div class="camera-controls">
          <button type="button" id="capturePhoto" class="submit-btn">Capture</button>
          <button type="button" id="closeCamera" class="btn-secondary">Close Camera</button>
        </div>
      </div>

      <div id="imagePreviewWrapper" class="image-preview-wrapper">
        <img id="imagePreview" alt="Image preview" />
      </div>

      <label for="uploadCategory">Category</label>
      <select id="uploadCategory" name="uploadCategory" required>
        <option value="">Choose category</option>
        <option value="wearables">Wearables</option>
        <option value="electronics">Electronics</option>
        <option value="household">Household (Furniture & Home)</option>
        <option value="recreational">Recreational</option>
        <option value="supplies">Supplies</option>
      </select>

      <label for="uploadName">Item Name</label>
      <input id="uploadName" name="uploadName" type="text" placeholder="Enter item name" required />

      <label for="uploadDescription">Description</label>
      <textarea id="uploadDescription" name="uploadDescription" placeholder="Describe the item" rows="4"></textarea>

      <div class="modal-actions">
        <button type="submit" class="submit-btn" id="uploadSubmitBtn">
          <span id="uploadSubmitLabel">Analyze Item</span>
          <span id="uploadSubmitSpinner" class="hidden">Analyzing…</span>
        </button>
        <button type="button" class="btn-secondary" id="cancelUpload">Cancel</button>
      </div>
    </form>
  </div>
</div>
`;

const impactModalHTML = `
<div class="modal-overlay" id="impactModal">
  <div class="modal impact-modal">
    <button class="close-modal" id="closeImpact" aria-label="Close">&times;</button>
    
    <div class="impact-card-wrapper" id="impactCard">
      <div class="impact-card-header">
        <div class="impact-badge">
          <i class="fas fa-leaf"></i>
          <span id="impactBadgeText">ITEM REPAIRED</span>
        </div>
        <div class="impact-brand">Scannable</div>
      </div>

      <div class="impact-card-image">
        <img id="impactItemImage" src="" alt="Impact Item" />
        <div class="impact-overlay-stat">
          <span class="stat-value" id="co2SavedValue">0.0</span>
          <span class="stat-unit">kg CO2 Saved</span>
        </div>
      </div>

      <div class="impact-card-content">
        <h3 id="impactTitle">Mission Accomplished!</h3>
        <p id="impactMessage">"I just saved this item from the landfill! Choosing to repair instead of replace makes a world of difference. 🌍"</p>
        <div class="impact-footer-stats">
          <div class="impact-stat-item">
            <span class="stat-label">Category</span>
            <span class="stat-info" id="impactCategory">Electronics</span>
          </div>
          <div class="impact-stat-item">
            <span class="stat-label">Action</span>
            <span class="stat-info" id="impactAction">Repair</span>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-actions impact-actions">
      <button type="button" class="submit-btn" id="shareImpactBtn">
        <i class="fas fa-share-alt"></i> Share Progress
      </button>
      <button type="button" class="btn-secondary" id="downloadImpactBtn">
        <i class="fas fa-download"></i> Download Card
      </button>
    </div>
  </div>
</div>
`;

// Helper data for impact card
const co2Values = {
  electronics: 15.5,
  wearables: 5.2,
  household: 25.0,
  recreational: 10.0,
  supplies: 2.5,
  default: 5.0
};

const actionMessages = {
  repair: "I just saved this item from the landfill! Choosing to repair instead of replace makes a world of difference. 🌍",
  donate: "I just donated this item! Giving it a second life helps the community and the planet. ♻️",
  recycle: "I just responsibly recycled this item! Keeping e-waste and materials out of the landfill. 🌿",
  reuse: "I'm repurposing this item! Creativity and reuse are the best ways to reduce waste. ✨"
};

const actionText = {
  repair: "ITEM REPAIRED",
  donate: "ITEM DONATED",
  recycle: "ITEM RECYCLED",
  reuse: "ITEM REUSED"
};

const actionLabels = {
  repair: "Repair",
  donate: "Donate",
  recycle: "Recycle",
  reuse: "Reuse"
};

let cameraStream = null;

// Ensure modals exist
export const initSharedModals = () => {
  if (!document.getElementById('uploadModal')) {
    document.body.insertAdjacentHTML('beforeend', uploadModalHTML);
  }
  if (!document.getElementById('impactModal')) {
    document.body.insertAdjacentHTML('beforeend', impactModalHTML);
  }

  bindUploadEvents();
  bindImpactEvents();
  bindGoogleAuth();
};

const bindGoogleAuth = () => {
  const googleBtns = document.querySelectorAll('.google-btn');
  if (!googleBtns.length) return;

  // Dynamically import Firebase auth so this file stays lightweight
  import('../../../config.js').then(({ auth, googleProvider, signInWithPopup }) => {
    googleBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const originalText = btn.textContent;
        googleBtns.forEach(b => {
          b.disabled = true;
          b.textContent = "Connecting to Google...";
        });

        try {
          const result = await signInWithPopup(auth, googleProvider);
          const idToken = await result.user.getIdToken();

          // Sync Google user with backend
          const response = await fetch('/api/auth/google-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });

          const data = await response.json();
          if (data.success) {
            localStorage.setItem('scannableUser', JSON.stringify(data.user));

            // Sync local items
            try {
              const localItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
              const syncRes = await fetch('/api/items/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken, items: localItems })
              });
              const syncData = await syncRes.json();
              if (syncData.success) {
                localStorage.setItem('scannableItems', JSON.stringify(syncData.items));
              }
            } catch (syncErr) {
              console.error("Error syncing items on Google login:", syncErr);
            }

            // Redirect to user home page
            window.location.href = 'userHome.html';
          } else {
            alert(data.error || "Google login sync failed.");
          }
        } catch (error) {
          if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Login Error:", error);
            alert(error.message || "Google sign-in failed. Please try again.");
          }
        } finally {
          googleBtns.forEach(b => {
            b.disabled = false;
            b.textContent = originalText;
          });
        }
      });
    });
  }).catch(err => {
    console.error('[shared-components] Could not load Firebase config for Google auth:', err);
  });
};

const bindUploadEvents = () => {
  const uploadBtn = document.getElementById('UploadItem');
  const uploadModal = document.getElementById('uploadModal');
  const closeUpload = document.getElementById('closeUpload');
  const cancelUpload = document.getElementById('cancelUpload');
  const uploadImage = document.getElementById('uploadImage');
  const imagePreview = document.getElementById('imagePreview');
  const imagePreviewWrapper = document.getElementById('imagePreviewWrapper');
  const cameraButton = document.getElementById('cameraButton');
  const cameraPanel = document.getElementById('cameraPanel');
  const cameraPreview = document.getElementById('cameraPreview');
  const capturePhoto = document.getElementById('capturePhoto');
  const closeCameraBtn = document.getElementById('closeCamera');
  const uploadForm = document.getElementById('uploadForm');
  const uploadSubmitBtn = document.getElementById('uploadSubmitBtn');
  const uploadSubmitLabel = document.getElementById('uploadSubmitLabel');
  const uploadSubmitSpinner = document.getElementById('uploadSubmitSpinner');

  const openUploadModal = () => uploadModal && uploadModal.classList.add('active');
  const closeUploadModal = () => uploadModal && uploadModal.classList.remove('active');

  if (uploadBtn) uploadBtn.addEventListener('click', openUploadModal);
  if (closeUpload) closeUpload.addEventListener('click', closeUploadModal);
  if (cancelUpload) cancelUpload.addEventListener('click', closeUploadModal);
  
  if (uploadModal) {
    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) closeUploadModal();
    });
  }

  const stopCameraStream = () => {
    if (!cameraStream) return;
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  };

  const closeCameraCapture = () => {
    if (cameraPanel) cameraPanel.classList.add('hidden');
    stopCameraStream();
  };

  if (closeCameraBtn) closeCameraBtn.addEventListener('click', closeCameraCapture);

  if (cameraButton && cameraPanel && cameraPreview) {
    cameraButton.addEventListener('click', async () => {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        cameraPreview.srcObject = cameraStream;
        cameraPanel.classList.remove('hidden');
      } catch (err) {
        alert('Could not access camera. Please upload a file instead.');
      }
    });
  }

  if (capturePhoto && cameraPreview && imagePreview && imagePreviewWrapper) {
    capturePhoto.addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = cameraPreview.videoWidth;
      canvas.height = cameraPreview.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      imagePreview.src = dataUrl;
      imagePreviewWrapper.style.display = 'block';
      closeCameraCapture();
      
      // Create a File object so form submit works normally
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          if (uploadImage) uploadImage.files = dataTransfer.files;
        });
    });
  }

  if (uploadImage && imagePreview && imagePreviewWrapper) {
    uploadImage.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          imagePreview.src = evt.target.result;
          imagePreviewWrapper.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        imagePreviewWrapper.style.display = 'none';
      }
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const file = uploadImage.files[0];
      if (!file) {
        alert('Please provide an image.');
        return;
      }

      uploadSubmitLabel.classList.add('hidden');
      uploadSubmitSpinner.classList.remove('hidden');
      uploadSubmitBtn.disabled = true;

      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          const base64data = reader.result;
          
          const payload = {
            name: document.getElementById('uploadName').value,
            category: document.getElementById('uploadCategory').value,
            description: document.getElementById('uploadDescription').value,
            imageData: base64data
          };

          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();

          if (data.success) {
            const newItem = {
              createdAt: new Date().toISOString(),
              ...payload,
              ...data.data
            };
            
            // Dispatch a global event so the active page can update its state
            window.dispatchEvent(new CustomEvent('itemUploaded', { detail: newItem }));
            
            closeUploadModal();
            uploadForm.reset();
            imagePreviewWrapper.style.display = 'none';
          } else {
            alert('Analysis failed: ' + data.error);
          }
        };
      } catch (err) {
        alert('An error occurred during upload.');
      } finally {
        uploadSubmitLabel.classList.remove('hidden');
        uploadSubmitSpinner.classList.add('hidden');
        uploadSubmitBtn.disabled = false;
      }
    });
  }
};

const bindImpactEvents = () => {
  const impactModal = document.getElementById('impactModal');
  const closeImpact = document.getElementById('closeImpact');
  const shareImpactBtn = document.getElementById('shareImpactBtn');
  const downloadImpactBtn = document.getElementById('downloadImpactBtn');

  if (closeImpact) {
    closeImpact.addEventListener('click', () => {
      impactModal.classList.remove('active');
    });
  }
  
  if (impactModal) {
    impactModal.addEventListener('click', (e) => {
      if (e.target === impactModal) impactModal.classList.remove('active');
    });
  }

  if (shareImpactBtn) {
    shareImpactBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'My Scannable Impact',
        text: document.getElementById('impactMessage').textContent,
        url: window.location.origin,
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
          alert('Progress copied to clipboard! Share it on your favorite social network.');
        }
      } catch (err) {
        console.warn('Share failed', err);
      }
    });
  }

  if (downloadImpactBtn) {
    downloadImpactBtn.addEventListener('click', async () => {
      if (!window.html2canvas) {
        alert('html2canvas library not loaded!');
        return;
      }
      const cardEl = document.getElementById('impactCard');
      if (!cardEl) return;
      try {
        downloadImpactBtn.disabled = true;
        downloadImpactBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        const canvas = await window.html2canvas(cardEl, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = 'my-scannable-impact.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        alert('Failed to generate image.');
      } finally {
        downloadImpactBtn.disabled = false;
        downloadImpactBtn.innerHTML = '<i class="fas fa-download"></i> Download Card';
      }
    });
  }
};

// Global function to show impact card
window.showImpactCard = (item, action) => {
  const impactModal = document.getElementById('impactModal');
  if (!impactModal) return;

  const badgeText = document.getElementById('impactBadgeText');
  const itemImage = document.getElementById('impactItemImage');
  const co2Value = document.getElementById('co2SavedValue');
  const impactTitle = document.getElementById('impactTitle');
  const impactMessage = document.getElementById('impactMessage');
  const impactCategory = document.getElementById('impactCategory');
  const impactAction = document.getElementById('impactAction');

  if (badgeText) badgeText.textContent = actionText[action] || "IMPACT MADE";
  if (itemImage) itemImage.src = item.imageData || '';
  
  const savedAmount = co2Values[item.category?.toLowerCase()] || co2Values.default;
  if (co2Value) co2Value.textContent = savedAmount.toFixed(1);
  
  if (impactTitle) impactTitle.textContent = "Mission Accomplished!";
  if (impactMessage) impactMessage.textContent = actionMessages[action] || actionMessages.repair;
  if (impactCategory) impactCategory.textContent = item.category;
  if (impactAction) impactAction.textContent = actionLabels[action] || action;

  impactModal.classList.add('active');
};
