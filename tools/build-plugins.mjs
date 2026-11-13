import { writeFileSync } from "node:fs";
import { pluginCode } from "./lib/plugin-build.mjs";
for(const name of ["figma-plugin","figjam-plugin"]) writeFileSync(`tools/${name}/code.js`,pluginCode(name));
console.log("Built both plugins from shared rules and component mapping");
