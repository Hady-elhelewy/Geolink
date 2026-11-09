// ============================================================
// GeoLink App - Full Version (Part 1/2)
// ============================================================

// 1. الأيقونات
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
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 15l2-2 2 2 2-2", network: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M16 5a3.5 3.5 0 010 7M18 14.5c2.5.6 4 2.2 4 5", 
  shield: "M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6zM9 12l2 2 4-4",
  calc: "M6 3h12v18H6zM9 7h6M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01", 
  pin: "M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11zM12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"
};

// 2. الدوال المساعدة
const num = s => { const t = String(s).trim().replace(",", "."); return t === "" ? NaN : Number(t); };
const f3 = x => x.toFixed(3);
const fmt = x => String(+x.toPrecision(10));
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const ang = s => { const n = (String(s).match(/\d+(?:[.,]\d+)?/g) || []).map(x => parseFloat(x.replace(",", "."))); return n.length ? n[0] + (n[1] || 0) / 60 + (n[2] || 0) / 3600 : NaN; };
function dms(d) { const g = Math.floor(d), m = Math.floor((d - g) * 60), s = Math.round(((d - g) * 60 - m) * 60); return `${g}°${m}'${s}"`; }
const azim = (dx, dy) => (deg(Math.atan2(dx, dy)) + 360) % 360;
function feddan(a) { return (a / 4200.83).toFixed(2) + " فدان"; }
const SH = { rect: ["مستطيل", [["a", "الطول"], ["b", "العرض"]]], tri: ["مثلث (قاعدة وارتفاع)", [["a", "القاعدة"], ["h", "الارتفاع"]]], circle: ["دائرة", [["r", "نصف القطر"]]] };
const UN = { len: ["الطول", [["متر", 1], ["كيلومتر", 1000], ["سنتيمتر", 0.01], ["قدم", 0.3048]]], area: ["المساحة", [["متر مربع", 1], ["هكتار", 10000], ["فدان", 4200.83], ["قيراط", 175.03]]] };

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

// 3. Firebase Init
firebase.initializeApp({
  apiKey: "AIzaSyApICmCU5DVg_-ttahelh3xPuGbDELhcNA", authDomain: "geolink-e80b4.firebaseapp.com",
  projectId: "geolink-e80b4", storageBucket: "geolink-e80b4.firebasestorage.app",
  messagingSenderId: "611615414436", appId: "1:611615414436:web:771c18e2dd31ebe5606e31"
});
const db = firebase.firestore(); const auth = firebase.auth();
const ADMIN_UID = "gPceivu7FAa1YkRP5mdjrksFJmm2";
const app = document.getElementById("app");
let currentUser = null;
const GOVS = ["القاهرة","الجيزة","الإسكندرية","الدقهلية","الشرقية","المنوفية","أسيوط","سوهاج","أخرى"];
const SERVICES = ["رفع مساحي", "توقيع مناسيب", "حساب كميات", "استشارة"];

// Helpers
const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const k in attrs) k === "class" ? e.className = attrs[k] : e.setAttribute(k, attrs[k]); kids.forEach(c => e.append(c)); return e; };
function toast(t) { const e = el("div", { class: "toast" }, t); document.body.append(e); setTimeout(() => e.remove(), 2200); }
function closeModal(id) { document.getElementById(id).classList.remove("show"); }
window.closeModal = closeModal;

const MOCK_POSTS = [{ id: 1, author: "مكتب AL Helwey", role: "Surveyor / QC Team Leader", time: "منذ ساعتين", content: "تم بحمد الله الانتهاء من أعمال الرفع المساحي لمشروع O&M Complex. #مساحة", image: "https://images.unsplash.com/photo-1541888078693-019d16e6d5e1?auto=format&fit=crop&q=80&w=600", likes: 124, comments: 12, verified: true }];

// Navigation & Views
function renderNav(active) {
  document.getElementById("nav").innerHTML = `
    <a href="#home" class="${active === 'home' ? 'on' : ''}"><svg viewBox="0 0 24 24"><path d="${IC.home}"/></svg><span>الرئيسية</span></a>
    <a href="#tools" class="${active === 'tools' ? 'on' : ''}"><svg viewBox="0 0 24 24"><path d="${IC.tools}"/></svg><span>الأدوات</span></a>
    <a href="#home" class="fab"><div class="c-fab"><svg viewBox="0 0 24 24"><path d="${IC.plus}"/></svg></div></a>
    <a href="#jobs" class="${active === 'jobs' ? 'on' : ''}"><svg viewBox="0 0 24 24"><path d="${IC.brief}"/></svg><span>الوظائف</span></a>
    <a href="#profile" class="${active === 'profile' ? 'on' : ''}"><svg viewBox="0 0 24 24"><path d="${IC.user}"/></svg><span>حسابي</span></a>`;
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
      <a class="tool-card" href="#ai"><i><svg viewBox="0 0 24 24"><path d="${IC.wand}"/></svg></i><b>GeoAI</b><span>مساعد ذكي</span></a>
      <a class="tool-card" href="#tool:coord"><i><svg viewBox="0 0 24 24"><path d="${IC.map}"/></svg></i><b>إحداثيات</b><span>WGS84/UTM</span></a>
      <a class="tool-card" href="#tool:level"><i><svg viewBox="0 0 24 24"><path d="M3 7h18v6H3z"/></svg></i><b>مناسيب</b><span>Level</span></a>
    </div>
    <div class="feed" id="feed"></div>
  `;
  MOCK_POSTS.forEach(p => {
    document.getElementById("feed").append(el("div", { class: "post-card", innerHTML: `
      <div class="post-header"><img class="post-avatar" src="https://ui-avatars.com/api/?name=${p.author}&background=102A56&color=fff"><div class="post-meta"><h4>${p.author} ${p.verified ? `<svg viewBox="0 0 24 24"><path d="${IC.check}"/></svg>` : ''}</h4><p>${p.role}</p></div></div>
      <div class="post-content"><p>${p.content}</p></div>${p.image ? `<img class="post-media" src="${p.image}">` : ''}
      <div class="post-actions"><button class="action-btn">إعجاب</button><button class="action-btn">تعليق</button></div>
    `}));
  });
}

function profileView() {
  app.className = "page"; renderNav('profile');
  const name = currentUser ? (currentUser.displayName || currentUser.email.split("@")[0]) : "زائر";
  app.innerHTML = `<div class="card" style="padding:0;overflow:hidden;">
    <div class="profile-cover"></div>
    <div class="profile-avatar-wrap"><img class="profile-avatar" src="https://ui-avatars.com/api/?name=${name}&background=1677F2&color=fff&size=120"></div>
    <div class="profile-info">
      <div class="profile-name">${name} ${currentUser ? `<svg class="verified" viewBox="0 0 24 24"><path d="${IC.check}"/></svg>` : ''}</div>
      <div class="profile-title">${currentUser ? "أخصائي مساحة" : "سجّل دخولك لاستكمال ملفك"}</div>
      <div class="profile-actions">${currentUser ? `<button class="primary" onclick="location.hash='#pro'">تعديل</button>` : `<button class="primary" onclick="location.hash='#pro'">تسجيل الدخول</button><button class="secondary" onclick="location.hash='#surveyor'">إنشاء حساب</button>`}</div>
    </div></div>
    <div class="card"><a href="#tools" style="display:block;padding:10px;">جميع أدوات المساحة</a><a href="#admin" style="display:block;padding:10px;border-top:1px solid #eee;">لوحة التحكم</a></div>`;
}

function jobsView() { app.className = "page"; renderNav('jobs'); app.innerHTML = `<h2>الوظائف</h2><div class="card">لا توجد وظائف حالياً.</div>`; }
function networkView() { app.className = "page"; renderNav('network'); app.innerHTML = `<h2>شبكتي</h2><div class="card">قريباً.</div>`; } // ============================================================
// GeoLink App - Full Version (Part 2/2)
// ============================================================

function toolsHub() {
  app.className = "page"; renderNav('tools');
  const T = [
    ["coord", "تحويل الإحداثيات"], ["dist", "المسافات والاتجاهات"], ["area", "حساب المساحات"], ["calc", "حساب الإحداثيات"],
    ["level", "حساب المناسيب"], ["slope", "الميول والانحدارات"], ["earth", "الحفر والردم"], ["trav", "الترافيرس"],
    ["curve", "المنحنيات"], ["unit", "تحويل الوحدات"]
  ];
  app.innerHTML = `<h2>الأدوات المساحية</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    ${T.map(([k, name]) => `<a href="#tool:${k}" class="card" style="margin:0;padding:16px;text-align:center;display:block;font-weight:bold;color:var(--navy);">${name}</a>`).join("")}
  </div>`;
}

function coordTool() {
  app.className = "page"; renderNav('tools');
  app.innerHTML = `<h2>تحويل الإحداثيات</h2><div class="card"><label>Lat</label><input id="lat" value="30.0444"><label>Lon</label><input id="lon" value="31.2357"><div id="res"></div></div>`;
  const c = () => { const lat = ang(document.getElementById("lat").value), lon = ang(document.getElementById("lon").value); if (isNaN(lat)) return; const u = toUTM(lat, lon); document.getElementById("res").innerHTML = `<div style="background:#eee;padding:14px;">Zone: ${u.zone}${u.band}<br>E: ${f3(u.E)}<br>N: ${f3(u.N)}</div>`; };
  document.getElementById("lat").oninput = c; document.getElementById("lon").oninput = c; c();
}

function distTool() {
  app.className = "page"; renderNav('tools');
  app.innerHTML = `<h2>المسافات</h2><div class="card"><label>E1</label><input id="e1" value="1000"><label>N1</label><input id="n1" value="2000"><label>E2</label><input id="e2" value="1100"><label>N2</label><input id="n2" value="2100"><div id="res"></div></div>`;
  const c = () => { const e1 = num(document.getElementById("e1").value), n1 = num(document.getElementById("n1").value), e2 = num(document.getElementById("e2").value), n2 = num(document.getElementById("n2").value); if ([e1,n1,e2,n2].some(isNaN)) return; document.getElementById("res").innerHTML = `<div style="background:#eee;padding:14px;">Dist: ${f3(Math.hypot(e2-e1, n2-n1))}<br>Az: ${dms(azim(e2-e1, n2-n1))}</div>`; };
  ["e1","n1","e2","n2"].forEach(id => document.getElementById(id).oninput = c); c();
}

function levelTool() {
  app.className = "page"; renderNav('tools');
  app.innerHTML = `<h2>المناسيب</h2><div class="card"><label>RL نقطة البداية</label><input id="rl0" value="100"><label>القراءات (BS/FS القيمة)</label><textarea id="t" rows="4">BS 1.5\nFS 1.2</textarea><div id="res"></div></div>`;
  const c = () => {
    const rl0 = num(document.getElementById("rl0").value), L = document.getElementById("t").value.split("\n").filter(x=>x.trim());
    let rl = rl0, out = "";
    L.forEach(l => { const p = l.split(" "); const t = p[0].toUpperCase(), v = num(p[1]); if (isNaN(v)) return; if (t === "BS") rl += v; else if (t === "FS") rl -= v; out += `${t} ${v} -> RL: ${f3(rl)}<br>`; });
    document.getElementById("res").innerHTML = `<div style="background:#eee;padding:14px;">${out}</div>`;
  };
  document.getElementById("rl0").oninput = c; document.getElementById("t").oninput = c; c();
}

function slopeTool() {
  app.className = "page"; renderNav('tools');
  app.innerHTML = `<h2>الميول</h2><div class="card"><label>المسافة الأفقية</label><input id="d" value="100"><label>فرق المنسوب</label><input id="h" value="10"><div id="res"></div></div>`;
  const c = () => { const d = num(document.getElementById("d").value), h = num(document.getElementById("h").value); if (isNaN(d) || isNaN(h) || d===0) return; document.getElementById("res").innerHTML = `<div style="background:#eee;padding:14px;">الميل: ${((h/d)*100).toFixed(2)}%<br>الزاوية: ${deg(Math.atan(h/d)).toFixed(2)}°</div>`; };
  document.getElementById("d").oninput = c; document.getElementById("h").oninput = c; c();
}

function earthTool() {
  app.className = "page"; renderNav('tools');
  app.innerHTML = `<h2>الحفر والردم</h2><div class="card"><label>مقاطع (مسافة، حفر، ردم)</label><textarea id="t" rows="4">0 10 0\n20 15 5</textarea><div id="res"></div></div>`;
  const c = () => {
    const L = document.getElementById("t").value.split("\n").filter(x=>x.trim()).map(l => l.split(" ").map(Number));
    if (L.length < 2) return; let cut = 0, fill = 0;
    for (let i=1; i<L.length; i++) { const d = L[i][0] - L[i-1][0]; if (d<=0) return; cut += ((L[i][1]+L[i-1][1])/2)*d; fill += ((L[i][2]+L[i-1][2])/2)*d; }
    document.getElementById("res").innerHTML = `<div style="background:#eee;padding:14px;">حفر: ${f3(cut)}<br>ردم: ${f3(fill)}</div>`;
  };
  document.getElementById("t").oninput = c; c();
}

function areaTool() {
  app.className = "page"; renderNav('tools');
  app.innerHTML = `<h2>المساحات</h2><div class="card"><label>الطول</label><input id="a" value="50"><label>العرض</label><input id="b" value="20"><div id="res"></div></div>`;
  const c = () => { const a = num(document.getElementById("a").value), b = num(document.getElementById("b").value); if (isNaN(a) || isNaN(b)) return; document.getElementById("res").innerHTML = `<div style="background:#eee;padding:14px;">المساحة: ${f3(a*b)} م²<br>${feddan(a*b)}</div>`; };
  document.getElementById("a").oninput = c; document.getElementById("b").oninput = c; c();
}

function calcTool() { app.className = "page"; renderNav('tools'); app.innerHTML = `<h2>حساب الإحداثيات</h2><div class="card">قيد التطوير.</div>`; }
function travTool() { app.className = "page"; renderNav('tools'); app.innerHTML = `<h2>الترافيرس</h2><div class="card">قيد التطوير.</div>`; }
function curveTool() { app.className = "page"; renderNav('tools'); app.innerHTML = `<h2>المنحنيات</h2><div class="card">قيد التطوير.</div>`; }
function unitTool() { app.className = "page"; renderNav('tools'); app.innerHTML = `<h2>تحويل الوحدات</h2><div class="card">قيد التطوير.</div>`; }

// AI
function aiView() {
  app.className = "page"; document.getElementById("nav").style.display = "none";
  app.innerHTML = `<header class="top-header"><a href="#home"><svg viewBox="0 0 24 24" style="transform:scaleX(-1);"><path d="${IC.arrow}"/></svg></a><b>GeoAI</b><div></div></header>
  <div style="padding:16px;padding-bottom:90px;" id="msgs"><div class="m bot">أهلاً بك! اسألني عن المساحة.</div></div>
  <div class="chat-input"><input id="inp" placeholder="اكتب سؤالك..."><button id="send"><svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button></div>`;
  const send = () => {
    const q = document.getElementById("inp").value; if (!q) return; document.getElementById("inp").value = "";
    const m = document.getElementById("msgs"); m.innerHTML += `<div class="m me">${q}</div>`; m.innerHTML += `<div class="m bot">جاري البحث...</div>`;
    setTimeout(() => { m.lastElementChild.textContent = "هذا سؤال ممتاز! فريق GeoLink سيتواصل معك قريباً للتفاصيل."; window.scrollTo(0, document.body.scrollHeight); }, 800);
  };
  document.getElementById("send").onclick = send; document.getElementById("inp").onkeydown = e => { if (e.key === "Enter") send(); };
}

// Forms
function formView(kind) {
  app.className = "page"; document.getElementById("nav").style.display = "flex";
  const client = kind === "client";
  app.innerHTML = `<h2>${client ? "طلب أخصائي" : "تسجيل أخصائي"}</h2><form class="card" id="f"><label>الاسم</label><input name="name" required><label>الموبايل</label><input name="phone" required><label>المحافظة</label><input name="gov" required><button class="go">إرسال</button><div id="out"></div></form>`;
  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault(); const b = e.target.querySelector("button"); b.disabled = true; b.textContent = "جاري...";
    try { await db.collection(client ? "requests" : "surveyors").add(Object.fromEntries(new FormData(e.target))); e.target.outerHTML = `<div class="card" style="text-align:center;color:green;font-weight:bold;">تم بنجاح!</div>`; }
    catch (err) { document.getElementById("out").innerHTML = `<span style="color:red;">خطأ في الاتصال</span>`; b.disabled = false; b.textContent = "إرسال"; }
  };
}

function adminView() {
  app.className = "page"; document.getElementById("nav").style.display = "flex";
  app.innerHTML = `<h2>الإدارة</h2><div class="card">هذه الصفحة مخصصة للأدمن فقط.</div>`;
}

// Router
function route() {
  const h = location.hash.slice(1) || "home";
  document.getElementById("nav").style.display = "flex";
  if (h === "home") homeView();
  else if (h === "tools") toolsHub();
  else if (h === "profile") profileView();
  else if (h === "jobs") jobsView();
  else if (h === "network") networkView();
  else if (h === "ai") aiView();
  else if (h === "client" || h === "surveyor") formView(h);
  else if (h === "admin") adminView();
  else if (h.startsWith("tool:")) {
    const t = h.split(":")[1];
    if (t === "coord") coordTool(); else if (t === "dist") distTool(); else if (t === "area") areaTool(); else if (t === "level") levelTool(); else if (t === "slope") slopeTool(); else if (t === "earth") earthTool(); else if (t === "calc") calcTool(); else if (t === "trav") travTool(); else if (t === "curve") curveTool(); else if (t === "unit") unitTool(); else homeView();
  }
  else homeView();
  window.scrollTo(0, 0);
}

auth.onAuthStateChanged(u => { currentUser = u; });
window.onhashchange = route;
route();
