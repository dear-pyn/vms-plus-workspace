import { test } from "node:test";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
test("catalog only links existing artifacts with matching case revisions",()=>{assert.match(execFileSync(process.execPath,["tools/validate.mjs"],{encoding:"utf8"}),/PASS/);});
test("Figma plugin checks the actual rendered text and removes partial exports",async()=>{
 const texts=[];const made=[];let result;
 const label=()=>{const text={type:"TEXT",name:"Label",fontName:{family:"Inter",style:"Medium"},characters:"Label"};texts.push(text);return {findAll:fn=>[text].filter(fn),setProperties(){}};};
 const key=JSON.parse(readFileSync("design/component-mapping.json","utf8")).components["input-label"].key;
 const figma={showUI(){},ui:{postMessage:m=>{result=m;}},importComponentByKeyAsync:async k=>({key:k,createInstance:label}),currentPage:{children:[],selection:[]},mixed:Symbol(),loadFontAsync:async()=>{},createFrame(){const node={setPluginData(){},appendChild(){},resize(){},remove(){this.removed=true;}};made.push(node);return node;},viewport:{scrollAndZoomIntoView(){}}};
 const ctx=vm.createContext({figma,__html__:"",Intl});vm.runInContext(readFileSync("tools/figma-plugin/code.js","utf8"),ctx);
 const spec=JSON.parse(readFileSync("tools/examples/screen-spec.json","utf8"));await figma.ui.onmessage({type:"build",json:JSON.stringify(spec)});
 assert.equal(result.ok,true);assert.equal(texts[0].characters,"1,000.00");
 spec.screens[0].elements[0].text[0].nodeName="missing-layer";await figma.ui.onmessage({type:"build",json:JSON.stringify(spec)});assert.equal(result.ok,false);assert.equal(made.at(-1).removed,true);
 figma.importComponentByKeyAsync=async()=>({key:"stale",createInstance:label});await figma.ui.onmessage({type:"build",json:JSON.stringify(spec)});assert.equal(result.ok,false);assert.match(result.message,/published key/);
});
test("FigJam rejects AC without evidence and preserves observed status",async()=>{
 let result;const made=[];const figma={showUI(){},ui:{postMessage:m=>{result=m;}},loadFontAsync:async()=>{},currentPage:{children:[]},viewport:{scrollAndZoomIntoView(){}},createShapeWithText(){const n={text:{},resize(){},setPluginData(){},remove(){}};made.push(n);return n;}};
 vm.runInContext(readFileSync("tools/figjam-plugin/code.js","utf8"),vm.createContext({figma,__html__:""}));
 const ac=JSON.parse(readFileSync("public/content/overhaul-dashboard-reference/ac.json","utf8"));await figma.ui.onmessage({type:"build",json:JSON.stringify(ac)});assert.equal(result.ok,true);assert.match(made[0].text.characters,/observed/);
 ac.items[0].source="";await figma.ui.onmessage({type:"build",json:JSON.stringify(ac)});assert.equal(result.ok,false);assert.equal(made.length,1);
});
