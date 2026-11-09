// ============================================================
// GeoLink App - Main Logic (Part 1/2)
// ============================================================
const { IC, num, f3, fmt, dms, ang, rad, deg, toUTM, fromUTM, vincenty, pts, feddan, polyArea, azim, quad, SH, UN, zoneOf, bandOf, FED } = window.GL;

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

// ---- Mock Posts ----
const MOCK_POSTS = [
  { id: 1, author: "مكتب AL Helwey للمساحة", role: "Surveyor / QC Team Leader", time: "منذ ساعتين", content: "تم بحمد الله الانتهاء من أعمال الرفع المساحي لمشروع O&M Complex. نستخدم أحدث أجهزة Total Station لضمان دقة عالية في التوقيع والمناسيب. #مساحة #هندسة", image: "https://images.unsplash.com/photo-1541888078693-019d16e6d5e1?auto=format&fit=crop&q=80&w=600", likes: 124, comments: 12, verified: true },
  { id: 2, author: "م. أحمد مصطفى", role: "GIS Specialist & Surveyor", time: "منذ 5 ساعات", content: "نصيحة اليوم: عند استخدام أجهزة GPS/RTK، تأكد دائماً من وجود سماء مفتوحة وتجنب العمل بجوار المباني العالية أو أشجار كثيفة لتجنب خطأ الـ Multipath. الدقة بتعتمد على نظافة الإشارة. 📡", image: null, likes: 89, comments: 5, verified: false }
];

// ================= NAV =================
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

// ================= FEED =================
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

// ================= HOME =================
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
      <div class="story"><div class="story-img"><img src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=150" alt=""></div><span>تحديثات GPS</span></div>
      <div class="story"><div class="story-img"><img src="https://images.unsplash.com/photo-1541888078693-019d16e6d5e1?auto=format&fit=crop&q=80&w=150" alt=""></div><span>AL Helwey</span></div>
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

// ================= PROFILE =================
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
        <div class="profile-stats">
          <span><b>1.2K</b> متابع</span><span><b>520</b> اتصال</span><span><b>7</b> سنوات خبرة</span>
        </div>
        <div class="profile-actions">
          ${currentUser
            ? `<button class="primary" onclick="location.hash='#pro'">تعديل الملف</button><button class="secondary">مشاركة</button>`
            : `<button class="primary" onclick="location.hash='#pro'">تسجيل الدخول</button><button class="secondary" onclick="location.hash='#surveyor'">إنشاء حساب</button>`}
        </div>
      </div>
    </div>
    <div class="card">
      <h3 style="margin-top:0; color:var(--navy); font-size:1.05rem;">الأدوات والإعدادات</h3>
      <a href="#tools" style="display:flex; align-items:center; gap:12px; padding:14px 0; border-bottom:1px solid var(--line);">
        <svg viewBox="0 0 24 24" style="width:22px;height:22px;color:var(--blue);"><path d="${IC.tools}"/></svg><span style="flex:1; font-weight:600; color:var(--navy);">جميع أدوات المساحة</span><svg viewBox="0 0 24 24" style="width:16px;height:16px;color:var(--mut); transform:scaleX(-1);"><path d="${IC.arrow}"/></svg>
      </a>
      <a href="#ai" style="display:flex; align-items:center; gap:12px; padding:14px 0; border-bottom:1px solid var(--line);">
        <svg viewBox="0 0 24 24" style="width:22px;height:22px;color:var(--blue);"><path d="${IC.wand}"/></svg><span style="flex:1; font-weight:600; color:var(--navy);">مساعد الذكاء الاصطناعي</span><svg viewBox="0 0 24 24" style="width:16px;height:16px;color:var(--mut); transform:scaleX(-1);"><path d="${IC.arrow}"/></svg>
      </a>
      <a href="#admin" style="display:flex; align-items:center; gap:12px; padding:14px 0; border-bottom:1px solid var(--line);">
        <svg viewBox="0 0 24 24" style="width:22px;height:22px;color:var(--blue);"><path d="${IC.shield}"/></svg><span style="flex:1; font-weight:600; color:var(--navy);">لوحة التحكم</span><svg viewBox="0 0 24 24" style="width:16px;height:16px;color:var(--mut); transform:scaleX(-1);"><path d="${IC.arrow}"/></svg>
      </a>
      <a href="#client" style="display:flex; align-items:center; gap:12px; padding:14px 0;">
        <svg viewBox="0 0 24 24" style="width:22px;height:22px;color:var(--blue);"><path d="${IC.doc}"/></svg><span style="flex:1; font-weight:600; color:var(--navy);">طلب خدمة مساحة</span><svg viewBox="0 0 24 24" style="width:16px;height:16px;color:var(--mut); transform:scaleX(-1);"><path d="${IC.arrow}"/></svg>
      </a>
    </div>
    <div class="card">
      <h3 style="margin-top:0; color:var(--navy); font-size:1.05rem;">نظام التحقق</h3>
      <p style="font-size:0.88rem; color:var(--mut); margin-bottom:14px; line-height:1.6;">احصل على العلامة الزرقاء لزيادة ثقة العملاء والوصول لفرص أكثر.</p>
      <button class="go" style="margin-top:0; background:#eaf1ff; color:var(--blue); border:1px solid var(--blue);">طلب التوثيق</button>
    </div>
  `;
}

// ================= NETWORK & JOBS & MESSAGES =================
function networkView() {
  app.className = "page";
  app.innerHTML = `
    <h2>شبكتي</h2>
    <div class="card">
      <h3 style="margin-top:0; color:var(--navy); font-size:1rem;">اقتراحات لك</h3>
      <div style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--line);">
        <img src="https://ui-avatars.com/api/?name=AH&background=102A56&color=fff" style="width:48px;height:48px;border-radius:50%;">
        <div style="flex:1;"><div style="font-weight:700; color:var(--navy); font-size:0.92rem;">م. أحمد حسن <svg viewBox="0 0 24 24" style="width:14px;height:14px;color:var(--blue);vertical-align:middle;"><path d="${IC.check}"/></svg></div><div style="font-size:0.78rem; color:var(--mut);">Surveyor | Total Station</div></div>
        <button style="padding:6px 14px; background:#eaf1ff; color:var(--blue); border:1px solid var(--blue); border-radius:20px; font:inherit; font-size:0.8rem; font-weight:600; cursor:pointer;">متابعة</button>
      </div>
      <div style="display:flex; align-items:center; gap:12px; padding:12px 0;">
        <img src="https://ui-avatars.com/api/?name=SM&background=1677F2&color=fff" style="width:48px;height:48px;border-radius:50%;">
        <div style="flex:1;"><div style="font-weight:700; color:var(--navy); font-size:0.92rem;">م. سارة محمود</div><div style="font-size:0.78rem; color:var(--mut);">GIS Specialist | Mapping</div></div>
        <button style="padding:6px 14px; background:#eaf1ff; color:var(--blue); border:1px solid var(--blue); border-radius:20px; font:inherit; font-size:0.8rem; font-weight:600; cursor:pointer;">متابعة</button>
      </div>
    </div>
    <div class="card">
      <h3 style="margin-top:0; color:var(--navy); font-size:1rem;">مجتمعات مقترحة</h3>
      <div style="padding:10px 0; font-size:0.9rem; color:var(--text);">📍 Total Station Professionals</div>
      <div style="padding:10px 0; font-size:0.9rem; color:var(--text);">📍 GIS & Geospatial</div>
    </div>
  `;
}
function jobsView() {
  app.className = "page";
  app.innerHTML = `
    <h2>فرص العمل</h2>
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <b style="color:var(--navy);">Surveyor - Total Station</b><span style="font-size:0.72rem; background:#eaf1ff; color:var(--blue); padding:2px 10px; border-radius:99px; font-weight:600;">جديد</span>
      </div>
      <div style="font-size:0.85rem; color:var(--mut); margin-bottom:4px;">📍 القاهرة، مصر · بدوام كامل</div>
      <div style="font-size:0.85rem; color:var(--mut); margin-bottom:12px;">شركة المقاولون العرب</div>
      <button style="padding:8px 16px; background:var(--blue); color:#fff; border:none; border-radius:20px; font:inherit; font-size:0.85rem; font-weight:600; cursor:pointer;">تقدم الآن</button>
    </div>
  `;
}
function messagesView() {
  app.className = "page";
  app.innerHTML = `
    <h2>الرسائل</h2>
    <div class="card" style="display:flex; align-items:center; gap:12px; padding:14px;">
      <img src="https://ui-avatars.com/api/?name=AH&background=102A56&color=fff" style="width:48px;height:48px;border-radius:50%;">
      <div style="flex:1;"><div style="font-weight:700; color:var(--navy); font-size:0.92rem;">م. أحمد حسن</div><div style="font-size:0.8rem; color:var(--mut);">شكراً على التعاون في مشروع...</div></div>
    </div>
  `;
}

// ================= TOOLS HUB =================
const TP = {
  coord: ["تحويل الإحداثيات", "WGS84 ↔ UTM", IC.globe],
  dist: ["المسافات والاتجاهات", "المسافة و Azimuth", IC.ruler],
  area: ["حساب المساحات", "أشكال وإحداثيات", IC.poly],
  calc: ["حساب الإحداثيات", "أمامي وعكسي", "M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"],
  level: ["حساب المناسيب", "HI أو Rise & Fall", "M3 7h18v6H3zM12 13v8M8 21h8M7 10h.01"],
  slope: ["الميول والانحدارات", "النسبة والدرجات", "M3 19h18M3 19L21 8"],
  earth: ["الحفر والردم", "متوسط المساحات", "M3 18h18M5 18l3-7 4 4 3-9 4 12"],
  trav: ["حساب الترافيرس", "تصحيح Bowditch", "M4 17l4-10 9-3 3 9-7 8z"],
  curve: ["حساب المنحنيات", "عناصر المنحنى", "M4 20c0-9 7-16 16-16"],
  unit: ["تحويل الوحدات", "طول، مساحة، زوايا", IC.calc]
};

function toolsHub() {
  app.className = "page";
  app.innerHTML = `<h2>الأدوات المساحية</h2>
    <p style="color:var(--mut); margin:0 0 16px; font-size:0.9rem;">حسابات احترافية تعمل مباشرة على جهازك.</p>
    
    <h3 style="font-size:1rem; color:var(--navy); margin-bottom:10px;">الإحداثيات والقياسات</h3>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
      ${Object.entries(TP).slice(0,4).map(([k, [name, desc, icon]]) => `
        <a href="#tool:${k}" class="card" style="margin:0; padding:16px; text-align:center; display:block;">
          <div style="width:40px;height:40px;background:#eaf1ff;color:var(--blue);border-radius:10px;display:grid;place-items:center;margin:0 auto 8px;"><svg viewBox="0 0 24 24" style="width:20px;height:20px;"><path d="${icon}"/></svg></div>
          <b style="display:block;color:var(--navy);font-size:0.85rem;">${name}</b>
        </a>`).join("")}
    </div>

    <h3 style="font-size:1rem; color:var(--navy); margin-bottom:10px;">الحسابات الهندسية</h3>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
      ${Object.entries(TP).slice(4).map(([k, [name, desc, icon]]) => `
        <a href="#tool:${k}" class="card" style="margin:0; padding:16px; text-align:center; display:block;">
          <div style="width:40px;height:40px;background:#eaf1ff;color:var(--blue);border-radius:10px;display:grid;place-items:center;margin:0 auto 8px;"><svg viewBox="0 0 24 24" style="width:20px;height:20px;"><path d="${icon}"/></svg></div>
          <b style="display:block;color:var(--navy);font-size:0.85rem;">${name}</b>
        </a>`).join("")}
    </div>
  `;
}

// ================= TOOL: COORD =================
function coordTool() {
  app.className = "page";
  app.innerHTML = `
    <a href="#tools" style="color:var(--mut); font-size:0.9rem; display:inline-block; margin-bottom:8px;">‹ رجوع للأدوات</a>
    <h2>تحويل الإحداثيات</h2>
    <div class="card">
      <div style="display:flex; gap:8px; margin-bottom:16px;">
        <button id="tab-w2u" class="on" style="flex:1;padding:10px;border:1px solid var(--line);background:var(--navy);color:#fff;border-radius:10px;font:inherit;font-size:0.85rem;font-weight:600;cursor:pointer;">WGS84 → UTM</button>
        <button id="tab-u2w" style="flex:1;padding:10px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:10px;font:inherit;font-size:0.85rem;font-weight:600;cursor:pointer;">UTM → WGS84</button>
      </div>
      <div id="coord-form"></div><div id="coord-result" style="margin-top:16px;"></div>
    </div>
  `;
  let mode = "w2u";
  const render = () => {
    const f = document.getElementById("coord-form");
    f.innerHTML = mode === "w2u" 
      ? `<label>خط العرض</label><input id="lat" dir="ltr" placeholder="30.0444"><label>خط الطول</label><input id="lon" dir="ltr" placeholder="31.2357"><label>رقم المنطقة (اختياري)</label><input id="zone" dir="ltr" placeholder="تلقائي">`
      : `<label>Easting (م)</label><input id="e" dir="ltr" placeholder="329899"><label>Northing (م)</label><input id="n" dir="ltr" placeholder="3325016"><label>رقم المنطقة</label><input id="zone" dir="ltr" placeholder="36">`;
    f.querySelectorAll("input").forEach(inp => inp.oninput = compute);
  };
  const compute = () => {
    const box = document.getElementById("coord-result");
    try {
      if (mode === "w2u") {
        const lat = ang(document.getElementById("lat").value), lon = ang(document.getElementById("lon").value);
        if (isNaN(lat) || isNaN(lon)) { box.innerHTML = ""; return; }
        const z = document.getElementById("zone").value.trim();
        const u = toUTM(lat, lon, z ? +z : 0);
        box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
          <div><b>Zone:</b> ${u.zone}${u.band}</div>
          <div><b>Easting:</b> ${f3(u.E)} م</div>
          <div><b>Northing:</b> ${f3(u.N)} م</div>
        </div>`;
      } else {
        const e = num(document.getElementById("e").value), n = num(document.getElementById("n").value), z = num(document.getElementById("zone").value);
        if (isNaN(e) || isNaN(n) || isNaN(z)) { box.innerHTML = ""; return; }
        const r = fromUTM(e, n, z, false);
        box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
          <div><b>Latitude:</b> ${r.lat.toFixed(8)}</div>
          <div><b>Longitude:</b> ${r.lon.toFixed(8)}</div>
          <div><b>DMS:</b> ${dms(r.lat)} N, ${dms(r.lon)} E</div>
        </div>`;  
    }
 } catch(err) { console.error(err); }
  };
  document.getElementById("tab-w2u").onclick = () => { mode = "w2u"; document.getElementById("tab-w2u").style.cssText = "flex:1;padding:10px;border:1px solid var(--line);background:var(--navy);color:#fff;border-radius:10px;font:inherit;font-size:0.85rem;font-weight:600;cursor:pointer;"; document.getElementById("tab-u2w").style.cssText = "flex:1;padding:10px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:10px;font:inherit;font-size:0.85rem;font-weight:600;cursor:pointer;"; render(); };
  document.getElementById("tab-u2w").onclick = () => { mode = "u2w"; document.getElementById("tab-u2w").style.cssText = "flex:1;padding:10px;border:1px solid var(--line);background:var(--navy);color:#fff;border-radius:10px;font:inherit;font-size:0.85rem;font-weight:600;cursor:pointer;"; document.getElementById("tab-w2u").style.cssText = "flex:1;padding:10px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:10px;font:inherit;font-size:0.85rem;font-weight:600;cursor:pointer;"; render(); };
  render();
}

// ================= TOOL: DISTANCE =================
function distTool() {
  app.className = "page";
  app.innerHTML = `
    <a href="#tools" style="color:var(--mut); font-size:0.9rem; display:inline-block; margin-bottom:8px;">‹ رجوع للأدوات</a>
    <h2>المسافات والاتجاهات</h2>
    <div class="card">
      <div style="display:flex; gap:8px; margin-bottom:16px;">
        <button id="dtab-pp" class="on" style="flex:1;padding:10px;border:1px solid var(--line);background:var(--navy);color:#fff;border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;">بين نقطتين</button>
        <button id="dtab-pf" style="flex:1;padding:10px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;">نقطة + اتجاه</button>
        <button id="dtab-geo" style="flex:1;padding:10px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;">جغرافي</button>
      </div>
      <div id="dist-form"></div>
      <div id="dist-result" style="margin-top:16px;"></div>
    </div>
  `;
  let mode = "pp";
  const setActive = (id) => {
    ["dtab-pp","dtab-pf","dtab-geo"].forEach(x => {
      const b = document.getElementById(x);
      b.style.cssText = x === id 
        ? "flex:1;padding:10px;border:1px solid var(--line);background:var(--navy);color:#fff;border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;"
        : "flex:1;padding:10px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;";
    });
  };
  const render = () => {
    const f = document.getElementById("dist-form");
    if (mode === "pp") {
      f.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><label>E1</label><input id="e1" dir="ltr" placeholder="1000"></div>
          <div><label>N1</label><input id="n1" dir="ltr" placeholder="2000"></div>
          <div><label>E2</label><input id="e2" dir="ltr" placeholder="1100"></div>
          <div><label>N2</label><input id="n2" dir="ltr" placeholder="2100"></div>
        </div>`;
    } else if (mode === "pf") {
      f.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><label>E1</label><input id="e1" dir="ltr" placeholder="1000"></div>
          <div><label>N1</label><input id="n1" dir="ltr" placeholder="2000"></div>
        </div>
        <label>الاتجاه Azimuth</label><input id="az" dir="ltr" placeholder="45 أو 45 30 0">
        <label>المسافة (م)</label><input id="d" dir="ltr" placeholder="100">`;
    } else {
      f.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><label>خط العرض 1</label><input id="la1" dir="ltr" placeholder="30.0444"></div>
          <div><label>خط الطول 1</label><input id="lo1" dir="ltr" placeholder="31.2357"></div>
          <div><label>خط العرض 2</label><input id="la2" dir="ltr" placeholder="31.2001"></div>
          <div><label>خط الطول 2</label><input id="lo2" dir="ltr" placeholder="29.9187"></div>
        </div>`;
    }
    f.querySelectorAll("input").forEach(inp => inp.oninput = compute);
  };
  const compute = () => {
    const box = document.getElementById("dist-result");
    try {
      if (mode === "pp") {
        const e1 = num(document.getElementById("e1").value), n1 = num(document.getElementById("n1").value);
        const e2 = num(document.getElementById("e2").value), n2 = num(document.getElementById("n2").value);
        if ([e1,n1,e2,n2].some(isNaN)) { box.innerHTML = ""; return; }
        const dE = e2 - e1, dN = n2 - n1, d = Math.hypot(dE, dN);
        if (d === 0) { box.innerHTML = "<p style='color:var(--red);'>النقطتان متطابقتان</p>"; return; }
        const az = azim(dE, dN);
        box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
          <div><b>ΔE:</b> ${f3(dE)} م</div>
          <div><b>ΔN:</b> ${f3(dN)} م</div>
          <div><b>المسافة:</b> ${f3(d)} م</div>
          <div><b>Azimuth:</b> ${dms(az)} (${az.toFixed(4)}°)</div>
          <div><b>Bearing:</b> ${quad(az)}</div>
        </div>`;
      } else if (mode === "pf") {
        const e1 = num(document.getElementById("e1").value), n1 = num(document.getElementById("n1").value);
        const az = ang(document.getElementById("az").value), d = num(document.getElementById("d").value);
        if ([e1,n1,az,d].some(isNaN)) { box.innerHTML = ""; return; }
        const e2 = e1 + d * Math.sin(rad(az)), n2 = n1 + d * Math.cos(rad(az));
        box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
          <div><b>E2:</b> ${f3(e2)}</div>
          <div><b>N2:</b> ${f3(n2)}</div>
        </div>`;
      } else {
        const la1 = ang(document.getElementById("la1").value), lo1 = ang(document.getElementById("lo1").value);
        const la2 = ang(document.getElementById("la2").value), lo2 = ang(document.getElementById("lo2").value);
        if ([la1,lo1,la2,lo2].some(isNaN)) { box.innerHTML = ""; return; }
        const r = vincenty(la1, lo1, la2, lo2);
        if (r.s === 0) { box.innerHTML = "<p style='color:var(--red);'>النقطتان متطابقتان</p>"; return; }
        box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
          <div><b>المسافة:</b> ${f3(r.s)} م (${(r.s/1000).toFixed(3)} كم)</div>
          <div><b>Azimuth:</b> ${dms(r.a1)}</div>
          <div><b>Back Azimuth:</b> ${dms((r.a2 + 180) % 360)}</div>
        </div>`;
      }
    } catch(e) { console.error(e); }
  };
  document.getElementById("dtab-pp").onclick = () => { mode = "pp"; setActive("dtab-pp"); render(); };
  document.getElementById("dtab-pf").onclick = () => { mode = "pf"; setActive("dtab-pf"); render(); };
  document.getElementById("dtab-geo").onclick = () => { mode = "geo"; setActive("dtab-geo"); render(); };
  render();
}

// ================= TOOL: AREA =================
function areaTool() {
  app.className = "page";
  app.innerHTML = `
    <a href="#tools" style="color:var(--mut); font-size:0.9rem; display:inline-block; margin-bottom:8px;">‹ رجوع للأدوات</a>
    <h2>حساب المساحات</h2>
    <div class="card">
      <div style="display:flex; gap:8px; margin-bottom:16px;">
        <button id="atab-shape" class="on" style="flex:1;padding:10px;border:1px solid var(--line);background:var(--navy);color:#fff;border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;">شكل هندسي</button>
        <button id="atab-en" style="flex:1;padding:10px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;">إحداثيات E,N</button>
        <button id="atab-ll" style="flex:1;padding:10px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;">جغرافي</button>
      </div>
      <div id="area-form"></div>
      <div id="area-result" style="margin-top:16px;"></div>
    </div>
  `;
  let mode = "shape", shape = "rect";
  const setActive = (id) => {
    ["atab-shape","atab-en","atab-ll"].forEach(x => {
      const b = document.getElementById(x);
      b.style.cssText = x === id 
        ? "flex:1;padding:10px;border:1px solid var(--line);background:var(--navy);color:#fff;border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;"
        : "flex:1;padding:10px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;";
    });
  };
  const render = () => {
    const f = document.getElementById("area-form");
    if (mode === "shape") {
      const opts = Object.entries(SH).map(([k, s]) => `<option value="${k}" ${k===shape?'selected':''}>${s[0]}</option>`).join("");
      const fields = SH[shape][1].map(([k, l]) => `<label>${l}</label><input id="s_${k}" dir="ltr" placeholder="0">`).join("");
      f.innerHTML = `<label>الشكل</label><select id="shape-sel">${opts}</select>${fields}`;
      document.getElementById("shape-sel").onchange = (e) => { shape = e.target.value; render(); };
    } else if (mode === "en") {
      f.innerHTML = `<label>النقاط (E N - كل سطر نقطة)</label>
        <textarea id="en-pts" dir="ltr" rows="6" placeholder="500000 3000000&#10;500100 3000000&#10;500100 3000100&#10;500000 3000100" style="font-family:monospace;"></textarea>`;
    } else {
      f.innerHTML = `<label>النقاط (lat lon - كل سطر نقطة)</label>
        <textarea id="ll-pts" dir="ltr" rows="6" placeholder="30.0000 31.0000&#10;30.0000 31.0010&#10;30.0010 31.0010&#10;30.0010 31.0000" style="font-family:monospace;"></textarea>`;
    }
    f.querySelectorAll("input, textarea, select").forEach(inp => inp.oninput = compute);
  };
  const compute = () => {
    const box = document.getElementById("area-result");
    try {
      if (mode === "shape") {
        const q = {}; SH[shape][1].forEach(([k]) => q[k] = num(document.getElementById("s_" + k).value));
        const vals = Object.values(q); if (vals.some(isNaN)) { box.innerHTML = ""; return; }
        if (vals.some(x => x <= 0)) { box.innerHTML = "<p style='color:var(--red);'>القيم يجب أن تكون > 0</p>"; return; }
        let A, per = null;
        if (shape === "rect") { A = q.a * q.b; per = 2*(q.a+q.b); }
        else if (shape === "tri") A = q.a * q.h / 2;
        else if (shape === "heron") { const s = (q.a+q.b+q.c)/2, t = s*(s-q.a)*(s-q.b)*(s-q.c); if (t <= 0) { box.innerHTML = "<p style='color:var(--red);'>الأضلاع لا تكون مثلثاً</p>"; return; } A = Math.sqrt(t); per = 2*s; }
        else if (shape === "circle") { A = Math.PI*q.r*q.r; per = 2*Math.PI*q.r; }
        else A = (q.a+q.b)/2 * q.h;
        box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
          <div><b>المساحة:</b> ${f3(A)} م²</div>
          <div><b>فدان:</b> ${feddan(A)}</div>
          <div><b>هكتار:</b> ${(A/10000).toFixed(5)}</div>
          ${per ? `<div><b>المحيط:</b> ${f3(per)} م</div>` : ''}
        </div>`;
      } else {
        const txt = document.getElementById(mode === "en" ? "en-pts" : "ll-pts").value;
        const P = pts(txt); if (!P.length || P.length < 3) { box.innerHTML = ""; return; }
        if (mode === "en") {
          const r = polyArea(P);
          box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
            <div><b>المساحة:</b> ${f3(r.area)} م²</div>
            <div><b>فدان:</b> ${feddan(r.area)}</div>
            <div><b>المحيط:</b> ${f3(r.per)} م</div>
            <div><b>عدد النقاط:</b> ${P.length}</div>
          </div>`;
        } else {
          const z = zoneOf(P[0][1]);
          const U = P.map(p => { const u = toUTM(p[0], p[1], z); return [u.E, u.N]; });
          const r = polyArea(U);
          box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
            <div><b>المساحة:</b> ${f3(r.area)} م²</div>
            <div><b>فدان:</b> ${feddan(r.area)}</div>
            <div><b>المحيط:</b> ${f3(r.per)} م</div>
            <div><b>Zone:</b> ${z}${bandOf(P[0][0])}</div>
          </div>`;
        }
      }
    } catch(e) { console.error(e); }
  };
  document.getElementById("atab-shape").onclick = () => { mode = "shape"; setActive("atab-shape"); render(); };
  document.getElementById("atab-en").onclick = () => { mode = "en"; setActive("atab-en"); render(); };
  document.getElementById("atab-ll").onclick = () => { mode = "ll"; setActive("atab-ll"); render(); };
  render();
}

// ================= TOOL: LEVEL =================
function levelTool() {
  app.className = "page";
  app.innerHTML = `
    <a href="#tools" style="color:var(--mut); font-size:0.9rem; display:inline-block; margin-bottom:8px;">‹ رجوع للأدوات</a>
    <h2>حساب المناسيب</h2>
    <div class="card">
      <label>منسوب نقطة البداية RL (م)</label>
      <input id="lv-rl0" dir="ltr" placeholder="100.000">
      <label>القراءات (BS/IS/FS ثم القيمة - كل سطر)</label>
      <textarea id="lv-t" dir="ltr" rows="6" placeholder="BS 1.525&#10;IS 1.230&#10;FS 0.975&#10;BS 1.780&#10;FS 1.215" style="font-family:monospace;"></textarea>
      <label>منسوب الإقفال (اختياري)</label>
      <input id="lv-rl1" dir="ltr" placeholder="101.110">
      <div id="lv-result" style="margin-top:16px;"></div>
    </div>
  `;
  const compute = () => {
    const box = document.getElementById("lv-result");
    const rl0 = num(document.getElementById("lv-rl0").value);
    if (isNaN(rl0)) { box.innerHTML = ""; return; }
    const L = document.getElementById("lv-t").value.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const rd = [];
    for (const l of L) {
      const m = l.match(/^(BS|IS|FS)\s*[:=,]?\s*(\S+)$/i);
      if (!m) { box.innerHTML = `<p style="color:var(--red);">سطر غير صالح: ${l}</p>`; return; }
      const x = num(m[2]); if (isNaN(x)) { box.innerHTML = `<p style="color:var(--red);">قيمة غير صالحة: ${m[2]}</p>`; return; }
      rd.push([m[1].toUpperCase(), x]);
    }
    if (!rd.length) { box.innerHTML = ""; return; }
    let rl = rl0, hi = 0;
    const out = [];
    rd.forEach(([t, x], i) => {
      if (t === "BS") { hi = rl + x; out.push([`#${i+1} BS ${x}`, `HI ${f3(hi)} | RL ${f3(rl)}`]); return; }
      rl = hi - x; out.push([`#${i+1} ${t} ${x}`, `RL ${f3(rl)}`]);
    });
    box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-size:0.85rem;">
      ${out.map(([k,v]) => `<div style="padding:4px 0;border-bottom:1px dashed var(--line);"><b style="font-family:monospace;">${k}</b> → ${v}</div>`).join("")}
    </div>`;
  };
  document.getElementById("lv-rl0").oninput = compute;
  document.getElementById("lv-t").oninput = compute;
  document.getElementById("lv-rl1").oninput = compute;
}

// ================= TOOL: UNITS =================
function unitTool() {
  app.className = "page";
  app.innerHTML = `
    <a href="#tools" style="color:var(--mut); font-size:0.9rem; display:inline-block; margin-bottom:8px;">‹ رجوع للأدوات</a>
    <h2>تحويل الوحدات</h2>
    <div class="card">
      <label>الفئة</label>
      <select id="u-cat">
        ${Object.entries(UN).map(([k, c]) => `<option value="${k}">${c[0]}</option>`).join("")}
      </select>
      <label>القيمة</label>
      <input id="u-val" dir="ltr" placeholder="1">
      <label>من وحدة</label>
      <select id="u-from"></select>
      <div id="u-result" style="margin-top:16px;"></div>
    </div>
  `;
  const updateUnits = () => {
    const cat = document.getElementById("u-cat").value;
    document.getElementById("u-from").innerHTML = UN[cat][1].map(([n], i) => `<option value="${i}">${n}</option>`).join("");
    compute();
  };
  const compute = () => {
    const cat = document.getElementById("u-cat").value;
    const x = num(document.getElementById("u-val").value);
    const from = +document.getElementById("u-from").value;
    const box = document.getElementById("u-result");
    if (isNaN(x)) { box.innerHTML = ""; return; }
    const L = UN[cat][1], base = x * L[from][1];
    box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
      ${L.map(([n, f], i) => i === from ? '' : `<div><b>${n}:</b> ${fmt(base / f)}</div>`).join("")}
      ${cat === "area" ? `<div style="border-top:1px dashed var(--line);margin-top:8px;padding-top:8px;"><b>فدان/قيراط/سهم:</b> ${feddan(base)}</div>` : ''}
      ${cat === "ang" ? `<div style="border-top:1px dashed var(--line);margin-top:8px;padding-top:8px;"><b>DMS:</b> ${dms(base)}</div>` : ""}
    </div>`;
  };
  document.getElementById("u-cat").onchange = updateUnits;
  document.getElementById("u-from").onchange = compute;
  document.getElementById("u-val").oninput = compute;
  updateUnits();
}// ============================================================
// GeoLink App - Main Logic (Part 2/2 - Continuation)
// ============================================================

// ================= TOOL: CALC (حساب الإحداثيات) =================
function calcTool() {
  app.className = "page";
  app.innerHTML = `
    <a href="#tools" style="color:var(--mut); font-size:0.9rem; display:inline-block; margin-bottom:8px;">‹ رجوع للأدوات</a>
    <h2>حساب الإحداثيات</h2>
    <div class="card">
      <div style="display:flex; gap:8px; margin-bottom:16px;">
        <button id="ctab-fwd" class="on" style="flex:1;padding:10px;border:1px solid var(--line);background:var(--navy);color:#fff;border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;">حساب أمامي</button>
        <button id="ctab-inv" style="flex:1;padding:10px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;">حساب عكسي</button>
      </div>
      <div id="calc-form"></div>
      <div id="calc-result" style="margin-top:16px;"></div>
    </div>
  `;
  let mode = "fwd";
  const render = () => {
    const f = document.getElementById("calc-form");
    if (mode === "fwd") {
      f.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><label>E1</label><input id="ce1" dir="ltr" placeholder="1000"></div>
          <div><label>N1</label><input id="cn1" dir="ltr" placeholder="2000"></div>
        </div>
        <label>Azimuth</label><input id="caz" dir="ltr" placeholder="45 30 0">
        <label>المسافة (م)</label><input id="cd" dir="ltr" placeholder="100">`;
    } else {
      f.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><label>E1</label><input id="ce1" dir="ltr" placeholder="1000"></div>
          <div><label>N1</label><input id="cn1" dir="ltr" placeholder="2000"></div>
          <div><label>E2</label><input id="ce2" dir="ltr" placeholder="1070.7"></div>
          <div><label>N2</label><input id="cn2" dir="ltr" placeholder="2070.7"></div>
        </div>`;
    }
    f.querySelectorAll("input").forEach(inp => inp.oninput = compute);
  };
  const compute = () => {
    const box = document.getElementById("calc-result");
    try {
      const e1 = num(document.getElementById("ce1").value), n1 = num(document.getElementById("cn1").value);
      if (mode === "fwd") {
        const az = ang(document.getElementById("caz").value), d = num(document.getElementById("cd").value);
        if ([e1,n1,az,d].some(isNaN)) { box.innerHTML = ""; return; }
        const e2 = e1 + d * Math.sin(rad(az)), n2 = n1 + d * Math.cos(rad(az));
        box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
          <div><b>E2:</b> ${f3(e2)}</div><div><b>N2:</b> ${f3(n2)}</div>
        </div>`;
      } else {
        const e2 = num(document.getElementById("ce2").value), n2 = num(document.getElementById("cn2").value);
        if ([e1,n1,e2,n2].some(isNaN)) { box.innerHTML = ""; return; }
        const dE = e2 - e1, dN = n2 - n1, d = Math.hypot(dE, dN);
        if (d === 0) { box.innerHTML = "<p style='color:var(--red);'>النقطتان متطابقتان</p>"; return; }
        const az = azim(dE, dN);
        box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
          <div><b>المسافة:</b> ${f3(d)} م</div>
          <div><b>Azimuth:</b> ${dms(az)}</div>
          <div><b>Back Azimuth:</b> ${dms((az + 180) % 360)}</div>
        </div>`;
      }
    } catch(e) { console.error(e); }
  };
  document.getElementById("ctab-fwd").onclick = () => { mode = "fwd"; document.getElementById("ctab-fwd").style.cssText = "flex:1;padding:10px;border:1px solid var(--line);background:var(--navy);color:#fff;border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;"; document.getElementById("ctab-inv").style.cssText = "flex:1;padding:10px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;"; render(); };
  document.getElementById("ctab-inv").onclick = () => { mode = "inv"; document.getElementById("ctab-inv").style.cssText = "flex:1;padding:10px;border:1px solid var(--line);background:var(--navy);color:#fff;border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;"; document.getElementById("ctab-fwd").style.cssText = "flex:1;padding:10px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:10px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;"; render(); };
  render();
}

// ================= TOOL: SLOPE (الميول) =================
function slopeTool() {
  app.className = "page";
  app.innerHTML = `
    <a href="#tools" style="color:var(--mut); font-size:0.9rem; display:inline-block; margin-bottom:8px;">‹ رجوع للأدوات</a>
    <h2>الميول والانحدارات</h2>
    <div class="card">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div><label>المسافة الأفقية (م)</label><input id="sl-d" dir="ltr" placeholder="100"></div>
        <div><label>فرق المنسوب (م)</label><input id="sl-h" dir="ltr" placeholder="10"></div>
      </div>
      <div id="sl-result" style="margin-top:16px;"></div>
    </div>
  `;
  const compute = () => {
    const box = document.getElementById("sl-result");
    const d = num(document.getElementById("sl-d").value), h = num(document.getElementById("sl-h").value);
    if (isNaN(d) || isNaN(h) || d === 0) { box.innerHTML = ""; return; }
    const pct = (h / d) * 100, degVal = deg(Math.atan(h / d)), ratio = d / Math.abs(h);
    box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
      <div><b>الميل (%):</b> ${pct.toFixed(2)}%</div>
      <div><b>الزاوية (°):</b> ${degVal.toFixed(4)}°</div>
      <div><b>الزاوية (DMS):</b> ${dms(degVal)}</div>
      <div><b>النسبة (1:n):</b> ${h===0 ? "0" : "1 : " + ratio.toFixed(2)}</div>
    </div>`;
  };
  document.getElementById("sl-d").oninput = compute;
  document.getElementById("sl-h").oninput = compute;
}

// ================= TOOL: EARTHWORK (الحفر والردم) =================
function earthTool() {
  app.className = "page";
  app.innerHTML = `
    <a href="#tools" style="color:var(--mut); font-size:0.9rem; display:inline-block; margin-bottom:8px;">‹ رجوع للأدوات</a>
    <h2>الحفر والردم (متوسط المساحات)</h2>
    <div class="card">
      <label>المقاطع (كل سطر: المسافة، مساحة الحفر، مساحة الردم)</label>
      <textarea id="ew-t" dir="ltr" rows="6" placeholder="0 10 0&#10;20 15 5&#10;40 20 0" style="font-family:monospace;"></textarea>
      <div id="ew-result" style="margin-top:16px;"></div>
    </div>
  `;
  const compute = () => {
    const box = document.getElementById("ew-result");
    const lines = document.getElementById("ew-t").value.split(/\n+/).map(l=>l.trim()).filter(Boolean);
    if (lines.length < 2) { box.innerHTML = ""; return; }
    let cutVol = 0, fillVol = 0;
    try {
      for (let i = 1; i < lines.length; i++) {
        const p1 = lines[i-1].split(/[\s,;]+/).map(Number);
        const p2 = lines[i].split(/[\s,;]+/).map(Number);
        if (p1.length < 3 || p2.length < 3 || p1.some(isNaN) || p2.some(isNaN)) {
          box.innerHTML = "<p style='color:var(--red);'>تأكد من كتابة 3 أرقام في كل سطر</p>"; return;
        }
        const d = p2[0] - p1[0];
        if (d <= 0) { box.innerHTML = "<p style='color:var(--red);'>المسافات يجب أن تكون تصاعدية</p>"; return; }
        cutVol += ((p1[1] + p2[1]) / 2) * d;
        fillVol += ((p1[2] + p2[2]) / 2) * d;
      }
      box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
        <div><b>حجم الحفر (م³):</b> ${f3(cutVol)}</div>
        <div><b>حجم الردم (م³):</b> ${f3(fillVol)}</div>
        <div><b>الصافي (حفر - ردم):</b> ${f3(cutVol - fillVol)} م³</div>
      </div>`;
    } catch(e) { console.error(e); }
  };
  document.getElementById("ew-t").oninput = compute;
}

// ================= TOOL: TRAVERSE (الترافيرس) =================
function travTool() {
  app.className = "page";
  app.innerHTML = `
    <a href="#tools" style="color:var(--mut); font-size:0.9rem; display:inline-block; margin-bottom:8px;">‹ رجوع للأدوات</a>
    <h2>حساب الترافيرس (تصحيح Bowditch)</h2>
    <div class="card">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div><label>E البداية</label><input id="tv-e0" dir="ltr" placeholder="1000"></div>
        <div><label>N البداية</label><input id="tv-n0" dir="ltr" placeholder="1000"></div>
      </div>
      <label>الأضلاع (كل سطر: المسافة، Azimuth)</label>
      <textarea id="tv-t" dir="ltr" rows="5" placeholder="100 90&#10;100 180&#10;100 270&#10;100 0" style="font-family:monospace;"></textarea>
      <div id="tv-result" style="margin-top:16px;"></div>
    </div>
  `;
  const compute = () => {
    const box = document.getElementById("tv-result");
    const e0 = num(document.getElementById("tv-e0").value), n0 = num(document.getElementById("tv-n0").value);
    const lines = document.getElementById("tv-t").value.split(/\n+/).map(l=>l.trim()).filter(Boolean);
    if (isNaN(e0) || isNaN(n0) || lines.length < 2) { box.innerHTML = ""; return; }
    const legs = [];
    try {
      for (const l of lines) {
        const p = l.split(/[\s,;]+/);
        const d = num(p[0]), az = ang(p.slice(1).join(" "));
        if (isNaN(d) || isNaN(az)) { box.innerHTML = "<p style='color:var(--red);'>تأكد من صحة الأرقام</p>"; return; }
        legs.push([d, az]);
      }
      let P = 0, sE = 0, sN = 0;
      const dE = [], dN = [];
      legs.forEach(([d, az]) => {
        dE.push(d * Math.sin(rad(az))); dN.push(d * Math.cos(rad(az)));
        sE += dE[dE.length-1]; sN += dN[dN.length-1]; P += d;
      });
      const fE = sE, fN = sN, LE = Math.hypot(fE, fN), prec = P / LE;
      let rE = e0, rN = n0;
      let html = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.82rem;overflow-x:auto;">
        <div style="margin-bottom:8px;color:var(--blue);"><b>المحيط:</b> ${f3(P)} م | <b>خطأ الإقفال:</b> ${f3(LE)} م | <b>الدقة:</b> 1:${Math.round(prec)}</div>
        <table style="width:100%;text-align:center;border-collapse:collapse;">
          <tr style="border-bottom:1px solid var(--line);"><th>الضلع</th><th>dE</th><th>dN</th><th>E</th><th>N</th></tr>`;
      legs.forEach(([d, az], i) => {
        rE += dE[i]; rN += dN[i];
        html += `<tr><td>${i+1}</td><td>${f3(dE[i])}</td><td>${f3(dN[i])}</td><td>${f3(rE)}</td><td>${f3(rN)}</td></tr>`;
      });
      html += `</table></div>`;
      box.innerHTML = html;
    } catch(e) { console.error(e); }
  };
  document.getElementById("tv-e0").oninput = compute;
  document.getElementById("tv-n0").oninput = compute;
  document.getElementById("tv-t").oninput = compute;
}

// ================= TOOL: CURVE (المنحنيات) =================
function curveTool() {
  app.className = "page";
  app.innerHTML = `
    <a href="#tools" style="color:var(--mut); font-size:0.9rem; display:inline-block; margin-bottom:8px;">‹ رجوع للأدوات</a>
    <h2>حساب المنحنيات</h2>
    <div class="card">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div><label>نصف القطر R (م)</label><input id="cv-r" dir="ltr" placeholder="300"></div>
        <div><label>زاوية الانحراف Δ (°)</label><input id="cv-da" dir="ltr" placeholder="40"></div>
      </div>
      <div id="cv-result" style="margin-top:16px;"></div>
    </div>
  `;
  const compute = () => {
    const box = document.getElementById("cv-result");
    const R = num(document.getElementById("cv-r").value), D = ang(document.getElementById("cv-da").value);
    if (isNaN(R) || isNaN(D) || R <= 0 || D <= 0 || D >= 180) { box.innerHTML = ""; return; }
    const h = D * rad(1) / 2, T = R * Math.tan(h), Lc = R * D * rad(1), LC = 2 * R * Math.sin(h), Ex = R * (1 / Math.cos(h) - 1), M = R * (1 - Math.cos(h));
    box.innerHTML = `<div style="background:var(--bg);padding:14px;border-radius:12px;font-family:monospace;font-size:0.85rem;">
      <div><b>طول المماس T:</b> ${f3(T)} م</div>
      <div><b>طول المنحنى L:</b> ${f3(Lc)} م</div>
      <div><b>الوتر الطويل LC:</b> ${f3(LC)} م</div>
      <div><b>المسافة الخارجية E:</b> ${f3(Ex)} م</div>
      <div><b>السهم الأوسط M:</b> ${f3(M)} م</div>
    </div>`;
  };
  document.getElementById("cv-r").oninput = compute;
  document.getElementById("cv-da").oninput = compute;
}

// ================= AI CHAT =================
const KB = [
  [["توتال", "total"], "التوتال ستيشن جهاز يقيس الزوايا والمسافات إلكترونياً ويحسب إحداثيات النقاط."],
  [["منسوب", "مناسيب"], "المنسوب هو ارتفاع نقطة عن مستوى مرجعي، ويُقاس بجهاز الميزان."],
  [["توقيع"], "التوقيع هو نقل نقاط المشروع من المخطط إلى الأرض."],
  [["رفع"], "الرفع المساحي هو قياس مواضع الأرض ورسمها على خريطة."],
  [["gps", "rtk"], "أجهزة GPS/RTK بتدي دقة سنتيمترية، لكن تحتاج سماء مفتوحة."],
  [["كميات"], "حساب الكميات يعتمد على مناسيب الأرض والتصميم."],
  [["سعر", "تكلفة"], "السعر يختلف حسب الخدمة والمساحة. اطلب أخصائي للتقييم."],
  [["اطلب"], "اضغط 'اطلب أخصائي' من الرئيسية، أو تواصل واتساب."]
];
async function aiAnswer(q) {
  const t = q.toLowerCase();
  const hit = KB.find(([ks]) => ks.some(k => t.includes(k)));
  return hit ? hit[1] : "سؤال كويس! للتفاصيل الفنية تواصل مع أخصائي من المنصة.";
}
function aiView() {
  app.className = "";
  app.innerHTML = `
    <header class="top-header">
      <a href="#home" style="color:var(--navy);"><svg viewBox="0 0 24 24" style="width:24px;height:24px;transform:scaleX(-1);"><path d="${IC.arrow}"/></svg></a>
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="g-icon"><svg viewBox="0 0 24 24"><path d="${IC.wand}"/></svg></div>
        <div><b style="color:var(--navy);">GeoAI</b><div style="font-size:0.72rem;color:var(--mut);">مساعد المساحة الذكي</div></div>
      </div>
      <div style="width:24px;"></div>
    </header>
    <div style="padding:16px; padding-bottom:90px;">
      <div id="chat-msgs" style="display:flex;flex-direction:column;gap:10px;"></div>
    </div>
    <div class="chat-input" style="position:fixed; bottom:64px; left:0; right:0; max-width:650px; margin:0 auto; background:var(--card); padding:10px 16px; display:flex; gap:8px; border-top:1px solid var(--line);">
      <input id="ai-input" placeholder="اسأل عن أي حاجة في المساحة..." style="flex:1;padding:10px;border-radius:20px;border:1px solid var(--line);">
      <button id="ai-send" style="width:44px;border:none;border-radius:12px;background:var(--blue);color:#fff;display:grid;place-items:center;cursor:pointer;"><svg viewBox="0 0 24 24" style="width:20px;height:20px;"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>
    </div>
  `;
  const msgs = document.getElementById("chat-msgs");
  const add = (who, text) => { const d = el("div", {class: "msg " + who}, text); msgs.append(d); window.scrollTo(0, document.body.scrollHeight); return d; };
  add("bot", "أهلاً! أنا GeoAI، مساعدك في مجال المساحة. اسألني عن أي شيء.");
  const send = async () => {
    const inp = document.getElementById("ai-input"); const q = inp.value.trim();
    if (!q) return;
    inp.value = ""; add("me", q); const w = add("bot", "...");
    try { w.textContent = await aiAnswer(q); } catch(e) { w.textContent = "حدث خطأ."; }
  };
  document.getElementById("ai-send").onclick = send;
  document.getElementById("ai-input").onkeydown = (e) => { if (e.key === "Enter") send(); };
}

// ================= FORMS (Client / Surveyor) =================
function formView(kind) {
  app.className = "page";
  const client = kind === "client";
  app.innerHTML = `
    <a href="#home" style="color:var(--mut);font-size:0.9rem;">‹ رجوع</a>
    <h2>${client ? "طلب أخصائي مساحة" : "تسجيل أخصائي"}</h2>
    <form class="card" id="f">
      <label>الاسم</label><input name="name" required>
      <label>رقم الموبايل</label><input name="phone" type="tel" dir="ltr" required placeholder="01xxxxxxxxx">
      <label>المحافظة</label><select name="gov">${opts(GOVS)}</select>
      ${client ? `
        <label>نوع الخدمة</label><select name="service">${opts(SERVICES)}</select>
        <label>موقع المشروع</label><input name="location" required>
        <label>ملاحظات</label><textarea name="notes"></textarea>
      ` : `
        <label>الإيميل</label><input name="email" type="email" dir="ltr" required>
        <label>الباسورد</label><input name="pw" type="password" dir="ltr" minlength="6" required>
        <label>سنين الخبرة</label><input name="years" type="number" min="0" required>
      `}
      <button class="go" type="submit">${client ? "إرسال الطلب" : "تسجيل"}</button>
      <div id="out"></div>
    </form>
  `;
  document.getElementById("f").onsubmit = async (ev) => {
    ev.preventDefault();
    const btn = ev.target.querySelector("button"), out = document.getElementById("out");
    btn.disabled = true; btn.textContent = "جاري الإرسال...";
    const data = Object.fromEntries(new FormData(ev.target));
    try {
      if (client) {
        await db.collection("requests").add({ ...data, status: "new", createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      } else {
        const { email, pw, ...rest } = data;
        const cred = await auth.createUserWithEmailAndPassword(email, pw);
        await db.collection("surveyors").doc(cred.user.uid).set({ ...rest, status: "new", createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
      ev.target.outerHTML = `<div class="card" style="text-align:center;padding:40px 20px;"><div style="width:70px;height:70px;background:var(--blue);border-radius:50%;margin:0 auto 16px;display:grid;place-items:center;"><svg viewBox="0 0 24 24" style="width:36px;height:36px;stroke:#fff;stroke-width:3;fill:none;"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h2>تم بنجاح</h2><p style="color:var(--mut);">${client ? "هنتواصل معاك قريباً." : "تم تسجيلك، هنراجع حسابك ونعتمده."}</p><a href="#home" class="go" style="display:block;margin-top:16px;text-decoration:none;">العودة للرئيسية</a></div>`;
    } catch(e) {
      out.style.cssText = "background:#fde8e8;color:#a61e1e;padding:12px;border-radius:12px;margin-top:14px;font-weight:600;";
      out.textContent = e.code === "auth/email-already-in-use" ? "الإيميل مسجل قبل كده." : "حدث خطأ، حاول مرة أخرى.";
      btn.disabled = false; btn.textContent = client ? "إرسال الطلب" : "تسجيل";
    }
  };
}

// ================= ADMIN & LOGIN =================
function adminView() {
  app.className = "page";
  if (!currentUser || currentUser.uid !== ADMIN_UID) {
    app.innerHTML = `<h2>لوحة التحكم</h2><div class="card" style="text-align:center;padding:40px 20px;"><p style="color:var(--mut);">هذه الصفحة للإدارة فقط.</p><a href="#pro" class="go" style="display:block;text-decoration:none;">تسجيل الدخول</a></div>`;
    return;
  }
  app.innerHTML = `<h2>لوحة التحكم</h2><div class="card">مرحباً ${currentUser.email}<br><button class="go" onclick="auth.signOut()" style="margin-top:12px;background:var(--bg);color:var(--navy);">خروج</button></div>`;
}
function loginView() {
  app.className = "page";
  app.innerHTML = `
    <a href="#home" style="color:var(--mut);font-size:0.9rem;">‹ رجوع</a>
    <h2>تسجيل الدخول</h2>
    <form class="card" id="lf">
      <label>الإيميل</label><input name="email" type="email" dir="ltr" required>
      <label>الباسورد</label><input name="pw" type="password" dir="ltr" required>
      <button class="go" type="submit">دخول</button>
      <div id="lo" style="margin-top:14px;font-size:0.9rem;text-align:center;">ما عندك حساب؟ <a href="#surveyor" style="color:var(--blue);font-weight:600;">سجّل الآن</a></div>
    </form>
  `;
  document.getElementById("lf").onsubmit = async (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target), lo = document.getElementById("lo");
    try { await auth.signInWithEmailAndPassword(f.get("email"), f.get("pw")); location.hash = "#home"; }
    catch(e) { lo.style.cssText = "background:#fde8e8;color:#a61e1e;padding:12px;border-radius:12px;margin-top:14px;font-weight:600;"; lo.textContent = "الإيميل أو الباسورد غلط."; }
  };
}

// ================= ROUTER & AUTH =================
function route() {
  const h = location.hash.slice(1) || "home";
  if (h === "home") { homeView(); renderNav('home'); }
  else if (h === "profile") { profileView(); renderNav('profile'); }
  else if (h === "network") { networkView(); renderNav('network'); }
  else if (h === "jobs") { jobsView(); renderNav('jobs'); }
  else if (h === "messages") { messagesView(); renderNav('home'); }
  else if (h === "tools") { toolsHub(); renderNav('home'); }
  else if (h === "tool:coord") { coordTool(); renderNav('home'); }
  else if (h === "tool:dist") { distTool(); renderNav('home'); }
  else if (h === "tool:area") { areaTool(); renderNav('home'); }
  else if (h === "tool:calc") { calcTool(); renderNav('home'); }
  else if (h === "tool:level") { levelTool(); renderNav('home'); }
  else if (h === "tool:slope") { slopeTool(); renderNav('home'); }
  else if (h === "tool:earth") { earthTool(); renderNav('home'); }
  else if (h === "tool:trav") { travTool(); renderNav('home'); }
  else if (h === "tool:curve") { curveTool(); renderNav('home'); }
  else if (h === "tool:unit") { unitTool(); renderNav('home'); }
  else if (h === "ai") { aiView(); document.getElementById("nav").style.display = "none"; }
  else if (h === "client") { formView("client"); renderNav('home'); }
  else if (h === "surveyor") { formView("surveyor"); renderNav('home'); }
  else if (h === "pro") { loginView(); renderNav('home'); }
  else if (h === "admin") { adminView(); renderNav('home'); }
  else { homeView(); renderNav('home'); }
  if (h !== "ai") document.getElementById("nav").style.display = "flex";
  window.scrollTo(0, 0);
}

auth.onAuthStateChanged(user => {
  currentUser = user;
  if (location.hash === "#profile" || location.hash === "" || location.hash === "#home") route();
});

window.onhashchange = route;
route();
