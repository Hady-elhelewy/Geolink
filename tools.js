// ============================================================
// GeoLink Tools - Surveying Calculators
// ============================================================

// ---- Icon Library ----
const IC = {
  home: "M3 11l9-8 9 8v10h-6v-6H9v6H3z",
  network: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M16 5a3.5 3.5 0 010 7M18 14.5c2.5.6 4 2.2 4 5",
  plus: "M12 5v14M5 12h14",
  brief: "M3 8h18v12H3zM8 8V5h8v3M3 13h18",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  bell: "M18 16v-5a6 6 0 10-12 0v5l-2 2h16zM10 20a2 2 0 004 0",
  chat: "M21 12a8 8 0 01-11.5 7.2L4 20l1-4.6A8 8 0 1121 12z",
  check: "M12 21a9 9 0 100-18 9 9 0 000 18zM8.5 12l2.5 2.5 4.5-5",
  like: "M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3",
  comment: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  share: "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13",
  tools: "M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z",
  wand: "M5 19L17 7M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 12l.7 1.3L21 14l-1.3.7L19 16l-.7-1.3L17 14l1.3-.7z",
  shield: "M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6zM9 12l2 2 4-4",
  arrow: "M19 12H5M11 6l-6 6 6 6",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18",
  poly: "M5 5h8l6 4-3 10H5z",
  calc: "M6 3h12v18H6zM9 7h6M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 15l2-2 2 2 2-2",
  ruler: "M3 17L17 3l4 4L7 21zM8 12l2 2M11 9l2 2M14 6l2 2",
  pin: "M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11zM12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"
};

// ---- Helpers ----
const nz = s => String(s).replace(/[٠-٩]/g, c => "٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace(/[۰-۹]/g, c => "۰۱۲۳۴۵۶۷۸۹".indexOf(c)).replace(/٫/g, ".").replace(/−/g, "-");
const num = s => { const t = nz(s).trim().replace(",", "."); return t === "" ? NaN : Number(t); };
const f3 = x => x.toFixed(3);
const fmt = x => String(+x.toPrecision(10));
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;

// ---- DMS ----
function dms(d, p = 2) {
  const sg = d < 0 ? "-" : ""; d = Math.abs(d);
  let g = Math.floor(d), m = Math.floor((d - g) * 60), s = ((d - g) * 60 - m) * 60;
  if (+s.toFixed(p) >= 60) { s = 0; m++; } if (m >= 60) { m = 0; g++; }
  return `${sg}${g}°${String(m).padStart(2, "0")}′${s.toFixed(p).padStart(p ? p + 3 : 2, "0")}″`;
}
function ang(s) {
  s = nz(s).trim(); if (!s) return NaN;
  const neg = /^-/.test(s) || /^[SWsw]/.test(s) || /[SWsw]\s*$/.test(s);
  const n = (s.match(/\d+(?:[.,]\d+)?/g) || []).map(x => parseFloat(x.replace(",", ".")));
  if (!n.length || n.length > 3) return NaN;
  const v = n[0] + (n[1] || 0) / 60 + (n[2] || 0) / 3600; return neg ? -v : v;
}

// ---- WGS84 / UTM ----
const WGS = { a: 6378137, f: 1 / 298.257223563 };
WGS.e2 = WGS.f * (2 - WGS.f); WGS.ep2 = WGS.e2 / (1 - WGS.e2);
const zoneOf = lon => Math.min(60, Math.max(1, Math.floor((lon + 180) / 6) + 1));
const bandOf = lat => (lat < -80 || lat > 84) ? "" : "CDEFGHJKLMNPQRSTUVWXX"[Math.floor((lat + 80) / 8)];
function toUTM(lat, lon, zone) {
  zone = zone || zoneOf(lon);
  const k0 = 0.9996, { a, e2, ep2 } = WGS, p = rad(lat), l0 = rad((zone - 1) * 6 - 180 + 3);
  const sn = Math.sin(p), cs = Math.cos(p), tn = Math.tan(p);
  const N = a / Math.sqrt(1 - e2 * sn * sn), T = tn * tn, C = ep2 * cs * cs, A = (rad(lon) - l0) * cs;
  const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256) * p - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * p) + (15 * e2 * e2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * p) - (35 * e2 ** 3 / 3072) * Math.sin(6 * p));
  const E = 500000 + k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120);
  let Nn = k0 * (M + N * tn * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720));
  const south = lat < 0; if (south) Nn += 1e7;
  return { zone, south, band: bandOf(lat), E, N: Nn };
}
function fromUTM(E, Nn, zone, south) {
  const k0 = 0.9996, { a, e2, ep2 } = WGS, x = E - 500000, y = south ? Nn - 1e7 : Nn, M = y / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256)), e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const p1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const s = Math.sin(p1), c = Math.cos(p1), t = Math.tan(p1), C1 = ep2 * c * c, T1 = t * t, N1 = a / Math.sqrt(1 - e2 * s * s), R1 = a * (1 - e2) / Math.pow(1 - e2 * s * s, 1.5), D = x / (N1 * k0);
  const lat = p1 - (N1 * t / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
  const lon = rad((zone - 1) * 6 - 180 + 3) + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / c;
  return { lat: deg(lat), lon: deg(lon) };
}

// ---- Vincenty ----
function vincenty(la1, lo1, la2, lo2) {
  const { a, f } = WGS, b = a * (1 - f), L = rad(lo2 - lo1);
  const U1 = Math.atan((1 - f) * Math.tan(rad(la1))), U2 = Math.atan((1 - f) * Math.tan(rad(la2)));
  const sU1 = Math.sin(U1), cU1 = Math.cos(U1), sU2 = Math.sin(U2), cU2 = Math.cos(U2);
  let lam = L, it = 0, sS, cS, sig, sA, c2A, c2SM, sL, cL;
  do {
    sL = Math.sin(lam); cL = Math.cos(lam);
    sS = Math.hypot(cU2 * sL, cU1 * sU2 - sU1 * cU2 * cL);
    if (sS === 0) return { s: 0, a1: 0, a2: 0 };
    cS = sU1 * sU2 + cU1 * cU2 * cL; sig = Math.atan2(sS, cS);
    sA = cU1 * cU2 * sL / sS; c2A = 1 - sA * sA;
    c2SM = c2A !== 0 ? cS - 2 * sU1 * sU2 / c2A : 0;
    const C = f / 16 * c2A * (4 + f * (4 - 3 * c2A)), prev = lam;
    lam = L + (1 - C) * f * sA * (sig + C * sS * (c2SM + C * cS * (-1 + 2 * c2SM * c2SM)));
    if (Math.abs(lam - prev) < 1e-12) break;
  } while (++it < 200);
  const u2 = c2A * (a * a - b * b) / (b * b), A = 1 + u2 / 16384 * (4096 + u2 * (-768 + u2 * (320 - 175 * u2))), B = u2 / 1024 * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
  const dS = B * sS * (c2SM + B / 4 * (cS * (-1 + 2 * c2SM * c2SM) - B / 6 * c2SM * (-3 + 4 * sS * sS) * (-3 + 4 * c2SM * c2SM)));
  return { s: b * A * (sig - dS), a1: (deg(Math.atan2(cU2 * sL, cU1 * sU2 - sU1 * cU2 * cL)) + 360) % 360, a2: (deg(Math.atan2(cU1 * sL, -sU1 * cU2 + cU1 * sU2 * cL)) + 360) % 360 };
}

// ---- Area / Polygon ----
const pts = (t, n = 2) => nz(t).split(/\n+/).map(l => l.trim()).filter(Boolean).map(l => l.split(/[\s,;]+/).filter(Boolean).map(Number)).filter(r => r.length >= n && r.slice(0, n).every(isFinite));
const FED = 4200.833333333333;
function feddan(a) {
  let t = Math.round(a / (FED / 576) * 100); const f = Math.floor(t / 57600); t -= f * 57600; const k = Math.floor(t / 2400); t -= k * 2400;
  return `${f} فدان ${k} قيراط ${(t / 100).toFixed(2)} سهم`;
}
function polyArea(P) {
  const [ox, oy] = P[0]; let s = 0, cx = 0, cy = 0, per = 0;
  for (let i = 0; i < P.length; i++) {
    const x1 = P[i][0] - ox, y1 = P[i][1] - oy, x2 = P[(i + 1) % P.length][0] - ox, y2 = P[(i + 1) % P.length][1] - oy, c = x1 * y2 - x2 * y1;
    s += c; cx += (x1 + x2) * c; cy += (y1 + y2) * c; per += Math.hypot(x2 - x1, y2 - y1);
  }
  const A = s / 2; return { area: Math.abs(A), per, cx: A ? cx / (6 * A) + ox : ox, cy: A ? cy / (6 * A) + oy : oy };
}
const azim = (dx, dy) => (deg(Math.atan2(dx, dy)) + 360) % 360;
function quad(az) {
  const ns = (az > 90 && az < 270) ? "S" : "N", ew = az < 180 ? "E" : "W";
  const a = az <= 90 ? az : az <= 180 ? 180 - az : az <= 270 ? az - 180 : 360 - az;
  return `${ns} ${dms(a, 0)} ${ew}`;
}

// ---- Shapes & Units ----
const SH = {
  rect: ["مستطيل", [["a", "الطول (م)"], ["b", "العرض (م)"]]],
  tri: ["مثلث (قاعدة وارتفاع)", [["a", "القاعدة (م)"], ["h", "الارتفاع (م)"]]],
  heron: ["مثلث (3 أضلاع)", [["a", "الضلع الأول (م)"], ["b", "الضلع الثاني (م)"], ["c", "الضلع الثالث (م)"]]],
  circle: ["دائرة", [["r", "نصف القطر (م)"]]],
  trap: ["شبه منحرف", [["a", "القاعدة الأولى (م)"], ["b", "القاعدة الثانية (م)"], ["h", "الارتفاع (م)"]]]
};
const UN = {
  len: ["الطول", [["متر (م)", 1], ["كيلومتر (كم)", 1000], ["سنتيمتر (سم)", .01], ["مليمتر (مم)", .001], ["بوصة (in)", .0254], ["قدم (ft)", .3048], ["ياردة (yd)", .9144], ["ميل (mi)", 1609.344], ["قدم مساحي أمريكي", 1200 / 3937], ["ميل بحري", 1852]]],
  area: ["المساحة", [["متر مربع (م²)", 1], ["كيلومتر مربع (كم²)", 1e6], ["هكتار", 1e4], ["فدان", FED], ["قيراط", FED / 24], ["سهم", FED / 576], ["أكر (acre)", 4046.8564224], ["قدم مربع (ft²)", .09290304], ["ياردة مربعة (yd²)", .83612736]]],
  ang: ["الزوايا", [["درجة (°)", 1], ["راديان (rad)", 180 / Math.PI], ["جراد (gon)", .9], ["دقيقة قوسية (′)", 1 / 60], ["ثانية قوسية (″)", 1 / 3600]]],
  vol: ["الحجم", [["متر مكعب (م³)", 1], ["لتر", .001], ["سنتيمتر مكعب (سم³)", 1e-6], ["قدم مكعب (ft³)", .028316846592], ["جالون أمريكي", .003785411784]]]
};

// ---- Exports for global use ----
window.GL = { IC, num, f3, fmt, dms, ang, rad, deg, toUTM, fromUTM, vincenty, pts, feddan, polyArea, azim, quad, SH, UN, zoneOf, bandOf, FED };