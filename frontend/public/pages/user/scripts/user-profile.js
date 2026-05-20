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
        // Use email for initials if name is removed
        let identifier = (user && user.email) || 'User';
        let initials = '??';
        if (identifier && identifier !== 'User') {
            const parts = identifier.split('@')[0].split(/[._-]/);
            if (parts.length === 1) {
                initials = parts[0].substring(0, 2).toUpperCase();
            } else {
                initials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
            }
        }
        sidebarAvatar.textContent = initials;
    }
}

// Show toast notification
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Load counts from scannableItems
function loadSustainabilityStats() {
    const items = JSON.parse(localStorage.getItem('scannableItems') || '[]');
    const counts = items.reduce(
        (acc, item) => {
            if (item.action) {
                acc[item.action] = (acc[item.action] || 0) + 1;
            }
            return acc;
        },
        { recycle: 0, reuse: 0, repair: 0, donate: 0 }
    );
    
    if (statRecycle) statRecycle.textContent = counts.recycle;
    if (statReuse) statReuse.textContent = counts.reuse;
    if (statDonate) statDonate.textContent = counts.donate;
    if (statRepair) statRepair.textContent = counts.repair;
}

// Initialize UI with localStorage data
function initProfileUI() {
    const user = JSON.parse(localStorage.getItem('scannableUser') || 'null');
    if (user) {
        if (sidebarEmailDisplay) sidebarEmailDisplay.textContent = user.email || 'your.email@example.com';
        aboutText.textContent = user.bio || 'Write something about yourself. This space is ready for your story, mission, or current focus.';
        updateAvatar(user);
    } else {
        if (sidebarEmailDisplay) sidebarEmailDisplay.textContent = 'your.email@example.com';
        aboutText.textContent = 'Write something about yourself. This space is ready for your story, mission, or current focus.';
        updateAvatar({ email: 'User' });
    }
    loadSustainabilityStats();
}

// Update entire UI after edit
async function updateProfileUI(email, bio, avatarFile) {
    let user = JSON.parse(localStorage.getItem('scannableUser') || '{}');
    
    user.email = email || user.email;
    user.bio = bio || user.bio;

    if (avatarFile) {
        try {
            const dataUrl = await readFileAsDataURL(avatarFile);
            user.profilePicture = dataUrl;
        } catch (error) {
            console.error('Failed to read avatar file', error);
        }
    }
    
    localStorage.setItem('scannableUser', JSON.stringify(user));
    
    if (sidebarEmailDisplay) sidebarEmailDisplay.textContent = user.email;
    aboutText.textContent = user.bio;
    updateAvatar(user);
    
    showToast('✨ Profile updated successfully!');
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

openEditBtn.addEventListener('click', openModal);
closeEditBtn.addEventListener('click', closeModal);

// Close modal when clicking outside
editModal.addEventListener('click', function(e) {
    if (e.target === editModal) closeModal();
});

// Close on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && editModal.classList.contains('active')) closeModal();
});

// Handle form submission
editForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('editEmail').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const avatarFile = document.getElementById('editAvatar').files[0];
    
    updateProfileUI(email, bio, avatarFile);
    closeModal();
});

// ======================== SIGN OUT LOGIC ========================
if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
        localStorage.clear(); // Clears all data including user and items
        window.location.href = '../../../index.html';
    });
}

// ======================== INITIAL LOAD ========================
initProfileUI();

console.log('✅ Profile updated: email-only display and logout implemented.');
