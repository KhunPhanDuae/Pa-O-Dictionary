export function createApprovedCard(item) {
  return `
    <div class="word-card">
      <div class="word-title">${item.pao}</div>
      <span class="word-type">${item.type}</span>
      <div class="word-meaning">${item.meaning}</div>
      ${item.example ? `<div class="word-example">"${item.example}"</div>` : ''}
    </div>
  `;
}

export function createPendingCard(item) {
  return `
    <div class="word-card" style="border-color: var(--warning);">
      <div class="word-title" style="color:var(--warning);">${item.pao}</div>
      <span class="word-type">${item.type}</span>
      <div class="word-meaning"><strong>မြန်မာ:</strong> ${item.meaning}</div>
      ${item.example ? `<div class="word-example">"${item.example}"</div>` : ''}
      <p style="font-size:0.8rem; color:var(--primary); margin:0.5rem 0;">ပေးပို့သူ: ${item.contributor || 'မသိရပါ'}</p>
      <div style="display:flex; gap:10px; margin-top:0.8rem;">
        <button class="btn btn-success" data-action="approve" data-id="${item.id}"><i class="fa-solid fa-check"></i> အတည်ပြုမည်</button>
        <button class="btn btn-danger" data-action="reject" data-id="${item.id}"><i class="fa-solid fa-xmark"></i> ငြင်းပယ်မည်</button>
      </div>
    </div>
  `;
}

export function createRejectedCard(item) {
  return `
    <div class="word-card" style="border-color: var(--danger);">
      <div class="word-title" style="color:var(--danger);">${item.pao}</div>
      <span class="word-type">${item.type}</span>
      <div class="word-meaning"><strong>မြန်မာ:</strong> ${item.meaning}</div>
      ${item.example ? `<div class="word-example">"${item.example}"</div>` : ''}
      <p style="font-size:0.8rem; color:var(--text-sub); margin:0.5rem 0;">ပေးပို့သူ: ${item.contributor || 'မသိရပါ'}</p>
      <div style="display:flex; gap:10px; margin-top:0.8rem;">
        <button class="btn btn-warning" data-action="restore" data-id="${item.id}"><i class="fa-solid fa-rotate-left"></i> စိစစ်သူဌာနသို့ ပြန်သွင်းမည်</button>
        <button class="btn btn-danger" data-action="delete" data-id="${item.id}"><i class="fa-solid fa-trash"></i> အပြီးပိုင်ဖျက်မည်</button>
      </div>
    </div>
  `;
}
