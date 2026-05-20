import { auth, onAuthStateChanged } from "../../../config.js";

// ======================== PROFILE DATA & UI ========================
const sidebarEmailDisplay = document.getElementById('sidebarEmailDisplay');
const aboutText = document.getElementById('aboutText');
const toast = document.getElementById('toast');
const signOutBtn = document.getElementById('signOutBtn');

const statRecycle = document.getElementById('statRecycle');
const statReuse = document.getElementById('statReuse');
const statDonate = document.getElementById('statDonate');
const statRepair = document.getElementById('statRepair');

// Helper: update avatar initials or image
function updateAvatar(user) {
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const headerAvatar = document.getElementById('headerAvatar');

    if (user && user.profilePicture) {
        const imgHtml = `<img src="${user.profilePicture}" alt="Profile">`;
        if (sidebarAvatar) sidebarAvatar.innerHTML = imgHtml;
        if (headerAvatar) headerAvatar.innerHTML = imgHtml;
    } else {
        let identifier = (user && user.email) || 'User';
        let initials = '??';
        if (identifier && identifier !== 'User') {
            const parts = identifier.split('@')[0].split(/[._-]/);
            initials = parts.length === 1 ? parts[0].substring(0, 2).toUpperCase() : (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        if (sidebarAvatar) {
            sidebarAvatar.textContent = initials;
            sidebarAvatar.innerHTML = initials;
        }
        if (headerAvatar) {
            headerAvatar.textContent = initials;
            headerAvatar.innerHTML = initials;
        }
    }
}

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#ff4d4d' : '#4CAF50';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function loadSustainabilityStats() {
    const items = JSON.parse(localStorage.getItem('scannableItems') || '[]');
    const counts = items.reduce((acc, item) => {
        if (item.action) acc[item.action] = (acc[item.action] || 0) + 1;
        return acc;
    }, { recycle: 0, reuse: 0, repair: 0, donate: 0 });
    
    if (statRecycle) statRecycle.textContent = counts.recycle;
    if (statReuse) statReuse.textContent = counts.reuse;
    if (statDonate) statDonate.textContent = counts.donate;
    if (statRepair) statRepair.textContent = counts.repair;
}

// ======================== INITIAL LOAD (PREVENT FLICKER) ========================
// Load cached data immediately so the user doesn't see "???"
const cachedUser = JSON.parse(localStorage.getItem('scannableUser') || 'null');
if (cachedUser) {
    renderProfile(cachedUser);
}

// Global listener for Auth
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/auth/login-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      const data = await response.json();
      if (data.success) {
        renderProfile(data.user);
      }
    } catch (e) {
      console.error("Auth sync failed", e);
    }
  } else {
    window.location.href = '../../../index.html';
  }
});

function renderProfile(user) {
    if (sidebarEmailDisplay) sidebarEmailDisplay.textContent = user.email || 'your.email@example.com';
    aboutText.textContent = user.bio || 'Write something about yourself...';
    updateAvatar(user);
    loadSustainabilityStats();
    localStorage.setItem('scannableUser', JSON.stringify(user));
}

async function updateProfileUI(email, bio, avatarFile) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const idToken = await user.getIdToken();
        let profilePicture = undefined;

        if (avatarFile) {
            // Resize and compress the image client-side to ensure it is lightweight and fits in Firestore (1MB limit)
            profilePicture = await resizeAndCompressImage(avatarFile);
        }

        const response = await fetch('/api/auth/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken, bio, profilePicture })
        });

        const data = await response.json();
        if (data.success) {
            showToast('✨ Profile updated successfully!');
            // Update local state and UI
            const updatedUser = JSON.parse(localStorage.getItem('scannableUser') || '{}');
            updatedUser.bio = bio;
            if (profilePicture) updatedUser.profilePicture = profilePicture;
            renderProfile(updatedUser);
        } else {
            console.error('Server error updating profile:', data);
            showToast(data.message || data.error || 'Update failed', true);
        }
    } catch (error) {
        console.error('Failed to update profile', error);
        showToast('Update failed. Try again.', true);
    }
}

function resizeAndCompressImage(file, maxWidth = 150, maxHeight = 150) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate aspect ratio
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

                // Export as standard optimized JPEG DataURL (quality 0.7 produces extremely small size: ~10-15KB)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedDataUrl);
            };
            img.onerror = () => reject(new Error('Failed to load image.'));
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


// ======================== MODAL LOGIC ========================
const editModal = document.getElementById('editProfileModal');
const openEditBtn = document.getElementById('openEditModal');
const closeEditBtn = document.getElementById('closeEditModal');
const editForm = document.getElementById('editProfileForm');

function openModal() {
    const user = JSON.parse(localStorage.getItem('scannableUser') || '{}');
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editBio').value = user.bio || '';
    editModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    editModal.classList.remove('active');
    document.body.style.overflow = '';
}

if (openEditBtn) openEditBtn.addEventListener('click', openModal);
if (closeEditBtn) closeEditBtn.addEventListener('click', closeModal);

// Close modal when clicking outside
if (editModal) {
    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) closeModal();
    });
}

// Close on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && editModal && editModal.classList.contains('active')) closeModal();
});

// Handle form submission
if (editForm) {
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('editEmail').value.trim();
        const bio = document.getElementById('editBio').value.trim();
        const avatarFile = document.getElementById('editAvatar').files[0];
        
        updateProfileUI(email, bio, avatarFile);
        closeModal();
    });
}

if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
        await auth.signOut();
        localStorage.clear();
        window.location.href = '../../../index.html';
    });
}
// Navigation Listeners
const dashboardBtn = document.getElementById('DashboardBtn');
if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => window.location.href = 'userHome.html');
}

const activeRepairBtn = document.getElementById('ActiveRepair');
if (activeRepairBtn) {
    activeRepairBtn.addEventListener('click', () => window.location.href = 'activeRepair.html');
}

const donationStashBtn = document.getElementById('DonationStash');
if (donationStashBtn) {
    donationStashBtn.addEventListener('click', () => window.location.href = 'donationStash.html');
}

console.log('✅ Profile updated: email-only display and logout implemented.');
