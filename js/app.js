import { AUTHORIZED_MODERATORS } from './config.js';
import { createApprovedCard, createPendingCard, createRejectedCard } from './templates.js';

let dictionaryData = [];
let currentActiveMod = null;
let targetViewAfterAuth = 'dashboard';

// Dynamic Data Loader (JSON/LocalStorage Sync)
async function loadInitialData() {
  const localData = localStorage.getItem('pao_dict_gh_data');
  if (localData) {
    dictionaryData = JSON.parse(localData);
  } else {
    try {
      const [approvedRes, pendingRes, rejectedRes] = await Promise.all([
        fetch('data/approved-words.json'),
        fetch('data/pending-words.json'),
        fetch('data/rejected-words.json')
      ]);
      const approved = await approvedRes.json();
      const pending = await pendingRes.json();
      const rejected = await rejectedRes.json();

      dictionaryData = [...approved, ...pending, ...rejected];
      saveData();
    } catch (err) {
      console.error("JSON Data Load Error:", err);
      dictionaryData = [];
    }
  }
  renderViewerWords();
}

function saveData() {
  localStorage.setItem('pao_dict_gh_data', JSON.stringify(dictionaryData));
}

// Render Functions
window.renderViewerWords = function () {
  const display = document.getElementById('wordListDisplay');
  const query = (document.getElementById('searchInput').value || '').toLowerCase();
  display.innerHTML = '';

  const items = dictionaryData.filter(d => d.status === 'approved' && (d.pao.toLowerCase().includes(query) || d.meaning.includes(query)));
  if (items.length === 0) {
    display.innerHTML = `<p style="color:var(--text-sub); text-align:center; padding: 2rem;">ရှာဖွေမှုနှင့် ကိုက်ညီသော စကားလုံး မရှိပါ။</p>`;
    return;
  }
  display.innerHTML = items.map(createApprovedCard).join('');
};

window.renderModQueue = function () {
  const display = document.getElementById('modPendingList');
  const query = (document.getElementById('modSearchInput').value || '').toLowerCase();
  display.innerHTML = '';

  const items = dictionaryData.filter(d => d.status === 'pending' && (d.pao.toLowerCase().includes(query) || d.meaning.includes(query) || (d.contributor && d.contributor.toLowerCase().includes(query))));
  if (items.length === 0) {
    display.innerHTML = `<p style="color:var(--text-sub); text-align:center; padding: 2rem;">စိစစ်ရန် စကားလုံးမရှိပါ။</p>`;
    return;
  }
  display.innerHTML = items.map(createPendingCard).join('');
};

window.renderRejectedQueue = function () {
  const display = document.getElementById('rejectedList');
  const query = (document.getElementById('rejectedSearchInput').value || '').toLowerCase();
  display.innerHTML = '';

  const items = dictionaryData.filter(d => d.status === 'rejected' && (d.pao.toLowerCase().includes(query) || d.meaning.includes(query) || (d.contributor && d.contributor.toLowerCase().includes(query))));
  if (items.length === 0) {
    display.innerHTML = `<p style="color:var(--text-sub); text-align:center; padding: 2rem;">ငြင်းပယ်ထားသော စကားလုံး မရှိပါ။</p>`;
    return;
  }
  display.innerHTML = items.map(createRejectedCard).join('');
};

// UI Controllers
window.toggleDrawer = function () {
  document.getElementById('drawer').classList.toggle('active');
  document.getElementById('drawerOverlay').classList.toggle('active');
};

window.openAddModal = function () { document.getElementById('addWordModal').classList.add('active'); };
window.closeModal = function (id) { document.getElementById(id).classList.remove('active'); };

window.switchView = function (viewName) {
  document.getElementById('homeView').style.display = 'none';
  document.getElementById('modDashboardView').style.display = 'none';
  document.getElementById('rejectedView').style.display = 'none';

  if (viewName === 'home') {
    document.getElementById('homeView').style.display = 'block';
    renderViewerWords();
  } else if (viewName === 'dashboard') {
    document.getElementById('modDashboardView').style.display = 'block';
    renderModQueue();
  } else if (viewName === 'rejected') {
    document.getElementById('rejectedView').style.display = 'block';
    renderRejectedQueue();
  }
  scrollToTop();
};

window.openModAuth = function (targetView) {
  if (currentActiveMod) {
    switchView(targetView);
  } else {
    targetViewAfterAuth = targetView;
    document.getElementById('modAuthModal').classList.add('active');
  }
};

window.handleModLogin = function (e) {
  e.preventDefault();
  const inputName = document.getElementById('modName').value.trim();
  const inputId = document.getElementById('modId').value.trim();

  const foundMod = AUTHORIZED_MODERATORS.find(m => m.name === inputName && m.id === inputId);
  if (foundMod) {
    currentActiveMod = foundMod;
    closeModal('modAuthModal');
    e.target.reset();
    showToast(`မင်္ဂလာပါ ${foundMod.name}၊ စိစစ်သူအဖြစ် ဝင်ရောက်ထားပါသည်။`);
    switchView(targetViewAfterAuth);
  } else {
    alert('စိစစ်သူ အမည် သို့မဟုတ် ID မမှန်ကန်ပါ။');
  }
};

window.handleContributorSubmit = function (e) {
  e.preventDefault();
  const newEntry = {
    id: Date.now(),
    pao: document.getElementById('cPao').value,
    type: document.getElementById('cType').value,
    meaning: document.getElementById('cMeaning').value,
    example: document.getElementById('cExample').value,
    contributor: document.getElementById('cName').value,
    status: 'pending'
  };

  dictionaryData.push(newEntry);
  saveData();
  closeModal('addWordModal');
  showToast('စကားလုံးအသစ် တင်သွင်းပြီးပါပြီ။');
  e.target.reset();
};

// Global Event Delegation for Dynamic Buttons
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);
  const item = dictionaryData.find(d => d.id === id);

  if (action === 'approve' && item) {
    item.status = 'approved'; saveData(); renderModQueue(); showToast('အတည်ပြုပြီးပါပြီ။');
  } else if (action === 'reject' && item) {
    item.status = 'rejected'; saveData(); renderModQueue(); showToast('ငြင်းပယ်လိုက်ပါပြီ။');
  } else if (action === 'restore' && item) {
    item.status = 'pending'; saveData(); renderRejectedQueue(); showToast('ပြန်လည် ပေးပို့ပြီးပါပြီ။');
  } else if (action === 'delete' && item) {
    if (confirm('အပြီးပိုင် ဖျက်ထုတ်ရန် သေချာပါသလား။')) {
      dictionaryData = dictionaryData.filter(d => d.id !== id);
      saveData(); renderRejectedQueue(); showToast('အပြီးပိုင် ဖျက်ပြီးပါပြီ။');
    }
  }
});

// Scroll & Toast
window.onscroll = function () {
  const btn = document.getElementById('scrollTopBtn');
  btn.style.display = (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) ? 'flex' : 'none';
};

window.scrollToTop = function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function showToast(msg) {
  const toast = document.getElementById('toastMsg');
  toast.innerText = msg; toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// Initial Run
loadInitialData();
