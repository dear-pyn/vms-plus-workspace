import { test } from "node:test";
import assert from "node:assert/strict";
import { currency } from "../packages/rules/currency.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";
test("MONEY-001 preserves zero, missing values and strict numeric input",()=>{for(const [value,expected] of [[1000,"1,000.00"],["1,234.5","1,234.50"],[0,"0.00"],[null,"—"],[undefined,"—"],["","—"],[-1000.25,"-1,000.25"],[1.005,"1.01"],[-1.005,"-1.01"],[1e21,"1,000,000,000,000,000,000,000.00"],["9007199254740993.01","9,007,199,254,740,993.01"]]) assert.equal(currency(value),expected);for(const bad of ["1,2",true,"abc",Infinity]) assert.throws(()=>currency(bad));});
test("generated Figma code renders the same currency text",()=>{const code=readFileSync("tools/figma-plugin/code.js","utf8");const context=vm.createContext({figma:{showUI(){},ui:{}},__html__:"",Intl:undefined});vm.runInContext(code,context);assert.equal(vm.runInContext("currency(1000)",context),"1,000.00");assert.equal(vm.runInContext("currency(0)",context),"0.00");});
