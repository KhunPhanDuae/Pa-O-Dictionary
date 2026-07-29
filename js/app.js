// --- GitHub Config ---
const GITHUB_OWNER = 'khunphanduae'; // ခွန်ဖန်ဒွဲ့ရဲ့ GitHub Username
const GITHUB_REPO = 'Pa-O-Dictionary'; // Repository နာမည် (ကိုယ့်အမှန်အတိုင်း ပြင်ပါ)
const FILE_PATH = 'data/words.json'; // JSON ဖိုင်ရှိမည့် လမ်းကြောင်း
const GITHUB_TOKEN = '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'; // အပေါ်မှာ ထုတ်ထားတဲ့ Token ထည့်ရန်

// 1. ဝက်ဆိုက် စဖွင့်တာနဲ့ စကားလုံးများကို JSON ကနေ လှမ်းဆွဲပြီး ပြသရန်
document.addEventListener('DOMContentLoaded', () => {
    loadWords();
});

async function loadWords() {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${FILE_PATH}`);
        if (!response.ok) throw new Error('Data ယူ၍မရပါ');
        
        const words = await response.json();
        displayWordsTable(words);
    } catch (error) {
        console.error('Error:', error);
    }
}

// 2. စကားလုံးအသစ် တင်သွင်းသည့် Form Submit လုပ်သည့်အခါ
const wordForm = document.getElementById('wordForm');
if (wordForm) {
    wordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newWord = {
            id: Date.now(), // Unique ID နံပါတ်
            pao: document.getElementById('paoWord').value,
            type: document.getElementById('wordType').value,
            meaning: document.getElementById('wordMeaning').value,
            example: document.getElementById('wordExample').value || '',
            contributor: document.getElementById('contributor').value || 'Anonymous',
            status: 'approved' // လိုအပ်ပါက pending သို့ approved ထားနိုင်သည်
        };

        await saveWordToGitHub(newWord);
    });
}

// 3. GitHub Repository ထဲသို့ JSON ဖိုင်အသစ် Commit ဝင်ရန်
async function saveWordToGitHub(newWord) {
    alert('GitHub သို့ တင်နေပါပြီ၊ ခဏစောင့်ပါ...');
    
    try {
        // (က) လက်ရှိဖိုင်နဲ့ SHA ကို အရင်တောင်းမည်
        const getRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });
        
        let currentWords = [];
        let sha = '';
        
        if (getRes.ok) {
            const fileData = await getRes.json();
            sha = fileData.sha;
            // Base64 မှ JSON သို့ ပြောင်းမည်
            const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
            currentWords = JSON.parse(decodedContent);
        }

        // (ခ) စကားလုံးအသစ် ထည့်မည်
        currentWords.push(newWord);

        // (ဂ) GitHub ထဲသို့ PUT ဖြင့် ပြန်တင်မည်
        const putRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Add new word: ${newWord.pao}`,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(currentWords, null, 2)))),
                sha: sha
            })
        });

        if (putRes.ok) {
            alert('စကားလုံး GitHub သို့ အောင်မြင်စွာ ရောက်ရှိသွားပါပြီ!');
            location.reload(); // စာမျက်နှာကို Refresh လုပ်မည်
        } else {
            const errData = await putRes.json();
            alert('အမှားအယွင်းရှိ습니다: ' + errData.message);
        }
    } catch (error) {
        console.error('Error saving to GitHub:', error);
        alert('ချိတ်ဆက်မှု အမှားအယွင်း ရှိနေပါသည်');
    }
}

// 4. ဇယားထဲတွင် စကားလုံးများ ထည့်သွင်းပြသရန် Function
function displayWordsTable(words) {
    const tableBody = document.getElementById('wordTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    words.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.pao}</td>
            <td>${item.type}</td>
            <td>${item.meaning}</td>
            <td>${item.example}</td>
            <td>${item.contributor}</td>
        `;
        tableBody.appendChild(row);
    });
}
