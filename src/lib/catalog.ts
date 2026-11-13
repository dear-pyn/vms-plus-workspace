import data from "../../content/catalog.json";
export type Case = typeof data.cases[number];
export const catalog = data;
export function asset(path: string) { return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`; }
