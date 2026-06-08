/* ── STORAGE HELPERS ── */

// Get all tasks from localStorage (returns array)
function getTasks() {
  const raw = localStorage.getItem('tc_tasks');
  return raw ? JSON.parse(raw) : getSeedTasks();
}

// Save tasks array back to localStorage
function saveTasks(tasks) {
  localStorage.setItem('tc_tasks', JSON.stringify(tasks));
}

// Get logged-in user (just a name string for Phase 1)
function getUser() {
  return localStorage.getItem('tc_user') || null;
}

// Save user
function saveUser(name) {
  localStorage.setItem('tc_user', name);
}

// Get My Tasks (tasks I accepted as doer)
function getMyDoingTasks() {
  const user = getUser();
  return getTasks().filter(t => t.doer === user);
}

// Get My Posted Tasks
function getMyPostedTasks() {
  const user = getUser();
  return getTasks().filter(t => t.poster === user);
}

/* ── SEED DATA (shown if localStorage is empty) ── */
function getSeedTasks() {
  const tasks = [
    {
      id: 'task_001',
      title: 'Deliver notes to Block C',
      desc: 'Printed slides need to go from Block A Room 101 to Block C Room 214. Quick 10-min walk. Please be careful with the papers.',
      category: 'Delivery',
      amount: 150,
      deadline: '20 min',
      status: 'open',
      poster: 'Anika S.',
      posterInitials: 'AS',
      posterRating: 4.8,
      doer: null,
      postedAt: Date.now() - 2 * 60 * 1000,   // 2 min ago
    },
    {
      id: 'task_002',
      title: 'Fix my Python code — TypeError',
      desc: 'Getting a TypeError on line 42 of my assignment. Need a Python person to help debug. Meeting in the library, about 30 min max.',
      category: 'Study help',
      amount: 200,
      deadline: '1 hr',
      status: 'open',
      poster: 'Rohan M.',
      posterInitials: 'RM',
      posterRating: 4.6,
      doer: null,
      postedAt: Date.now() - 18 * 60 * 1000,
    },
    {
      id: 'task_003',
      title: 'Pick up package from admin office',
      desc: 'Package arrived at the admin office. Just need someone to collect it and bring to Hostel B-204. Very simple errand, 10 min max.',
      category: 'Errand',
      amount: 100,
      deadline: '45 min',
      status: 'open',
      poster: 'Priya K.',
      posterInitials: 'PK',
      posterRating: 4.9,
      doer: null,
      postedAt: Date.now() - 35 * 60 * 1000,
    },
    {
      id: 'task_004',
      title: 'Print & spiral bind project report',
      desc: '35-page project report needs printing and spiral binding. PDF will be shared on WhatsApp. Print cost will be paid separately in cash.',
      category: 'Print job',
      amount: 250,
      deadline: '2 hrs',
      status: 'open',
      poster: 'Vikram T.',
      posterInitials: 'VT',
      posterRating: 4.5,
      doer: null,
      postedAt: Date.now() - 52 * 60 * 1000,
    },
    {
      id: 'task_005',
      title: 'Fix WiFi on my laptop',
      desc: 'Laptop WiFi keeps disconnecting every 10 minutes. Need someone who knows networking / drivers. Can meet in library or my hostel room.',
      category: 'Tech help',
      amount: 180,
      deadline: '1 hr',
      status: 'open',
      poster: 'Meera P.',
      posterInitials: 'MP',
      posterRating: 4.7,
      doer: null,
      postedAt: Date.now() - 70 * 60 * 1000,
    },
  ];
  saveTasks(tasks);
  return tasks;
}

/* ── UNIQUE ID GENERATOR ── */
function generateId() {
  return 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

/* ── TIME FORMATTER ── */
function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

/* ── TOAST NOTIFICATION ── */
function showToast(message, type = 'info', duration = 2800) {
  // Remove old toast if any
  const old = document.getElementById('tc-toast');
  if (old) old.remove();

  const icons = { success: '✓', error: '✕', info: '◆' };

  const toast = document.createElement('div');
  toast.id = 'tc-toast';
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

/* ── NAVBAR ACTIVE LINK ── */
function setActiveNavLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page) a.classList.add('active');
    else a.classList.remove('active');
  });
}

/* ── UPDATE NAV FOR LOGIN STATE ── */
function updateNavAuth() {
  const user = getUser();
  const loginBtn = document.getElementById('nav-login-btn');
  const userArea = document.getElementById('nav-user-area');

  if (!loginBtn && !userArea) return; // nav not present

  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userArea) {
      userArea.style.display = 'flex';
      const nameEl = document.getElementById('nav-user-name');
      if (nameEl) nameEl.textContent = user;
    }
  } else {
    if (loginBtn) loginBtn.style.display = '';
    if (userArea) userArea.style.display = 'none';
  }
}

/* ── CATEGORY COLORS ── */
function categoryColor(cat) {
  const map = {
    'Delivery':  { bg: 'rgba(139,124,248,.12)', color: '#a89dff' },
    'Study help':{ bg: 'rgba(96,165,250,.1)',   color: '#60a5fa' },
    'Errand':    { bg: 'rgba(251,191,36,.1)',   color: '#fbbf24' },
    'Print job': { bg: 'rgba(45,212,191,.1)',   color: '#2dd4bf' },
    'Tech help': { bg: 'rgba(74,222,128,.1)',   color: '#4ade80' },
    'Other':     { bg: 'rgba(148,163,184,.1)',  color: '#94a3b8' },
  };
  return map[cat] || map['Other'];
}

/* ── BUILD A TASK CARD HTML ── */
function buildTaskCard(task, clickable = true) {
  const earn = Math.round(task.amount * 0.8);
  const col   = categoryColor(task.category);
  const catStyle = `background:${col.bg};color:${col.color};border:1px solid ${col.color}33`;

  return `
    <div class="task-card${clickable ? ' card-clickable' : ''}" 
         onclick="${clickable ? `goToTask('${task.id}')` : ''}"
         data-id="${task.id}">
      <div class="tc-header">
        <div class="tc-title">${task.title}</div>
        <div class="amount-pill">₹${task.amount}</div>
      </div>
      <div class="tc-desc">${task.desc.length > 100 ? task.desc.slice(0, 100) + '...' : task.desc}</div>
      <div class="tc-footer">
        <span class="badge badge-open">Open</span>
        <span class="badge" style="${catStyle}">${task.category}</span>
        <span class="badge badge-gray">⏱ ${task.deadline}</span>
        <span class="badge badge-gray" style="margin-left:auto">${timeAgo(task.postedAt)}</span>
      </div>
    </div>`;
}

/* ── NAVIGATE TO TASK DETAIL ── */
function goToTask(id) {
  window.location.href = `task.html?id=${id}`;
}

/* ── REQUIRE LOGIN ── */
// Call on pages that need a logged-in user
function requireLogin() {
  if (!getUser()) {
    showToast('Please login first', 'error');
    setTimeout(() => window.location.href = 'login.html', 1200);
    return false;
  }
  return true;
}

/* ── ON DOM READY ── */
document.addEventListener('DOMContentLoaded', () => {
  setActiveNavLink();
  updateNavAuth();
});