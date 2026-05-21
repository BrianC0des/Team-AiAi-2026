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

const impactStylesCSS = `
.modal.impact-modal {
    padding: 0 !important;
    overflow: hidden !important;
    background: #ffffff !important;
    border: none !important;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2), var(--glow-violet-strong) !important;
    width: min(380px, 92%) !important;
    max-height: 95vh !important;
}
.impact-card-wrapper {
    background: #ffffff !important;
    display: flex !important;
    flex-direction: column !important;
    position: relative !important;
    border-bottom: 1px solid var(--divider, #e5e7eb) !important;
    width: 100% !important;
    box-sizing: border-box !important;
}
.impact-card-header {
    padding: 14px 18px !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    background: #ffffff !important;
    box-sizing: border-box !important;
}
.impact-badge {
    background: var(--badge-green-bg, #dcfce7) !important;
    color: var(--badge-green-text, #15803d) !important;
    padding: 6px 12px !important;
    border-radius: 100px !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    letter-spacing: 0.1em !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    text-transform: uppercase !important;
}
.impact-brand {
    font-weight: 800 !important;
    color: var(--primary-violet, #7c3aed) !important;
    font-size: 1rem !important;
    letter-spacing: -0.02em !important;
}
.impact-card-image {
    position: relative !important;
    width: 100% !important;
    max-height: 180px !important;
    background: #f8f6fb !important;
    overflow: hidden !important;
}
.impact-card-image img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
}
.impact-overlay-stat {
    position: absolute !important;
    bottom: 12px !important;
    right: 12px !important;
    background: rgba(124, 58, 237, 0.9) !important;
    backdrop-filter: blur(8px) !important;
    color: white !important;
    padding: 8px 14px !important;
    border-radius: 14px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    box-shadow: 0 8px 24px rgba(124, 58, 237, 0.3) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
}
.stat-value {
    font-size: 20px !important;
    font-weight: 800 !important;
    line-height: 1 !important;
}
.stat-unit {
    font-size: 9px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    opacity: 0.9 !important;
}
.impact-card-content {
    padding: 16px 18px !important;
    background: #ffffff !important;
    box-sizing: border-box !important;
}
.impact-card-content h3 {
    font-size: 18px !important;
    color: var(--text-dark, #1f2937) !important;
    margin-top: 0 !important;
    margin-bottom: 8px !important;
    font-weight: 800 !important;
}
.impact-card-content p {
    color: var(--text-medium, #4b5563) !important;
    font-size: 13px !important;
    line-height: 1.5 !important;
    margin-bottom: 14px !important;
    font-style: italic !important;
}
.impact-footer-stats {
    display: flex !important;
    gap: 24px !important;
    padding-top: 20px !important;
    border-top: 1px solid var(--divider, #e5e7eb) !important;
}
.impact-stat-item {
    display: flex !important;
    flex-direction: column !important;
    gap: 4px !important;
}
.stat-label {
    font-size: 11px !important;
    font-weight: 700 !important;
    color: var(--text-muted, #9ca3af) !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
}
.stat-info {
    font-size: 15px !important;
    font-weight: 600 !important;
    color: var(--primary-violet, #7c3aed) !important;
}
.impact-actions {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 16px 20px !important;
    background: #faf9fc !important;
    box-sizing: border-box !important;
}
.impact-actions button {
    flex: 1 !important;
    width: auto !important;
    min-width: 0 !important;
    padding: 10px 14px !important;
    font-size: 13.5px !important;
    border-radius: 999px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
}
@media (max-width: 480px) {
    .modal.impact-modal {
        width: 100% !important;
        height: 100% !important;
        max-height: 100vh !important;
        border-radius: 0 !important;
    }
    .impact-overlay-stat {
        bottom: 16px !important;
        right: 16px !important;
        padding: 10px 16px !important;
    }
    .stat-value {
        font-size: 24px !important;
    }
    .impact-actions button {
        font-size: 12px !important;
        padding: 8px 10px !important;
        gap: 6px !important;
    }
}
`;

const compressImage = (file, maxWidth = 1024, maxHeight = 1024) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 jpeg with 0.7 quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Ensure modals exist
export const initSharedModals = () => {
  if (!document.getElementById('impactModalStyles')) {
    const style = document.createElement('style');
    style.id = 'impactModalStyles';
    style.textContent = impactStylesCSS;
    document.head.appendChild(style);
  }

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
        // Detect if the app is embedded inside an iframe (like Hugging Face Spaces)
        if (window.self !== window.top) {
          const isSignup = btn.id === 'googleBtnSignup';
          const param = isSignup ? 'openSignup=true' : 'openLogin=true';
          const directUrl = window.location.origin + window.location.pathname + '?' + param;
          
          // Open in a new tab synchronously to guarantee the browser allows the gesture
          window.open(directUrl, '_blank');
          
          alert("To complete sign-in, we have opened the ScanAble app in a new tab. Once you log in there, this page will automatically sync and log you in!");
          return;
        }

        // 1. Immediately launch popup synchronously to avoid any popup blocking
        let popupPromise;
        try {
          popupPromise = signInWithPopup(auth, googleProvider);
        } catch (e) {
          console.error("Popup launch error:", e);
        }

        // 2. Visual feedback (use pointer-events: none instead of disabled=true to prevent gesture revocation)
        const originalText = btn.textContent;
        googleBtns.forEach(b => {
          b.style.pointerEvents = 'none';
          b.textContent = "Connecting to Google...";
        });

        try {
          const result = await popupPromise;
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

            // Close any active auth modals immediately so they don't linger during sync/migration
            const activeModals = document.querySelectorAll('.modal-overlay.active');
            activeModals.forEach(modal => modal.classList.remove('active'));

            // Sync local items with optional migration prompt
            try {
              const localItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
              let itemsToSync = localItems;
              
              const hasGuestItems = localItems.some(item => item.isGuestItem === true);
              if (hasGuestItems) {
                const shouldMigrate = await promptSyncMigration();
                if (!shouldMigrate) {
                  itemsToSync = [];
                }
              }
              
              const syncRes = await fetch('/api/items/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken, items: itemsToSync })
              });
              const syncData = await syncRes.json();
              if (syncData.success) {
                localStorage.setItem('scannableItems', JSON.stringify(syncData.items));
              }
            } catch (syncErr) {
              console.error("Error syncing items on Google login:", syncErr);
            }

            // Redirect to user home page (or reload if already there)
            if (window.location.pathname.includes('userHome.html')) {
              location.reload();
            } else {
              window.location.href = 'userHome.html';
            }
          } else {
            alert(data.error || "Google login sync failed.");
          }
        } catch (error) {
          if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Login Error:", error);
            
            let errMsg = error.message || String(error);
            const code = error.code || error.message || "";
            
            if (code.includes('unauthorized-domain')) {
              errMsg = `This domain (${window.location.hostname}) is not authorized for authentication in the Firebase console. Please ask your team lead to add this domain to the 'Authorized domains' list in Firebase Authentication > Settings.`;
            } else if (code.includes('popup-blocked')) {
              errMsg = "The Google login popup was blocked by your browser. Please allow popups/redirects for this site in your browser settings (or disable adblocker/shields) and try again.";
            } else {
              if (errMsg.startsWith("Firebase: ")) {
                errMsg = errMsg.replace("Firebase: ", "");
              }
            }
            alert(errMsg);
          }
        } finally {
          googleBtns.forEach(b => {
            b.style.pointerEvents = '';
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
        const base64data = await compressImage(file);
        
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
        
        if (!res.ok) {
          // If response is not 200/201, try to parse it as JSON or read it as text
          let errMsg = 'Failed to analyze item.';
          try {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          } catch (_) {
            const errText = await res.text();
            if (errText.includes('<!DOCTYPE') || errText.includes('<html')) {
              errMsg = 'Server returned HTML error response. Please check backend logs or configuration.';
            } else {
              errMsg = errText || errMsg;
            }
          }
          throw new Error(errMsg);
        }

        const data = await res.json();

        if (data.success) {
          const isGuest = !localStorage.getItem('scannableUser');
          const item = {
            id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
            category: payload.category,
            name: payload.name,
            description: payload.description,
            imageName: file.name || 'camera-photo.jpg',
            imageData: base64data,
            action: null,
            createdAt: new Date().toISOString(),
            isGuestItem: isGuest,
            conditionSeverity: data.severity || null,
            aiAction: data.recommendedAction || null,
            aiSuggestion: data.summary || '',
            aiDiyTips: data.diyTips || [],
            aiExpertTips: data.expertTips || [],
            aiConfidence: data.confidence || null,
            unrecognizable: data.unrecognizable || false,
            notAnItem: data.notAnItem || false,
            detectedAs: data.detectedAs || '',
          };

          // Save to local storage for persistence across pages
          if (!item.unrecognizable && !item.notAnItem) {
            try {
              const storedItems = JSON.parse(localStorage.getItem('scannableItems') || '[]');
              storedItems.push(item);
              localStorage.setItem('scannableItems', JSON.stringify(storedItems));
            } catch (err) {
              console.warn('LocalStorage error:', err);
            }
          }
          
          // Dispatch a global event so the active page can update its state
          window.dispatchEvent(new CustomEvent('itemUploaded', { detail: item }));
          
          closeUploadModal();
          uploadForm.reset();
          imagePreviewWrapper.style.display = 'none';
        } else {
          alert('Analysis failed: ' + data.error);
        }
      } catch (err) {
        console.error('Upload/Analysis error:', err);
        alert('An error occurred during analysis: ' + err.message);
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

const syncConfirmModalHTML = `
<div class="modal-overlay" id="syncConfirmModal">
  <div class="modal" style="width: min(420px, 92%); padding: 24px;">
    <h2 style="margin-top: 0; margin-bottom: 14px; color: var(--primary-violet); font-size: 1.5rem; font-weight: 800; text-align: center;">Sync Progress</h2>
    <div class="modal-body" style="margin-bottom: 24px;">
      <p style="margin: 0; line-height: 1.5; color: var(--text-main); font-size: 0.95rem; text-align: center;">We detected some items you uploaded as a guest. Do you want to sync and migrate them to your account?</p>
      <p style="margin-top: 12px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; text-align: center;">Click <strong>Sync & Merge</strong> to combine them, or <strong>Keep Existing</strong> to keep only your existing account items.</p>
    </div>
    <div class="modal-actions" style="display: flex; flex-direction: row; gap: 12px;">
      <button type="button" class="submit-btn" id="syncConfirmBtn" style="flex: 1; margin: 0; padding: 12px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; border: none; cursor: pointer; transition: all 0.2s; text-align: center; background: var(--submit-btn-background); color: white;">Sync & Merge</button>
      <button type="button" class="btn-secondary" id="syncCancelBtn" style="flex: 1; margin: 0; padding: 12px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s; text-align: center; background: #f5f3ff; color: var(--text-main);">Keep Existing</button>
    </div>
  </div>
</div>
`;

export const promptSyncMigration = () => {
  return new Promise((resolve) => {
    let modal = document.getElementById('syncConfirmModal');
    if (!modal) {
      document.body.insertAdjacentHTML('beforeend', syncConfirmModalHTML);
      modal = document.getElementById('syncConfirmModal');
    }

    const confirmBtn = document.getElementById('syncConfirmBtn');
    const cancelBtn = document.getElementById('syncCancelBtn');

    const cleanUpAndResolve = (result) => {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.remove();
      }, 300);
      resolve(result);
    };

    confirmBtn.onclick = () => cleanUpAndResolve(true);
    cancelBtn.onclick = () => cleanUpAndResolve(false);

    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
  });
};
