import type { NavGroup } from "@ui/AppShell";

/** เมนูหลักตามระบบเดิม + กลุ่ม "จัดการยานพาหนะขนาดใหญ่" ต่อจาก "จัดการใบสั่งจราจร" — design/reference/navigation.md
 *  ไอคอนใช้ชื่อเดียวกับระบบเดิม (vmsplus-dev) · ⚠ ไอคอนกลุ่มใหม่ (local_shipping) ยังไม่เคาะ
 *  เมนูย่อยที่ไม่มี href = ยังไม่มีในต้นแบบ (แสดงจาง) */
export function mainNav(prototypeBase: string): NavGroup[] {
  return [
    { id: "home", label: "หน้าหลัก", icon: "home", href: "/" },
    { id: "booking", label: "ระบบจองยานพาหนะ", icon: "car_rental", children: [{ id: "b1", label: "คำขอใช้ยานพาหนะ" }, { id: "b2", label: "ประเมินพนักงานขับรถ" }, { id: "b3", label: "ใบสั่งจราจร" }] },
    { id: "requests", label: "จัดการคำขอใช้ยานพาหนะ", icon: "traffic_jam", children: [{ id: "r1", label: "ตรวจสอบและจัดการคำขอ" }, { id: "r2", label: "อนุมัติใช้ยานพาหนะ" }] },
    { id: "master", label: "ข้อมูลพนักงานและยานพาหนะ", icon: "database", children: [{ id: "m1", label: "ข้อมูลพนักงานขับรถ" }, { id: "m2", label: "ข้อมูลยานพาหนะ" }, { id: "m3", label: "กลุ่มยานพาหนะ" }, { id: "m4", label: "ผู้ดูแลยานพาหนะ" }, { id: "m5", label: "บริหารสัญญา" }] },
    { id: "ev", label: "การอัดประจุไฟฟ้า", icon: "ev_station", children: [{ id: "e1", label: "สถานีอัดประจุไฟฟ้า" }, { id: "e2", label: "อัตราค่าไฟฟ้า" }, { id: "e3", label: "ค่าใช้จ่ายอัดประจุไฟฟ้ายานพาหนะ" }, { id: "e4", label: "บันทึกการอัดประจุ Wall Charger" }, { id: "e5", label: "ตรวจสอบการอัดประจุ" }] },
    { id: "repair", label: "งานซ่อมและบำรุงรักษา", icon: "build", children: [{ id: "rp1", label: "ภาพรวมการซ่อมบำรุง" }, { id: "rp2", label: "ตารางบำรุงรักษา" }, { id: "rp3", label: "นัดหมายบำรุงรักษา" }, { id: "rp4", label: "งานซ่อม" }, { id: "rp5", label: "รถทดแทน" }] },
    { id: "incident", label: "จัดการเหตุการณ์", icon: "e911_emergency", children: [{ id: "i1", label: "จัดการเหตุรถเสีย" }, { id: "i2", label: "จัดการเหตุอุบัติเหตุ" }] },
    { id: "report", label: "รายงาน", icon: "news" },
    { id: "ticket", label: "จัดการใบสั่งจราจร", icon: "receipt_long", children: [{ id: "t1", label: "รายการใบสั่งจราจร" }, { id: "t2", label: "สร้างใบสั่งจราจร" }] },
    {
      id: "heavy",
      label: "จัดการยานพาหนะขนาดใหญ่",
      icon: "local_shipping",
      children: [
        { id: "overhaul", label: "Overhaul", href: `${prototypeBase}/prototypes/overhaul/` },
        { id: "h2", label: "บำรุงรักษาตามวาระ" },
        { id: "h3", label: "แจ้งซ่อม" },
        { id: "h4", label: "ยืม-คืน" },
        { id: "h5", label: "โอนย้าย" },
        { id: "h6", label: "จำหน่าย" },
        { id: "h7", label: "Fleet Card" },
      ],
    },
    { id: "dashboard", label: "ภาพรวม Dashboard", icon: "dashboard" },
    { id: "manual", label: "คู่มือการใช้งาน", icon: "help" },
    { id: "issue", label: "แจ้งปัญหาการใช้งาน", icon: "list_alt" },
  ];
}
