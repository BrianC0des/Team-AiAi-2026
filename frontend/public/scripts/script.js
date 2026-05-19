const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginButtons = [document.getElementById('login'), document.getElementById('login2')];
const signupButtons = [document.getElementById('register'), document.getElementById('register2')];
const closeButtons = document.querySelectorAll('.close-modal');
const switchButtons = document.querySelectorAll('.modal-switch-btn');

function openModal(modal) {
  if (!modal) return;
  modal.classList.add('active');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('active');
}

loginButtons.forEach(button => {
  if (button) button.addEventListener('click', () => openModal(loginModal));
});

signupButtons.forEach(button => {
  if (button) button.addEventListener('click', () => openModal(signupModal));
});

closeButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal-overlay');
    closeModal(modal);
  });
});

switchButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.dataset.target;
    const targetModal = document.getElementById(targetId);
    closeModal(loginModal);
    closeModal(signupModal);
    openModal(targetModal);
  });
});

[loginModal, signupModal].forEach(modal => {
  if (!modal) return;
  modal.addEventListener('click', event => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeModal(loginModal);
    closeModal(signupModal);
  }
});

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

if (loginForm) {
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    closeModal(loginModal);
    setTimeout(() => {
      window.location.href = 'pages/user/pages/userHome.html';
    }, 150);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', event => {
    event.preventDefault();
    closeModal(signupModal);
    setTimeout(() => {
      window.location.href = 'pages/user/pages/userHome.html';
    }, 150);
  });
}
