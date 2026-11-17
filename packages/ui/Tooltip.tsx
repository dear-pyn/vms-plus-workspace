"use client";
/** Figma: `Tooltip` (Tail position=Bottom center) ของไฟล์ Component หน้า "Tooltips" (107:2517 · key 8739efb01b4e2577d183e1b28384713c7deff026)
 *  ตัวกล่อง: พื้น #101828 (gray-900) · r4 (rounded-xs) · pad 12/16 · เงา DROP_SHADOW #10182814 y12 blur16 spread-4 (= --shadow-lg → shadow-tooltip)
 *  ข้อความ: Text 14 SemiBold ขาว · Supporting text 12 Regular #D0D5DD (gray-300) · หาง 28×8 สีเดียวกับกล่อง
 *  ตัวเปิด: ไอคอน `info-24-300-round` ใน `Input label` (24 · #D0D5DD gray-300 · ห่างป้าย 4)
 *  เปิดเมื่อชี้เมาส์หรือโฟกัสด้วยคีย์บอร์ด (ปุ่ม) — ใช้ใน FieldShell ผ่าน prop `info` (เจ้าของงาน 17 พ.ย. 2569 เปิดใช้เฉพาะช่องที่ระบุ) */
import { useId } from "react";
import { Icon } from "./Icon";

export interface TooltipContent {
  /** Text (14 SemiBold) */
  title: string;
  /** Supporting text (12) — ไม่ใส่ก็ได้ */
  text?: string;
}

export function InfoTooltip({ title, text }: TooltipContent) {
  const id = useId();
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label={title}
        aria-describedby={id}
        className="inline-flex cursor-help rounded-full text-gray-300 outline-none focus-visible:shadow-ring"
      >
        <Icon name="info" size={24} />
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 flex w-max max-w-[320px] -translate-x-1/2 flex-col items-center opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        <span className="flex flex-col rounded-xs bg-gray-900 px-4 py-3 text-left shadow-tooltip">
          <span className="text-sm font-semibold text-white">{title}</span>
          {text && <span className="text-xs font-normal text-gray-300">{text}</span>}
        </span>
        <span aria-hidden className="h-2 w-7 bg-gray-900 [clip-path:polygon(0_0,100%_0,50%_100%)]" />
      </span>
    </span>
  );
}
