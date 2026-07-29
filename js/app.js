import { supabase } from './supabaseClient.js';
import { AUTHORIZED_MODERATORS } from './config.js';
import { createApprovedCard, createPendingCard, createRejectedCard } from './templates.js';

// Global Data Arrays
let approvedWords = [];
let pendingWords = [];
let rejectedWords = [];

// ==========================================
// 1. DATA LOADING (GitHub JSON)
// ==========================================
async function loadDataFromGitHub() {
  try {
    const [resApproved, resPending, resRejected] = await Promise.all([
      fetch('data/approved-words.json?cache=' + Date.now()),
      fetch('data/pending-words.json?cache=' + Date.now()),
      fetch('data/rejected-words.json?cache=' + Date.now())
    ]);

    approvedWords = resApproved.ok ? await resApproved.json() : [];
    pendingWords = resPending.ok ? await resPending.json() : [];
    rejectedWords = resRejected.ok ? await resRejected.json() : [];

    renderViewerWords();
  } catch (err) {
    console.error('GitHub JSON ဖတ်ယူရာတွင် အမှားရှိသည်:', err);
  }
}

// ==========================================
// 2. RENDER FUNCTIONS
// ==========================================
window.renderViewerWords = function () {
  const display = document.getElementById('wordListDisplay');
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
  if (!display) return;
  display.innerHTML = '';

  const items = approvedWords.filter(d => 
    (d.pao && d.pao.toLowerCase().includes(query)) || 
    (d.meaning && d.meaning.toLowerCase().includes(query))
  );
  
  if (items.length === 0) {
    display.innerHTML = `<p style="color:var(--text-sub); text-align:center; padding: 2rem;">အတည်ပြုပြီး စကားလုံး မရှိသေးပါ။</p>`;
    return;
  }
  display.innerHTML = items.map(createApprovedCard).join('');
};

window.renderModQueue = function () {
  const display = document.getElementById('modPendingList');
  const query = (document.getElementById('modSearchInput')?.value || '').toLowerCase();
  if (!display) return;
  display.innerHTML = '';

  const items = pendingWords.filter(d => 
    (d.pao && d.pao.toLowerCase().includes(query)) || 
    (d.meaning && d.meaning.toLowerCase().includes(query))
  );

  if (items.length === 0) {
    display.innerHTML = `<p style="color:var(--text-sub); text-align:center; padding: 2rem;">စိစစ်ရန် စကားလုံး မရှိပါ။</p>`;
    return;
  }
  display.innerHTML = items.map(createPendingCard).join('');
};

window.renderRejectedQueue = function () {
  const display = document.getElementById('rejectedList');
  const query = (document.getElementById('rejectedSearchInput')?.value || '').toLowerCase();
  if (!display) return;
  display.innerHTML = '';

  const items = rejectedWords.filter(d => 
    (d.pao && d.pao.toLowerCase().includes(query)) || 
    (d.meaning && d.meaning.toLowerCase().includes(query))
  );

  if (items.length === 0) {
    display.innerHTML = `<p style="color:var(--text-sub); text-align:center; padding: 2rem;">ငြင်းပယ်ထားသော စကားလုံး မရှိပါ။</p>`;
    return;
  }
  display.innerHTML = items.map(createRejectedCard).join('');
};

// ==========================================
// 3. SUBMIT FORM HANDLER (Supabase Insert)
// ==========================================
window.handleContributorSubmit = async function (e) {
  e.preventDefault();
  const newEntry = {
    pao: document.getElementById('cPao').value.trim(),
    type: document.getElementById('cType').value,
    meaning: document.getElementById('cMeaning').value.trim(),
    example: document.getElementById('cExample').value.trim(),
    contributor: document.getElementById('cName').value.trim(),
    status: 'pending'
  };

  const { error } = await supabase.from('words').insert([newEntry]);

  if (error) {
    alert('အချက်အလက် ပေးပို့ရာတွင် အမှားအယွင်းရှိပါသည်: ' + error.message);
  } else {
    closeModal('addWordModal');
    showToast('စကားလုံးအသစ် တင်သွင်းပြီးပါပြီ။ Sync ဖြစ်ပြီးပါက GitHub တွင် ပေါ်လာပါလိမ့်မည်။');
    e.target.reset();
  }
};

// ==========================================
// 4. UI & NAVIGATION CONTROLS (မီးနူးနှင့် Modal)
// ==========================================

// Side Drawer မီးနူး ပွင့်/ပိတ် ပြုလုပ်ရန်
window.toggleDrawer = function () {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer && overlay) {
    drawer.classList.toggle('active');
    overlay.classList.toggle('active');
  }
};

// စာမျက်နှာ (View) များ ပြောင်းလဲရန်
window.switchView = function (viewName) {
  const home = document.getElementById('homeView');
  const mod = document.getElementById('modDashboardView');
  const rejected = document.getElementById('rejectedView');

  if (home && mod && rejected) {
    home.style.display = viewName === 'home' ? 'block' : 'none';
    mod.style.display = viewName === 'dashboard' ? 'block' : 'none';
    rejected.style.display = viewName === 'rejected' ? 'block' : 'none';

    if (viewName === 'dashboard') renderModQueue();
    if (viewName === 'rejected') renderRejectedQueue();
  }
};

// စကားလုံးအသစ်ထည့် Modal ဖွင့်ရန်
window.openAddModal = function () {
  document.getElementById('addWordModal')?.classList.add('active');
};

// စိစစ်သူ Auth Modal ဖွင့်ရန်
window.openModAuth = function (targetView) {
  document.getElementById('modAuthModal')?.classList.add('active');
};

// Modal များ ပိတ်ရန်
window.closeModal = function (modalId) {
  document.getElementById(modalId)?.classList.remove('active');
};

// Toast အသိပေးချက် ပြသရန်
window.showToast = function (msg) {
  const toast = document.getElementById('toastMsg');
  if (toast) {
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }
};

// အပေါ်သို့ ပြန်တက်သည့် ခလုတ်
window.scrollToTop = function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.addEventListener('scroll', () => {
  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    scrollBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
  }
});

// Initial Load
loadDataFromGitHub();
