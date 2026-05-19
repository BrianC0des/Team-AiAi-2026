'use strict';

const body = document.body;
const burger = document.getElementById('Burger');

const sidebar = document.createElement('aside');
sidebar.className = 'sidebar';
sidebar.innerHTML = `
  <div class="sidebar-top">
    <div id="profimg"></div>
    <div class="sidebar-user">
      <h2>User Name</h2>
      <p>usergmail@gmail.com</p>
    </div>
  </div>
  <nav class="sidebar-nav">
  <a href="UserProfile.html"><button>Profile</button></a>
    <a href="UserHome.html"><button>Dashboard</button></a>
    <a href="UserHome.html"><button>Page 1</button></a>
    <a href="UserHome.html"><button>Page 2</button></a>
    <a href="UserHome.html"><button>Page 3</button></a>
    <a href="../../../index.html"><button id="Signout">Sign Out</button></a>
  </nav>
`;

const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';

body.prepend(sidebar);
body.append(overlay);

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('active');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

burger?.addEventListener('click', () => {
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
});


