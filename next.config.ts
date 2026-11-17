import type { NextConfig } from "next";
import path from "node:path";
const config: NextConfig = { output: "export", outputFileTracingRoot: path.resolve("."), turbopack: { root: path.resolve(".") }, trailingSlash: true, images: { unoptimized: true }, basePath: process.env.NEXT_PUBLIC_BASE_PATH || "", devIndicators: false /* ตัวบอก dev ของ Next ทับปุ่ม Mock มุมซ้ายล่าง (17 พ.ย. 2569) */ };
export default config;
