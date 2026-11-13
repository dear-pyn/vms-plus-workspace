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

figma.showUI(__html__, { width: 520, height: 540 });
let busy=false;
figma.ui.onmessage=async message=>{
 if(message.type!=="build"||busy)return;busy=true;const made=[];
 try {
  const ac=JSON.parse(message.json);
  if(!ac.caseId||!ac.revision||ac.ruleVersion!==RULE_VERSION||!Array.isArray(ac.items)||!ac.items.length) throw Error("ต้องมี caseId, revision, ruleVersion ปัจจุบัน และ AC อย่างน้อย 1 รายการ");
  const ids=new Set();
  for(const item of ac.items){if(!item.id||ids.has(item.id)||!item.screenId||!item.source||!["confirmed","observed","pending"].includes(item.status)||![item.given,item.when,item.then].every(v=>typeof v==="string"&&v.trim())) throw Error("AC ต้องมี id ไม่ซ้ำ, screenId, source, status และ given/when/then ครบ");ids.add(item.id);}
  await figma.loadFontAsync({family:"Inter",style:"Medium"});
  const startY=figma.currentPage.children.reduce((m,n)=>Math.max(m,n.y+n.height),0)+120;
  for(let i=0;i<ac.items.length;i++){
   const item=ac.items[i];const card=figma.createShapeWithText();made.push(card);card.shapeType="ROUNDED_RECTANGLE";
   card.name=`${ac.caseId} / ${ac.revision} / ${item.screenId} / ${item.id}`;
   card.resize(520,440);card.x=(i%3)*580;card.y=startY+Math.floor(i/3)*500;
   card.fills=[{type:"SOLID",color:item.status==="confirmed"?{r:.91,g:.98,b:.94}:item.status==="observed"?{r:.93,g:.95,b:1}:{r:1,g:.97,b:.88}}];
   card.text.fontName={family:"Inter",style:"Medium"};card.text.fontSize=16;
   card.text.characters=`${ac.caseId} · ${ac.revision} · rules ${ac.ruleVersion}\n${item.id} · ${item.screenId}\nสถานะ: ${item.status}\n\nGiven: ${item.given}\nWhen: ${item.when}\nThen: ${item.then}\n\nหลักฐาน: ${item.source}`;
   card.setPluginData("vms-ac",JSON.stringify(item));
  }
  figma.currentPage.selection=made;figma.viewport.scrollAndZoomIntoView(made);figma.ui.postMessage({ok:true,message:`วาง AC ${made.length} รายการแล้ว กรุณาตรวจข้อความยาวว่าล้นกรอบหรือไม่`});
 }catch(error){for(const n of made)n.remove();figma.ui.postMessage({ok:false,message:String(error.message||error)});}finally{busy=false;}
};
