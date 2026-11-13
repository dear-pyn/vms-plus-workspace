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
