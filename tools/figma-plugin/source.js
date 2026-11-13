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
