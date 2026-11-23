"use client";
/** Prototype-only controls. Handlers change form state; normal validation/save still applies. */
import { useEffect, useState } from "react";
import { Button } from "@ui/Button";
import { resetPrototypeData, useStorageMode } from "./usePrototypeData";
export type MockMode = "ready" | "missing" | "error";
const EVENT = "overhaul:mock-fill";
/** ปุ่มสร้างชุดเคสทดสอบ (19 พ.ย. 2569) — หน้าต้นแบบรับแล้วเพิ่มชุดลง localStorage เครื่องนี้ */
export const MOCK_CASES_EVENT = "overhaul:mock-cases";
type Request = { mode: MockMode; handled: boolean };
export function usePrototypeFill(fill: (mode: MockMode) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const receive = (event: Event) => {
      const request = (event as CustomEvent<Request>).detail;
      if (request.handled) return;
      request.handled = true;
      fill(request.mode);
    };
    window.addEventListener(EVENT, receive);
    return () => window.removeEventListener(EVENT, receive);
  }, [fill, enabled]);
}
export function MockTools() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const storage = useStorageMode();
  function fill(mode: MockMode) {
    const detail: Request = { mode, handled: false };
    window.dispatchEvent(new CustomEvent(EVENT, { detail }));
    setMessage(detail.handled ? "เติมข้อมูลแล้ว กดปุ่มบันทึกของหน้าเพื่อทดสอบต่อ" : "เปิดฟอร์มที่แก้ไขได้ก่อนเติมข้อมูล mock");
  }
  return (
    <aside aria-label="เครื่องมือ prototype" className="fixed bottom-6 left-6 z-[90] flex max-w-[calc(100vw-3rem)] flex-col items-start gap-2">
      {open && <div id="prototype-mock-panel" className="flex w-72 max-w-full flex-col gap-3 rounded-lg border border-gray-300 bg-white p-4 shadow-field">
        <strong className="text-sm text-gray-800">ข้อมูล mock สำหรับ prototype</strong>
        <p className="text-xs text-gray-600">แทนค่าฟอร์มที่เปิดอยู่ ยังไม่บันทึกข้อมูล</p>
        {/* 19 พ.ย. 2569: บอกว่าข้อมูลเก็บที่ไหน — DB กลาง (ทุกคนเห็นชุดเดียวกัน) หรือเฉพาะเบราว์เซอร์นี้ */}
        <p className="text-xs text-gray-600">ข้อมูล: {storage === "remote" ? "ฐานข้อมูลกลาง ทุกคนเห็นชุดเดียวกัน" : storage === "connecting" ? "กำลังเชื่อมฐานข้อมูลกลาง…" : "เฉพาะเบราว์เซอร์นี้"}</p>
        <Button variant="secondary" onClick={() => fill("ready")}>เติมข้อมูลให้ครบ</Button>
        <Button variant="secondary" onClick={() => fill("missing")}>จำลองข้อมูลไม่ครบ</Button>
        <Button variant="secondary" onClick={() => fill("error")}>จำลองบันทึกไม่สำเร็จ</Button>
        <p className="text-xs text-gray-600">{message}</p>
        {/* 17 พ.ย. 2569: ทางเข้าสารบัญเคส + รีเซ็ตข้อมูล · 23 พ.ย. 2569 เปลี่ยนชื่อเป็น Overview */}
        <div className="flex flex-col gap-2 border-t border-gray-200 pt-3">
          <Button variant="tertiaryBrand" iconLeft="list_alt" onClick={() => { window.location.hash = "/cases"; setOpen(false); }}>Overview</Button>
          <Button variant="tertiaryBrand" iconLeft="add" onClick={() => { window.dispatchEvent(new Event(MOCK_CASES_EVENT)); window.location.hash = "/cases"; setOpen(false); }}>สร้างเคสทดสอบทุกสถานะ (เครื่องนี้)</Button>
          <Button variant="tertiary" iconLeft="restart_alt" onClick={() => resetPrototypeData()}>{storage === "remote" ? "รีเซ็ตข้อมูลต้นแบบ (ทุกคน)" : "รีเซ็ตข้อมูลต้นแบบ"}</Button>
        </div>
      </div>}
      {/* 17 พ.ย. 2569 เจ้าของงาน: ปุ่มลอยบังหน้าจอ → ปุ่มวงกลมไอคอนอย่างเดียว (ชื่อปุ่มยังเป็น "Mock · Prototype" สำหรับโปรแกรมอ่านหน้าจอ/สคริปต์แคป) */}
      <Button size="lg" iconOnly={open ? "close" : "science"} aria-label="Mock · Prototype" title="Mock · Prototype" aria-expanded={open} aria-controls="prototype-mock-panel" className="rounded-full shadow-field" onClick={() => { setOpen(!open); setMessage(""); }} />
    </aside>
  );
}
