// usage: node tools/figma-dump/spec.cjs <page-file.json> "<component set regex>" [variant regex] [depth]
// พิมพ์สเปก component จากไลบรารี (VmOC07pKEsDkHZagOgcSU2): ขนาด · padding · gap · radius · fill · stroke · ฟอนต์ · ข้อความ ทีละ variant
const path = require('path');
const dir = path.join(__dirname, '../../design/figma-dump/VmOC07pKEsDkHZagOgcSU2/import-2026-11-13');
const j = require(path.join(dir, process.argv[2]));
const setRe = new RegExp(process.argv[3], 'i');
const varRe = new RegExp(process.argv[4] || '.', 'i');
const maxD = Number(process.argv[5] || 6);
const fmt = (n) => {
  const a = [`${n.type[0]} ${Math.round(n.w)}x${Math.round(n.h)}`];
  if (n.dir) a.push(n.dir === 'VERTICAL' ? 'col' : 'row');
  if (n.sizing) a.push(n.sizing.join('/'));
  if (n.padding) a.push('p' + (Array.isArray(n.padding) ? n.padding.join('/') : n.padding));
  if (n.pt !== undefined || n.pl !== undefined) a.push(`p${n.pt || 0}/${n.pr || 0}/${n.pb || 0}/${n.pl || 0}`);
  if (n.gap) a.push('gap' + n.gap);
  if (n.r) a.push('r' + (Array.isArray(n.r) ? n.r.join('/') : n.r));
  if (n.fill) a.push('fill' + JSON.stringify(n.fill));
  if (n.stroke) a.push('stroke' + JSON.stringify(n.stroke) + (n.sw ? '/' + n.sw : ''));
  if (n.font) a.push('font' + JSON.stringify(n.font));
  if (n.effects || n.shadow) a.push('fx' + JSON.stringify(n.effects || n.shadow).slice(0, 80));
  return a.join(' ');
};
function walk(n, d) {
  if (d > maxD || n.visible === false) return;
  const t = n.type === 'TEXT' ? ` "${String(n.text || '').replace(/\s+/g, ' ').slice(0, 60)}"` : '';
  const c = n.component ? ` ← ${n.component.name}` : '';
  console.log('  '.repeat(d) + `${n.name} (${fmt(n)})${t}${c}`);
  (n.kids || []).forEach((k) => walk(k, d + 1));
}
(function find(n) {
  if (n.type === 'COMPONENT_SET' && setRe.test(n.name)) {
    console.log('=== SET ' + n.name);
    (n.kids || []).filter((v) => varRe.test(v.name)).forEach((v) => walk(v, 0));
    return;
  }
  if (n.type === 'COMPONENT' && setRe.test(n.name) && varRe.test(n.name)) { console.log('=== COMP ' + n.name); walk(n, 0); return; }
  (n.kids || []).forEach(find);
})({ kids: j.sets || [] });
