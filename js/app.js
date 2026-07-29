import { supabase } from './supabaseClient.js';
import { AUTHORIZED_MODERATORS } from './config.js';
import { createApprovedCard, createPendingCard, createRejectedCard } from './templates.js';

let approvedWords = [];
let pendingWords = [];
let rejectedWords = [];

// 1. GitHub Repository ရဲ့ data/ ဖိုဒါထဲမှ JSON ဖိုင်များကို ဖတ်ယူခြင်း
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

// Render Functions (GitHub မှရသော Data များကို ပြသပေးမည်)
window.renderViewerWords = function () {
  const display = document.getElementById('wordListDisplay');
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
  display.innerHTML = '';

  const items = approvedWords.filter(d => d.pao.toLowerCase().includes(query) || d.meaning.toLowerCase().includes(query));
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

  const items = pendingWords.filter(d => d.pao.toLowerCase().includes(query) || d.meaning.toLowerCase().includes(query));
  if (items.length === 0) {
    display.innerHTML = `<p style="color:var(--text-sub); text-align:center; padding: 2rem;">စိစစ်ရန် စကားလုံး မရှိပါ။</p>`;
    return;
  }
  display.innerHTML = items.map(createPendingCard).join('');
};

// 2. စကားလုံးအသစ် ပို့ပါက Supabase ထဲသို့ ရေးမည်
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

// Initial Load
loadDataFromGitHub();
