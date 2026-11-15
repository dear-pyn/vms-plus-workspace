// แปลง Figma dump → HTML ตรงตัว (ไม่ตีความ) — ใช้เป็นฉบับตั้งต้นที่เหมือน Figma ที่สุดก่อนทำต้นแบบ
//
//   npm run render -- <ชุด dump> "<คำค้นชื่อจอ>"
//   npm run render -- figma-overhaul-refinement-09 "C\.1 · S2"
//   npm run render -- figma-overhaul-refinement-09 "^OH2 / "        (ทุกจอที่ขึ้นต้นแบบนี้)
//
// ผล: public/figma-render/<ชุด>/<node-id>.html + index.html (สารบัญ) — เปิดผ่าน npm run dev ที่ /figma-render/<ชุด>/
//
// กติกาการแปลง (ทุกค่ามาจาก dump):
//   auto layout (dir) → flex · gap · padding · justify/align · sizing FIXED=px · HUG=พอดีเนื้อ · FILL=ยืดตามแม่
//   fill/stroke/sws/r/effects/opacity → background/border/radius/box-shadow/opacity (stroke วาดด้านใน = box-sizing:border-box)
//   TEXT → font (family/style→weight/size/lh/ls/align) + สี · ข้อความ HUG ไม่ตัดบรรทัด
//   instance ไอคอน (ชื่อแบบ name-24-300-round[-fill]) → Material Symbols Rounded ขนาด/สีตาม dump
//   ชิ้นที่มี svg/png ใน dump (โลโก้ ภาพประกอบ) → <img>
//   visible:false → ข้าม
// ตำแหน่ง: dump รุ่นที่มี x/y (ปลั๊กอิน 13 พ.ย. 2569 เป็นต้นไป) วางชิ้นนอก auto layout / ชิ้นลอย ตรงตำแหน่ง ·
//   dump รุ่นเก่าไม่มี x/y → วางมุมซ้ายบน + เส้นประสีส้ม (data-abs) ให้รู้ว่าตำแหน่งอาจคลาด

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DUMP = path.join(ROOT, "design", "figma-dump");
const [setArg, patArg = "^OH2 / "] = process.argv.slice(2);
if (!setArg) {
  console.log("ใช้: npm run render -- <ชุด dump ใน design/figma-dump> \"<คำค้นชื่อจอ (regex)>\"");
  process.exit(1);
}

// หาไฟล์ dump ล่าสุดของชุด
const setDir = path.join(DUMP, setArg);
const imports = fs.readdirSync(setDir).filter((d) => d.startsWith("import-")).sort();
const impDir = path.join(setDir, imports.at(-1));
const files = fs.readdirSync(impDir).filter((f) => f.endsWith(".json") && !["index.json", "source.json"].includes(f));
const pat = new RegExp(patArg);

const WEIGHT = { Thin: 100, ExtraLight: 200, Light: 300, Regular: 400, Text: 400, Medium: 500, SemiBold: 600, Bold: 700, ExtraBold: 800 };
const ICON = /^(.+)-(\d{2})-(\d{3})-(round|sharp|outlined)(-fill)?$/;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const px = (v) => `${Math.round(v * 100) / 100}px`;
const JUSTIFY = { MIN: "flex-start", CENTER: "center", MAX: "flex-end", SPACE_BETWEEN: "space-between" };
const ALIGN = { MIN: "flex-start", CENTER: "center", MAX: "flex-end", BASELINE: "baseline", STRETCH: "stretch" };

function color(v) {
  if (typeof v !== "string") return null;
  return v; // #RRGGBB หรือ #RRGGBBAA จาก dump
}
function lastSolid(arr) {
  const s = (arr || []).filter((x) => typeof x === "string");
  return s.length ? s.at(-1) : null;
}
function firstVectorFill(n) {
  if ((n.type === "VECTOR" || n.type === "BOOLEAN_OPERATION") && n.fill?.length) return lastSolid(n.fill);
  for (const k of n.kids || []) {
    if (k.visible === false) continue;
    const c = firstVectorFill(k);
    if (c) return c;
  }
  return null;
}

let absCount = 0;
function render(n, parentDir) {
  if (n.visible === false) return "";
  const st = [];
  const [sh, sv] = n.sizing || ["FIXED", "FIXED"];
  const main = parentDir === "HORIZONTAL" ? sh : parentDir === "VERTICAL" ? sv : null;
  const cross = parentDir === "HORIZONTAL" ? sv : parentDir === "VERTICAL" ? sh : null;

  // ขนาด
  const w = sh === "FIXED" || !parentDir ? px(n.w) : null;
  const h = sv === "FIXED" || !parentDir ? px(n.h) : null;
  if (parentDir) {
    // FILL = ยืดจากขนาดจริงใน Figma (basis = w/h เดิม) — basis 0 ทำให้คอลัมน์หดเหลือ 0 เมื่อแม่เป็น HUG
    if (main === "FILL") st.push(`flex:1 1 ${px(parentDir === "HORIZONTAL" ? n.w : n.h)}`, "min-width:0", "min-height:0");
    else st.push("flex:0 0 auto");
    if (cross === "FILL") st.push("align-self:stretch");
  } else if (n._abs) {
    st.push("position:absolute", `left:${px(n.x ?? 0)}`, `top:${px(n.y ?? 0)}`);
  }
  if (parentDir && n.absolute) {
    // ลอยใน auto layout (layoutPositioning=ABSOLUTE) — ไม่กินที่ในแถว
    st.length = 0;
    st.push("position:absolute", `left:${px(n.x ?? 0)}`, `top:${px(n.y ?? 0)}`, `width:${px(n.w)}`, `height:${px(n.h)}`);
  }
  if (n.rot) st.push(`transform:rotate(${-n.rot}deg)`, "transform-origin:0 0");
  if (n.clip) st.push("overflow:hidden");
  if (w && !(parentDir === "HORIZONTAL" && main === "FILL")) st.push(`width:${w}`);
  if (h && !(parentDir === "VERTICAL" && main === "FILL")) st.push(`height:${h}`);
  if (sh === "FILL" && parentDir === "VERTICAL") st.push("width:auto");
  if (sv === "FILL" && parentDir === "HORIZONTAL") st.push("height:auto");

  if (typeof n.opacity === "number") st.push(`opacity:${n.opacity}`);

  // ไอคอน → Material Symbols
  const comp = n.component?.name || "";
  const im = n.type === "INSTANCE" && (comp.match(ICON) || n.name.match(ICON));
  if (im) {
    const fillIcon = !!im[5];
    const col = firstVectorFill(n) || "#000";
    st.push(`font-size:${px(n.w)}`, `color:${col}`, `font-variation-settings:'FILL' ${fillIcon ? 1 : 0},'wght' ${im[3]},'opsz' ${im[2]}`);
    return `<span class="ms" title="${esc(comp || n.name)}" style="${st.join(";")}">${esc(im[1])}</span>`;
  }

  // ภาพ/SVG ที่ dump ส่งออกมา
  if (n.svg) return `<img alt="${esc(n.name)}" style="${st.join(";")}" src="data:image/svg+xml;utf8,${encodeURIComponent(n.svg)}">`;
  if (n.png) return `<img alt="${esc(n.name)}" style="${st.join(";")}" src="data:image/png;base64,${n.png}">`;

  // พื้น ขอบ มุม เงา
  // paint เก็บสีพร้อม alpha (#RRGGBBAA) เมื่อมีความทึบ < 1 — ใช้ก่อน fill ที่ตัด alpha ทิ้ง
  const bg = lastSolid(n.paint) || lastSolid(n.fill);
  if (bg) st.push(`background:${color(bg)}`);
  if (n.paint?.some((p) => p === "image")) st.push("background:repeating-linear-gradient(45deg,#e4e7ec 0 6px,#f2f4f7 6px 12px)");
  const stroke = lastSolid(n.stroke);
  if (stroke) {
    const [t, r, b, l] = n.sws || [n.sw ?? 1, n.sw ?? 1, n.sw ?? 1, n.sw ?? 1];
    st.push(`border-style:solid`, `border-color:${stroke}`, `border-width:${px(t)} ${px(r)} ${px(b)} ${px(l)}`);
  }
  if (n.type === "ELLIPSE") st.push("border-radius:50%");
  else if (n.radii) st.push(`border-radius:${n.radii.map(px).join(" ")}`);
  else if (n.r) st.push(`border-radius:${n.r >= 9999 ? "9999px" : px(n.r)}`);
  if (Array.isArray(n.effects)) {
    const sh2 = n.effects.filter((e) => /SHADOW/.test(e.type)).map((e) => `${e.type === "INNER_SHADOW" ? "inset " : ""}${px(e.x)} ${px(e.y)} ${px(e.blur)} ${px(e.spread || 0)} ${e.color}`);
    if (sh2.length) st.push(`box-shadow:${sh2.join(",")}`);
  }

  // ข้อความ
  if (n.type === "TEXT") {
    const f = n.font || {};
    const col = lastSolid(n.fill);
    if (bg) st.splice(st.indexOf(`background:${bg}`), 1);
    st.push(
      `font-family:'${f.fam || "IBM Plex Sans Thai"}',sans-serif`,
      `font-weight:${WEIGHT[(f.style || "Regular").replace(/\s|Italic/g, "")] || 400}`,
      `font-size:${px(f.size || 14)}`,
      `line-height:${f.lh ? (typeof f.lh === "number" ? px(f.lh) : f.lh) : "normal"}`,
      `letter-spacing:${px(f.ls || 0)}`,
      `text-align:${(f.align || "LEFT").toLowerCase().replace("justified", "justify")}`,
    );
    if (col) st.push(`color:${col}`);
    if (sh === "HUG") st.push("white-space:pre");
    else st.push("white-space:pre-wrap", "overflow-wrap:anywhere");
    return `<div class="t" style="${st.join(";")}">${esc(n.text ?? "")}</div>`;
  }

  // กล่อง
  const kids = (n.kids || []).filter((k) => k.visible !== false);
  if (n.dir === "HORIZONTAL" || n.dir === "VERTICAL") {
    st.push("display:flex", `flex-direction:${n.dir === "HORIZONTAL" ? "row" : "column"}`);
    if ((n.kids || []).some((k) => k.absolute)) st.push("position:relative");
    if (n.gap) st.push(`gap:${px(n.gap)}`);
    if (n.justify) st.push(`justify-content:${JUSTIFY[n.justify] || "flex-start"}`);
    st.push(`align-items:${ALIGN[n.align] || "flex-start"}`);
    if (n.wrap) st.push("flex-wrap:wrap");
    const pad = [n.pt, n.pr, n.pb, n.pl].map((v) => px(v || 0));
    if (pad.some((v) => v !== "0px")) st.push(`padding:${pad.join(" ")}`);
    const inner = kids.map((k) => render(k, n.dir)).join("");
    return `<div class="n" data-n="${esc(n.name)}"${comp ? ` data-c="${esc(comp)}"` : ""} style="${st.join(";")}">${inner}</div>`;
  }
  // ไม่มี auto layout → ลูกวางซ้อนกัน (dump ไม่มี x/y)
  if (!n._abs) st.push("position:relative");
  if (kids.length && !(n.w && n.h)) st.push("display:inline-block");
  const inner = kids
    .map((k) => {
      absCount++;
      const unknown = typeof k.x !== "number" && kids.length > 1 && n.type !== "GROUP";
      if (!unknown) absCount--;
      return render({ ...k, _abs: true }, null).replace(/^<(\w+)/, unknown ? '<$1 data-abs="1"' : "<$1");
    })
    .join("");
  return `<div class="n" data-n="${esc(n.name)}"${comp ? ` data-c="${esc(comp)}"` : ""} style="${st.join(";")}">${inner}</div>`;
}

const page = (title, body, w, h) => `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block">
<style>
*{box-sizing:border-box;margin:0}
body{background:#e4e7ec;font-family:'IBM Plex Sans Thai',sans-serif}
.bar{position:sticky;top:0;z-index:9;background:#101828;color:#fff;font:13px/1.4 'IBM Plex Sans Thai';padding:8px 16px;display:flex;gap:16px;align-items:center}
.bar a{color:#fed8f6}
.bar label{margin-left:auto;display:flex;gap:6px;align-items:center}
.frame{width:${w}px;height:${h}px;overflow:hidden;position:relative;background:#fff;margin:0 auto}
.ms{font-family:'Material Symbols Rounded';line-height:1;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;user-select:none}
.show-abs [data-abs]{outline:1px dashed #f79009}
</style></head><body>
<div class="bar"><a href="./">สารบัญ</a><span>${esc(title)} · ${w}×${h}</span>
<label><input type="checkbox" onchange="document.body.classList.toggle('show-abs',this.checked)"> แสดงชิ้นที่ไม่รู้ตำแหน่ง (ส้ม)</label></div>
<div class="frame">${body}</div></body></html>`;

const outDir = path.join(ROOT, "public", "figma-render", setArg);
fs.mkdirSync(outDir, { recursive: true });
const done = [];
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(impDir, f), "utf8"));
  const tops = d.sets || (d.root ? [d.root] : []);
  for (const fr of tops) {
    if (!pat.test(fr.name) || fr.visible === false || !fr.kids?.length) continue;
    absCount = 0;
    const id = (fr.id || `${f.replace(".json", "")}-${done.length}`).replace(/[:;]/g, "-");
    const slug = fr.name.replace(/[^\p{L}\p{M}\p{N}.]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60) || id;
    const html = page(fr.name, render({ ...fr, sizing: ["FIXED", "FIXED"] }, null), Math.round(fr.w), Math.round(fr.h));
    fs.writeFileSync(path.join(outDir, `${slug}.html`), html);
    done.push({ name: fr.name, file: `${slug}.html`, w: Math.round(fr.w), h: Math.round(fr.h), abs: absCount });
  }
}
const idx = `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(setArg)} — จอจาก Figma dump</title>
<style>body{font:14px/1.6 'IBM Plex Sans Thai',sans-serif;margin:24px;color:#101828}a{color:#a80689}td,th{padding:4px 12px;text-align:left;border-bottom:1px solid #eaecf0}</style></head><body>
<h1>${esc(setArg)}</h1><p>สร้างจาก ${esc(path.relative(ROOT, impDir))} — แปลงตรงตัวจาก dump · ชิ้นที่ไม่รู้ตำแหน่ง = ชิ้นนอก auto layout (dump ไม่มี x/y)</p>
<table><tr><th>จอ</th><th>ขนาด</th><th>ไม่รู้ตำแหน่ง</th></tr>${done
  .sort((a, b) => a.name.localeCompare(b.name, "th"))
  .map((x) => `<tr><td><a href="${encodeURI(x.file)}">${esc(x.name)}</a></td><td>${x.w}×${x.h}</td><td>${x.abs}</td></tr>`)
  .join("")}</table></body></html>`;
fs.writeFileSync(path.join(outDir, "index.html"), idx);
console.log(`แปลง ${done.length} จอ → ${path.relative(ROOT, outDir)}/`);
for (const x of done.slice(0, 15)) console.log(`  ${x.file}  (${x.w}×${x.h} · ไม่รู้ตำแหน่ง ${x.abs})`);
