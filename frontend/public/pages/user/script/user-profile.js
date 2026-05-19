// ======================== PROFILE DATA & UI ========================
const sidebarName = document.getElementById('sidebarName');
const sidebarUsername = document.getElementById('sidebarUsername');
const sidebarAvatar = document.getElementById('sidebarAvatar');
const aboutText = document.getElementById('aboutText');
const toast = document.getElementById('toast');

// Helper: update avatar initials from display name
function updateAvatarFromName(name) {
    let initials = '??';
    if (name && name.trim() !== 'Your Name' && name.trim() !== '') {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            initials = parts[0].charAt(0).toUpperCase();
        } else {
            initials = (parts[0].charAt(0) + parts[parts.length-1].charAt(0)).toUpperCase();
        }
        if (initials.length > 2) initials = initials.substring(0,2);
    } else {
        initials = '??';
    }
    sidebarAvatar.textContent = initials;
}

// Show toast notification
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Initialize UI with default values (no localStorage)
function initProfileUI() {
    sidebarName.textContent = 'Your Name';
    sidebarUsername.textContent = '@username';
    aboutText.textContent = 'Write something about yourself. This space is ready for your story, mission, or current focus.';
    updateAvatarFromName('Your Name');
}

// Update entire UI after edit (no persistence)
function updateProfileUI(name, username, bio) {
    const displayName = name || 'Your Name';
    const displayUsername = username || 'username';
    const displayBio = bio || 'Write something about yourself. This space is ready for your story, mission, or current focus.';
    
    sidebarName.textContent = displayName;
    sidebarUsername.textContent = '@' + displayUsername;
    aboutText.textContent = displayBio;
    updateAvatarFromName(displayName);
    
    showToast('✨ Profile updated successfully!');
}

// ======================== MODAL LOGIC ========================
const editModal = document.getElementById('editProfileModal');
const openEditBtn = document.getElementById('openEditModal');
const closeEditBtn = document.getElementById('closeEditModal');
const editForm = document.getElementById('editProfileForm');

function openModal() {
    // Pre-fill form with current values (cleaning up placeholder texts)
    let currentName = sidebarName.textContent;
    let currentUsername = sidebarUsername.textContent.replace('@', '');
    let currentBio = aboutText.textContent;
    
    if (currentName === 'Your Name') currentName = '';
    if (currentUsername === 'username') currentUsername = '';
    if (currentBio === 'Write something about yourself. This space is ready for your story, mission, or current focus.') currentBio = '';
    
    document.getElementById('editName').value = currentName;
    document.getElementById('editUsername').value = currentUsername;
    document.getElementById('editBio').value = currentBio;
    
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
    
    const name = document.getElementById('editName').value.trim();
    const username = document.getElementById('editUsername').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    
    updateProfileUI(name, username, bio);
    closeModal();
});

// ======================== INITIAL LOAD ========================
initProfileUI();

console.log('✅ Clean profile layout — localStorage removed, data resets on reload.');