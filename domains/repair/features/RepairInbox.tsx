"use client";
/** เพิ่มใหม่ (ไม่มีใน UAT) — หน้าของผู้รับงานต่อ ตามแพทเทิร์น Overhaul
 *  เจ้าของงาน 23 พ.ย. 2569: "รวมได้ แบ่งเป็นประเภท" → เมนู "ตอบรับนัดหมาย" และ "อนุมัติงาน" ใช้ร่วมกับ Overhaul มีแท็บ Overhaul / งานซ่อม
 *    (หน้ารวมอยู่ในต้นแบบ Overhaul · ไฟล์นี้ให้ตารางแท็บงานซ่อม + หน้าตอบรับ/เซ็นลงนามของงานซ่อม)
 *  1) "ตอบรับนัดหมายงานซ่อม" (หน่วยงานต้นทาง) — แบบ AgencyPages ของ Overhaul:
 *     นัดหมายวันซ่อม / นัดหมายวันคืนรถ → เลือกวันที่ในช่วงที่ กบค. เสนอ → ตอบรับ · ปฏิเสธ = เหตุผล (บังคับ) + ช่วงวันที่สะดวก (ถ้ามี)
 *     เซ็นลงนามการรับมอบรถ / การส่งคืนรถ → ดูรายการตรวจแล้วกด "เซ็นลงนาม" (แบบ IntakeApproval ของ Overhaul)
 *     งานซ่อมเอง (ส่งกลับต้นทาง · กรย เห็นชอบ · ดำเนินการซ่อมเอง) → ไปหน้ารายละเอียด
 *  2) "อนุมัติงานซ่อม" (หัวหน้าหน่วยงาน · หัวหน้า กบค.) — แบบ ApprovalPages ของ Overhaul รวมทุกเรื่องที่รออนุมัติ
 *  UAT แทนทั้งหมดนี้ด้วยปุ่มให้ กบค. กดแทน ("ต้นทางยืนยัน" · "เซ็นลงนาม") หรือไม่มีเมนูให้ผู้อนุมัติ */
import { useState } from "react";
import { Button } from "@ui/Button";
import { DateField, DateRangeField, parseThaiDate } from "@ui/DateField";
import { EmptyState } from "@ui/EmptyState";
import { Modal } from "@ui/Modal";
import { PageHeader } from "@ui/PageHeader";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { TextArea } from "@ui/TextArea";
import { personOf, vehicleOf, type StatusCode } from "../mock/data";
import { nowBE, todayBE, type Appointment, type RepairJob, type Role } from "./model";
import type { Act } from "./ProcessSteps";
import { ProcessBody } from "./RepairDetail";
import { RequestSummary } from "./RequestSummary";
import { AddedNote, InfoPanel, SectionBar, StatusPill } from "./ui";

export type ReplyKind = "appt" | "return" | "signIntake" | "signPost" | "self";
const KIND_LABEL: Record<ReplyKind, string> = { appt: "นัดหมายวันซ่อม", return: "นัดหมายวันคืนรถ", signIntake: "เซ็นลงนามการรับมอบรถ", signPost: "เซ็นลงนามการส่งคืนรถ", self: "งานซ่อมเอง" };

export function replyItems(jobs: RepairJob[]): { job: RepairJob; kind: ReplyKind }[] {
  const out: { job: RepairJob; kind: ReplyKind }[] = [];
  for (const j of jobs) {
    if (j.status === "waiting_origin_confirm_appointment") out.push({ job: j, kind: "appt" });
    if (j.status === "waiting_origin_confirm_pickup") out.push({ job: j, kind: "return" });
    if (j.status === "ready_to_proceed" && j.intake?.signReq && !j.intake.signed[0]) out.push({ job: j, kind: "signIntake" });
    if (j.status === "waiting_med_post_repair_inspection" && j.post?.signReq && !j.post.signed[0]) out.push({ job: j, kind: "signPost" });
    if (j.status === "returned_for_self_repair" || j.status === "ecd_approved_self_repair" || j.status === "self_repair_in_progress") out.push({ job: j, kind: "self" });
  }
  return out;
}

const APPROVER: Partial<Record<StatusCode, { role: Role; what: string }>> = {
  waiting_unit_head_approval: { role: "unitHead", what: "ขออนุมัติแจ้งซ่อม" },
  waiting_ecd_review: { role: "ecd", what: "พิจารณาวิธีซ่อม (กรย.)" },
  waiting_med_head_approval: { role: "medHead", what: "ขออนุมัติเปิดงานซ่อม" },
  found_additional_symptoms: { role: "medHead", what: "ขออนุมัติอาการเพิ่ม" },
  waiting_closing_approval: { role: "medHead", what: "ขออนุมัติปิดงาน" },
};
export const approvalItems = (jobs: RepairJob[], role: Role) => jobs.filter((j) => { const a = APPROVER[j.status]; return !!a && (role === "admin" || a.role === role); });

const apptOf = (j: RepairJob, k: ReplyKind) => (k === "appt" ? j.appt : k === "return" ? j.returnAppt : undefined);
const range = (a?: Appointment) => (a ? (a.to && a.to !== a.from ? `${a.from} - ${a.to}` : a.from) : "-");

/* ---------------- รายการ: ตอบรับนัดหมายงานซ่อม ---------------- */
/** แท็บ "งานซ่อม" ของเมนูตอบรับนัดหมาย */
export function RepairReplyTable({ jobs, onOpen }: { jobs: RepairJob[]; onOpen: (id: string, kind: ReplyKind) => void }) {
  const items = replyItems(jobs);
  return (
    <section className="flex flex-col gap-4">
      <SectionBar>{`รอตอบรับ (${items.length})`}</SectionBar>
      {items.length === 0 ? (
        <EmptyState kind="data-empty" title="ไม่มีงานที่รอตอบรับ" description="เมื่อ กบค. ส่งนัดหมายหรือคำขอเซ็นลงนาม รายการจะแสดงที่นี่" />
      ) : (
        <DataTable label="รายการรอตอบรับ" striped>
          <thead><tr><Th>หมายเลขเหตุการณ์</Th><Th>เรื่อง</Th><Th>ยานพาหนะ</Th><Th>วันที่นัดหมาย</Th><Th>สถานะเหตุการณ์</Th><Th><span className="sr-only">ดู</span></Th></tr></thead>
          <tbody>
            {items.map(({ job, kind }) => {
              const v = vehicleOf(job.plate);
              return (
                <tr key={job.id + kind}>
                  <Td className="font-semibold">{job.no}</Td>
                  <Td>{KIND_LABEL[kind]}</Td>
                  <Td><CellStack main={<span className="font-semibold">{v.plate} {v.provinceShort}</span>} sub={v.type} /></Td>
                  <Td>{range(apptOf(job, kind))}</Td>
                  <Td><StatusPill status={job.status} /></Td>
                  <Td className="text-right"><Button variant="tertiary" iconOnly="quick_reference_all" aria-label={`เปิด ${job.no}`} onClick={() => onOpen(job.id, kind)} /></Td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </section>
  );
}

/* ---------------- หน้าตอบรับ / เซ็นลงนาม ---------------- */
export function ReplyPage({ job, kind, act, onList, role }: { job: RepairJob; kind: ReplyKind; act: Act; onList: () => void; role: Role }) {
  const a = apptOf(job, kind);
  const [date, setDate] = useState(a?.from === a?.to ? a?.from ?? "" : "");
  const [ask, setAsk] = useState<null | "accept" | "reject">(null);
  const [reason, setReason] = useState("");
  const [alt, setAlt] = useState({ from: "", to: "", });
  const isAppt = kind === "appt" || kind === "return";
  const d = parseThaiDate(date);
  const lo = parseThaiDate(a?.from ?? "");
  const hi = parseThaiDate(a?.to || a?.from || "");
  const inRange = !!d && !!lo && !!hi && d >= lo && d <= hi;
  const dateErr = date && !inRange ? `กรุณาเลือกวันที่ในช่วง ${range(a)}` : undefined;
  const v = vehicleOf(job.plate);
  const title = `${KIND_LABEL[kind]} ${job.no}`;

  const accept = () => {
    const reply = { ok: true, at: nowBE(), reason: undefined };
    if (kind === "appt") act({ appt: { ...a!, from: date, to: date, reply } }, { status: "ready_to_proceed", log: `ต้นทางตอบรับนัดหมายวันซ่อม ${date}`, toast: "ตอบรับนัดหมายสำเร็จ", notify: [{ to: "med", text: `หน่วยงาน ${v.unit} ของ ${job.no} ยืนยันนัดหมายวันซ่อม ${date} แล้ว`, tone: "success" }] });
    else act({ returnAppt: { ...a!, from: date, to: date, reply } }, { status: "waiting_med_post_repair_inspection", log: `ต้นทางตอบรับนัดหมายวันคืนรถ ${date}`, toast: "ตอบรับนัดหมายสำเร็จ", notify: [{ to: "med", text: `หน่วยงาน ${v.unit} ของ ${job.no} ยืนยันรับรถคืน ${date} แล้ว`, tone: "success" }] });
    onList();
  };
  const reject = () => {
    const note = `${reason.trim()}${alt.from ? ` · วันที่สะดวก ${alt.from}${alt.to ? ` - ${alt.to}` : ""}` : ""}`;
    const reply = { ok: false, reason: note, at: nowBE() };
    if (kind === "appt") act({ appt: { ...a!, reply } }, { status: "preparing_spare_parts", log: "ต้นทางปฏิเสธนัดหมายวันซ่อม", note, toast: "ปฏิเสธนัดหมายสำเร็จ", notify: [{ to: "med", text: `หน่วยงาน ${v.unit} ปฏิเสธนัดหมายวันซ่อม ${job.no} เหตุผล: ${note}`, tone: "error" }] });
    else act({ returnAppt: { ...a!, reply } }, { status: "waiting_med_reschedule_return", log: "ต้นทางปฏิเสธนัดหมายวันคืนรถ", note, toast: "ปฏิเสธนัดหมายสำเร็จ", notify: [{ to: "med", text: `หน่วยงาน ${v.unit} ปฏิเสธนัดหมายวันคืนรถ ${job.no} เหตุผล: ${note}`, tone: "error" }] });
    onList();
  };
  const sign = () => {
    const who = personOf(kind === "signIntake" ? job.intake?.delivererId : job.post?.delivererId)?.name ?? "ผู้ส่งมอบรถ";
    if (kind === "signIntake") act({ intake: { ...job.intake!, signed: [true, job.intake!.signed[1]], signReq: false } }, { log: "ผู้ส่งมอบรถเซ็นลงนามการรับมอบรถ", toast: "เซ็นลงนามสำเร็จ", notify: [{ to: "med", text: `${who} เซ็นลงนามการรับมอบรถ ${job.no} แล้ว`, tone: "success" }] });
    else act({ post: { ...job.post!, signed: [true, job.post!.signed[1]], signReq: false, signedAt: todayBE() } }, { log: "หน่วยงานเซ็นลงนามการส่งคืนรถ", toast: "เซ็นลงนามสำเร็จ", notify: [{ to: "med", text: `${who} เซ็นลงนามการส่งคืนรถ ${job.no} แล้ว`, tone: "success" }] });
    onList();
  };
  const can = role === "admin" || role === "origin";

  return (
    <div className="flex flex-col gap-6 px-8 py-6 max-md:px-4">
      <PageHeader
        crumbs={[{ label: "ตอบรับนัดหมาย", onClick: onList }, { label: title }]}
        title={title}
        badge={<StatusPill status={job.status} />}
        actions={
          can &&
          (isAppt ? (
            <>
              <Button variant="tertiaryDanger" onClick={() => { setReason(""); setAlt({ from: "", to: "" }); setAsk("reject"); }}>ปฏิเสธนัดหมาย</Button>
              <Button disabled={!inRange} onClick={() => setAsk("accept")}>ตอบรับนัดหมาย</Button>
            </>
          ) : kind !== "self" ? (
            <Button iconLeft="draw" onClick={sign}>เซ็นลงนาม</Button>
          ) : null)
        }
      />
      {!can && <AddedNote>ต้นแบบ: เปลี่ยน role เป็น &quot;หน่วยงานต้นทาง&quot; เพื่อตอบรับ</AddedNote>}
      {isAppt && a && (
        <>
          <section className="flex flex-col gap-4">
            <SectionBar description={`กบค. เสนอช่วง ${range(a)} — เลือกวันที่สะดวกในช่วงนี้`}>ตอบรับนัดหมาย</SectionBar>
            <div className="flex flex-col gap-2 md:w-1/3">
              <span className="text-md font-semibold text-gray-600">{kind === "appt" ? "วันที่นำรถเข้า" : "วันที่รับรถ"}</span>
              <DateField aria-label="วันที่นัดหมาย" value={date} onChange={setDate} min={lo ?? undefined} max={hi ?? undefined} disabled={!can} />
              {dateErr && <span className="text-sm text-error-600">{dateErr}</span>}
            </div>
          </section>
          <section className="flex flex-col gap-4">
            <SectionBar>รายละเอียดการนัดหมาย</SectionBar>
            <InfoPanel cols={4} items={[
              [kind === "appt" ? "ช่วงเวลาที่รับมอบรถ" : "ช่วงเวลาวันนัดคืนรถ", range(a)],
              ["ช่างซ่อม", personOf(a.mechanicId)?.name],
              ["เบอร์โทรศัพท์ผู้รับมอบรถ", personOf(a.mechanicId)?.phone],
              [kind === "appt" ? (a.kind === "onsite" ? "สถานที่ซ่อม" : "สถานที่รับรถ") : "สถานที่นัดคืนรถ", a.place],
            ]} />
          </section>
          <RequestSummary job={job} />
        </>
      )}
      {(kind === "signIntake" || kind === "signPost") && (
        <ProcessBody step={kind === "signIntake" ? 3 : 6} job={job} edit={false} act={act} role={role} />
      )}

      <Modal open={ask === "accept"} onClose={() => setAsk(null)} variant="centered" icon="event_available" title="ตอบรับนัดหมาย" description={`ยืนยัน${kind === "appt" ? "นำรถเข้า" : "รับรถคืน"}วันที่ ${date}`} confirmLabel="ตอบรับนัดหมาย" onConfirm={() => { setAsk(null); accept(); }} />
      <Modal open={ask === "reject"} onClose={() => setAsk(null)} title="ปฏิเสธนัดหมาย" confirmLabel="ปฏิเสธนัดหมาย" confirmVariant="danger" confirmDisabled={!reason.trim()} onConfirm={() => { setAsk(null); reject(); }}>
        <TextArea label="เหตุผล" rows={4} placeholder="ระบุเหตุผล" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex flex-col gap-2">
          <span className="text-md font-semibold text-gray-600">ช่วงวันที่สะดวก <span className="font-normal text-gray-500">(ถ้ามี)</span></span>
          <DateRangeField aria-label="ช่วงวันที่สะดวก" from={alt.from} to={alt.to} onChange={(from, to) => setAlt({ from, to })} />
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- รายการ: อนุมัติงานซ่อม ---------------- */
/** แท็บ "งานซ่อม" ของเมนูอนุมัติงาน — แจ้งซ่อม · เปิดงานซ่อม · อาการเพิ่ม · ปิดงาน */
export function RepairApprovalTable({ jobs, role, onOpen }: { jobs: RepairJob[]; role: Role; onOpen: (id: string) => void }) {
  const items = approvalItems(jobs, role);
  return (
    <section className="flex flex-col gap-4">
      <SectionBar>{`รออนุมัติ (${items.length})`}</SectionBar>
      {items.length === 0 ? (
        <EmptyState kind="data-empty" title="ไม่มีงานที่รออนุมัติ" description="เมื่อมีเรื่องส่งอนุมัติมาถึงคุณ รายการจะแสดงที่นี่" />
      ) : (
        <DataTable label="รายการรออนุมัติ" striped>
          <thead><tr><Th>หมายเลขเหตุการณ์</Th><Th>เรื่อง</Th><Th>ยานพาหนะ</Th><Th>ส่งเมื่อ</Th><Th>ผู้ส่ง</Th><Th>สถานะเหตุการณ์</Th><Th><span className="sr-only">ดู</span></Th></tr></thead>
          <tbody>
            {items.map((j) => {
              const v = vehicleOf(j.plate);
              const last = j.history[j.history.length - 1];
              return (
                <tr key={j.id}>
                  <Td className="font-semibold">{j.no}</Td>
                  <Td>{APPROVER[j.status]?.what}</Td>
                  <Td><CellStack main={<span className="font-semibold">{v.plate} {v.provinceShort}</span>} sub={v.type} /></Td>
                  <Td>{last?.at ?? j.updatedAt}</Td>
                  <Td>{personOf(last?.byId)?.name ?? "-"}</Td>
                  <Td><StatusPill status={j.status} /></Td>
                  <Td className="text-right"><Button variant="tertiary" iconOnly="quick_reference_all" aria-label={`เปิด ${j.no}`} onClick={() => onOpen(j.id)} /></Td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </section>
  );
}
