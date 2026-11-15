// usage: node outline.cjs "<frame regex>" [maxDepth]
// prints compact tree of a Figma dump frame: component instances (← Component / variant), texts, layout
const path = require('path').join(__dirname, '../../design/figma-dump/figma-overhaul-refinement-09/import-2026-11-13/1-5795.json');
const j = require(path);
const re = new RegExp(process.argv[2] || '.', 'i');
const maxD = Number(process.argv[3] || 40);
const out = [];
function lay(n) {
  const a = [];
  if (n.dir) a.push(n.dir === 'VERTICAL' ? 'col' : 'row');
  if (n.gap) a.push('gap' + n.gap);
  if (n.padding) a.push('p' + (Array.isArray(n.padding) ? n.padding.join('/') : n.padding));
  return a.join(' ');
}
function walk(n, d) {
  if (d > maxD || n.visible === false) return;
  if (/^(Sidebar navigation|Header navigation)$/.test(n.name)) return;
  const ind = '  '.repeat(d);
  if (n.type === 'TEXT') {
    out.push(`${ind}"${String(n.text || n.name).replace(/\s+/g, ' ').slice(0, 90)}"`);
    return;
  }
  const comp = n.component ? ` ← ${n.component.name}${n.component.variant ? ' [' + (typeof n.component.variant === 'string' ? n.component.variant : JSON.stringify(n.component.variant)) + ']' : ''}` : '';
  out.push(`${ind}${n.name} (${n.type[0]} ${Math.round(n.w)}x${Math.round(n.h)} ${lay(n)})${comp}`);
  // collapse deep internals of instances: show texts only
  if (n.type === 'INSTANCE' && d > 2) {
    const texts = [];
    (function t(x) { if (x.visible === false) return; if (x.type === 'TEXT') texts.push(String(x.text || '').replace(/\s+/g, ' ').slice(0, 40)); (x.kids || []).forEach(t); })(n);
    if (texts.length) out.push(`${ind}  · ${texts.slice(0, 12).join(' | ')}`);
    return;
  }
  (n.kids || []).forEach((k) => walk(k, d + 1));
}
function find(n, acc) {
  if (re.test(n.name) && /^OH2/.test(n.name) && n.type === 'FRAME') acc.push(n);
  (n.kids || []).forEach((k) => find(k, acc));
  return acc;
}
const roots = Array.isArray(j.sets) ? j.sets : [j.sets];
const seen = new Set();
const hits = roots.flatMap((r) => find(r, [])).filter((h) => /^OH2 \//.test(h.name) && !seen.has(h.name) && seen.add(h.name));
for (const h of hits) { out.push('=== ' + h.name); walk(h, 0); }
console.log(out.join('\n'));
