import { supabase } from './supabaseClient.js';
import { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH } from './config.js';

// Supabase မှ ဒေတာအပြည့်အစုံကို ယူ၍ GitHub data/ ဖိုဒါထဲသို့ Sync မည်
async function syncSupabaseToGitHub() {
  // 1. Supabase မှ Approved စကားလုံးများ ဆွဲယူခြင်း
  const { data: approvedWords } = await supabase
    .from('words')
    .select('*')
    .eq('status', 'approved');

  // 2. GitHub REST API ဖြင့် data/approved-words.json သို့ Commit ပြုလုပ်ခြင်း
  const filePath = 'data/approved-words.json';
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

  // GitHub ရှိ ဖိုင်အဟောင်း၏ SHA ယူခြင်း
  const fileRes = await fetch(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  const fileData = await fileRes.json();
  const sha = fileData.sha;

  // JSON ဒေတာ ပြင်ဆင်ခြင်း
  const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(approvedWords, null, 2))));

  // GitHub သို့ Auto Commit မည်
  await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Auto Sync: Update dictionary JSON from Supabase',
      content: updatedContent,
      sha: sha,
      branch: GITHUB_BRANCH
    })
  });
  
  console.log('GitHub data/ Folder သို့ ဒေတာများ Auto Sync ဖြစ်သွားပါပြီ။');
}
