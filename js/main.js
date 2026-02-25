// Clark Signage - V3.4 SMASH VIBE (Responsive Cards & Clock)

const targetSlugs = [
    'tokyo-tokyo', 'tokyo-ikebukuro', 'tokyo-next_akihabara', 'tokyo-next_tokyo', 'tokyo-smart_tokyo',
    'kanagawa-yokohama', 'kanagawa-yokohamaaoba', 'kanagawa-atsugi', 'kanagawa-smart_yokohama',
    'saitama-saitama', 'saitama-tokorozawa', 'saitama-smart_saitama',
    'chiba-chiba', 'chiba-kashiwa', 'chiba-smart_chiba'
];

const campusNames = {
    'tokyo-tokyo': '東京', 'tokyo-ikebukuro': '池袋', 'tokyo-next_akihabara': 'NEXT Akihabara',
    'tokyo-next_tokyo': 'NEXT Tokyo', 'tokyo-smart_tokyo': 'SMART東京',
    'kanagawa-yokohama': '横浜', 'kanagawa-yokohamaaoba': '横浜青葉',
    'kanagawa-atsugi': '厚木', 'kanagawa-smart_yokohama': 'SMART横浜',
    'saitama-saitama': 'さいたま', 'saitama-tokorozawa': '所沢', 'saitama-smart_saitama': 'SMARTさいたま',
    'chiba-chiba': '千葉', 'chiba-kashiwa': '柏', 'chiba-smart_chiba': 'SMART千葉'
};

let postQueue = [];
let currentPostIndex = 0;
let lastShownCampusSlug = "";

const arena = document.getElementById('card-arena');
let MAX_CARDS = 4; // 動的に変更するためletに変更

// 画面幅に応じて表示するカードの最大数を計算
function calculateMaxCards() {
    const width = window.innerWidth;
    if (width > 1600) return 5;
    if (width > 1200) return 4;
    if (width > 800) return 3;
    if (width > 500) return 2;
    return 1;
}

// リサイズ時にMAX_CARDSを更新し、多すぎるカードがあれば即座に削除する
window.addEventListener('resize', () => {
    MAX_CARDS = calculateMaxCards();

    // 画面が狭くなり、現在の表示枚数がMAXを上回った場合は古いものをサクッと消す
    while (arena.children.length > MAX_CARDS) {
        arena.removeChild(arena.firstElementChild);
    }
});

// 初期計算
MAX_CARDS = calculateMaxCards();

async function fetchClarkData() {
    try {
        const response = await fetch('https://www.clark.ed.jp/wp-json/wp/v2/posts?per_page=100&_embed=1');
        const data = await response.json();

        postQueue = [];
        data.forEach(post => {
            const link = post.link;
            let slug = "unknown";
            const match = link.match(/\/campus\/([^\/]+)\//);
            if (match) slug = match[1];

            if (targetSlugs.includes(slug)) {
                const title = typeof post.title === 'string' ? post.title : post.title.rendered;
                let thumbUrl = 'https://placehold.co/600x400/0f2743/e6f2ff?text=NO+IMAGE';
                if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0].source_url) {
                    thumbUrl = post._embedded['wp:featuredmedia'][0].source_url;
                }

                postQueue.push({
                    title: title.replace(/<[^>]*>?/gm, ''),
                    link: link,
                    date: post.date,
                    slug: slug,
                    campusName: campusNames[slug] || slug.toUpperCase(),
                    thumb: thumbUrl
                });
            }
        });

        postQueue.sort(() => Math.random() - 0.5);
    } catch (err) {
        console.error("API Fetch Error:", err);
    }
}

function createCardDOM(post) {
    const card = document.createElement('div');
    card.className = 'smash-card';

    const formattedDate = new Date(post.date).toLocaleDateString('ja-JP');

    card.innerHTML = `
        <a href="${post.link}" target="_blank" class="card-link-wrapper">
            <div class="card-header">${post.campusName}</div>
            <div class="card-thumb-container">
                <img src="${post.thumb}" class="card-thumb" alt="Thumbnail">
            </div>
            <div class="card-body">
                <h3 class="card-title">${post.title}</h3>
                <div class="card-meta">
                    <span class="card-date">${formattedDate}</span>
                </div>
            </div>
        </a>
    `;
    return card;
}

async function triggerNextEvent() {
    if (postQueue.length === 0) return;

    let post = postQueue[currentPostIndex];

    let attempts = 0;
    while (post.slug === lastShownCampusSlug && attempts < 10) {
        currentPostIndex = (currentPostIndex + 1) % postQueue.length;
        post = postQueue[currentPostIndex];
        attempts++;
    }

    lastShownCampusSlug = post.slug;
    currentPostIndex = (currentPostIndex + 1) % postQueue.length;

    if (currentPostIndex === 0) fetchClarkData();

    const card = createCardDOM(post);
    arena.appendChild(card);

    if (arena.children.length > MAX_CARDS) {
        const oldest = arena.firstElementChild;
        oldest.classList.add('exit');

        setTimeout(() => {
            if (arena.contains(oldest)) {
                arena.removeChild(oldest);
            }
        }, 500);
    }
}

// Clock logic
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    const timeEl = document.getElementById('current-time');
    if (timeEl) timeEl.innerText = timeString;
}

setInterval(updateClock, 1000);
updateClock();

// Start sequence
setTimeout(() => {
    fetchClarkData().then(() => {
        let initialFill = setInterval(() => {
            if (arena.children.length < MAX_CARDS && postQueue.length > 0) {
                let post = postQueue[currentPostIndex];

                let attempts = 0;
                while (post.slug === lastShownCampusSlug && attempts < 10) {
                    currentPostIndex = (currentPostIndex + 1) % postQueue.length;
                    post = postQueue[currentPostIndex];
                    attempts++;
                }

                lastShownCampusSlug = post.slug;
                currentPostIndex = (currentPostIndex + 1) % postQueue.length;

                arena.appendChild(createCardDOM(post));
            } else {
                clearInterval(initialFill);
                setInterval(triggerNextEvent, 5000);
            }
        }, 400);
    });
}, 500);
