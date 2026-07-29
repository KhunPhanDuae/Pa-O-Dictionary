import { createApprovedCard, createPendingCard, createRejectedCard } from './templates.js';

// --- GitHub Config ---
const GITHUB_OWNER = 'KhunPhanDuae'; // ကိုယ့်ရဲ့ GitHub Username အမှန်
const GITHUB_REPO = 'Pa-O-Dictionary'; // ကိုယ့်ရဲ့ Repo နာမည်အမှန်
const GITHUB_TOKEN = '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'; // GitHub Token ထည့်ရန်

let approvedWords = [];
let pendingWords = [];
let rejectedWords = [];

// 1. DATA LOADING (GitHub JSON မှ ဖတ်ယူခြင်း)
async function loadDataFromGitHub() {
  try {
    const [resApproved, resPending, resRejected] = await Promise.all([
      fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/data/approved-words.json?cache=` + Date.now()),
      fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/data/pending-words.json?cache=` + Date.now()),
      fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/data/rejected-words.json?cache=` + Date.now())
    ]);

    approvedWords = resApproved.ok ? await resApproved.json() : [];
    pendingWords = resPending.ok ? await resPending.json() : [];
    rejectedWords = resRejected.ok ? await resRejected.json() : [];

    renderViewerWords();
    renderModQueue();
    renderRejectedQueue();
  } catch (err) {
    console.error('GitHub မှ ဒေတာဖတ်ယူရာတွင် အမှားရှိသည်:', err);
  }
}

// 2. RENDER FUNCTIONS
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

// 3. GITHUB HELPER (Update JSON File)
async function updateGitHubJSONFile(filePath, updatedDataArray, commitMessage) {
  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
    
    const getRes = await fetch(url, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    if (!getRes.ok) throw new Error('GitHub ဖိုင်ကို ရှာမတွေ့ပါ။');
    const fileData = await getRes.json();
    const sha = fileData.sha;

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(updatedDataArray, null, 2)))),
        sha: sha
      })
    });

    return putRes.ok;
  } catch (err) {
    console.error('GitHub Update Error:', err);
    return false;
  }
}

// 4. SUBMIT FORM
window.handleContributorSubmit = async function (e) {
  if (e) e.preventDefault();

  const nameVal = document.getElementById('cName')?.value || '';
  const paoVal = document.getElementById('cPao')?.value || '';
  const typeVal = document.getElementById('cType')?.value || '';
  const meaningVal = document.getElementById('cMeaning')?.value || '';
  const exampleVal = document.getElementById('cExample')?.value || '';

  const newEntry = {
    id: Date.now(),
    pao: String(paoVal).trim(),
    type: String(typeVal).trim(),
    meaning: String(meaningVal).trim(),
    example: String(exampleVal).trim(),
    contributor: String(nameVal).trim(),
    status: 'pending'
  };

  pendingWords.push(newEntry);
  const success = await updateGitHubJSONFile('data/pending-words.json', pendingWords, `Add pending word: ${newEntry.pao}`);

  if (success) {
    closeModal('addWordModal');
    showToast('စကားလုံးအသစ် အောင်မြင်စွာ တင်သွင်းပြီးပါပြီ။');
    if (e.target && e.target.reset) e.target.reset();
    loadDataFromGitHub();
  } else {
    alert('တင်သွင်းရာတွင် အမှားအယွင်း ရှိပါသည်။ Token သို့မဟုတ် Internet ကို စစ်ဆေးပါ။');
  }
};

// 5. MODERATOR ACTIONS
window.approveWord = async function (id) {
  const itemIndex = pendingWords.findIndex(i => i.id === id);
  if (itemIndex === -1) return;

  const item = pendingWords.splice(itemIndex, 1)[0];
  item.status = 'approved';
  approvedWords.push(item);

  const success1 = await updateGitHubJSONFile('data/pending-words.json', pendingWords, `Approve word: ${item.pao}`);
  const success2 = await updateGitHubJSONFile('data/approved-words.json', approvedWords, `Move to approved: ${item.pao}`);

  if (success1 && success2) {
    showToast('စကားလုံးကို အတည်ပြုပြီးပါပြီ။');
    loadDataFromGitHub();
  } else {
    alert('ဆောင်ရွက်ချက် မအောင်မြင်ပါ။');
  }
};

window.rejectWord = async function (id) {
  const itemIndex = pendingWords.findIndex(i => i.id === id);
  if (itemIndex === -1) return;

  const item = pendingWords.splice(itemIndex, 1)[0];
  item.status = 'rejected';
  rejectedWords.push(item);

  const success1 = await updateGitHubJSONFile('data/pending-words.json', pendingWords, `Reject word: ${item.pao}`);
  const success2 = await updateGitHubJSONFile('data/rejected-words.json', rejectedWords, `Move to rejected: ${item.pao}`);

  if (success1 && success2) {
    showToast('စကားလုံးကို ငြင်းပယ်လိုက်ပါပြီ။');
    loadDataFromGitHub();
  } else {
    alert('ဆောင်ရွက်ချက် မအောင်မြင်ပါ။');
  }
};

window.restoreWord = async function (id) {
  const itemIndex = rejectedWords.findIndex(i => i.id === id);
  if (itemIndex === -1) return;

  const item = rejectedWords.splice(itemIndex, 1)[0];
  item.status = 'pending';
  pendingWords.push(item);

  const success1 = await updateGitHubJSONFile('data/rejected-words.json', rejectedWords, `Remove from rejected: ${item.pao}`);
  const success2 = await updateGitHubJSONFile('data/pending-words.json', pendingWords, `Restore to pending: ${item.pao}`);

  if (success1 && success2) {
    showToast('စိစစ်ရန်သို့ ပြန်လည်ပို့ဆောင်လိုက်ပါပြီ။');
    loadDataFromGitHub();
  } else {
    alert('ဆောင်ရွက်ချက် မအောင်မြင်ပါ။');
  }
};

window.deleteWordCompletely = async function (id) {
  if (!confirm('ဤစကားလုံးကို အပြီးတိုင် ဖျက်မည်မှာ သေချာပါသလား။')) return;
  
  const itemIndex = rejectedWords.findIndex(i => i.id === id);
  if (itemIndex === -1) return;

  const item = rejectedWords.splice(itemIndex, 1)[0];
  const success = await updateGitHubJSONFile('data/rejected-words.json', rejectedWords, `Delete permanently: ${item.pao}`);

  if (success) {
    showToast('အပြီးတိုင် ဖျက်ဆီးပြီးပါပြီ။');
    loadDataFromGitHub();
  } else {
    alert('ဖျက်ဆီးရာတွင် အမှားရှိသည်။');
  }
};

window.showToast = function (msg) {
  const toast = document.getElementById('toastMsg');
  if (toast) {
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
  }
};

loadDataFromGitHub();
