"use client";
/** Overview (#/overview) — เครื่องมือต้นแบบงานซ่อม ไม่ใช่หน้าของระบบจริง
 *  แบบเดียวกับ Overview ของ Overhaul (เดิม "สารบัญเคส") — เจ้าของงาน 23 พ.ย. 2569 "ทำแบบเคสต้นแบบ Overhaul และเปลี่ยนคำว่า เคสต้นแบบ → Overview"
 *  ลิสต์ทุก flow / สถานะของงานซ่อม → งานตัวอย่างในข้อมูลตั้งต้น (1 งานต่อเคส) + role ที่ต้องใช้ · กด "เปิด" = สลับ role ให้แล้วไปหน้านั้น
 *  เล่นไปแล้วงานเลื่อนสถานะ → แถวบอก "เลื่อนเป็น … แล้ว" · กด "รีเซ็ตข้อมูลต้นแบบ" เพื่อกลับเป็นค่าตั้งต้น
 *  คอลัมน์ "ที่มา": UAT = มีในระบบ UAT 20 พ.ย. 2569 · เพิ่มใหม่ = ต้นแบบเติม (รอยืนยัน) */
import { useMemo } from "react";
import { Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { PageHeader, SectionHeader } from "@ui/PageHeader";
import { DataTable, Td, Th } from "@ui/Table";
import { statusOf, type StatusCode } from "../mock/data";
import { seedJobs } from "../mock/jobs";
import { mergedHref } from "../mock/store";
import { ROLES, type RepairJob, type Role } from "../features/model";
import { StatusPill } from "../features/ui";

type Src = "uat" | "added";
interface Spec { group: string; title: string; src: Src; role: Role; /** หน้าเฉพาะ (ไม่ผูกงาน) */ hash?: string; /** ข้ามต้นแบบ (เมนูรวมใน Overhaul) */ url?: string; status?: StatusCode; pick?: (j: RepairJob) => boolean; /** ต่อท้าย hash ของงาน เช่น reply */ jobHash?: (id: string) => string; note?: string }

const G = {
  list: "รายการ / แจ้งซ่อม",
  approve: "อนุมัติก่อนซ่อม",
  self: "ซ่อมเอง / ศูนย์บริการ-อู่ภายนอก",
  process: "กระบวนการซ่อม (กบค.) ขั้น 1–7",
  origin: "มุมหน่วยงานเจ้าของยานพาหนะ",
  approver: "มุมผู้อนุมัติ",
  unused: "สถานะที่ยังไม่รู้ว่าใช้ตอนไหน (รอถาม กฟภ.)",
};

const SPECS: Spec[] = [
  { group: G.list, title: "รายการงานซ่อม · แท็บ ปกติ / ค่าซ่อมเกิน 30% · เสนอเข้าแผน Overhaul / เสนอจำหน่าย", src: "uat", role: "admin", hash: "#/", note: "แท็บเกิน 30% + เมนูท้ายแถว = เพิ่มใหม่" },
  { group: G.list, title: "รายการว่าง (ไม่มีรายการแจ้งซ่อม)", src: "uat", role: "admin", hash: "#/empty" },
  { group: G.list, title: "แจ้งซ่อม 4 ขั้น (ข้อมูลยานพาหนะ · อาการเสีย · อะไหล่ที่แนะนำ · ยืนยัน) + section ศูนย์บริการ/อู่ (เลือกอู่ → แนบเอกสาร → ราคาประเมิน)", src: "uat", role: "origin", hash: "#/new", note: "ระบุอู่ / ราคาประเมิน = เพิ่มใหม่" },

  { group: G.approve, title: "รอหัวหน้าหน่วยงานอนุมัติ — อนุมัติทันที / ไม่อนุมัติ (Modal เหตุผล) · เคสค่าซ่อมเกิน 30%", src: "added", role: "unitHead", status: "waiting_unit_head_approval", pick: (j) => !!j.estimate, note: "UAT ให้เลือกวิธีซ่อมที่ขั้นนี้ — ย้ายไปขั้น กบค รับเรื่อง" },
  { group: G.approve, title: "รอหัวหน้า กบค. อนุมัติ — วิธีซ่อม/ราคาประเมินเดิม · อนุมัติ / ส่งคืนงานซ่อม", src: "uat", role: "medHead", status: "waiting_med_head_approval" },
  { group: G.approve, title: "รอ กรย พิจารณา — เลือก ซ่อมโดย กรย. / กบค. / อู่ภายนอก + ประเมินราคา → อนุมัติ", src: "added", role: "ecd", status: "waiting_ecd_review" },
  { group: G.approve, title: "รอ กบค รับเรื่อง — เลือกวิธีซ่อม + ประเมินราคา → รับงานซ่อม (หน้า UAT)", src: "uat", role: "med", status: "waiting_med_receive" },
  { group: G.approve, title: "รอ กบค พิจารณา — หน้าเดียวกับ รอ กบค รับเรื่อง", src: "added", role: "med", status: "waiting_med_review" },
  { group: G.approve, title: "ส่งกลับต้นทางซ่อมเอง — เหตุผล + กระบวนการซ่อมอู่ 3 ขั้น", src: "added", role: "origin", status: "returned_for_self_repair" },
  { group: G.approve, title: "ยกเลิกแล้ว", src: "added", role: "admin", status: "cancelled" },
  { group: G.approve, title: "ไม่อนุมัติ — ยกเลิกใบแจ้งซ่อม (แล้วสร้างใหม่)", src: "added", role: "origin", status: "not_approved" },

  { group: G.self, title: "กรย. เห็นชอบให้ซ่อมอู่ — ขั้น 1 นำรถเข้าอู่ (อู่ · ใบเสนอราคา · ราคาประเมิน)", src: "added", role: "origin", status: "ecd_approved_self_repair" },
  { group: G.self, title: "ซ่อมโดย กรย. — กระบวนการซ่อม 3 ขั้น", src: "added", role: "ecd", status: "waiting_ecd_action" },
  { group: G.self, title: "ซ่อมอู่ ขั้น 2 ความคืบหน้า → ขั้น 3 รับรถคืน · ค่าใช้จ่าย · ใบเสร็จ · ประกันของอู่ → ปิดงาน", src: "added", role: "origin", status: "self_repair_in_progress" },
  { group: G.self, title: "ปิดงานแล้ว (ศูนย์บริการ/อู่ภายนอก) — ดูย้อนหลังทีละขั้น", src: "added", role: "admin", status: "job_closed", pick: (j) => !!j.external },

  { group: G.process, title: "ขั้น 1 เบิกอะไหล่ — เลือกอะไหล่ · ยืนยันเบิก", src: "added", role: "med", status: "preparing_spare_parts", pick: (j) => !j.parts?.locked },
  { group: G.process, title: "ขั้น 2 นัดหมายวันซ่อม — ส่งนัดหมาย", src: "added", role: "med", status: "preparing_spare_parts", pick: (j) => !!j.parts?.locked },
  { group: G.process, title: "ขั้น 2 รอต้นทางยืนยันนัดหมาย (มุม กบค.)", src: "added", role: "med", status: "waiting_origin_confirm_appointment" },
  { group: G.process, title: "ขั้น 3 ตรวจสภาพก่อนซ่อม — เอกสารรับรถ · ตรวจ 24 ข้อ · รูป (บังคับ) → จึงเซ็นลงนาม (แบบ Overhaul)", src: "uat", role: "med", status: "ready_to_proceed", pick: (j) => !j.intake?.signReq },
  { group: G.process, title: "ขั้น 3 ส่งให้หน่วยงานเซ็นแล้ว — ล็อกข้อมูล · แก้ไข (ยกเลิกคำขอ)", src: "added", role: "med", status: "ready_to_proceed", pick: (j) => !!j.intake?.signReq },
  { group: G.process, title: "ขั้น 4 ดำเนินการซ่อม — บันทึกความคืบหน้า · พบ/ไม่พบอาการเพิ่ม", src: "uat", role: "med", status: "repair_in_progress", note: "บันทึกความคืบหน้า = เพิ่มใหม่ · อาการเพิ่มตาม UAT" },
  { group: G.process, title: "ขั้น 4 เจออาการเพิ่ม — หัวหน้า กบค. อนุมัติ / ไม่อนุมัติ", src: "added", role: "medHead", status: "found_additional_symptoms" },
  { group: G.process, title: "ขั้น 5 นัดหมายวันคืนรถ — ส่งนัดหมาย", src: "uat", role: "med", status: "repair_finished" },
  { group: G.process, title: "ขั้น 5 รอต้นทางยืนยันรับรถ (มุม กบค.)", src: "uat", role: "med", status: "waiting_origin_confirm_pickup" },
  { group: G.process, title: "ขั้น 5 ต้นทางขอเปลี่ยนวัน — ส่งนัดคืนรถใหม่", src: "added", role: "med", status: "waiting_med_reschedule_return" },
  { group: G.process, title: "ขั้น 6 ตรวจสภาพหลังซ่อม — ตรวจ 24 ข้อ · ลงนามส่งคืน (วันปิดงาน) · คะแนน · ประกันของ กบค. · อะไหล่ใช้/คืน", src: "uat", role: "med", status: "waiting_med_post_repair_inspection", note: "ประกัน / รูปหลังซ่อม / คำขอเซ็น = เพิ่มใหม่" },
  { group: G.process, title: "ขั้น 7 รายงานปิดงาน — ค่าใช้จ่ายในการซ่อม · อะไหล่เก่า · เอกสารปิดงาน 15 ข้อ · ส่งอนุมัติ", src: "uat", role: "med", status: "waiting_med_closing_report", note: "ค่าใช้จ่าย = เพิ่มใหม่" },
  { group: G.process, title: "ขั้น 7 รออนุมัติปิดงาน — อนุมัติปิดงาน / ส่งกลับแก้ไข", src: "uat", role: "medHead", status: "waiting_closing_approval", note: "ส่งกลับแก้ไข = เพิ่มใหม่" },
  { group: G.process, title: "ปิดงานแล้ว (กบค.) — ประกันใกล้หมด แจ้งเตือนในกระดิ่ง", src: "uat", role: "admin", status: "job_closed", pick: (j) => !j.external && !!j.intake },

  { group: G.origin, title: "เมนูตอบรับนัดหมาย (รวมกับ Overhaul · แท็บงานซ่อม)", src: "added", role: "origin", url: mergedHref("agency", "repair") },
  { group: G.origin, title: "ตอบรับ / ปฏิเสธ นัดหมายวันซ่อม", src: "added", role: "origin", status: "waiting_origin_confirm_appointment", jobHash: (id) => `#/reply/${id}/appt` },
  { group: G.origin, title: "ตอบรับ / ปฏิเสธ นัดหมายวันคืนรถ", src: "added", role: "origin", status: "waiting_origin_confirm_pickup", jobHash: (id) => `#/reply/${id}/return` },
  { group: G.origin, title: "เซ็นลงนามการรับมอบรถ", src: "added", role: "origin", status: "ready_to_proceed", pick: (j) => !!j.intake?.signReq, jobHash: (id) => `#/reply/${id}/signIntake` },

  { group: G.approver, title: "เมนูอนุมัติงาน (รวมกับ Overhaul · แท็บงานซ่อม) — แจ้งซ่อม · เปิดงาน · อาการเพิ่ม · ปิดงาน", src: "added", role: "medHead", url: mergedHref("approval", "repair") },

  { group: G.unused, title: "รอต้นทางรับรถกลับไปใช้งาน", src: "uat", role: "admin", status: "waiting_origin_pickup", note: "มีใน API แต่ไม่พบว่าเกิดตอนไหน" },
  { group: G.unused, title: "รอ คนแจ้งซ่อม ยืนยันนัดหมาย วันคืนรถ", src: "uat", role: "admin", status: "waiting_reporter_confirm_return_date", note: "มีใน API แต่ไม่พบว่าเกิดตอนไหน" },
];

/** สิ่งที่ยังไม่ได้ทำในต้นแบบ (ตอบคำถาม "ครบทุก flow ยัง") */
const NOT_YET = [
  "JO1 7.2.2 พิกัด/สถานที่ที่รถเสีย ในใบแจ้งซ่อม",
  "JO1 7.2.3.1 ผู้ดูแลยานพาหนะยืนยันก่อนส่งผู้อนุมัติ · เปลี่ยนผู้อนุมัติ · แก้เบอร์โทรผู้อนุมัติ",
  "แก้ไข / ลบ บันทึกความคืบหน้า (ตอนนี้เพิ่มได้อย่างเดียว)",
  "ตัวกรองและปุ่ม \"รายงาน\" ในแท็บประวัติการซ่อม (ยังกดไม่มีผล) · Export Excel/PDF · Dashboard งานซ่อม",
  "เทียบ 30% กับค่าซ่อมสะสมของรถคันนั้น (ตอนนี้คิดเฉพาะครั้งนี้ — รอตอบ)",
];

export function RepairOverview({ jobs, onOpen, onReset }: { jobs: RepairJob[]; onOpen: (target: { hash?: string; url?: string }, role: Role) => void; onReset: () => void }) {
  const seed = useMemo(() => seedJobs(), []);
  const rows = SPECS.map((sp) => {
    if (sp.hash || sp.url) return { sp, job: undefined as RepairJob | undefined, href: sp.hash ?? sp.url!, moved: false, missing: false };
    const s = seed.find((j) => j.status === sp.status && (!sp.pick || sp.pick(j)));
    const cur = s ? jobs.find((j) => j.id === s.id) : undefined;
    const moved = !!cur && (cur.status !== sp.status || (sp.pick ? !sp.pick(cur) : false));
    return { sp, job: cur, href: cur ? (sp.jobHash ? sp.jobHash(cur.id) : `#/job/${cur.id}`) : "", moved, missing: !cur };
  });
  const groups = [...new Set(SPECS.map((s) => s.group))];
  const roleLabel = (r: Role) => ROLES.find((x) => x.value === r)?.label.split(" · ")[0].split(" (")[0] ?? r;
  const uat = SPECS.filter((s) => s.src === "uat").length;

  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={[{ label: "Overview (ต้นแบบ)" }]}
        title="Overview"
        subtitle={`เครื่องมือของต้นแบบงานซ่อม · ${SPECS.length} เคส (UAT ${uat} · เพิ่มใหม่ ${SPECS.length - uat}) · กด "เปิด" ระบบสลับ role ให้ตามเคส`}
        actions={<Button variant="secondary" iconLeft="restart_alt" onClick={onReset}>รีเซ็ตข้อมูลต้นแบบ</Button>}
      />
      {groups.map((g) => (
        <section key={g} className="flex flex-col gap-4">
          <SectionHeader title={g} />
          <DataTable label={g} striped cols={[420, 100, 270, 160, 240, 96]}>
            <thead>
              <tr>
                <Th>เคส</Th>
                <Th>ที่มา</Th>
                <Th>สถานะตอนนี้</Th>
                <Th>role</Th>
                <Th>งาน / หมายเหตุ</Th>
                <Th><span className="sr-only">เปิด</span></Th>
              </tr>
            </thead>
            <tbody>
              {rows.filter((r) => r.sp.group === g).map(({ sp, job, href, moved, missing }) => (
                <tr key={sp.title}>
                  <Td className="whitespace-normal">{sp.title}</Td>
                  <Td>{sp.src === "uat" ? <Pill tone="gray">UAT</Pill> : <Pill tone="purple">เพิ่มใหม่</Pill>}</Td>
                  <Td className="whitespace-normal">{job ? <StatusPill status={job.status} /> : "—"}</Td>
                  <Td className="whitespace-normal text-gray-700">{roleLabel(sp.role)}</Td>
                  <Td className="whitespace-normal text-gray-600">
                    {missing ? "ไม่มีในข้อมูลตอนนี้ — กดรีเซ็ต" : moved ? `เลื่อนเป็น "${statusOf(job!.status).name}" แล้ว — กดรีเซ็ต` : [job?.no, sp.note].filter(Boolean).join(" · ") || "—"}
                  </Td>
                  <Td>
                    {href ? (
                      <Button variant="tertiaryBrand" iconRight="arrow_forward" onClick={() => onOpen(sp.url ? { url: sp.url } : { hash: href }, sp.role)}>เปิด</Button>
                    ) : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </section>
      ))}
      <section className="flex flex-col gap-4">
        <SectionHeader title="ยังไม่ได้ทำในต้นแบบ" />
        <ul className="list-disc rounded-xl bg-gray-50 py-4 pr-6 pl-10 text-sm text-gray-700">
          {NOT_YET.map((t) => <li key={t} className="py-1">{t}</li>)}
        </ul>
      </section>
    </div>
  );
}
