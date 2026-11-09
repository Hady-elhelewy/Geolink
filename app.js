// ============================================================
// GeoLink App - Main Logic (Part 1/2)
// ============================================================
const { f3, fmt, dms, ang, rad, deg, toUTM, fromUTM, vincenty, pts, feddan, polyArea, azim, quad, SH, UN, zoneOf, bandOf, FED } = window.GL;
const IC = window.IC;

// ---- Firebase Init ----
const WA_NUMBER = "201020259546";
firebase.initializeApp({
  apiKey: "AIzaSyApICmCU5DVg_-ttahelh3xPuGbDELhcNA",
  authDomain: "geolink-e80b4.firebaseapp.com",
  projectId: "geolink-e80b4",
  storageBucket: "geolink-e80b4.firebasestorage.app",
  messagingSenderId: "611615414436",
  appId: "1:611615414436:web:771c18e2dd31ebe5606e31"
});
const db = firebase.firestore();
const auth = firebase.auth();
const ADMIN_UID = "gPceivu7FAa1YkRP5mdjrksFJmm2";
const app = document.getElementById("app");
let currentUser = null;
let currentTab = "foryou";

const GOVS = ["القاهرة","الجيزة","الإسكندرية","القليوبية","الشرقية","الدقهلية","الغربية","كفر الشيخ","المنوفية","البحيرة","مطروح","الإسماعيلية","بورسعيد","السويس","شمال سيناء","جنوب سيناء","دمياط","الفيوم","بني سويف","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","أخرى"];
const SERVICES = ["رفع مساحي لأرض","توقيع وتحديد مناسيب (إنشاءات)","حساب كميات","رفع مساحي لمبنى قائم","تقسيم أراضي","استشارة مساحية","تقرير كروكي","خدمة أخرى"];

// ---- Helpers ----
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const k in attrs) k === "class" ? e.className = attrs[k] : e.setAttribute(k, attrs[k]);
  kids.forEach(c => e.append(c));
  return e;
};
const opts = list => list.map(x => `<option>${x}</option>`).join("");
function toast(t) {
  const e = el("div", { class: "toast" }, t);
  document.body.append(e);
  setTimeout(() => e.remove(), 2200);
}
function closeModal(id) { document.getElementById(id).classList.remove("show"); }
window.closeModal = closeModal;

const MOCK_POSTS = [
  { id: 1, author: "مكتب AL Helwey للمساحة", role: "Surveyor / QC Team Leader", time: "منذ ساعتين", content: "تم بحمد الله الانتهاء من أعمال الرفع المساحي لمشروع O&M Complex. نستخدم أحدث أجهزة Total Station لضمان دقة عالية في التوقيع والمناسيب. #مساحة #هندسة", image: "https://images.unsplash.com/photo-1541888078693-019d16e6d5e1?auto=format&fit=crop&q=80&w=600", likes: 124, comments: 12, verified: true },
  { id: 2, author: "م. أحمد مصطفى", role: "GIS Specialist & Surveyor", time: "منذ 5 ساعات", content: "نصيحة اليوم: عند استخدام أجهزة GPS/RTK، تأكد دائماً من وجود سماء مفتوحة وتجنب العمل بجوار المباني العالية أو أشجار كثيفة لتجنب خطأ الـ Multipath. الدقة بتعتمد على نظافة الإشارة. 📡", image: null, likes: 89, comments: 5, verified: false }
];

function renderNav(active) {
  document.getElementById("nav").innerHTML = `
    <a href="#home" class="${active === 'home' ? 'on' : ''}"><svg viewBox="0 0 24 24"><path d="${IC.home}"/></svg><span>الرئيسية</span></a>
    <a href="#network" class="${active === 'network' ? 'on' : ''}"><svg viewBox="0 0 24 24"><path d="${IC.network}"/></svg><span>شبكتي</span></a>
    <a href="#" class="fab" id="fab-btn"><div class="c-fab"><svg viewBox="0 0 24 24"><path d="${IC.plus}"/></svg></div></a>
    <a href="#jobs" class="${active === 'jobs' ? 'on' : ''}"><svg viewBox="0 0 24 24"><path d="${IC.brief}"/></svg><span>الوظائف</span></a>
    <a href="#profile" class="${active === 'profile' ? 'on' : ''}"><svg viewBox="0 0 24 24"><path d="${IC.user}"/></svg><span>حسابي</span></a>
  `;
  document.getElementById("fab-btn").onclick = (e) => { e.preventDefault(); openComposer(); };
}

function openComposer() {
  document.getElementById("composer-user").innerHTML = `
    <img id="composer-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser ? (currentUser.displayName || currentUser.email) : "G")}&background=1677F2&color=fff" style="width:40px;height:40px;border-radius:50%;">
    <div>
      <b id="composer-name" style="color:var(--navy);">${currentUser ? (currentUser.displayName || currentUser.email) : "زائر"}</b>
      <div style="font-size:0.78rem; color:var(--mut);" id="composer-role">${currentUser ? "أخصائي مساحة" : "سجّل دخولك للنشر باسمك"}</div>
    </div>
  `;
  document.getElementById("composer").classList.add("show");
  document.getElementById("publish-btn").onclick = async () => {
    const text = document.getElementById("post-text").value.trim();
    if (!text) return toast("اكتب شيئاً أولاً");
    const btn = document.getElementById("publish-btn");
    btn.disabled = true; btn.textContent = "جاري النشر...";
    try {
      if (currentUser) {
        await db.collection("posts").add({
          text, author: currentUser.displayName || currentUser.email, role: "أخصائي مساحة", uid: currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(), likes: 0, comments: 0
        });
      } else {
        MOCK_POSTS.unshift({ id: Date.now(), author: "أنت (زائر)", role: "مستخدم", time: "الآن", content: text, image: null, likes: 0, comments: 0, verified: false });
      }
      closeModal("composer");
      document.getElementById("post-text").value = "";
      toast("تم النشر بنجاح");
      if (location.hash === "#home" || location.hash === "") renderFeed();
    } catch (e) { console.error(e); toast("حدث خطأ في النشر"); }
    btn.disabled = false; btn.textContent = "نشر";
  };
}

async function loadPosts() {
  let posts = [];
  try {
    const snap = await db.collection("posts").orderBy("createdAt", "desc").limit(20).get();
    snap.forEach(d => {
      const x = d.data();
      posts.push({
        id: d.id, author: x.author || "مستخدم", role: x.role || "أخصائي",
        time: x.createdAt ? x.createdAt.toDate().toLocaleDateString("ar-EG") : "الآن",
        content: x.text, image: x.image || null, likes: x.likes || 0, comments: x.comments || 0, verified: x.verified || false
      });
    });
  } catch (e) { console.warn("Firestore posts not available:", e); }
  return posts.length ? posts : MOCK_POSTS;
}

async function renderFeed() {
  const feed = document.getElementById("feed-container");
  if (!feed) return;
  feed.innerHTML = `<div class="empty">جاري التحميل...</div>`;
  const posts = await loadPosts();
  feed.innerHTML = "";
  posts.forEach(post => {
    const card = el("article", { class: "post-card" });
    card.innerHTML = `
      <div class="post-header">
        <img class="post-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=102A56&color=fff" alt="">
        <div class="post-meta">
          <h4>${post.author} ${post.verified ? `<svg viewBox="0 0 24 24"><path d="${IC.check}"/></svg>` : ''}</h4>
          <p>${post.role}</p>
        </div>
        <div class="post-time">${post.time}</div>
      </div>
      <div class="post-content"><p>${post.content}</p></div>
      ${post.image ? `<img class="post-media" src="${post.image}" alt="">` : ''}
      <div class="post-stats">
        <span>👍 ${post.likes} إعجاب</span>
        <span>${post.comments} تعليق</span>
      </div>
      <div class="post-actions">
        <button class="action-btn like-btn"><svg viewBox="0 0 24 24"><path d="${IC.like}"/></svg> إعجاب</button>
        <button class="action-btn"><svg viewBox="0 0 24 24"><path d="${IC.comment}"/></svg> تعليق</button>
        <button class="action-btn"><svg viewBox="0 0 24 24"><path d="${IC.share}"/></svg> مشاركة</button>
      </div>
    `;
    feed.append(card);
  });
  feed.querySelectorAll('.like-btn').forEach(btn => {
    btn.onclick = function() {
      this.classList.toggle('liked');
      if (this.classList.contains('liked')) this.innerHTML = `<svg viewBox="0 0 24 24" style="fill:currentColor;stroke:currentColor;"><path d="${IC.like}"/></svg> أعجبني`;
      else this.innerHTML = `<svg viewBox="0 0 24 24"><path d="${IC.like}"/></svg> إعجاب`;
    };
  });
}

function homeView() {
  app.className = "";
  app.innerHTML = `
    <header class="top-header">
      <div class="brand-logo">
        <div class="g-icon"><svg viewBox="0 0 24 24"><path d="${IC.globe}"/></svg></div>
        <div class="brand-text">Geo<span>Link</span></div>
      </div>
      <div class="search-bar"><svg viewBox="0 0 24 24"><path d="${IC.search}"/></svg><span>بحث...</span></div>
      <div class="header-actions">
        <button class="icon-btn"><svg viewBox="0 0 24 24"><path d="${IC.bell}"/></svg><span class="dot"></span></button>
        <button class="icon-btn" onclick="location.hash='#messages'"><svg viewBox="0 0 24 24"><path d="${IC.chat}"/></svg></button>
      </div>
    </header>
    <div class="feed-tabs" id="feed-tabs">
      <button data-tab="foryou" class="on">لك</button>
      <button data-tab="following">متابعة</button>
      <button data-tab="jobs">وظائف</button>
      <button data-tab="projects">مشاريع</button>
      <button data-tab="trending">الأكثر تفاعلاً</button>
    </div>
    <div class="stories-wrap">
      <div class="story"><div class="story-img add"><svg viewBox="0 0 24 24"><path d="${IC.plus}"/></svg></div><span>قصتك</span></div>
      <div class="story"><div class="story-img"><img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=150" alt=""></div><span>مشروع O&M</span></div>
    </div>
    <div class="composer-bar" onclick="openComposer()">
      <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser ? (currentUser.displayName || currentUser.email) : "G")}&background=1677F2&color=fff" alt="">
      <div class="fake-input">شارك إنجازاً، مشروعاً، أو استشارة...</div>
      <button class="media-btn">📷</button>
    </div>
    <div class="section-head">أدواتك السريعة <a href="#tools">عرض الكل</a></div>
    <div class="quick-tools">
      <a class="tool-card" href="#ai"><i><svg viewBox="0 0 24 24"><path d="${IC.wand}"/></svg></i><b>GeoAI</b><span>مساعد ذكي</span></a>
      <a class="tool-card" href="#tool:coord"><i><svg viewBox="0 0 24 24"><path d="${IC.map}"/></svg></i><b>إحداثيات</b><span>WGS84 / UTM</span></a>
      <a class="tool-card" href="#tool:level"><i><svg viewBox="0 0 24 24"><path d="M3 7h18v6H3zM12 13v8M8 21h8M7 10h.01"/></svg></i><b>مناسيب</b><span>ميزانية</span></a>
      <a class="tool-card" href="#tool:area"><i><svg viewBox="0 0 24 24"><path d="${IC.poly}"/></svg></i><b>مساحات</b><span>حساب المساحة</span></a>
      <a class="tool-card" href="#client"><i><svg viewBox="0 0 24 24"><path d="${IC.brief}"/></svg></i><b>اطلب أخصائي</b><span>خدمة مساحة</span></a>
    </div>
    <div id="feed-container" class="feed"></div>
  `;
  document.getElementById("feed-tabs").onclick = (e) => {
    if (e.target.tagName === "BUTTON") {
      document.querySelectorAll("#feed-tabs button").forEach(b => b.classList.remove("on"));
      e.target.classList.add("on");
      currentTab = e.target.dataset.tab;
      renderFeed();
    }
  };
  renderFeed();
}

function profileView() {
  app.className = "page";
  const name = currentUser ? (currentUser.displayName || currentUser.email.split("@")[0]) : "زائر";
  app.innerHTML = `
    <div class="card" style="padding:0; overflow:hidden;">
      <div class="profile-cover"><img src="https://images.unsplash.com/photo-1541888078693-019d16e6d5e1?auto=format&fit=crop&q=80&w=800" alt=""></div>
      <div class="profile-avatar-wrap"><img class="profile-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1677F2&color=fff&size=120" alt=""></div>
      <div class="profile-info">
        <div class="profile-name">${name} ${currentUser ? `<svg class="verified" viewBox="0 0 24 24"><path d="${IC.check}"/></svg>` : ''}</div>
        <div class="profile-title">${currentUser ? "أخصائي مساحة | Total Station & GNSS" : "سجّل دخولك لاستكمال ملفك المهني"}</div>
        <div class="profile-loc">📍 ${currentUser ? "القاهرة، مصر" : "—"}</div>
        <div class="profile-actions">
          ${currentUser
            ? `<button class="primary" onclick="location.hash='#pro'">تعديل الملف</button>`
            : `<button class="primary" onclick="location.hash='#pro'">تسجيل الدخول</button><button class="secondary" onclick="location.hash='#surveyor'">إنشاء حساب</button>`}
        </div>
      </div>
    </div>
    <div class="card">
      <a href="#tools" style="display:flex; align-items:center; gap:12px; padding:14px 0; border-bottom:1px solid var(--line);">
        <svg viewBox="0 0 24 24" style="width:22px;height:22px;color:var(--blue);"><path d="${IC.tools}"/></svg><span style="flex:1; font-weight:600; color:var(--navy);">جميع أدوات المساحة</span>
      </a>
      <a href="#ai" style="display:flex; align-items:center; gap:12px; padding:14px 0;">
        <svg viewBox="0 0 24 24" style="width:22px;height:22px;color:var(--blue);"><path d="${IC.wand}"/></svg><span style="flex:1; font-weight:600; color:var(--navy);">مساعد الذكاء الاصطناعي</span>
      </a>
    </div>
  `;
}

function networkView() {
  app.className = "page";
  app.innerHTML = `<h2>شبكتي</h2><div class="card">قيد التطوير</div>`;
}
function jobsView() {
  app.className = "page";
  app.innerHTML = `<h2>الوظائف</h2><div class="card">قيد التطوير</div>`;
}
function messagesView() {
  app.className = "page";
  app.innerHTML = `<h2>الرسائل</h2><div class="card">قيد التطوير</div>`;
} // ============================================================
// GeoLink App - Main Logic (Part 2/2)
// ============================================================

const TP = {
  coord: ["تحويل الإحداثيات", IC.globe], dist: ["المسافات والاتجاهات", IC.ruler],
  area: ["حساب المساحات", IC.poly], calc: ["حساب الإحداثيات", "M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"],
  level: ["حساب المناسيب", "M3 7h18v6H3zM12 13v8M8 21h8M7 10h.01"], slope: ["الميول والانحدارات", "M3 19h18M3 19L21 8"],
  earth: ["الحفر والردم", "M3 18h18M5 18l3-7 4 4 3-9 4 12"], trav: ["حساب الترافيرس", "M4 17l4-10 9-3 3 9-7 8z"],
  curve: ["حساب المنحنيات", "M4 20c0-9 7-16 16-16"], unit: ["تحويل الوحدات", IC.calc]
};

function toolsHub() {
  app.className = "page";
  app.innerHTML = `<h2>الأدوات المساحية</h2><div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
    ${Object.entries(TP).map(([k, [name, icon]]) => `
      <a href="#tool:${k}" class="card" style="margin:0; padding:16px; text-align:center; display:block;">
        <div style="width:40px;height:40px;background:#eaf1ff;color:var(--blue);border-radius:10px;display:grid;place-items:center;margin:0 auto 8px;"><svg viewBox="0 0 24 24" style="width:20px;height:20px;"><path d="${icon}"/></svg></div>
        <b style="display:block;color:var(--navy);font-size:0.85rem;">${name}</b>
      </a>`).join("")}
  </div>`;
}

function coordTool() {
  app.className = "page";
  app.innerHTML = `<h2>تحويل الإحداثيات</h2>
    <div class="card"><label>خط العرض</label><input id="lat" dir="ltr"><label>خط الطول</label><input id="lon" dir="ltr"><div id="res" style="margin-top:16px;"></div></div>`;
  document.getElementById("lat").oninput = compute; document.getElementById("lon").oninput = compute;
  function compute() {
    const lat = ang(document.getElementById("lat").value), lon = ang(document.getElementById("lon").value);
    if (isNaN(lat) || isNaN(lon)) return;
    const u = toUTM(lat, lon);
    document.getElementById("res").innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;">Zone: ${u.zone}${u.band}<br>E: ${f3(u.E)}<br>N: ${f3(u.N)}</div>`;
  }
}

function distTool() {
  app.className = "page";
  app.innerHTML = `<h2>المسافات</h2>
    <div class="card"><div style="display:flex;gap:10px;"><div><label>E1</label><input id="e1" dir="ltr"></div><div><label>N1</label><input id="n1" dir="ltr"></div></div>
    <div style="display:flex;gap:10px;margin-top:10px;"><div><label>E2</label><input id="e2" dir="ltr"></div><div><label>N2</label><input id="n2" dir="ltr"></div></div>
    <div id="res" style="margin-top:16px;"></div></div>`;
  ["e1","n1","e2","n2"].forEach(id => document.getElementById(id).oninput = compute);
  function compute() {
    const e1 = num(document.getElementById("e1").value), n1 = num(document.getElementById("n1").value);
    const e2 = num(document.getElementById("e2").value), n2 = num(document.getElementById("n2").value);
    if ([e1,n1,e2,n2].some(isNaN)) return;
    const dE = e2 - e1, dN = n2 - n1, d = Math.hypot(dE, dN);
    document.getElementById("res").innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;">Distance: ${f3(d)}<br>Azimuth: ${dms(azim(dE, dN))}</div>`;
  }
}

function areaTool() {
  app.className = "page";
  app.innerHTML = `<h2>المساحات</h2>
    <div class="card"><label>إحداثيات (E N) كل سطر</label><textarea id="pts" dir="ltr" rows="5"></textarea><div id="res" style="margin-top:16px;"></div></div>`;
  document.getElementById("pts").oninput = compute;
  function compute() {
    const P = pts(document.getElementById("pts").value);
    if (P.length < 3) return;
    const r = polyArea(P);
    document.getElementById("res").innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;">Area: ${f3(r.area)} m²<br>Feddan: ${feddan(r.area)}</div>`;
  }
}

function calcTool() { app.className = "page"; app.innerHTML = `<h2>حساب الإحداثيات</h2><div class="card">قيد التطوير</div>`; }
function levelTool() { app.className = "page"; app.innerHTML = `<h2>المناسيب</h2><div class="card">قيد التطوير</div>`; }
function slopeTool() { app.className = "page"; app.innerHTML = `<h2>الميول</h2><div class="card">قيد التطوير</div>`; }
function earthTool() { app.className = "page"; app.innerHTML = `<h2>الحفر والردم</h2><div class="card">قيد التطوير</div>`; }
function travTool() { app.className = "page"; app.innerHTML = `<h2>الترافيرس</h2><div class="card">قيد التطوير</div>`; }
function curveTool() { app.className = "page"; app.innerHTML = `<h2>المنحنيات</h2><div class="card">قيد التطوير</div>`; }
function unitTool() { app.className = "page"; app.innerHTML = `<h2>تحويل الوحدات</h2><div class="card">قيد التطوير</div>`; }

function aiView() { app.className = "page"; app.innerHTML = `<h2>GeoAI</h2><div class="card">قريباً</div>`; }
function formView() { app.className = "page"; app.innerHTML = `<h2>طلب خدمة</h2><div class="card">قريباً</div>`; }
function adminView() { app.className = "page"; app.innerHTML = `<h2>الإدارة</h2><div class="card">قريباً</div>`; }
function loginView() { app.className = "page"; app.innerHTML = `<h2>دخول</h2><div class="card">قريباً</div>`; }

function route() {
  const h = location.hash.slice(1) || "home";
  if (h === "home") { homeView(); renderNav('home'); }
  else if (h === "profile") { profileView(); renderNav('profile'); }
  else if (h === "network") { networkView(); renderNav('network'); }
  else if (h === "jobs") { jobsView(); renderNav('jobs'); }
  else if (h === "messages") { messagesView(); renderNav('home'); }
  else if (h === "tools") { toolsHub(); renderNav('home'); }
  else if (h.startsWith("tool:")) {
    const tool = h.split(":")[1];
    if (tool === "coord") coordTool();
    else if (tool === "dist") distTool();
    else if (tool === "area") areaTool();
    else if (tool === "calc") calcTool();
    else if (tool === "level") levelTool();
    else if (tool === "slope") slopeTool();
    else if (tool === "earth") earthTool();
    else if (tool === "trav") travTool();
    else if (tool === "curve") curveTool();
    else if (tool === "unit") unitTool();
    renderNav('home');
  }
  else if (h === "ai") { aiView(); document.getElementById("nav").style.display = "none"; }
  else if (h === "client" || h === "surveyor") { formView(); renderNav('home'); }
  else if (h === "pro") { loginView(); renderNav('home'); }
  else if (h === "admin") { adminView(); renderNav('home'); }
  else { homeView(); renderNav('home'); }
  if (h !== "ai") document.getElementById("nav").style.display = "flex";
  window.scrollTo(0, 0);
}

auth.onAuthStateChanged(user => { currentUser = user; });
window.onhashchange = route;
route();
