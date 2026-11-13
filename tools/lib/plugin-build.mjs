import { readFileSync } from "node:fs";
export function pluginCode(name){
 const read=p=>readFileSync(p,"utf8");
 const policy=JSON.parse(read("packages/rules/policy.json"));
 const mapping=JSON.parse(read("design/component-mapping.json"));
 const currency=read("packages/rules/currency.mjs").replace("export function currency", "function currency");
 return `// GENERATED: npm run plugins:build; edit source.js instead.\nconst RULE_VERSION=${JSON.stringify(policy.version)};\nconst COMPONENTS=${JSON.stringify(mapping.components)};\n${currency}\n${read(`tools/${name}/source.js`)}`;
}
