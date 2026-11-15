import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import { pluginCode } from "./lib/plugin-build.mjs";
const catalog=JSON.parse(readFileSync("content/catalog.json","utf8"));
const policy=JSON.parse(readFileSync("packages/rules/policy.json","utf8"));
const domains=new Set(catalog.domains.map(x=>x.id)); const ids=new Set();
const domainPolicies=new Map();
for(const d of catalog.domains){
 const local=JSON.parse(readFileSync(`domains/${d.id}/rules.json`,"utf8"));assert(local.domain===d.id);
 const ruleIds=new Set(policy.rules.map(r=>r.id));
 for(const rule of local.rules){assert(!ruleIds.has(rule.id),`Duplicate or silently overridden rule ${rule.id}`);ruleIds.add(rule.id);assert(rule.source&&rule.description&&["confirmed","pending"].includes(rule.status),`Rule needs source and status ${rule.id}`);if(rule.status==="confirmed")assert(rule.approval?.by&&rule.approval?.evidence&&rule.check,`Confirmed domain rule needs approval and check ${rule.id}`);}
 domainPolicies.set(d.id,local);
}
for(const c of catalog.cases){
 assert(!ids.has(c.id),`Duplicate case ${c.id}`); ids.add(c.id);
 assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.id),`Invalid case ID ${c.id}`);
 assert(domains.has(c.domain),`Unknown domain ${c.domain}`);
 assert(["draft","review","archived"].includes(c.status),`Unknown status ${c.id}`);
 if(c.status!=="archived") {
  assert(c.ruleVersion===policy.version,`Stale rule version ${c.id}`);
  assert(c.domainRuleVersion===domainPolicies.get(c.domain).version,`Stale domain rules ${c.id}`);
 } else {
  assert(/^[0-9]+\.[0-9]+\.[0-9]+$/.test(c.ruleVersion)&&/^[0-9]+\.[0-9]+\.[0-9]+$/.test(c.domainRuleVersion),"Invalid archived rule version");
  assert(existsSync(`packages/rules/versions/${c.ruleVersion}.json`),`Missing archived global rules ${c.id}`);
  assert(existsSync(`domains/${c.domain}/versions/${c.domainRuleVersion}.json`),`Missing archived domain rules ${c.id}`);
 }
 for(const jo of c.joIds) assert(catalog.jos.some(j=>j.id===jo),`Unknown JO ${jo}`);
 for(const field of ["prototype","requirements","flow","ac","screenSpec"]) if(c[field]) {
  assert(c[field].startsWith("/")&&!c[field].includes(".."),`Unsafe artifact ${c.id}`);
  assert(existsSync(`public${c[field]}`)||(field==="prototype"&&c[field].endsWith("/")&&existsSync(`src/app/(prototype)${c[field]}page.tsx`)),`Missing ${field}: ${c.id}`);
 }
 if(c.ac){const ac=JSON.parse(readFileSync(`public${c.ac}`,"utf8"));assert(ac.caseId===c.id&&ac.revision===c.revision&&ac.ruleVersion===c.ruleVersion,`AC revision mismatch ${c.id}`);for(const item of ac.items){assert(["confirmed","observed","pending"].includes(item.status));assert(item.source&&item.screenId,`AC must have evidence ${item.id}`);}}
 if(c.status==="review") {for(const key of ["prototype","requirements","flow","ac"]) assert(c[key],`Review case needs ${key}`);assert(c.joIds.length,`Review case needs a confirmed JO`);assert(c.approval?.by&&c.approval?.at&&c.approval?.evidence,`Review case needs explicit approval evidence`);}
}
console.log(`PASS: ${ids.size} cases, artifacts, JO links and rule versions`);

for(const name of ["figma-plugin","figjam-plugin"]) assert.equal(readFileSync(`tools/${name}/code.js`,"utf8"),pluginCode(name),`Stale generated ${name}; run npm run plugins:build`);
