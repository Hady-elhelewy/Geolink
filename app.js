// ============================================================
// GeoLink App - Final Stable Version (No Tools.js needed)
// ============================================================

// 1. تعريف الأيقونات والمساعدات (عشان ميعملوش تعارض)
const IC = {
  home: "M3 11l9-8 9 8v10h-6v-6H9v6H3z", brief: "M3 8h18v12H3zM8 8V5h8v3M3 13h18",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  bell: "M18 16v-5a6 6 0 10-12 0v5l-2 2h16zM10 20a2 2 0 004 0",
  chat: "M21 12a8 8 0 01-11.5 7.2L4 20l1-4.6A8 8 0 1121 12z",
  check: "M12 21a9 9 0 100-18 9 9 0 000 18zM8.5 12l2.5 2.5 4.5-5",
  like: "M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3",
  comment: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  share: "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13",
  tools: "M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  poly: "M5 5h8l6 4-3 10H5z", plus: "M12 5v14M5 12h14", ruler: "M3 17L17 3l4 4L7 21zM8 12l2 2M11 9l2 2M14 6l2 2",
  arrow: "M19 12H5M11 6l-6 6 6 6", wand: "M5 19L17 7M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 12l.7 1.3L21 14l-1.3.7L19 16l-.7-1.3L17 14l1.3-.7z",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 15l2-2 2 2 2-2", network: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M16 5a3.5 3.5 0 010 7M18 14.5c2.5.6 4 2.2 4 5", shield: "M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6zM9 12l2 2 4-4"
};

const num = s => { const t = String(s).trim().replace(",", "."); return t === "" ? NaN : Number(t); };
const f3 = x => x.toFixed(3);
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const ang = s => { const n = (String(s).match(/\d+(?:[.,]\d+)?/g) || []).map(x => parseFloat(x.replace(",", "."))); return n.length ? n[0] + (n[1] || 0) / 60 + (n[2] || 0) / 3600 : NaN; };
function dms(d) { const g = Math.floor(d), m = Math.floor((d - g) * 60); return `${g}°${m}'`; }
const azim = (dx, dy) => (deg(Math.atan2(dx, dy)) + 360) % 360;
function feddan(a) { return (a / 4200.83).toFixed(2) + " فدان"; }
const WGS = { a: 6378137, f: 1 / 298.257223563 }; WGS.e2 = WGS.f * (2 - WGS.f); WGS.ep2 = WGS.e2 / (1 - WGS.e2);
const zoneOf = lon => Math.min(60, Math.max(1, Math.floor((lon + 180) / 6) + 1));
const bandOf = lat => "CDEFGHJKLMNPQRSTUVWXX"[Math.floor((lat + 80) / 8)];

function toUTM(lat, lon, zone) {
  zone = zone || zoneOf(lon);
  const k0 = 0.9996, { a, e2, ep2 } = WGS, p = rad(lat), l0 = rad((zone - 1) * 6 - 180 + 3);
  const sn = Math.sin(p), cs = Math.cos(p), tn = Math.tan(p);
  const N = a / Math.sqrt(1 - e2 * sn * sn), T = tn * tn, C = ep2 * cs * cs, A = (rad(lon) - l0) * cs;
  const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256) * p - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * p) + (15 * e2 * e2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * p) - (35 * e2 ** 3 / 3072) * Math.sin(6 * p));
  const E = 500000 + k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120);
  let Nn = k0 * (M + N * tn * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720));
  if (lat < 0) Nn += 1e7;
  return { zone, band: bandOf(lat), E, N: Nn };
}

// ---- Firebase Init ----
firebase.initializeApp({
  apiKey: "AIzaSyApICmCU5DVg_-ttahelh3xPuGbDELhcNA", authDomain: "geolink-e80b4.firebaseapp.com",
  projectId: "geolink-e80b4", storageBucket: "geolink-e80b4.firebasestorage.app",
  messagingSenderId: "611615414436", appId: "1:611615414436:web:771c18e2dd31ebe5606e31"
});
const db = firebase.firestore(); const auth = firebase.auth();
const ADMIN_UID = "gPceivu7FAa1YkRP5mdjrksFJmm2";
const app = document.getElementById("app");
let currentUser = null;

// ---- Helpers ----
const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const k in attrs) k === "class" ? e.className = attrs[k] : e.setAttribute(k, attrs[k]); kids.forEach(c => e.append(c)); return e; };
function toast(t) { const e = el("div", { class: "toast" }, t); document.body.append(e); setTimeout(() => e.remove(), 2200); }
function closeModal(id) { document.getElementById(id).classList.remove("show"); }
window.closeModal = closeModal;

const MOCK_POSTS = [
  { id: 1, author: "مكتب AL Helwey", role: "Surveyor / QC Team Leader", time: "منذ ساعتين", content: "تم بحمد الله الانتهاء من أعمال الرفع المساحي لمشروع O&M Complex. #مساحة", image: "https://images.unsplash.com/photo-1541888078693-019d16e6d5e1?auto=format&fit=crop&q=80&w=600", likes: 124, comments: 12, verified: true }
];

// ---- Views ----
function renderNav(active) {
  document.getElementById("nav").innerHTML = `
    <a href="#home" class="${active === 'home' ? 'on' : ''}"><svg viewBox="0 0 24 24"><path d="${IC.home}"/></svg><span>الرئيسية</span></a>
    <a href="#tools" class="${active === 'tools' ? 'on' : ''}"><svg viewBox="0 0 24 24"><path d="${IC.tools}"/></svg><span>الأدوات</span></a>
    <a href="#home" class="fab"><div class="c-fab"><svg viewBox="0 0 24 24"><path d="${IC.plus}"/></svg></div></a>
    <a href="#jobs" class="${active === 'jobs' ? 'on' : ''}"><svg viewBox="0 0 24 24"><path d="${IC.brief}"/></svg><span>الوظائف</span></a>
    <a href="#profile" class="${active === 'profile' ? 'on' : ''}"><svg viewBox="0 0 24 24"><path d="${IC.user}"/></svg><span>حسابي</span></a>
  `;
}

function homeView() {
  app.className = ""; renderNav('home');
  app.innerHTML = `
    <header class="top-header">
      <div class="brand-logo"><div class="g-icon"><svg viewBox="0 0 24 24"><path d="${IC.globe}"/></svg></div><div class="brand-text">Geo<span>Link</span></div></div>
      <div class="search-bar"><svg viewBox="0 0 24 24"><path d="${IC.search}"/></svg><span>بحث...</span></div>
    </header>
    <div class="section-head">أدواتك السريعة <a href="#tools">عرض الكل</a></div>
    <div class="quick-tools">
      <a class="tool-card" href="#tool:coord"><i><svg viewBox="0 0 24 24"><path d="${IC.map}"/></svg></i><b>إحداثيات</b><span>WGS84/UTM</span></a>
      <a class="tool-card" href="#tool:dist"><i><svg viewBox="0 0 24 24"><path d="${IC.ruler}"/></svg></i><b>مسافات</b><span>Azimuth</span></a>
    </div>
    <div class="feed" id="feed"></div>
  `;
  MOCK_POSTS.forEach(p => {
    document.getElementById("feed").append(el("div", { class: "post-card", innerHTML: `
      <div class="post-header">
        <img class="post-avatar" src="https://ui-avatars.com/api/?name=${p.author}&background=102A56&color=fff">
        <div class="post-meta"><h4>${p.author} ${p.verified ? `<svg viewBox="0 0 24 24"><path d="${IC.check}"/></svg>` : ''}</h4><p>${p.role}</p></div>
      </div>
      <div class="post-content"><p>${p.content}</p></div>
      ${p.image ? `<img class="post-media" src="${p.image}">` : ''}
      <div class="post-actions"><button class="action-btn">إعجاب</button><button class="action-btn">تعليق</button></div>
    `}));
  });
}

function toolsHub() {
  app.className = "page"; renderNav('tools');
  app.innerHTML = `<h2>الأدوات</h2>
    <div class="card"><a href="#tool:coord" style="display:block;padding:10px;">🌍 تحويل الإحداثيات</a></div>
    <div class="card"><a href="#tool:dist" style="display:block;padding:10px;">📏 المسافات والاتجاهات</a></div>`;
}

function coordTool() {
  app.className = "page"; renderNav('tools');
  app.innerHTML = `<h2>تحويل الإحداثيات</h2>
    <div class="card"><label>خط العرض</label><input id="lat" value="30.0444"><label>خط الطول</label><input id="lon" value="31.2357"><div id="res" style="margin-top:16px;"></div></div>`;
  const c = () => {
    const lat = ang(document.getElementById("lat").value), lon = ang(document.getElementById("lon").value);
    if (isNaN(lat) || isNaN(lon)) return;
    const u = toUTM(lat, lon);
    document.getElementById("res").innerHTML = `<div style="background:#eee;padding:14px;border-radius:12px;">Zone: ${u.zone}${u.band}<br>E: ${f3(u.E)}<br>N: ${f3(u.N)}</div>`;
  };
  document.getElementById("lat").oninput = c; document.getElementById("lon").oninput = c; c();
}

function distTool() {
  app.className = "page"; renderNav('tools');
  app.innerHTML = `<h2>المسافات</h2><div class="card"><label>E1</label><input id="e1" value="1000"><label>N1</label><input id="n1" value="2000"><label>E2</label><input id="e2" value="1100"><label>N2</label><input id="n2" value="2100"><div id="res"></div></div>`;
  const c = () => {
    const e1 = num(document.getElementById("e1").value), n1 = num(document.getElementById("n1").value);
    const e2 = num(document.getElementById("e2").value), n2 = num(document.getElementById("n2").value);
    if ([e1,n1,e2,n2].some(isNaN)) return;
    document.getElementById("res").innerHTML = `<div style="background:#eee;padding:14px;border-radius:12px;">Dist: ${f3(Math.hypot(e2-e1, n2-n1))}<br>Az: ${dms(azim(e2-e1, n2-n1))}</div>`;
  };
  ["e1","n1","e2","n2"].forEach(id => document.getElementById(id).oninput = c); c();
}

// ---- Router ----
function route() {
  const h = location.hash.slice(1) || "home";
  if (h === "home") homeView();
  else if (h === "tools") toolsHub();
  else if (h === "tool:coord") coordTool();
  else if (h === "tool:dist") distTool();
  else homeView();
  window.scrollTo(0, 0);
}

window.onhashchange = route;
route();
