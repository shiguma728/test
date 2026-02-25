// Clark Signage - V4 Map & Card Fusion

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

const campusData = {
    'tokyo-tokyo': { lat: 35.7133, lon: 139.7046 },
    'tokyo-ikebukuro': { lat: 35.7295, lon: 139.7109 },
    'tokyo-next_akihabara': { lat: 35.6983, lon: 139.7731 },
    'tokyo-next_tokyo': { lat: 35.6895, lon: 139.6917 },
    'tokyo-smart_tokyo': { lat: 35.7000, lon: 139.7700 },
    'kanagawa-yokohama': { lat: 35.4658, lon: 139.6223 },
    'kanagawa-yokohamaaoba': { lat: 35.5529, lon: 139.5391 },
    'kanagawa-atsugi': { lat: 35.4431, lon: 139.3625 },
    'kanagawa-smart_yokohama': { lat: 35.4600, lon: 139.6200 },
    'saitama-saitama': { lat: 35.8617, lon: 139.6455 },
    'saitama-tokorozawa': { lat: 35.7865, lon: 139.4682 },
    'saitama-smart_saitama': { lat: 35.8600, lon: 139.6400 },
    'chiba-chiba': { lat: 35.6130, lon: 140.1114 },
    'chiba-kashiwa': { lat: 35.8623, lon: 139.9712 },
    'chiba-smart_chiba': { lat: 35.6100, lon: 140.1100 }
};

let map;
let markers = {};
let postQueue = [];
let currentPostIndex = 0;
let lastShownCampusSlug = "";

const arena = document.getElementById('card-arena');
let MAX_CARDS = 1; // 常に1枚表示（左半分の単一カードレイアウト）

function createCustomIcon(isActive) {
    return L.divIcon({
        className: 'custom-leaflet-icon',
        html: `<div class="campus-marker ${isActive ? 'active' : ''}"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });
}

function initMap(lat, lon) {
    map = L.map('map', { zoomControl: false }).setView([lat, lon], 13);
    // Dark Matterから、一般的なカラーマップ（Voyager）へ変更してリアルな色合いにする
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    for (const [slug, data] of Object.entries(campusData)) {
        const marker = L.marker([data.lat, data.lon], {
            icon: createCustomIcon(false)
        }).addTo(map);
        markers[slug] = marker;
    }
}

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

    // マップ連動アニメーション
    if (campusData[post.slug] && markers[post.slug]) {
        // すべてのハイライトを解除
        Object.values(markers).forEach(m => {
            m.setIcon(createCustomIcon(false));
        });

        // 一度カメラを引く（ズームアウト）
        map.setZoom(9, { animate: true, duration: 1.0 });

        // 引いた後、次のキャンパスへ急降下（flyToしてズームイン）
        setTimeout(() => {
            // 当該キャンパスのマーカーをハイライト
            const currentMarker = markers[post.slug];
            currentMarker.setIcon(createCustomIcon(true));

            map.flyTo([campusData[post.slug].lat, campusData[post.slug].lon], 13, { animate: true, duration: 2.5 });
        }, 1200);
    }

    const card = createCardDOM(post);
    arena.appendChild(card);

    // トップメッセージを更新（日付を表示）
    const msgEl = document.getElementById("top-message-text");
    if (msgEl) {
        const d = new Date(post.date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        msgEl.innerText = `${yyyy}.${mm}.${dd}`;
    }

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
        if (postQueue.length > 0) {
            let post = postQueue[currentPostIndex];

            let attempts = 0;
            while (post.slug === lastShownCampusSlug && attempts < 10) {
                currentPostIndex = (currentPostIndex + 1) % postQueue.length;
                post = postQueue[currentPostIndex];
                attempts++;
            }

            lastShownCampusSlug = post.slug;
            currentPostIndex = (currentPostIndex + 1) % postQueue.length;

            // 最初の記事の座標をベースにマップを初期化
            const initialLat = campusData[post.slug] ? campusData[post.slug].lat : 35.68;
            const initialLon = campusData[post.slug] ? campusData[post.slug].lon : 139.75;
            initMap(initialLat, initialLon);

            // 初回マーカーハイライト
            if (campusData[post.slug] && markers[post.slug]) {
                const currentMarker = markers[post.slug];
                currentMarker.setIcon(createCustomIcon(true));
            }

            // 初回トップメッセージ更新（日付を表示）
            const msgEl = document.getElementById("top-message-text");
            if (msgEl) {
                const d = new Date(post.date);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                msgEl.innerText = `${yyyy}.${mm}.${dd}`;
            }

            arena.appendChild(createCardDOM(post));

            // 表示間隔を大幅に延長（15秒ごとに次の記事へ）
            setInterval(triggerNextEvent, 15000);
        }
    });
}, 500);
