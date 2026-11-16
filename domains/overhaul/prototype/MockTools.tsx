"use client";
/** Prototype-only controls. Handlers change form state; normal validation/save still applies. */
import { useEffect, useState } from "react";
import { Button } from "@ui/Button";
export type MockMode = "ready" | "missing" | "error";
const EVENT = "overhaul:mock-fill";
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
        <Button variant="secondary" onClick={() => fill("ready")}>เติมข้อมูลให้ครบ</Button>
        <Button variant="secondary" onClick={() => fill("missing")}>จำลองข้อมูลไม่ครบ</Button>
        <Button variant="secondary" onClick={() => fill("error")}>จำลองบันทึกไม่สำเร็จ</Button>
        <p className="text-xs text-gray-600">{message}</p>
      </div>}
      <Button aria-expanded={open} aria-controls="prototype-mock-panel" iconLeft="science" onClick={() => { setOpen(!open); setMessage(""); }}>Mock · Prototype</Button>
    </aside>
  );
}
