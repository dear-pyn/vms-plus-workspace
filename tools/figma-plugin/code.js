// GENERATED: npm run plugins:build; edit source.js instead.
const RULE_VERSION="1.0.0";
const COMPONENTS={"input-label":{"name":"Input label","key":"100b172084b1ad5149031c2be07b944e763d0614","kind":"component","source":"Maintenance-Request-Form/figma-export/current-library.json","verification":"source-registry; not yet verified in destination Figma"}};
/** MONEY-001. Shared by web and generated Figma plugin; never coerce invalid/missing values to zero. */
function currency(value) {
  if (value === null || value === undefined || (typeof value === "string" && !value.trim())) return "—";
  if (typeof value !== "number" && typeof value !== "string") throw new TypeError("Invalid currency type");
  if (typeof value === "string" && !/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value.trim())) throw new TypeError("Invalid currency value");
  const number = typeof value === "number" ? value : Number(value.trim().replaceAll(",", ""));
  if (!Number.isFinite(number)) throw new TypeError("Invalid currency value");
  // Deterministic decimal rounding in both browser and Figma sandbox (no Intl dependency).
  let raw = typeof value === "number" ? String(value) : value.trim().replaceAll(",", "");
  const negative = raw.startsWith("-"); raw = raw.replace(/^-/, "");
  if (/[eE]/.test(raw)) {
    const [mantissa, exponent] = raw.toLowerCase().split("e");
    const parts = mantissa.split("."); const digits = parts.join("");
    const position = parts[0].length + Number(exponent);
    raw = position <= 0 ? "0." + "0".repeat(-position) + digits : position >= digits.length ? digits + "0".repeat(position - digits.length) : digits.slice(0, position) + "." + digits.slice(position);
  }
  const [whole, fraction = ""] = raw.split(".");
  let cents = BigInt(whole) * 100n + BigInt(fraction.slice(0, 2).padEnd(2, "0"));
  if (fraction.length > 2 && fraction[2] >= "5") cents += 1n;
  const integer = (cents / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (negative && cents > 0n ? "-" : "") + integer + "." + (cents % 100n).toString().padStart(2, "0");
}

/* Built with shared currency, library mapping and rule version. Do not edit code.js. */
figma.showUI(__html__, { width: 520, height: 540 });
let busy = false;
figma.ui.onmessage = async message => {
 if (message.type !== "build" || busy) return;
 busy = true; const made = [];
 try {
  const spec = JSON.parse(message.json);
  if (spec.ruleVersion !== RULE_VERSION || !spec.caseId || !spec.revision || !Array.isArray(spec.screens) || !spec.screens.length) throw Error("ต้องมี caseId, revision, screens และ ruleVersion ตรงกับ policy ปัจจุบัน");
  const imported = new Map();
  for (const screen of spec.screens) {
   if (!screen.id || !Array.isArray(screen.elements)) throw Error("screen ต้องมี id และ elements");
   for (const element of screen.elements) {
    const entry = COMPONENTS[element.component];
    if (!entry || !entry.key) throw Error("ไม่มี published mapping: " + element.component);
    if (!imported.has(element.component)) {
     const component = await figma.importComponentByKeyAsync(entry.key);
     if (component.key !== entry.key) throw Error("published key ไม่ตรง: " + element.component);
     imported.set(element.component, component);
    }
   }
  }
  const startY = figma.currentPage.children.reduce((m,n) => Math.max(m,n.y+n.height),0)+120;
  for (let i=0;i<spec.screens.length;i++) {
   const screen=spec.screens[i]; const frame=figma.createFrame(); made.push(frame);
   frame.name=`${spec.caseId} / ${spec.revision} / ${screen.id}`;
   frame.layoutMode="VERTICAL"; frame.primaryAxisSizingMode="AUTO";frame.counterAxisSizingMode="FIXED";
   frame.resize(screen.width || 1200,800); frame.paddingTop=frame.paddingBottom=32;frame.paddingLeft=frame.paddingRight=32;frame.itemSpacing=24;
   frame.x=i*1320;frame.y=startY;frame.setPluginData("vms-case",JSON.stringify({caseId:spec.caseId,revision:spec.revision,ruleVersion:spec.ruleVersion,screenId:screen.id}));
   for (const element of screen.elements) {
    const instance=imported.get(element.component).createInstance(); frame.appendChild(instance);
    if(element.properties) instance.setProperties(element.properties);
    for(const override of element.text || []) {
     const targets=instance.findAll(n=>n.type==="TEXT"&&n.name===override.nodeName);
     if(targets.length!==1) throw Error(`ต้องพบ text layer ชื่อ ${override.nodeName} เพียง 1 ตัวใน ${element.component}; พบ ${targets.length}`);
     const target=targets[0];
     if(target.fontName===figma.mixed) {for(const font of target.getRangeAllFontNames(0,target.characters.length)) await figma.loadFontAsync(font);}
     else await figma.loadFontAsync(target.fontName);
     const expected=override.format==="currency"?currency(override.value):String(override.value??"");
     target.characters=expected;
     if(target.characters!==expected) throw Error("ข้อความหลัง render ไม่ตรงกติกา");
    }
   }
  }
  figma.currentPage.selection=made;figma.viewport.scrollAndZoomIntoView(made);
  figma.ui.postMessage({ok:true,message:`สร้าง ${made.length} จอแล้ว · rules ${RULE_VERSION}; ต้องตรวจภาพ/variant ใน Figma จริงก่อนรับรอง`});
 } catch(error) {for(const node of made) node.remove();figma.ui.postMessage({ok:false,message:String(error.message||error)});}
 finally {busy=false;}
};
