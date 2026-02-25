// Clark Campus Signage - 首都圏特化版 JS

// -- 1. Map Initialization --
// 首都圏が見渡せるフォーカス（東京中心やや広域）
const map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    zoomAnimation: true,
    fadeAnimation: true
}).setView([35.68, 139.75], 9);

// Add Clean Light Tile Layer (CartoDB Positron) for official look
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// -- 2. 首都圏対象キャンパスマスター --
// 抽出された首都圏キャンパスのみをターゲットとする
const targetSlugs = [
    'tokyo-tokyo', 'tokyo-ikebukuro', 'tokyo-next_akihabara', 'tokyo-next_tokyo', 'tokyo-smart_tokyo',
    'kanagawa-yokohama', 'kanagawa-yokohamaaoba', 'kanagawa-atsugi', 'kanagawa-smart_yokohama',
    'saitama-saitama', 'saitama-tokorozawa', 'saitama-smart_saitama',
    'chiba-chiba', 'chiba-kashiwa', 'chiba-smart_chiba'
];

// 正確な座標マッピング（首都圏）
const exactNodes = {
    // 東京
    'tokyo-tokyo': { name: "東京キャンパス", lat: 35.7118, lon: 139.7314 },
    'tokyo-ikebukuro': { name: "池袋キャンパス", lat: 35.7295, lon: 139.7109 },
    'tokyo-next_akihabara': { name: "NEXT Akihabara", lat: 35.6983, lon: 139.7731 },
    'tokyo-next_tokyo': { name: "NEXT Tokyo", lat: 35.7160, lon: 139.7610 }, // 独自調整
    'tokyo-smart_tokyo': { name: "SMART東京キャンパス", lat: 35.7000, lon: 139.7000 },
    // 神奈川
    'kanagawa-yokohama': { name: "横浜キャンパス", lat: 35.4437, lon: 139.6380 },
    'kanagawa-yokohamaaoba': { name: "横浜青葉キャンパス", lat: 35.5300, lon: 139.5284 },
    'kanagawa-atsugi': { name: "厚木キャンパス", lat: 35.4433, lon: 139.3622 },
    'kanagawa-smart_yokohama': { name: "SMART横浜キャンパス", lat: 35.4500, lon: 139.6400 },
    // 埼玉
    'saitama-saitama': { name: "さいたまキャンパス", lat: 35.8617, lon: 139.6455 },
    'saitama-tokorozawa': { name: "所沢キャンパス", lat: 35.7997, lon: 139.4688 },
    'saitama-smart_saitama': { name: "SMARTさいたまキャンパス", lat: 35.8700, lon: 139.6500 },
    // 千葉
    'chiba-chiba': { name: "千葉キャンパス", lat: 35.6072, lon: 140.1062 },
    'chiba-kashiwa': { name: "柏キャンパス", lat: 35.8624, lon: 139.9715 },
    'chiba-smart_chiba': { name: "SMART千葉キャンパス", lat: 35.6100, lon: 140.1100 }
};

const markers = {};
let activeNodesCount = 0;
let postQueue = [];

// -- 3. Base UI Functions --

function addIntelFeed(campusName, title, isAlert) {
    const feed = document.getElementById('intel-feed');
    const li = document.createElement('li');
    li.className = `intel-item ${isAlert ? 'alert' : 'info'}`;
    const timeStr = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    li.innerHTML = `<span class="intel-date">${timeStr} | ${campusName}</span>${title}`;
    feed.insertBefore(li, feed.firstChild);
    if (feed.children.length > 5) feed.removeChild(feed.lastChild);
}

// ターゲットのキャンパスにのみマーカーを設置
function getOrInjectMarker(slug) {
    let nodeData = exactNodes[slug];
    if (!nodeData) return null; // 首都圏対象外はスルー

    if (!markers[slug]) {
        markers[slug] = L.circleMarker([nodeData.lat, nodeData.lon], {
            radius: 5, fillColor: "#005A9C", color: "#ffffff", weight: 2, fillOpacity: 0.9
        }).addTo(map);
        activeNodesCount++;
        document.getElementById('active-nodes').innerText = activeNodesCount.toString().padStart(2, '0');
    }

    return { marker: markers[slug], data: nodeData };
}

// -- 4. Fetch WP Data --
async function fetchClarkData() {
    try {
        // 全国の最新を少し多めに取得し、JS側で首都圏だけにフィルターする
        const response = await fetch('https://www.clark.ed.jp/wp-json/wp/v2/posts?per_page=100&_embed=1');
        const data = await response.json();

        postQueue = [];

        data.forEach(post => {
            const link = post.link;
            let slug = "unknown";
            const match = link.match(/\/campus\/([^\/]+)\//);
            if (match) slug = match[1];

            // 首都圏キャンパスターゲットのみ抽出
            if (targetSlugs.includes(slug)) {
                const title = typeof post.title === 'string' ? post.title : post.title.rendered;

                let thumbUrl = null;
                if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0].source_url) {
                    thumbUrl = post._embedded['wp:featuredmedia'][0].source_url;
                }

                const isAlert = title.includes('急') || title.includes('重要') || title.includes('大会');

                postQueue.push({
                    title: title.replace(/<[^>]*>?/gm, ''),
                    link: link,
                    date: post.date,
                    slug: slug,
                    thumb: thumbUrl,
                    isAlert: isAlert
                });

                getOrInjectMarker(slug);
            }
        });

        // 順番を適度にシャッフル
        postQueue.sort(() => Math.random() - 0.5);

    } catch (err) {
        console.error("API Fetch Error:", err);
    }
}

// -- 5. Main Simulation Action --
let currentPostIndex = 0;

function triggerNextEvent() {
    if (postQueue.length === 0) return;

    const post = postQueue[currentPostIndex];
    currentPostIndex = (currentPostIndex + 1) % postQueue.length;

    if (currentPostIndex === 0) fetchClarkData();

    const nodeInfo = getOrInjectMarker(post.slug);
    if (!nodeInfo) return; // セーフティネット

    const { marker, data } = nodeInfo;

    setTimeout(() => {
        // Map Animation Center (Zoom in a bit closer for Kanto)
        map.flyTo([data.lat, data.lon], 11, { animate: true, duration: 1.5 });

        setTimeout(() => {
            // Highlight Marker
            marker.setStyle({ radius: 10, fillColor: "#F18D00", color: "#ffffff", weight: 3, fillOpacity: 1 });

            let shortTitle = post.title;
            if (shortTitle.length > 55) shortTitle = shortTitle.substring(0, 52) + "...";

            let imgHtml = '';
            if (post.thumb) {
                imgHtml = `<div class="popup-thumb-wrapper"><img src="${post.thumb}" class="popup-thumb" alt="Thumbnail"></div>`;
            }

            const formattedDate = new Date(post.date).toLocaleDateString('ja-JP');
            const popupContent = `
                <a href="${post.link}" target="_blank" class="popup-link-wrapper">
                    <h4>${data.name}</h4>
                    ${imgHtml}
                    <p>${shortTitle}</p>
                    <span class="tag">${formattedDate}</span>
                </a>
            `;

            const popup = L.popup({ closeButton: false, autoClose: true, maxWidth: 360, minWidth: 280, keepInView: true })
                .setLatLng([data.lat, data.lon])
                .setContent(popupContent)
                .openOn(map);

            document.getElementById("top-ticker-text").innerText = `【首都圏エリア最新情報】${data.name}：${shortTitle}`;
            addIntelFeed(data.name, shortTitle, post.isAlert);

            setTimeout(() => {
                marker.setStyle({ radius: 5, fillColor: "#005A9C", color: "#ffffff", weight: 2, fillOpacity: 0.9 });
                map.closePopup(popup);

                setTimeout(() => {
                    // Return to Kanto view
                    map.flyTo([35.68, 139.75], 9, { animate: true, duration: 2.0 });
                }, 800);
            }, 8000); // 記事を長く見せるため8秒に延長

        }, 1600);
    }, 500);
}

// Start Lifecycle
setTimeout(() => {
    // Pre-inject markers for all targets to show the network map
    targetSlugs.forEach(slug => getOrInjectMarker(slug));

    fetchClarkData().then(() => {
        setTimeout(triggerNextEvent, 2000);
        setInterval(triggerNextEvent, 16000);
    });
}, 500);
