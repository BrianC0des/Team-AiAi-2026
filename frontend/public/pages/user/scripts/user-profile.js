import { auth, onAuthStateChanged } from "../../../config.js";

// ======================== PROFILE DATA & UI ========================
const sidebarEmailDisplay = document.getElementById('sidebarEmailDisplay');
const sidebarAvatar = document.getElementById('sidebarAvatar');
const aboutText = document.getElementById('aboutText');
const toast = document.getElementById('toast');
const signOutBtn = document.getElementById('signOutBtn');

const statRecycle = document.getElementById('statRecycle');
const statReuse = document.getElementById('statReuse');
const statDonate = document.getElementById('statDonate');
const statRepair = document.getElementById('statRepair');

// Helper: update avatar initials or image
function updateAvatar(user) {
    if (user && user.profilePicture) {
        sidebarAvatar.innerHTML = `<img src="${user.profilePicture}" alt="Profile">`;
    } else {
        let identifier = (user && user.email) || 'User';
        let initials = '??';
        if (identifier && identifier !== 'User') {
            const parts = identifier.split('@')[0].split(/[._-]/);
            initials = parts.length === 1 ? parts[0].substring(0, 2).toUpperCase() : (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        sidebarAvatar.textContent = initials;
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
            profilePicture = await readFileAsDataURL(avatarFile);
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
        }
    } catch (error) {
        console.error('Failed to update profile', error);
        showToast('Update failed. Try again.', true);
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ======================== MODAL LOGIC ========================
const editModal = document.getElementById('editProfileModal');
const openEditBtn = document.getElementById('openEditModal');
const closeEditBtn = document.getElementById('closeEditModal');
const editForm = document.getElementById('editProfileForm');

openEditBtn.addEventListener('click', () => {
    const user = JSON.parse(localStorage.getItem('scannableUser') || '{}');
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editBio').value = user.bio || '';
    editModal.classList.add('active');
});

closeEditBtn.addEventListener('click', () => editModal.classList.remove('active'));

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const bio = document.getElementById('editBio').value.trim();
    const avatarFile = document.getElementById('editAvatar').files[0];
    updateProfileUI(null, bio, avatarFile);
    editModal.classList.remove('active');
});

if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
        await auth.signOut();
        localStorage.clear();
        window.location.href = '../../../index.html';
    });
}
