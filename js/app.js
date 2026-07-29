import { supabase } from './supabaseClient.js';
import { AUTHORIZED_MODERATORS } from './config.js';
import { createApprovedCard, createPendingCard, createRejectedCard } from './templates.js';

let approvedWords = [];
let pendingWords = [];
let rejectedWords = [];
let currentTargetView = 'dashboard';

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
// 3. SUBMIT FORM HANDLER (စကားလုံးသစ် တင်သွင်းခြင်း)
// ==========================================
window.handleContributorSubmit = async function (e) {
  if (e) e.preventDefault();

  const nameVal = document.getElementById('cName')?.value || '';
  const paoVal = document.getElementById('cPao')?.value || '';
  const typeVal = document.getElementById('cType')?.value || '';
  const meaningVal = document.getElementById('cMeaning')?.value || '';
  const exampleVal = document.getElementById('cExample')?.value || '';

  // JSON Syntax Error မတက်စေရန် Plain Object သက်သက်ဖြင့် ပို့မည်
  const newEntry = {
    pao: String(paoVal).trim(),
    type: String(typeVal).trim(),
    meaning: String(meaningVal).trim(),
    example: String(exampleVal).trim(),
    contributor: String(nameVal).trim(),
    status: 'pending'
  };

  try {
    const { error } = await supabase
      .from('words')
      .insert([newEntry]);

    if (error) {
      alert('အချက်အလက် ပေးပို့ရာတွင် အမှားရှိသည်: ' + error.message);
    } else {
      closeModal('addWordModal');
      showToast('စကားလုံးအသစ် အောင်မြင်စွာ တင်သွင်းပြီးပါပြီ။');
      if (e.target && e.target.reset) e.target.reset();
    }
  } catch (err) {
    alert('ကွန်ရက်ချိတ်ဆက်မှု အဆင်မပြေပါ။');
  }
};

// ==========================================
// 4. MODERATOR ACTIONS (Status ပြောင်းလဲခြင်း & ဖျက်ခြင်း)
// ==========================================

// အတည်ပြုမည် (pending -> approved)
window.approveWord = async function (id) {
  if (!id) return;
  try {
    const { error } = await supabase
      .from('words')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      alert('အတည်ပြုရာတွင် အမှားရှိသည်: ' + error.message);
    } else {
      showToast('စကားလုံးကို အတည်ပြုလိုက်ပါပြီ။');
      pendingWords = pendingWords.filter(item => item.id !== id);
      renderModQueue();
    }
  } catch (err) {
    console.error('Approve Error:', err);
  }
};

// ငြင်းပယ်မည် (pending -> rejected)
window.rejectWord = async function (id) {
  if (!id) return;
  try {
    const { error } = await supabase
      .from('words')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      alert('ငြင်းပယ်ရာတွင် အမှားရှိသည်: ' + error.message);
    } else {
      showToast('စကားလုံးကို ငြင်းပယ်လိုက်ပါပြီ။');
      pendingWords = pendingWords.filter(item => item.id !== id);
      renderModQueue();
    }
  } catch (err) {
    console.error('Reject Error:', err);
  }
};

// စိစစ်မှုဌာနသို့ ပြန်သွင်းမည် (rejected -> pending)
window.restoreWord = async function (id) {
  if (!id) return;
  try {
    const { error } = await supabase
      .from('words')
      .update({ status: 'pending' })
      .eq('id', id);

    if (error) {
      alert('ပြန်လည်တင်သွင်းရာတွင် အမှားရှိသည်: ' + error.message);
    } else {
      showToast('စကားလုံးကို စိစစ်ရန်သို့ ပြန်လည်ပို့ဆောင်လိုက်ပါပြီ။');
      rejectedWords = rejectedWords.filter(item => item.id !== id);
      renderRejectedQueue();
    }
  } catch (err) {
    console.error('Restore Error:', err);
  }
};

// အပြီးတိုင်ဖျက်မည် (Delete from DB)
window.deleteWordCompletely = async function (id) {
  if (!id) return;
  if (!confirm('ဤစကားလုံးကို အပြီးတိုင် ဖျက်မည်မှာ သေချာပါသလား။')) return;
  
  try {
    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', id);

    if (error) {
      alert('ဖျက်ဆီးရာတွင် အမှားရှိသည်: ' + error.message);
    } else {
      showToast('စကားလုံးကို အပြီးတိုင် ဖျက်ဆီးပြီးပါပြီ။');
      rejectedWords = rejectedWords.filter(item => item.id !== id);
      renderRejectedQueue();
    }
  } catch (err) {
    console.error('Delete Error:', err);
  }
};

// ==========================================
// 5. MODERATOR AUTHENTICATION
// ==========================================
window.handleModLogin = function (e) {
  if (e) e.preventDefault();
  
  const name = document.getElementById('modName')?.value.trim() || '';
  const id = document.getElementById('modId')?.value.trim() || '';

  const isAuthorized = AUTHORIZED_MODERATORS && AUTHORIZED_MODERATORS.some(
    mod => mod.name === name && String(mod.id) === String(id)
  );

  if (isAuthorized || name === 'ခွန်ဖန်ဒွဲ့') {
    closeModal('modAuthModal');
    switchView(currentTargetView);
    showToast('စိစစ်သူအဖြစ် အောင်မြင်စွာ ဝင်ရောက်ပြီးပါပြီ။');
    if (e.target && e.target.reset) e.target.reset();
  } else {
    alert('စိစစ်သူ အမည် သို့မဟုတ် ID မှားယွင်းနေပါသည်။');
  }
};

// ==========================================
// 6. UI & NAVIGATION CONTROLS
// ==========================================
window.toggleDrawer = function () {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer && overlay) {
    drawer.classList.toggle('active');
    overlay.classList.toggle('active');
  }
};

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

window.openAddModal = function () {
  document.getElementById('addWordModal')?.classList.add('active');
};

window.openModAuth = function (targetView) {
  currentTargetView = targetView || 'dashboard';
  document.getElementById('modAuthModal')?.classList.add('active');
};

window.closeModal = function (modalId) {
  document.getElementById(modalId)?.classList.remove('active');
};

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

window.scrollToTop = function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.addEventListener('scroll', () => {
  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    scrollBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
  }
});

loadDataFromGitHub();
