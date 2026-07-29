// ==========================================
// 1. အတည်ပြုပြီး စကားလုံးများအတွက် Card (Main Dictionary View)
// ==========================================
export function createApprovedCard(item) {
  return `
    <div class="word-card">
      <h3 class="word-pao">${escapeHtml(item.pao)}</h3>
      <span class="badge">${escapeHtml(item.type)}</span>
      <p class="word-meaning"><strong>မြန်မာ:</strong> ${escapeHtml(item.meaning)}</p>
      ${item.example ? `<p class="word-example">"${escapeHtml(item.example)}"</p>` : ''}
      <p class="word-contributor" style="font-size: 0.85rem; color: var(--text-sub); margin-top: 8px;">
        တင်သွင်းသူ: ${escapeHtml(item.contributor || 'အမည်မသိ')}
      </p>
    </div>
  `;
}

// ==========================================
// 2. စိစစ်ရန် စောင့်ဆိုင်းနေသော စကားလုံးများအတွက် Card (Dashboard View)
// ==========================================
export function createPendingCard(item) {
  return `
    <div class="word-card" style="border-left: 4px solid var(--warning);">
      <h3 class="word-pao">${escapeHtml(item.pao)}</h3>
      <span class="badge">${escapeHtml(item.type)}</span>
      <p class="word-meaning"><strong>မြန်မာ:</strong> ${escapeHtml(item.meaning)}</p>
      ${item.example ? `<p class="word-example">"${escapeHtml(item.example)}"</p>` : ''}
      <p class="word-contributor" style="font-size: 0.85rem; color: var(--text-sub); margin-top: 8px;">
        ပေးပို့သူ: ${escapeHtml(item.contributor || 'အမည်မသိ')}
      </p>
      
      <div style="display:flex; gap:10px; margin-top: 12px;">
        <button class="btn btn-success" style="flex:1;" onclick="approveWord(${item.id})">
          <i class="fa-solid fa-check"></i> အတည်ပြုမည်
        </button>
        <button class="btn btn-danger" style="flex:1;" onclick="rejectWord(${item.id})">
          <i class="fa-solid fa-xmark"></i> ငြင်းပယ်မည်
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 3. ငြင်းပယ်ထားသော စကားလုံးများအတွက် Card (Rejected View)
// ==========================================
export function createRejectedCard(item) {
  return `
    <div class="word-card" style="border-left: 4px solid var(--danger); opacity: 0.85;">
      <h3 class="word-pao">${escapeHtml(item.pao)}</h3>
      <span class="badge" style="background: rgba(239, 68, 68, 0.15); color: var(--danger);">${escapeHtml(item.type)}</span>
      <p class="word-meaning"><strong>မြန်မာ:</strong> ${escapeHtml(item.meaning)}</p>
      ${item.example ? `<p class="word-example">"${escapeHtml(item.example)}"</p>` : ''}
      <p class="word-contributor" style="font-size: 0.85rem; color: var(--text-sub); margin-top: 8px;">
        တင်သွင်းသူ: ${escapeHtml(item.contributor || 'အမည်မသိ')}
      </p>
    </div>
  `;
}

// ==========================================
// Security Helper (XSS ကာကွယ်ရန်)
// ==========================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
