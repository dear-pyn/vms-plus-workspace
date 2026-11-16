"use client";
/** หน้าสรุปรายคัน (S18 · จอ OH2 / T.1–T.8 · Q.5 ปลายทางแจ้งเตือนประกัน)
 *  component: Page header (breadcrumb 5 ชั้น + Badge outline Success "ปิดงานแล้ว" + Secondary "ส่งออก Excel" / "ส่งออก PDF") · Section header (แทน Section label) ·
 *    Content item row · Table Alternating fills (ระยะเวลาและขั้นตอน · อะไหล่ · การติดตามงานซ่อม) · Alert Warning/Error (ประกันใกล้หมด T.3) · File upload item (ดูอย่างเดียว) ·
 *    Modal Form "ส่งออกไฟล์" (Radio text card PDF/Excel · Checkbox with description 4 หัวข้อ) · Notification Success "ส่งออกไฟล์สำเร็จ" (T.8) */
import { useState, type ReactNode } from "react";
import { Alert } from "@ui/Alert";
import { OutlineBadge } from "@ui/Badge";
import { Button } from "@ui/Button";
import { CheckboxRow } from "@ui/Checkbox";
import { parseThaiDate } from "@ui/DateField";
import { Modal } from "@ui/Modal";
import { PageHeader, SectionHeader, SectionLabel } from "@ui/PageHeader";
import { ProgressBar } from "@ui/ProgressBar";
import { RadioCard } from "@ui/RadioCard";
import { DataTable, Td, Th } from "@ui/Table";
import type { Plan } from "../plan/types";
import type { Staff } from "../po/types";
import { FileRow } from "../plan/PlanDetail";
import type { PendingClose } from "../po/types";
import { PartsTable } from "./StepClose";
import { warrantyEnd, warrantyLeft } from "./close";
import { Row } from "./StepAppointment";

const SECTIONS = [
  ["steps", "ขั้นตอนและระยะเวลา", "ตาราง 6 ขั้นพร้อมวันที่เสร็จ"],
  ["warranty", "การรับประกันงานซ่อม", "วันเริ่ม วันหมด และการแจ้งเตือน"],
  ["parts", "อะไหล่ที่ใช้", "ชื่อ จำนวน หน่วย"],
  ["progress", "การติดตามงานซ่อม", "ความคืบหน้าทุกรายการ"],
] as const;

const diff = (a?: string, b?: string) => {
  const x = a ? parseThaiDate(a) : null;
  const y = b ? parseThaiDate(b) : null;
  return x && y ? Math.round((y.getTime() - x.getTime()) / 86_400_000) + 1 : null;
};

/** สถานะประกันจากวันที่เหลือ (AC-S15: แจ้งเตือน 30 และ 15 วัน) */
export function warrantyState(left: number | null): { label: string; tone?: "warning" | "error"; sent: string } {
  if (left === null) return { label: "ไม่มีการรับประกัน", sent: "ไม่แจ้งเตือน" };
  if (left < 0) return { label: "หมดประกันแล้ว", sent: "ส่งครบ 2 รอบ" };
  if (left <= 15) return { label: "ใกล้หมดประกัน", tone: "error", sent: "ส่งรอบ 30 วัน และ 15 วันแล้ว" };
  if (left <= 30) return { label: "ใกล้หมดประกัน", tone: "warning", sent: "ส่งรอบ 30 วันแล้ว" };
  return { label: "อยู่ในประกัน", sent: "ยังไม่ถึงรอบ" };
}

export function SummaryPage({
  item, plan, staff, onGoPlans, onGoPlan, onGoPO, onNotify,
}: {
  item: PendingClose;
  plan: Plan;
  staff: Staff[];
  onGoPlans: () => void;
  onGoPlan: () => void;
  onGoPO: () => void;
  onNotify: (msg: string, tone?: "success" | "error" | "info", description?: string) => void;
}) {
  const { job, po, garage, vehicle } = item;
  const c = job.close;
  const w = c?.warranty;
  const left = w?.on ? warrantyLeft(w.start, w.days) : null;
  const ws = warrantyState(left);
  const coord = staff.find((s) => s.id === job.appt1?.coordinatorId);
  const [exp, setExp] = useState<{ fmt: "pdf" | "xlsx"; pick: string[] } | null>(null);
  const [expErr, setExpErr] = useState("");
  const closedAt = c?.closedAt?.slice(0, 10);
  const total = diff(job.appt1?.reply?.date ?? job.intake?.date, closedAt);
  const inGarage = diff(job.intake?.date, c?.returnedAt);
  const finishedRepair = job.progressLog?.find((e) => e.percent >= 100)?.at.slice(0, 10);

  const stepRows: Array<[string, ReactNode, ReactNode, ReactNode]> = [
    ["การนำรถเข้าอู่", job.skipped1 ? job.intake?.date : job.appt1?.reply?.at, job.skipped1 ? "ข้ามนัดหมาย (ยานพาหนะอยู่อู่แล้ว)" : `หน่วยงานตอบรับ · ผู้นำส่งรถ ${job.appt1?.reply?.deliverer ?? "—"}`, job.appt1 ? `นัด ${job.appt1.from} - ${job.appt1.to}` : "—"],
    ["ตรวจรับรถ", job.intake?.confirmedAt?.slice(0, 10), `ผู้ส่งมอบ ${staff.find((x) => x.id === job.intake?.delivererId)?.name ?? "—"} · ผู้รับมอบ ${staff.find((x) => x.id === job.intake?.receiverId)?.name ?? "—"}`, `รายการเอกสารรับรถ มี ${job.intake?.checks.filter((x) => x.has).length ?? 0}/${job.intake?.checks.length ?? 0} รายการ`],
    ["ติดตามงานซ่อม", finishedRepair, `ความคืบหน้า ${job.progressLog?.length ?? 0} รายการ`, finishedRepair ? `ซ่อมสำเร็จ ${finishedRepair}` : "—"],
    ["ตรวจสภาพ", job.inspection?.confirmedAt?.slice(0, 10), `เอกสาร Safety Inspection ${job.inspection?.safety.length ?? 0} ไฟล์`, "ยืนยันการตรวจสภาพ"],
    ["นัดรับรถ", job.appt5?.reply?.at, `หน่วยงานตอบรับ · ผู้รับรถ ${c?.receiver ?? job.appt5?.reply?.deliverer ?? "—"}`, job.appt5 ? `นัด ${job.appt5.from} - ${job.appt5.to}` : "—"],
    ["ปิดงาน", closedAt, `อะไหล่ ${(c?.body.length ?? 0) + (c?.tools.length ?? 0)} รายการ · ${w?.on ? `รับประกัน ${w.days} วัน` : "ไม่มีการรับประกัน"}`, "ยืนยันการส่งอนุมัติ (ปิดงานทันที — ไม่มีขั้นผู้อนุมัติ)"],
  ];

  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={[{ label: "จัดการงาน Overhaul", onClick: onGoPlans }, { label: `แผน ${plan.id}`, onClick: onGoPlan }, { label: po.id, onClick: onGoPO }, { label: "สรุปรายคัน" }, { label: job.plate }]}
        title={job.plate}
        badge={<OutlineBadge tone={job.code === "V11" ? "success" : "gray"}>{job.code === "V11" ? "ปิดงานแล้ว" : "ยังไม่ปิดงาน"}</OutlineBadge>}
        actions={
          <>
            <Button variant="secondary" iconLeft="download" onClick={() => setExp({ fmt: "xlsx", pick: SECTIONS.map((s) => s[0]) })}>
              ส่งออก Excel
            </Button>
            <Button variant="secondary" iconLeft="download" onClick={() => setExp({ fmt: "pdf", pick: SECTIONS.map((s) => s[0]) })}>
              ส่งออก PDF
            </Button>
          </>
        }
      />
      <section className="flex flex-col gap-4">
        <SectionLabel title="ข้อมูลยานพาหนะ" />
        <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
          <Row items={[["ทะเบียน", job.plate], ["ยี่ห้อ/รุ่น", vehicle ? `${vehicle.make} ${vehicle.model}` : ""], ["ประเภท", vehicle?.type], ["อายุการใช้งาน", vehicle ? `${vehicle.ageYears} ปี` : ""]]} />
          <Row items={[["เลขไมล์สะสม", vehicle?.mileageKm != null ? `${vehicle.mileageKm.toLocaleString()} กม.` : ""], ["ชั่วโมงสะสม", vehicle?.engineHours != null ? `${vehicle.engineHours.toLocaleString()} ชม.` : ""], ["หน่วยงานเจ้าของยานพาหนะ", vehicle?.affiliation]]} />
        </dl>
      </section>
      <section className="flex flex-col gap-4">
        <SectionLabel title="ข้อมูลงาน Overhaul" />
        <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
          <Row items={[["หมายเลขแผน", plan.id], ["ชื่อแผน", plan.name], ["หมายเลข Purchase Order", po.id], ["ศูนย์บริการ/อู่", garage?.name]]} />
          <Row items={[["รับรถเข้าอู่", job.intake?.date], ["ปิดงาน", closedAt], ["ระยะเวลาทั้งหมด", total ? `${total} วัน${inGarage ? ` (อยู่อู่ ${inGarage} วัน)` : ""}` : ""], ["ผู้ประสานงาน (กบค.)", coord ? `${coord.name} ${coord.phone}` : ""]]} />
        </dl>
      </section>
      <section className="flex flex-col gap-4">
        <SectionLabel title="ระยะเวลาและขั้นตอน" />
        <DataTable label="ระยะเวลาและขั้นตอน" striped>
          <thead>
            <tr>
              <Th>ขั้นตอน</Th>
              <Th>วันที่เสร็จ</Th>
              <Th>ผลของขั้น</Th>
              <Th>รายละเอียด</Th>
            </tr>
          </thead>
          <tbody>
            {stepRows.map(([s, d, r, x]) => (
              <tr key={s}>
                <Td>{s}</Td>
                <Td className="whitespace-nowrap">{d || "—"}</Td>
                <Td className="whitespace-normal">{r}</Td>
                <Td className="whitespace-normal">{x}</Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>
      <section className="flex flex-col gap-4">
        <SectionLabel title="การรับประกันงานซ่อม" />
        {ws.tone && left !== null && w && (
          <Alert tone={ws.tone} title={`ประกันงานซ่อมเหลือ ${left} วัน หมด ${warrantyEnd(w.start, w.days)}`}>
            สำรวจความสมบูรณ์ของยานพาหนะ หากพบปัญหาให้นำเข้าอู่ {garage?.name} ตามเงื่อนไขประกันก่อนหมดประกัน
          </Alert>
        )}
        <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
          {w?.on ? (
            <Row items={[["วันเริ่มรับประกัน", w.start], ["ระยะรับประกัน", `${w.days} วัน`], ["วันหมดอายุประกัน", `${warrantyEnd(w.start, w.days)}${left !== null && left >= 0 ? ` (เหลือ ${left} วัน)` : ""}`], ["สถานะ", ws.label]]} />
          ) : (
            <Row items={[["การรับประกันงานซ่อม", "ไม่มี"], ["สถานะ", ws.label]]} />
          )}
          <Row items={[["ผู้รับจ้าง", garage?.name], ["หมายเลข Purchase Order", po.id], ["แจ้งเตือนก่อนหมด", w?.on ? "เจ้าของยานพาหนะ และ กบค. 30 วัน และ 15 วัน" : "ไม่แจ้งเตือน"], ["แจ้งเตือนที่ส่งแล้ว", ws.sent]]} />
        </dl>
      </section>
      {c?.body.length ? (
        <section className="flex flex-col gap-4">
          <SectionHeader title="อะไหล่ — ตัวรถ" />
          <PartsTable label="อะไหล่ — ตัวรถ" parts={c.body} />
        </section>
      ) : null}
      {c?.tools.length ? (
        <section className="flex flex-col gap-4">
          <SectionHeader title="อะไหล่ — เครื่องมือกล" />
          <PartsTable label="อะไหล่ — เครื่องมือกล" parts={c.tools} />
        </section>
      ) : null}
      <section className="flex flex-col gap-4">
        <SectionLabel title={`การติดตามงานซ่อม (${job.progressLog?.length ?? 0})`} />
        <DataTable label="การติดตามงานซ่อม" striped>
          <thead>
            <tr>
              <Th>วันที่</Th>
              <Th>รายละเอียด</Th>
              <Th className="w-44">ความคืบหน้า</Th>
              <Th>หมายเหตุ</Th>
            </tr>
          </thead>
          <tbody>
            {(job.progressLog ?? []).map((e) => (
              <tr key={e.id}>
                <Td className="whitespace-nowrap">{e.at} น.</Td>
                <Td className="whitespace-normal">{e.detail}</Td>
                <Td>
                  <ProgressBar value={e.percent} tone="info" decimals={1} />
                </Td>
                <Td className="whitespace-normal">{e.note || "-"}</Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>
      <section className="flex flex-col gap-4">
        <SectionLabel title="เอกสาร" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="text-md font-semibold text-gray-600">ใบสั่งจ้าง</span>
            <ul className="flex flex-col gap-2">{po.docs.order.map((f) => <FileRow key={f.name} file={f} />)}</ul>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-md font-semibold text-gray-600">เอกสาร Safety Inspection</span>
            {job.inspection?.safety.length ? <ul className="flex flex-col gap-2">{job.inspection.safety.map((f) => <FileRow key={f.name} file={f} />)}</ul> : <span className="text-md text-gray-600">ไม่มีเอกสาร</span>}
          </div>
        </div>
      </section>
      <div className="flex justify-start border-t border-gray-200 pt-6">
        <Button variant="secondary" size="lg" onClick={onGoPO}>
          ย้อนกลับ
        </Button>
      </div>
      <Modal
        open={!!exp}
        title="ส่งออกไฟล์"
        description="เลือกรูปแบบไฟล์และหัวข้อที่ต้องการ"
        onClose={() => setExp(null)}
        confirmLabel="ส่งออก"
        onConfirm={() => {
          if (!exp) return;
          if (!exp.pick.length) {
            setExpErr("กรุณาเลือกอย่างน้อย 1 หัวข้อ");
            return;
          }
          const name = `สรุป-Overhaul-${job.plate.replace(/\s+/g, "-")}-${po.id}.${exp.fmt}`;
          setExp(null);
          onNotify("ส่งออกไฟล์สำเร็จ", "success", name); // T.8
        }}
      >
        {exp && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RadioCard name="fmt" checked={exp.fmt === "pdf"} onChange={() => setExp({ ...exp, fmt: "pdf" })} title="PDF" description="เอกสาร A4 สำหรับพิมพ์หรือแนบหนังสือ" />
              <RadioCard name="fmt" checked={exp.fmt === "xlsx"} onChange={() => setExp({ ...exp, fmt: "xlsx" })} title="Excel" description="ไฟล์ .xlsx แยกชีตตามหัวข้อ" />
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-gray-600">หัวข้อที่ส่งออก (ข้อมูลยานพาหนะและข้อมูลงานรวมเสมอ)</span>
              {SECTIONS.map(([k, t, d]) => (
                <CheckboxRow
                  key={k}
                  checked={exp.pick.includes(k)}
                  onChange={(v) => {
                    setExp({ ...exp, pick: v ? [...exp.pick, k] : exp.pick.filter((x) => x !== k) });
                    setExpErr("");
                  }}
                >
                  <span className="flex flex-col">
                    <span>{t}</span>
                    <span className="text-sm text-gray-600">{d}</span>
                  </span>
                </CheckboxRow>
              ))}
              {expErr && <span className="text-sm text-error-600">{expErr}</span>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
