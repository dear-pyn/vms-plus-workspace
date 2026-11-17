"use client";
/** ชั้นลอยของ dropdown/ปฏิทิน — วางที่ document.body ด้วย position: fixed ใต้ช่องที่กด
 *  เหตุผล (17 พ.ย. 2569 เจ้าของงานเจอ "dropdown panel โดนตัดอยู่ใน modal body"): Modal body เป็น overflow-y-auto + กล่อง overflow-hidden
 *  รายการที่เป็น absolute ในช่องจึงถูกตัด · ย้ายไปลอยนอกกล่องแทน ไม่เปลี่ยนหน้าตา (ค่ากรอบ/เงา/ระยะยังมาจาก component เดิม)
 *  - ติดตามตำแหน่งช่องเมื่อเลื่อนหน้า (scroll ทุกชั้น · capture) และย่อขยายจอ
 *  - พื้นที่ด้านล่างไม่พอ → เปิดขึ้นด้านบนแทน
 *  - z-[70] อยู่เหนือ Modal/Side panel (z-60) */
import { useLayoutEffect, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

export function Floating({ anchor, open, children, floatingRef, gap = 4, matchWidth = true, estHeight = 320 }: { anchor: RefObject<HTMLElement | null>; open: boolean; children: ReactNode; floatingRef?: RefObject<HTMLDivElement | null>; gap?: number; matchWidth?: boolean; estHeight?: number }) {
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    if (!open) return setPos(null);
    const place = () => {
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom;
      const up = below < estHeight && r.top > below;
      setPos(up ? { bottom: window.innerHeight - r.top + gap, left: r.left, width: r.width } : { top: r.bottom + gap, left: r.left, width: r.width });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, anchor, gap, estHeight]);
  if (!open || !pos || typeof document === "undefined") return null;
  return createPortal(
    <div ref={floatingRef} className="fixed z-[70]" style={{ top: pos.top, bottom: pos.bottom, left: pos.left, width: matchWidth ? pos.width : undefined }}>
      {children}
    </div>,
    document.body,
  );
}
