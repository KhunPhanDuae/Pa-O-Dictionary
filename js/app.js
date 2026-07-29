import { supabase } from './supabaseClient.js';
import { AUTHORIZED_MODERATORS } from './config.js';
import { createApprovedCard, createPendingCard, createRejectedCard } from './templates.js';

// Global Data Arrays
let approvedWords = [];
let pendingWords = [];
let rejectedWords = [];
let currentTargetView = 'dashboard'; // Moderation View Target Tracking

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
    (d.pao && String(d.pao).toLowerCase().includes(query)) || 
    (d.meaning && String(d.meaning).toLowerCase().includes(query))
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
    (d.pao && String(d.pao).toLowerCase().includes(query)) || 
    (d.meaning && String(d.meaning).toLowerCase().includes(query))
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
    (d.pao && String(d.pao).toLowerCase().includes(query)) || 
    (d.meaning && String(d.meaning).toLowerCase().includes(query))
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
  if (e) e.preventDefault();

  const nameVal = document.getElementById('cName')?.value || '';
  const paoVal = document.getElementById('cPao')?.value || '';
  const typeVal = document.getElementById('cType')?.value || '';
  const meaningVal = document.getElementById('cMeaning')?.value || '';
  const exampleVal = document.getElementById('cExample')?.value || '';

  // Safe Standard Object Insertion
  const newEntry = {
    pao: String(paoVal).trim(),
    type: String(typeVal).trim(),
    meaning: String(meaningVal).trim(),
    example: String(exampleVal).trim(),
    contributor: String(nameVal).trim(),
    status: 'pending'
  };

  try {
    const { data, error } = await supabase
      .from('words')
      .insert([newEntry]);

    if (error) {
      console.error('Supabase Error:', error);
      alert('အချက်အလက် ပေးပို့ရာတွင် အမှားအယွင်းရှိပါသည်: ' + error.message);
    } else {
      closeModal('addWordModal');
      showToast('စကားလုံးအသစ် တင်သွင်းပြီးပါပြီ။');
      
      // Form ကို Reset ပြန်လုပ်မည်
      const form = e.target;
      if (form && form.reset) form.reset();
    }
  } catch (err) {
    console.error('Network/Submit Error:', err);
    alert('အချက်အလက် ပေးပို့မှု အဆင်မပြေပါ');
  }
};

// ==========================================
// 4. MODERATOR AUTHENTICATION HANDLER
// ==========================================
window.handleModLogin = function (e) {
  if (e) e.preventDefault();
  
  const name = document.getElementById('modName')?.value.trim() || '';
  const id = document.getElementById('modId')?.value.trim() || '';

  // Config မှ Moderator ဟုတ်မဟုတ် စစ်ဆေးခြင်း
  const isAuthorized = AUTHORIZED_MODERATORS && AUTHORIZED_MODERATORS.some(
    mod => mod.name === name && String(mod.id) === String(id)
  );

  // စိစစ်သူ မှန်ကန်ပါက သို့မဟုတ် ခွန်ဖန်ဒွဲ့ ဖြစ်ပါက ဝင်ရောက်ခွင့်ပေးမည်
  if (isAuthorized || name === 'ခွန်ဖန်ဒွဲ့') {
    closeModal('modAuthModal');
    switchView(currentTargetView); // Dashboard သို့မဟုတ် Rejected View သို့ ရောက်သွားမည်
    showToast('စိစစ်သူအဖြစ် အောင်မြင်စွာ ဝင်ရောက်ပြီးပါပြီ။');
    
    if (e.target && e.target.reset) e.target.reset();
  } else {
    alert('စိစစ်သူ အမည် သို့မဟုတ် ID မှားယွင်းနေပါသည်။');
  }
};

// ==========================================
// 5. UI & NAVIGATION CONTROLS
// ==========================================

// Side Drawer မီးနူး ပွင့်/ပိတ်
window.toggleDrawer = function () {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer && overlay) {
    drawer.classList.toggle('active');
    overlay.classList.toggle('active');
  }
};

// စာမျက်နှာ (View) ပြောင်းလဲရန်
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

// စိစစ်သူ Auth Modal ဖွင့်ရန် (Target View မှတ်ထားမည်)
window.openModAuth = function (targetView) {
  currentTargetView = targetView || 'dashboard';
  document.getElementById('modAuthModal')?.classList.add('active');
};

// Modal ပိတ်ရန်
window.closeModal = function (modalId) {
  document.getElementById(modalId)?.classList.remove('active');
};

// Toast အသိပေးချက်
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

// Scroll to Top ခလုတ်
window.scrollToTop = function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.addEventListener('scroll', () => {
  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    scrollBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
  }
});

// App စတင်ပွင့်ချိန်တွင် အချက်အလက်များ လှမ်းဖတ်မည်
loadDataFromGitHub();
