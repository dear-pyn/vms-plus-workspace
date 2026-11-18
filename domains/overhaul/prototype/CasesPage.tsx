"use client";
/** สารบัญเคส (#/cases) — เครื่องมือต้นแบบ ไม่ใช่หน้าของระบบจริง (เจ้าของงานขอ 17 พ.ย. 2569 "มีวิธีไหนที่จะดูทุกเคสได้บ้าง" → แบบที่ 1)
 *  ลิสต์ทุกสถานะของงานรายคัน (แผนเคสทดสอบ ORZ6999999 · PO-699999 ยานพาหนะ 1 คันต่อ 1 สถานะ) + มุมหน่วยงาน + หน้าแผน/PO
 *  ปุ่ม "รีเซ็ตข้อมูลต้นแบบ" ล้าง localStorage กลับเป็นข้อมูลตั้งต้น (เล่นไปแล้วงานเลื่อนขั้น เคสเดิมจะหาย)
 *  component: Page header + Secondary button · Section header · Table + Pill (สถานะในตาราง) · Alert Info */
import { Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { PageHeader, SectionHeader } from "@ui/PageHeader";
import { DataTable, Td, Th } from "@ui/Table";
import { JOB_STATUS, type VehicleJob } from "../features/po/types";
import { CASES, CASE_PLAN_ID, CASE_PO_ID } from "../mock/cases";
import { resetPrototypeData } from "./usePrototypeData";

type Link = { group: string; title: string; href: string; status?: VehicleJob["code"]; note?: string };

export function CasesPage({ jobs }: { jobs: VehicleJob[] }) {
  const caseJobs = jobs.filter((j) => j.poId === CASE_PO_ID);
  const enc = (s: string) => encodeURIComponent(s);
  const rows: Link[] = CASES.map((c, i) => {
    const j = caseJobs[i];
    const moved = j && j.code !== c.code;
    return {
      group: c.group,
      title: c.title,
      href: j ? `#/job/${CASE_PO_ID}/${enc(j.plate)}` : "",
      status: j?.code,
      note: !j ? "ไม่มีในข้อมูลตอนนี้ — กดรีเซ็ต" : moved ? `เลื่อนเป็น "${JOB_STATUS[j.code].label}" แล้ว — กดรีเซ็ตเพื่อกลับเคสเดิม` : j.plate,
    };
  });
  const wait1 = caseJobs.find((j) => j.code === "V2");
  const wait5 = caseJobs.find((j) => j.code === "V8");
  const waitAp = caseJobs.find((j) => j.code === "V10.3");
  rows.push(
    { group: "มุมหน่วยงานเจ้าของยานพาหนะ", title: "รายการรอตอบรับนัดหมาย (เมนูตอบรับนัดหมาย)", href: "#/agency" },
    { group: "มุมผู้อนุมัติปิดงาน", title: "รายการรออนุมัติปิดงาน (เมนูอนุมัติปิดงาน)", href: "#/approval" },
    { group: "มุมผู้อนุมัติปิดงาน", title: "อนุมัติ / ส่งกลับแก้ไข", href: waitAp ? `#/approval/job/${CASE_PO_ID}/${enc(waitAp.plate)}` : "", note: waitAp ? waitAp.plate : "ไม่มีงานรออนุมัติ — กดรีเซ็ต" },
    { group: "มุมหน่วยงานเจ้าของยานพาหนะ", title: "ตอบรับ/ปฏิเสธ นัดนำรถเข้าอู่", href: wait1 ? `#/agency/job/${CASE_PO_ID}/${enc(wait1.plate)}` : "", note: wait1 ? wait1.plate : "ไม่มีงานรอตอบรับ — กดรีเซ็ต" },
    { group: "มุมหน่วยงานเจ้าของยานพาหนะ", title: "ตอบรับ/ปฏิเสธ นัดรับรถ", href: wait5 ? `#/agency/job/${CASE_PO_ID}/${enc(wait5.plate)}` : "", note: wait5 ? wait5.plate : "ไม่มีงานรอตอบรับ — กดรีเซ็ต" },
    { group: "แผน / Purchase Order", title: "Dashboard ระดับแผน (CI VMS Plus)", href: "#/dashboard" },
    { group: "แผน / Purchase Order", title: "Dashboard ระดับยานพาหนะ (CI VMS Plus)", href: "#/dashboard/vehicles" },
    { group: "แผน / Purchase Order", title: "รายการแผน Overhaul", href: "#/" },
    { group: "แผน / Purchase Order", title: "แท็บยานพาหนะที่ Overhaul", href: "#/vehicles" } /* อยู่ข้างรายการแผน (17 พ.ย. 2569) */,
    { group: "แผน / Purchase Order", title: "สร้างแผน Overhaul", href: "#/new" },
    { group: "แผน / Purchase Order", title: "รายละเอียดแผน — ยังไม่มี Purchase Order", href: "#/plan/ORZ7000011" },
    { group: "แผน / Purchase Order", title: "รายละเอียดแผน — มี Purchase Order", href: `#/plan/${CASE_PLAN_ID}` },
    { group: "แผน / Purchase Order", title: "รายละเอียด Purchase Order (ทุกสถานะในตารางเดียว)", href: `#/plan/${CASE_PLAN_ID}/po/${CASE_PO_ID}` },
    /* แผนที่ยังไม่มี PO = มียานพาหนะว่างให้เลือก (แผนเคสทดสอบอยู่ใน PO ครบแล้ว เลือกไม่ได้) */
    { group: "แผน / Purchase Order", title: "เพิ่ม Purchase Order", href: "#/plan/ORZ7000011/po/new" },
  );
  /* เรียงตามลำดับการใช้งาน (เจ้าของงาน 17 พ.ย. 2569 "หน้าจัดการต้องมาก่อน"): แผน/PO → งานรายคันขั้น 1–7 → มุมหน่วยงาน */
  const PLAN = "แผน / Purchase Order";
  const AGENCY = "มุมหน่วยงานเจ้าของยานพาหนะ";
  const steps = [...new Set(rows.map((r) => r.group))].filter((g) => g !== PLAN && g !== AGENCY);
  const APPROVER = "มุมผู้อนุมัติปิดงาน";
  const groups = [PLAN, ...steps.filter((g) => g !== APPROVER), AGENCY, APPROVER];

  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={[{ label: "สารบัญเคส (ต้นแบบ)" }]}
        title="สารบัญเคส"
        subtitle="เครื่องมือของต้นแบบ ไม่ใช่หน้าของระบบจริง · งานจะเลื่อนขั้นตามที่กด ถ้าเคสไหนเลื่อนไปแล้ว กด รีเซ็ตข้อมูลต้นแบบ"
        actions={
          <Button variant="secondary" iconLeft="restart_alt" onClick={() => resetPrototypeData()}>
            รีเซ็ตข้อมูลต้นแบบ
          </Button>
        }
      />
      {groups.map((g) => (
        <section key={g} className="flex flex-col gap-4">
          <SectionHeader title={g} />
          <DataTable label={g} striped>
            <thead>
              <tr>
                <Th>เคส</Th>
                <Th className="w-56">สถานะตอนนี้</Th>
                <Th className="w-80">ยานพาหนะ / หมายเหตุ</Th>
                <Th className="w-28"><span className="sr-only">เปิด</span></Th>
              </tr>
            </thead>
            <tbody>
              {rows.filter((r) => r.group === g).map((r) => (
                <tr key={r.title}>
                  <Td className="whitespace-normal">{r.title}</Td>
                  <Td>{r.status ? <Pill tone={JOB_STATUS[r.status].tone}>{JOB_STATUS[r.status].label}</Pill> : "—"}</Td>
                  <Td className="whitespace-normal text-gray-600">{r.note ?? "—"}</Td>
                  <Td>
                    {r.href ? (
                      <Button variant="tertiaryBrand" iconRight="arrow_forward" onClick={() => (window.location.hash = r.href.slice(1))}>
                        เปิด
                      </Button>
                    ) : (
                      "—"
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </section>
      ))}
    </div>
  );
}
