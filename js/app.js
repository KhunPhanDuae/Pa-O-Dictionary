import { supabase } from './supabaseClient.js';
import { AUTHORIZED_MODERATORS } from './config.js';
import { createApprovedCard, createPendingCard, createRejectedCard } from './templates.js';

let dictionaryData = [];
let currentActiveMod = null;
let targetViewAfterAuth = 'dashboard';

// Fetch Data from Supabase
async function fetchWordsFromSupabase() {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Data Fetch Error:', error.message);
    return;
  }

  dictionaryData = data || [];
  renderCurrentView();
}

// Real-time Listener (Auto Sync across phones)
function subscribeToRealtimeChanges() {
  supabase
    .channel('public:words')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'words' }, () => {
      fetchWordsFromSupabase();
    })
    .subscribe();
}

// Render Handlers
function renderCurrentView() {
  renderViewerWords();
  if (document.getElementById('modDashboardView').style.display !== 'none') renderModQueue();
  if (document.getElementById('rejectedView').style.display !== 'none') renderRejectedQueue();
}

window.renderViewerWords = function () {
  const display = document.getElementById('wordListDisplay');
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
  display.innerHTML = '';

  const items = dictionaryData.filter(d => d.status === 'approved' && (d.pao.toLowerCase().includes(query) || d.meaning.toLowerCase().includes(query)));
  if (items.length === 0) {
    display.innerHTML = `<p style="color:var(--text-sub); text-align:center; padding: 2rem;">အတည်ပြုပြီး စကားလုံး မရှိသေးပါ။</p>`;
    return;
  }
  display.innerHTML = items.map(createApprovedCard).join('');
};

window.renderModQueue = function () {
  const display = document.getElementById('modPendingList');
  const query = (document.getElementById('modSearchInput')?.value || '').toLowerCase();
  display.innerHTML = '';

  const items = dictionaryData.filter(d => d.status === 'pending' && (d.pao.toLowerCase().includes(query) || d.meaning.toLowerCase().includes(query) || (d.contributor && d.contributor.toLowerCase().includes(query))));
  if (items.length === 0) {
    display.innerHTML = `<p style="color:var(--text-sub); text-align:center; padding: 2rem;">စိစစ်ရန် စကားလုံး မရှိပါ။</p>`;
    return;
  }
  display.innerHTML = items.map(createPendingCard).join('');
};

window.renderRejectedQueue = function () {
  const display = document.getElementById('rejectedList');
  const query = (document.getElementById('rejectedSearchInput')?.value || '').toLowerCase();
  display.innerHTML = '';

  const items = dictionaryData.filter(d => d.status === 'rejected' && (d.pao.toLowerCase().includes(query) || d.meaning.toLowerCase().includes(query) || (d.contributor && d.contributor.toLowerCase().includes(query))));
  if (items.length === 0) {
    display.innerHTML = `<p style="color:var(--text-sub); text-align:center; padding: 2rem;">ငြင်းပယ်ထားသော စကားလုံး မရှိပါ။</p>`;
    return;
  }
  display.innerHTML = items.map(createRejectedCard).join('');
};

// Form Handlers
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
    showToast('စကားလုံးအသစ် တင်သွင်းပြီးပါပြီ။ စိစစ်သူဌာနသို့ ရောက်ရှိသွားပါပြီ။');
    e.target.reset();
  }
};

// Global Button Delegation
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);

  if (action === 'approve') {
    await supabase.from('words').update({ status: 'approved' }).eq('id', id);
    showToast('စကားလုံးကို အတည်ပြုလိုက်ပါပြီ။');
  } else if (action === 'reject') {
    await supabase.from('words').update({ status: 'rejected' }).eq('id', id);
    showToast('စကားလုံးကို ငြင်းပယ်လိုက်ပါပြီ။');
  } else if (action === 'restore') {
    await supabase.from('words').update({ status: 'pending' }).eq('id', id);
    showToast('စိစစ်သူဌာနသို့ ပြန်လည် ပေးပို့လိုက်ပါပြီ။');
  } else if (action === 'delete') {
    if (confirm('အပြီးပိုင် ဖျက်ထုတ်ရန် သေချာပါသလား။')) {
      await supabase.from('words').delete().eq('id', id);
      showToast('အပြီးပိုင် ဖျက်ထုတ်ပြီးပါပြီ။');
    }
  }
});

// UI Navigation Controllers
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

window.scrollToTop = function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.onscroll = function () {
  const btn = document.getElementById('scrollTopBtn');
  if (btn) {
    btn.style.display = (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) ? 'flex' : 'none';
  }
};

function showToast(msg) {
  const toast = document.getElementById('toastMsg');
  toast.innerText = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// App Initialization
fetchWordsFromSupabase();
subscribeToRealtimeChanges();
