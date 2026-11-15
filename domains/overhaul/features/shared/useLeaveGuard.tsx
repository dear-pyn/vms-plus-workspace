"use client";
/** EC-27 ออกจากหน้าระหว่างมีการแก้ไข — ใช้ร่วมทุกฟอร์ม (แผน · Purchase Order · นัดหมาย · …) (เจ้าของงาน 14 พ.ย. 2569 "leave หน้าต้องมี modal")
 *  · ปิดแท็บ/รีเฟรช = กล่องเตือนของเบราว์เซอร์ (หน้าเว็บกำหนดเองไม่ได้)
 *  · กดลิงก์/เมนู · ปุ่มย้อนกลับ/ไปข้างหน้าของเบราว์เซอร์ · ปุ่มยกเลิก/breadcrumb (requestLeave) = modal "คุณต้องการออกจากหน้านี้หรือไม่ ?"
 *  · บันทึก: ครอบด้วย runSave() — สำเร็จแล้วหน้าพาออกเองโดยไม่ถาม */
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@ui/Modal";
import { setLeaveGuard } from "./leaveGuard";

export function useLeaveGuard(dirty: boolean, onCancel: () => void) {
  const [ask, setAsk] = useState(false);
  const bypass = useRef(false);
  const pending = useRef<(() => void) | null>(null);
  const ownHash = useRef("");
  useEffect(() => {
    ownHash.current = window.location.hash;
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      if (!bypass.current) e.preventDefault();
    };
    const click = (e: MouseEvent) => {
      if (bypass.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.getAttribute("href") === "#" || a.href === window.location.href) return;
      e.preventDefault();
      e.stopPropagation();
      pending.current = () => window.location.assign(a.href);
      setAsk(true);
    };
    // ปุ่มย้อนกลับ/ไปข้างหน้า: ตัวจัดเส้นทาง hash ถามด่านนี้ก่อนเปลี่ยนหน้า → ดึง hash กลับแล้วเปิด modal
    setLeaveGuard((to) => {
      if (bypass.current) return false;
      window.history.pushState(null, "", ownHash.current);
      pending.current = () => {
        window.location.hash = to;
      };
      setAsk(true);
      return true;
    });
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
      setLeaveGuard(null);
    };
  }, [dirty]);

  const leave = () => {
    bypass.current = true;
    const next = pending.current;
    pending.current = null;
    setAsk(false);
    (next ?? onCancel)();
  };
  /** ปุ่มยกเลิก/ย้อนกลับ/breadcrumb ของฟอร์ม */
  const requestLeave = (go: () => void = onCancel) => {
    if (!dirty) return go();
    pending.current = go;
    setAsk(true);
  };
  /** ครอบการบันทึก: hashchange จาก go() มาหลัง await → ปลดด่านเฉพาะตอนไม่ได้ออกจากหน้า (บันทึกไม่สำเร็จ / ยกเลิกในขั้นยืนยัน) */
  async function runSave<T>(save: () => Promise<T>, ok: (r: T) => boolean = (r) => r === (true as unknown as T)): Promise<T> {
    bypass.current = true;
    const r = await save();
    if (!ok(r) || window.location.hash === ownHash.current) bypass.current = false;
    return r;
  }

  const dialog = (
    <ConfirmDialog
      open={ask}
      onClose={() => {
        pending.current = null;
        setAsk(false);
      }}
      onConfirm={leave}
      icon="logout"
      title="คุณต้องการออกจากหน้านี้หรือไม่ ?"
      description="หากยืนยัน ข้อมูลที่ระบุจะหาย"
    />
  );
  return { requestLeave, runSave, dialog };
}
