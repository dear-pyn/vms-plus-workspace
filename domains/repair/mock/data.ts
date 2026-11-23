/** ข้อมูลจำลองงานซ่อม (แจ้งซ่อม) — โครง/ค่าตัวเลือกยกจากระบบ UAT vms-plus-uat.odds.team/maintain-d/repair-utility-vehicle (ดู 20 พ.ย. 2569)
 *  ⚠ ชื่อคน/ทะเบียน/หมายเลขเหตุการณ์ เป็นค่าสมมติทั้งหมด — ห้ามใส่ข้อมูลบุคคลจริงจากภาพ/ระบบ UAT
 *  ค่าที่ยกตรงจาก UAT (master data ไม่ใช่ข้อมูลบุคคล): สถานะ 24 ค่า (API /api/repair/job-statuses) · ตัวเลือกงบ · อาการเสีย · รายการเอกสารรับรถ ·
 *  รายการตรวจสภาพ 24 ข้อ · เอกสารปิดงาน 15 ข้อ · ชื่ออะไหล่ตัวอย่าง */

/* ---------------- สถานะ (ตรงกับ API job-statuses · ลำดับ sort_order) ---------------- */
export type StatusCode =
  | "waiting_unit_head_approval" | "self_repair_in_progress" | "not_approved" | "returned_for_self_repair"
  | "waiting_ecd_review" | "ecd_approved_self_repair" | "waiting_ecd_action" | "waiting_med_receive" | "waiting_med_review"
  | "preparing_spare_parts" | "waiting_origin_confirm_appointment" | "ready_to_proceed" | "repair_in_progress" | "repair_finished"
  | "found_additional_symptoms" | "job_closed" | "waiting_origin_confirm_pickup" | "waiting_origin_pickup" | "waiting_med_reschedule_return"
  | "waiting_med_head_approval" | "waiting_reporter_confirm_return_date" | "waiting_med_post_repair_inspection" | "waiting_med_closing_report"
  | "waiting_closing_approval"
  /** เพิ่มใหม่ (เจ้าของงาน 23 พ.ย. 2569): ไม่อนุมัติ → ผู้แจ้งกดยกเลิก → สถานะยกเลิก แล้วสร้างใบแจ้งซ่อมใหม่ */
  | "cancelled";

/** observed = มีหน้าจอ/งานจริงในสถานะนี้บน UAT (20 พ.ย. 2569) · added = UAT มีแค่ชื่อสถานะ ไม่มีจอ → ต้นแบบเติม flow (รอยืนยัน) · unused = ยังไม่รู้ว่าใช้ตอนไหน */
export type Evidence = "observed" | "added" | "unused";
export type Tone = "warning" | "gray" | "success" | "brand" | "error";

export const STATUSES: { code: StatusCode; name: string; terminal?: boolean; tone: Tone; evidence: Evidence }[] = [
  { code: "waiting_unit_head_approval", name: "รอหัวหน้าหน่วยงานอนุมัติ", tone: "warning", evidence: "observed" },
  { code: "self_repair_in_progress", name: "ดำเนินการซ่อมเอง", tone: "warning", evidence: "added" },
  { code: "not_approved", name: "ไม่อนุมัติ", terminal: true, tone: "error", evidence: "added" },
  { code: "returned_for_self_repair", name: "ส่งกลับต้นทางซ่อมเอง", tone: "warning", evidence: "added" },
  { code: "waiting_ecd_review", name: "รอ กรย พิจารณา", tone: "warning", evidence: "added" },
  { code: "ecd_approved_self_repair", name: "กรย เห็นชอบ ซ่อมเอง", tone: "warning", evidence: "added" },
  { code: "waiting_ecd_action", name: "รอ กรย ดำเนินการ", tone: "warning", evidence: "added" },
  { code: "waiting_med_receive", name: "รอ กบค รับเรื่อง", tone: "warning", evidence: "added" },
  { code: "waiting_med_review", name: "รอ กบค พิจารณา", tone: "warning", evidence: "added" },
  { code: "preparing_spare_parts", name: "เตรียมอะไหล่", tone: "warning", evidence: "added" },
  { code: "waiting_origin_confirm_appointment", name: "รอต้นทางยืนยันนัดหมาย", tone: "warning", evidence: "added" },
  { code: "ready_to_proceed", name: "รอตรวจสภาพก่อนซ่อม", tone: "brand", evidence: "observed" },
  { code: "repair_in_progress", name: "ดำเนินการซ่อม", tone: "warning", evidence: "observed" },
  { code: "repair_finished", name: "ซ่อมเสร็จ", tone: "success", evidence: "observed" },
  { code: "found_additional_symptoms", name: "เจออาการเพิ่ม", tone: "warning", evidence: "added" },
  { code: "job_closed", name: "ปิดงาน", terminal: true, tone: "gray", evidence: "observed" },
  { code: "cancelled", name: "ยกเลิก", terminal: true, tone: "gray", evidence: "added" },
  { code: "waiting_origin_confirm_pickup", name: "รอต้นทางยืนยันรับรถ", tone: "warning", evidence: "observed" },
  { code: "waiting_origin_pickup", name: "รอต้นทางรับรถกลับไปใช้งาน", tone: "warning", evidence: "unused" },
  { code: "waiting_med_reschedule_return", name: "รอ กบค. ส่งนัดหมายวันคืนรถใหม่อีกครั้ง", tone: "warning", evidence: "added" },
  { code: "waiting_med_head_approval", name: "รอหัวหน้า กบค. อนุมัติ", tone: "warning", evidence: "observed" },
  { code: "waiting_reporter_confirm_return_date", name: "รอ คนแจ้งซ่อม ยืนยันนัดหมาย วันคืนรถ", tone: "warning", evidence: "unused" },
  { code: "waiting_med_post_repair_inspection", name: "รอ กบค. ตรวจสภาพหลังซ่อม", tone: "warning", evidence: "observed" },
  { code: "waiting_med_closing_report", name: "รอ กบค. ส่งรายงานปิดงาน", tone: "warning", evidence: "observed" },
  { code: "waiting_closing_approval", name: "รออนุมัติปิดงาน", tone: "warning", evidence: "observed" },
];
export const statusOf = (c: StatusCode) => STATUSES.find((s) => s.code === c)!;

/* ---------------- master data (ค่าตัวเลือกตรงจาก UAT) ---------------- */
export const BUDGETS = [
  { value: "own", label: "งบทำการ หน่วยงานต้นสังกัด" },
  { value: "other", label: "งบทำการ หน่วยงานอื่น" },
  { value: "invest", label: "งบลงทุน งานก่อสร้าง" },
  { value: "maint", label: "งานบำรุงรักษา" },
  { value: "etc", label: "อื่น ๆ (โปรดระบุในหมายเหตุ)" },
] as const;
export type BudgetType = (typeof BUDGETS)[number]["value"];
export const COST_CENTERS = ["Z903021100 ผจค.กพค.-บริหาร", "Z903022100 ผจค.กพค.-ปฏิบัติการ", "Z903031100 ผบร.กบค.-บริหาร"];

export const SYMPTOMS = [
  "ดุมล้อมีน้ำมันรั่ว (อะไหล่ที่ใช้ต่อข้าง)",
  "แอร์ไดเออร์รั่ว",
  "เบรควิ้นซ์",
  "เบรค (ห้องบังคับเครน)",
  "กระบอกสไลด์ขาช้าง (อะไหล่ที่ใช้ต่อกระบอก)",
  "กระบอกขาช้างหน้า (อะไหล่ที่ใช้ต่อกระบอก)",
  "กระบอกขาช้างหลัง (อะไหล่ที่ใช้ต่อกระบอก)",
  "กระบอกโช๊คล๊อคแหนบ (อะไหล่ที่ใช้ต่อกระบอก)",
];

export const INTAKE_DOCS = [
  "แผ่นป้ายทะเบียนหน้า-หลัง",
  "ป้ายทะเบียนติดกระจก และ พรบ.",
  "กระจกมองข้างซ้าย-ขวา, กระจกมองหลัง",
  "ยางอะไหล่",
  "แบตเตอรี่ยี่ห้อ", // แถว 5 มีช่อง ยี่ห้อ + จำนวน ลูก
  "เครื่องมือประจำรถ, แม่แรง, ประแจถอดล้อ",
  "ฝาถังน้ำมัน",
  "อุปกรณ์บนหน้าปัด, แตร",
  "ใบปัดน้ำฝน",
  "วิทยุ, ลำโพง, เสาอากาศ, วิทยุรับ-ส่ง",
  "ระบบไฟส่องสว่าง",
  "สภาพยาง",
  "สภาพตัวถังและสี",
];

export const INSPECT_ITEMS = [
  "ชุดเกียร์พีทีโอ", "ชุดกระบอกขาช้างหน้า ซ้าย ขวา", "ชุดกระบอกขาช้างหลัง ซ้าย ขวา", "ชุดวาร์ลคอนโทรลขาช้าง", "เพลาขับปั๊มน้ำมันไฮดรอลิค", "ชุดโรตารี่",
  "ชุดกระบอก UPPER BOOM", "ชุดกระบอก LOWER BOOM", "ชุดวาล์วล็อคต่างๆ", "รอกและเชือกวินซ์", "ชุด LIFT รุ่น 115 kV", "ชุดยึดฐานเครน", "ปั๊มน้ำมันไฮดรอลิค",
  "ชุดมอเตอร์และเฟื่องหมุนฐานเครน", "ชุด CONTROL ล่าง", "ชุดกระบอก เทน้ำ-ปรับดิ่ง", "จุดเชื่อมต่อโครงสร้าง BOOM", "สายน้ำมันไฮดรอลิค", "ชุด CONTROL บน",
  "กระบอกปรับบิด", "BUCKET, LINER, ชุดการ์ดครอบ", "ระบบ EMERGENCY", "ระบบเร่งเครื่องยนต์", "สายสัญญาณต่างๆ",
];

export const CLOSE_DOCS = [
  "บันทึกสั่งงาน/สำเนาบันทึกสั่งงาน", "บันทึกรับงานเข้างาน", "ใบเบิกของ", "ใบส่งของคลัง", "สำเนาอนุมัติหลักการจัดซื้อ", "สำเนาบิลส่งของเรื่องจัดซื้อ",
  "สำเนาอนุมัติหลักการจัดจ้าง", "สำเนาบิลส่งของเรื่องจัดจ้าง", "บันทึกการตรวจสอบวัสดุอะไหล่", "สำเนาใบส่งคืนคลังพัสดุ", "บันทึกการตรวจสภาพบำรุงรักษา",
  "บันทึกทดสอบก่อนซ่อม/หลังซ่อม", "รายงานออกปฏิบัติงานส่วนภูมิภาค", "เรื่องแจ้งงานเสร็จ", "เรื่องแจ้งงดซ่อม",
];

/* ---------------- คน · ยานพาหนะ · อะไหล่ (สมมติ) ---------------- */
export interface Person { id: string; name: string; position: string; unit: string; phone?: string }
export const PEOPLE: Person[] = [
  { id: "p1", name: "นาย กบค", position: "วศก.6", unit: "กบค" }, // persona ทดสอบของ UAT (ไม่ใช่บุคคลจริง)
  { id: "p2", name: "นายทดสอบ ผู้รับแจ้ง", position: "รฝ.", unit: "ฝวบ.(น1)", phone: "081-000-0001" },
  { id: "p3", name: "นางสาวตัวอย่าง หัวหน้าแผนก", position: "หผ.", unit: "กบค.กฟภ.น.1", phone: "081-000-0002" },
  { id: "p4", name: "นายสมมติ ช่างซ่อม", position: "ช่าง 5", unit: "กบค", phone: "081-000-0003" },
  { id: "p5", name: "นายจำลอง ช่างเครื่อง", position: "ช่าง 6", unit: "กบค", phone: "081-000-0004" },
  { id: "p6", name: "นายต้นแบบ ผู้ส่งมอบ", position: "พขร.", unit: "กฟส.ตัวอย่าง", phone: "081-000-0005" },
  { id: "p7", name: "นางทดลอง หัวหน้า กบค.", position: "ผบค.", unit: "กบค", phone: "081-000-0006" },
  { id: "p8", name: "นายสาธิต กรย", position: "หผ.", unit: "กรย. เขต 1", phone: "081-000-0007" },
];
export const personOf = (id?: string) => PEOPLE.find((p) => p.id === id);

export interface Vehicle {
  plate: string; province: string; provinceShort: string; brand: string; model: string; type: string; unit: string;
  age: string; mileage: number; hours?: number; crane: boolean; mechanic?: string; driver?: string;
  /** ราคาที่ได้มา (บาท) — เจ้าของงาน 23 พ.ย. 2569 "ใช้ราคารถที่ได้มา" · ระบบจริงดึงจาก SAP/VMMS · ใช้เตือนค่าซ่อมเกิน 30% (JO1 7.2.3.1) */ assetValue: number;
}
export const VEHICLES: Vehicle[] = [
  { plate: "80-1001", province: "นครสวรรค์", provinceShort: "นว", brand: "ISUZU", model: "FTR11H-K", type: "ตรวจการ", unit: "การไฟฟ้าส่วนภูมิภาคสาขาตัวอย่าง(กฟส.ตย.)", age: "33 ปี 5 เดือน", mileage: 56678, crane: false, assetValue: 45000 },
  { plate: "80-1002", province: "เชียงใหม่", provinceShort: "ชม", brand: "ISUZU", model: "FXZ77QXDTS", type: "บรรทุกเฉพาะกิจ(มีเครื่องกำเนิด) 800 กว.", unit: "กฟน.1", age: "8 ปี 2 เดือน", mileage: 120450, crane: false, assetValue: 1850000 },
  { plate: "80-1003", province: "นครราชสีมา", provinceShort: "นม", brand: "HINO", model: "XZU720R-HKFTLT3", type: "กระเช้าแก้ไฟ", unit: "กฟฉ.3", age: "2 ปี 7 เดือน", mileage: 1234, hours: 3456, crane: true, assetValue: 2400000 },
  { plate: "80-1004", province: "กรุงเทพมหานคร", provinceShort: "กทม", brand: "NISSAN", model: "AR250E", type: "เครนแข็ง", unit: "กบค", age: "12 ปี 1 เดือน", mileage: 12345, hours: 820, crane: true, assetValue: 3600000 },
  { plate: "80-1005", province: "กำแพงเพชร", provinceShort: "กพ", brand: "HINO", model: "XZU720R-HKFTLT3", type: "กระเช้าแก้ไฟ", unit: "กฟน.3", age: "4 ปี 0 เดือน", mileage: 45210, hours: 1500, crane: true, assetValue: 2100000 },
];
export const vehicleOf = (plate: string) => VEHICLES.find((v) => v.plate === plate)!;

export interface Part { id: string; name: string; code: string; unit: string; price: number; stock: { main: number; spare: number } }
export const PARTS: Part[] = [
  { id: "a1", name: "ลูกปืนตลับนอก # 522510/522548", code: "2-38-040-0210", unit: "ตลับ", price: 850, stock: { main: 0, spare: 1 } },
  { id: "a2", name: "O-RING KIT # 45127-Z9027", code: "2-38-041-0001", unit: "ชุด", price: 420, stock: { main: 6, spare: 0 } },
  { id: "a3", name: "CYLINDER BRAKE # 360-501-80000 (แม่ปั๊มฝักเบรก)", code: "2-38-041-0002", unit: "ชิ้น", price: 3250.5, stock: { main: 2, spare: 1 } },
  { id: "a4", name: "RING,BACKUP # 914-110-07500", code: "2-38-041-0003", unit: "ชิ้น", price: 95, stock: { main: 20, spare: 0 } },
  { id: "a5", name: "O,RING P48A # 910-028-04801", code: "2-38-041-0004", unit: "ชิ้น", price: 60, stock: { main: 0, spare: 0 } },
  { id: "a6", name: "น้ำมันเบรค PTT.DOT 3", code: "2-38-050-0100", unit: "ขวด", price: 180, stock: { main: 12, spare: 4 } },
  { id: "a7", name: "PACKING SNY35 # 916-940-03500", code: "2-38-041-0005", unit: "ชิ้น", price: 145, stock: { main: 3, spare: 0 } },
];
export const partOf = (id: string) => PARTS.find((p) => p.id === id)!;
