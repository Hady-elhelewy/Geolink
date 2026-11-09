// ============================================================
// GeoLink App - Clean Version
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

// ---- Helpers ----
function toast(t) { const e = document.createElement("div"); e.className="toast"; e.textContent=t; document.body.append(e); setTimeout(()=>e.remove(), 2000); }
function closeModal(id) { document.getElementById(id).classList.remove("show"); }
window.closeModal = closeModal;

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
    </header>
    
    <div class="section-head">أدواتك السريعة <a href="#tools">عرض الكل</a></div>
    <div class="quick-tools">
      <a class="tool-card" href="#tool:coord"><i><svg viewBox="0 0 24 24"><path d="${IC.map}"/></svg></i><b>إحداثيات</b></a>
      <a class="tool-card" href="#tool:dist"><i><svg viewBox="0 0 24 24"><path d="${IC.ruler}"/></svg></i><b>مسافات</b></a>
    </div>

    <div class="card" style="text-align:center; margin: 20px;">
       <h2>مرحباً بك في GeoLink</h2>
       <p>التطبيق يعمل الآن!</p>
    </div>

    <nav id="nav">
      <a href="#home" class="on"><svg viewBox="0 0 24 24"><path d="${IC.home}"/></svg><span>الرئيسية</span></a>
      <a href="#tools"><svg viewBox="0 0 24 24"><path d="${IC.tools}"/></svg><span>الأدوات</span></a>
    </nav>
  `;
}

// ================= TOOLS =================
function toolsHub() {
  app.className = "page";
  app.innerHTML = `<h2>الأدوات</h2>
    <div class="card"><a href="#tool:coord">تحويل الإحداثيات</a></div>
    <div class="card"><a href="#tool:dist">المسافات</a></div>`;
}

function coordTool() {
  app.className = "page";
  app.innerHTML = `<h2>تحويل الإحداثيات</h2>
    <div class="card"><label>خط العرض</label><input id="lat" dir="ltr" value="30.0444"><label>خط الطول</label><input id="lon" dir="ltr" value="31.2357"><div id="res" style="margin-top:16px;"></div></div>`;
  const compute = () => {
    const lat = ang(document.getElementById("lat").value), lon = ang(document.getElementById("lon").value);
    if (isNaN(lat) || isNaN(lon)) return;
    const u = toUTM(lat, lon);
    document.getElementById("res").innerHTML = `<div style="background:#eee;padding:14px;border-radius:12px;font-family:monospace;">Zone: ${u.zone}${u.band}<br>E: ${f3(u.E)}<br>N: ${f3(u.N)}</div>`;
  };
  document.getElementById("lat").oninput = compute; document.getElementById("lon").oninput = compute;
  compute();
}

function distTool() {
  app.className = "page";
  app.innerHTML = `<h2>المسافات</h2>
    <div class="card"><div><label>E1</label><input id="e1" dir="ltr" value="1000"></div><div><label>N1</label><input id="n1" dir="ltr" value="2000"></div><div><label>E2</label><input id="e2" dir="ltr" value="1100"></div><div><label>N2</label><input id="n2" dir="ltr" value="2100"></div><div id="res" style="margin-top:16px;"></div></div>`;
  const compute = () => {
    const e1 = num(document.getElementById("e1").value), n1 = num(document.getElementById("n1").value);
    const e2 = num(document.getElementById("e2").value), n2 = num(document.getElementById("n2").value);
    if ([e1,n1,e2,n2].some(isNaN)) return;
    const d = Math.hypot(e2-e1, n2-n1);
    document.getElementById("res").innerHTML = `<div style="background:#eee;padding:14px;border-radius:12px;font-family:monospace;">Distance: ${f3(d)}<br>Azimuth: ${dms(azim(e2-e1, n2-n1))}</div>`;
  };
  ["e1","n1","e2","n2"].forEach(id => document.getElementById(id).oninput = compute);
  compute();
}

// ================= ROUTER =================
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
