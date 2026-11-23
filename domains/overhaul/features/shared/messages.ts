/** ข้อความ Toast + Notification ของเมนูจัดการงาน Overhaul — ตามชีต "MaintainD-Overhaul - OH-Toast (ทุกหน้า)" (เจ้าของงานส่ง 17 พ.ย. 2569)
 *  เลขแถว (#) ตามชีต · ข้อความใช้คอลัมน์ "ข้อความ toast" ที่ลูกค้า CF หรือที่ NOTE BY PEACE ให้ "ปรับข้อความ"
 *  - เจ้าของงาน 17 พ.ย. 2569 "แยกกัน toast new กับ noti": แถวที่มีคอลัมน์ "New toast" → toast แสดงข้อความ New toast อย่างเดียว
 *    (เช่น "บันทึกข้อมูลสำเร็จ") · ข้อความเฉพาะของแถวไปอยู่ที่ notification (N) แทน · แถวที่ไม่มี New toast → toast = ข้อความเฉพาะ
 *  - Error แสดง Status Code เป็นข้อความรองตาม NOTE ("ถ้าไม่รู้ว่า Error จากอะไร ให้เอา Status Code มาแสดง")
 *  - {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO}: ระดับแผน = เลขแผน · ระดับงานรายคัน = "เลข PO (ทะเบียน)"
 *  - General Error = แสดง Status Code เช่น "500 Internal Server Error" (แถว 2 · 11 · 26)
 *  ยังไม่เคาะ: แถว 25 NOTE ให้ "ปิดงาน … เรียบร้อยแล้ว" (ตอนตัดผู้อนุมัติ) — ตอนนี้มีผู้อนุมัติแล้ว (17 พ.ย. 2569) จึงใช้ "คำขอปิดงาน … รอการตอบรับ" ตามคอลัมน์ toast/notification
 *    และย้าย "เรียบร้อยแล้ว" ไปแถว 27 (ผู้อนุมัติอนุมัติ) */

export type ToastMsg = { msg: string; description?: string; tone?: "success" | "error" | "info" | "warning" };

export const GENERAL_ERROR = "500 Internal Server Error";
const SAVED = "บันทึกข้อมูลสำเร็จ";
const SAVE_FAIL = "บันทึกข้อมูลไม่สำเร็จ";
const DELETED = "ลบข้อมูลสำเร็จ";

/** {ข้อมูลสำคัญ} ระดับงานรายคัน */
export const jobKey = (poId: string, plate: string) => `${poId} (${plate})`;

export const T = {
  /** 1 */ planCreated: (planId: string): ToastMsg => ({ msg: `สร้างแผน Overhaul ${planId} สำเร็จ` }),
  /** 2 */ planSaveFail: (): ToastMsg => ({ msg: GENERAL_ERROR, tone: "error" }),
  /** 3 */ planEdited: (): ToastMsg => ({ msg: "บันทึกการแก้ไขแผนสำเร็จ" }),
  /** 4 */ planDeleted: (planId: string): ToastMsg => ({ msg: `ลบแผน Overhaul ${planId} สำเร็จ` }),
  /** 6 */ planNotFound: (planId: string): ToastMsg => ({ msg: `ไม่พบแผน ${planId}`, tone: "error" }),
  /** 7 */ poCreated: (): ToastMsg => ({ msg: SAVED }),
  /** 8 */ poEdited: (): ToastMsg => ({ msg: SAVED }),
  /** 9 */ poDeleted: (): ToastMsg => ({ msg: DELETED }),
  /** 11 */ poSaveFail: (): ToastMsg => ({ msg: SAVE_FAIL, description: GENERAL_ERROR, tone: "error" }),
  /** 12 */ poPlanNotFound: (): ToastMsg => ({ msg: "ไม่พบแผน", tone: "error" }),
  /** 13 */ apptSent: (): ToastMsg => ({ msg: SAVED }),
  /** 14 */ apptFail: (key: string): ToastMsg => ({ msg: `นัดหมาย ${key} ไม่สำเร็จ`, tone: "error" }),
  /** 15 */ apptAccepted: (): ToastMsg => ({ msg: SAVED }),
  /** 16 */ apptRejected: (unit: string, key: string): ToastMsg => ({ msg: `หน่วยงาน ${unit} ของ ${key} ปฏิเสธนัดหมาย`, tone: "warning" }),
  /** 17 */ intakeConfirmed: (): ToastMsg => ({ msg: SAVED }),
  /** 18 */ progressAdded: (): ToastMsg => ({ msg: SAVED }),
  /** 19 */ progressEdited: (): ToastMsg => ({ msg: SAVED }),
  /** 20 */ progressDeleted: (): ToastMsg => ({ msg: SAVED }),
  /** 21 */ repairDone: (): ToastMsg => ({ msg: SAVED }),
  /** 22 */ inspectionConfirmed: (): ToastMsg => ({ msg: SAVED }),
  /** 23 (ปุ่มนำเข้าไฟล์ถูกตัด 16 พ.ย. 2569 — ปิดงานใช้หัวข้อ New toast) */ closed: (): ToastMsg => ({ msg: SAVED }),
  /** 25 */ approvalSent: (): ToastMsg => ({ msg: SAVED }),
  /** 26 */ stepSaveFail: (): ToastMsg => ({ msg: SAVE_FAIL, description: GENERAL_ERROR, tone: "error" }),
  /** 27 */ approved: (key: string): ToastMsg => ({ msg: `อนุมัติ ${key} เรียบร้อยแล้ว` }),
  /** 29 */ notApproved: (key: string): ToastMsg => ({ msg: `ไม่อนุมัติคำขอปิดงาน ${key}`, tone: "warning" }),
};

/** Notification (กระดิ่ง) — แยกจาก toast (เจ้าของงาน 17 พ.ย. 2569) · ข้อความตามคอลัมน์ "ข้อความ notification" ของชีต ("ตาม Toast เลย" = ข้อความคอลัมน์ toast)
 *  {overhaul ระบบ xxx} = "Overhaul" + ชื่อ PO (เช่น "ซ่อมระบบเครื่องยนต์") ต่อด้วย {PO (ทะเบียน)} · ปลายทางตามคอลัมน์ "ปลายทาง" */
export const ohName = (poName: string, key: string) => `Overhaul ${poName} ${key}`;
export const N = {
  /** 13 → หน่วยงาน คนเดียว */ apptSent: (key: string) => `ส่งยืนยัน ${key} สำเร็จ`,
  /** 15 → ตาม role กบค. (ตาม Toast) */ apptAccepted: (unit: string, key: string) => `หน่วยงาน ${unit} ของ ${key} ยืนยันนัดหมายแล้ว`,
  /** 17 → หน่วยงาน คนเดียว (ตาม Toast) */ intakeConfirmed: () => "ยืนยันรับรถสำเร็จ",
  /** 25 → หัวหน้า กบค. (ผู้อนุมัติ) */ approvalSent: (oh: string) => `คำขอปิดงาน ${oh} รอการตอบรับ`,
  /** 27 → กบค. */ approved: (oh: string) => `ดำเนินการปิดงาน ${oh} เรียบร้อยแล้ว`,
  /** ไม่อยู่ในชีต: แจ้งวันสิ้นสุดประกัน (FigJam Q.1–Q.5) → กบค. · ใช้ {PO (ทะเบียน)} ตามรูปแบบชีต */ warrantyEnd: (end: string, key: string, left: number, round: 30 | 15 = 30, combined = false) =>
    `แจ้งวันสิ้นสุดประกัน วันที่ ${end} ของ ${key} เหลือ ${left} วัน ${
      /* v2 feedback ลูกค้า 23 พ.ย. 2569: รอบ 30 วัน = ตรวจความสมบูรณ์ ให้ผู้รับจ้างแก้ทัน · รอบ 15 วัน = เตรียมเอกสารคืนเงินค้ำประกัน · ปิดงานตอนเหลือ ≤ 15 วัน = รวมสองเรื่อง */
      combined ? "โปรดตรวจสอบความสมบูรณ์ของยานพาหนะ และเตรียมเอกสารคืนเงินค้ำประกัน"
      : round === 30 ? "โปรดตรวจสอบความสมบูรณ์ของยานพาหนะ หากพบชำรุดให้แจ้งผู้รับจ้างแก้ไขก่อนหมดประกัน"
      : "โปรดเตรียมเอกสารคืนเงินค้ำประกัน"}`,
  /** ไม่อยู่ในชีต: ขั้น 5 ไม่มีการนัดหมาย (เจ้าของงาน 16 พ.ย. 2569) → ผู้รับมอบรถ (หน่วยงาน) · ใช้ {PO (ทะเบียน)} ตามรูปแบบชีต */ returned: (unit: string, key: string, date: string) => `ส่งมอบยานพาหนะ ${key} คืนหน่วยงาน ${unit} แล้ว วันที่ ${date}`,
  /** ไม่อยู่ในชีต (เจ้าของงาน 17 พ.ย. 2569): ขั้น 2 บันทึกแล้วขอให้ผู้ลงนามเซ็นรับทราบ → ผู้ส่งมอบรถ / ผู้รับมอบรถ คนเดียว */ signRequest: (key: string) => `กรุณาเซ็นลงนามการรับมอบรถ ${key}`,
  /** ไม่อยู่ในชีต: ผู้ลงนามเซ็นแล้ว → กบค. */ signed: (name: string, key: string) => `${name} เซ็นลงนามการรับมอบรถ ${key} แล้ว`,
  /** 29 → กบค. */ notApproved: (oh: string, reason: string) => `คำขอปิดงาน ${oh} ไม่ได้รับอนุมัติ เหตุผล: ${reason}`,
};

/** Tooltip ของไอคอน info ท้ายป้าย "ผู้ส่งมอบรถ" (ขั้น 1 · ขั้น 2 · มุมหน่วยงาน) — เจ้าของงาน 17 พ.ย. 2569 ให้บอกว่าเป็นคนของหน่วยงานผ่าน info แทนการต่อท้าย "(หน่วยงาน)" */
export const GIVER_INFO = { title: "พนักงานของหน่วยงาน", text: "ผู้ที่นำยานพาหนะมาส่งที่อู่ จากหน่วยงานเจ้าของยานพาหนะ" };
/** Tooltip ของไอคอน info ท้ายป้าย "ผู้รับมอบรถ" ขั้น 5 (กบค. · มุมหน่วยงาน) — เจ้าของงาน 17 พ.ย. 2569 ใช้ info แบบเดียวกับผู้ส่งมอบรถ แทนการต่อท้าย "(หน่วยงาน)" */
export const RECEIVER_INFO = { title: "พนักงานของหน่วยงาน", text: "ผู้ที่มารับยานพาหนะคืนที่อู่ จากหน่วยงานเจ้าของยานพาหนะ" };
