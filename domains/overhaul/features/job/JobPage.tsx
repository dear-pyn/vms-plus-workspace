"use client";
/** หน้างานรายคัน — จอ OH2 / H–P (S7–S15) : Page header (breadcrumb 4 ชั้น + Badge outline สถานะ) · ข้อมูลยานพาหนะ · Progress steps · เนื้อหาขั้น
 *  ขั้นที่ผ่านแล้วกดดูย้อนหลังได้ (S17 "ดูย้อนหลัง") · ขั้นยังไม่ถึงกดไม่ได้
 *  ขั้น: 1/5 StepAppointment · 2 StepIntake · 3 StepProgress · 4 StepInspection · 6 StepClose · 7 StepSendApproval · viewOnly = มุมหน่วยงานเจ้าของ (S17) */
import { useState, type ReactNode } from "react";
import { OutlineBadge } from "@ui/Badge";
import { PageHeader, SectionHeader } from "@ui/PageHeader";
import { EmptyState } from "@ui/EmptyState";
import { ProgressSteps } from "@ui/ProgressSteps";
import type { Plan } from "../plan/types";
import type { PlanVehicle } from "../vehicle/types";
import { JOB_STATUS, JOB_STEPS, type Appointment, type Garage, type JobCode, type PurchaseOrder, type Staff, type VehicleJob } from "../po/types";
import { Row, StepAppointment } from "./StepAppointment";
import { StepIntake, type IntakeDraft } from "./StepIntake";
import { StepProgress, type ProgressDraft } from "./StepProgress";
import { StepInspection } from "./StepInspection";
import type { Inspection } from "../po/types";
import { StepClose, type CloseDraft } from "./StepClose";
import { StepSendApproval } from "./StepSendApproval";
import { seedSmiParts } from "./close";
import { emptyChecks, intakeLocked, validateIntakeForSign } from "./intake";
import { todayThai } from "../shared/time";
import { nowStamp } from "../shared/time";
import { T, jobKey, type ToastMsg } from "../shared/messages";

const BADGE = { gray: "gray", warning: "gray", error: "error", info: "brand", success: "success", brand: "brand", disabled: "disabled", purple: "brand" } as const;

export interface JobPageProps {
  plan: Plan;
  po: PurchaseOrder;
  job: VehicleJob;
  vehicle?: PlanVehicle;
  garage?: Garage;
  staff: Staff[];
  onGoPlans: () => void;
  onGoPlan: () => void;
  onGoPO: () => void;
  /** บันทึกงาน (จำลองเครือข่ายที่หน้า page) — คืน true เมื่อสำเร็จ */
  onUpdate: (next: VehicleJob, toast?: ToastMsg) => void;
  onNotify: (msg: string, tone?: "success" | "error" | "info" | "warning", description?: string) => void;
  /** ต้นแบบ: เปิดหน้าผู้ยืนยันการรับมอบ (ขั้น 2) */
  onOpenApproval: (staffId: string) => void;
  /** S17 หน่วยงานเจ้าของยานพาหนะ / กรย. — ดูอย่างเดียวทุกขั้น */
  viewOnly?: boolean;
  /** ปุ่มขวาบนของหัวหน้า (มุมหน่วยงาน: ปฏิเสธนัดหมาย / ตอบรับนัดหมาย) */
  actions?: ReactNode;
  /** ส่วนบนสุดก่อน "ข้อมูลยานพาหนะ" (มุมหน่วยงาน: ฟอร์มตอบรับนัดหมาย) */
  top?: ReactNode;
  /** ใต้แถบขั้นตอน แทนเนื้อหาขั้นปัจจุบัน (มุมหน่วยงาน: ช่องวันที่ตอบรับ) */
  belowSteps?: ReactNode;
  /** ซ่อน Progress steps — แสดงเฉพาะเนื้อหาขั้นปัจจุบัน (มุมหน่วยงาน: เจ้าของงานสั่ง 16 พ.ย. 2569 "เอา step ออก") */
  hideSteps?: boolean;
  /** แทน breadcrumb เดิม (มุมหน่วยงานเข้าจากเมนู "ตอบรับนัดหมาย") */
  crumbs?: Array<{ label: string; onClick?: () => void }>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function JobPage({ plan, po, job, vehicle, garage, staff, onGoPlans, onGoPlan, onGoPO, onUpdate, onNotify, onOpenApproval, viewOnly, actions, top, belowSteps, hideSteps, crumbs }: JobPageProps) {
  const st = JOB_STATUS[job.code];
  const current = job.code === "V11" ? 8 : st.step; // ปิดงานแล้ว = ครบทุกขั้น
  // Track explicit navigation separately from progression. A remote reply advances the active step.
  const [selection, setSelection] = useState({ code: job.code, step: Math.min(current, 7) });
  const view = selection.code === job.code ? Math.min(selection.step, current) : Math.min(current, 7);
  const setViewing = (step: number) => setSelection({ code: job.code, step });
  const key = jobKey(po.id, job.plate);
  const set = (code: JobCode, patch: Partial<VehicleJob>, toast?: ToastMsg) => {
    onUpdate({ ...job, ...patch, code }, toast);
    setSelection({ code, step: JOB_STATUS[code].step });
  };

  async function sendAppt(kind: 1 | 5, a: Appointment): Promise<boolean> {
    await wait(600);
    if (/error/i.test(a.note)) {
      onNotify(T.apptFail(key).msg, "error"); // ชีต OH-Toast แถว 14 — จำลอง: หมายเหตุมีคำว่า error
      return false;
    }
    const range = `${a.from} – ${a.to}`;
    if (kind === 1) set("V2", { appt1: a, detail: [`นัดเข้าอู่ ${range}`, "รอหน่วยงานตอบรับ"] }, T.apptSent()); // ชีต OH-Toast แถว 13
    else set("V8", { appt5: a, detail: [`นัดรับรถ ${range}`, "รอหน่วยงานตอบรับ"] }, T.apptSent());
    return true;
  }
  function reply(kind: 1 | 5, accepted: boolean) {
    const a = kind === 1 ? job.appt1 : job.appt5;
    if (!a) return;
    const today = new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
    const r = accepted ? { accepted, date: a.from, at: today } : { accepted, reason: "ยานพาหนะติดภารกิจซ่อมบำรุงสายส่ง ขอเลื่อนนัด", at: today };
    const unit = vehicle?.affiliation ?? "";
    // ต้นแบบ: ตอบรับแล้วถือว่าถึงวันนัด → ขั้นถัดไปทันที (V4 → V4.1 · V10)
    if (kind === 1) set(accepted ? "V4.1" : "V3", { appt1: { ...a, reply: r }, detail: accepted ? [`นัดเข้าอู่ ${a.from}`, "รอตรวจรับรถ"] : ["หน่วยงานปฏิเสธนัด", "รอแก้นัดหมาย"] }, accepted ? T.apptAccepted() : T.apptRejected(unit, key));
    else set(accepted ? "V10" : "V9", { appt5: { ...a, reply: r }, detail: accepted ? [`นัดรับรถ ${a.from}`, "รอปิดงาน"] : ["หน่วยงานปฏิเสธนัด", "รอแก้นัดหมาย"] }, accepted ? T.apptAccepted() : T.apptRejected(unit, key));
  }

  /** จำลองบันทึกไม่สำเร็จ (toast แถว 26): ข้อความที่กรอกมีคำว่า "error" */
  const fail = (...texts: string[]) => texts.some((t) => /error/i.test(t));

  /** ขั้น 2 (คำสั่งล่าสุด 17 พ.ย. 2569): เซ็นรับทราบครบสองฝ่ายแล้ว "บันทึกและถัดไป" → ติดตามงานซ่อม
   *  วันที่/เลขไมล์รับรถ ระบบใส่ให้จากขั้น 1 (นำรถเข้า · วันที่หน่วยงานเลือก) หรือวันที่บันทึก */
  async function saveIntake(d: IntakeDraft): Promise<boolean> {
    await wait(600);
    if (fail(...d.checks.map((c) => c.note))) {
      { const t = T.stepSaveFail(); onNotify(t.msg, "error", t.description); } // ชีต OH-Toast แถว 26
      return false;
    }
    if (!["หน่วยงาน", "กบค."].every(side=>job.intake?.approvals.some(a=>a.side===side&&a.result==="approved"))) return false;
    const date = job.direct1?.date ?? job.appt1?.reply?.date ?? nowStamp().slice(0, 10);
    const at = nowStamp();
    const intake = { date, mileageKm: d.mileage ? Number(d.mileage.replace(/,/g, "")) : (job.direct1?.mileageKm ?? null), engineHours: d.hours ? Number(d.hours.replace(/,/g, "")) : null, checks: d.checks, delivererId: d.delivererId, receiverId: d.receiverId, photos: d.photos,
      approvals: job.intake?.approvals ?? [], // ส่งอนุมัติ/เซ็นแล้วทีละคนก่อนบันทึก (sendSign)
      log: [...(job.intake?.log ?? []), { at, who: "กบค. (ผู้ใช้งานปัจจุบัน)", action: "บันทึกรายการเอกสารรับรถ" }], confirmedAt: at };
    const signedIntake = { ...job.intake!, confirmedAt: at, log: intake.log };
    set("V5", { intake: signedIntake, progress: 0, progressLog: job.progressLog ?? [], detail: ["อยู่อู่ 0 วัน", `รับรถ ${date}`] }, T.intakeConfirmed()); // ชีต OH-Toast แถว 17
    return true;
  }

  /** ขั้น 2 ลงนามการรับมอบรถ — กระดานเจ้าของงาน 17 พ.ย. 2569: เลือกผู้ลงนาม → "ส่งอนุมัติ" (แจ้งเตือนให้คนนั้นเซ็นรับทราบจากหน้าเซ็นลงนาม)
   *  ยังไม่เซ็น → "แก้ไข" เปลี่ยนคนแล้วส่งใหม่ได้ · เก็บลง job.intake ทันที (งานยังอยู่ขั้น 2 · ยังไม่มี confirmedAt) */
  async function sendSign(side: "หน่วยงาน" | "กบค.", staffId: string, draft: IntakeDraft): Promise<boolean> {
    if (Object.keys(validateIntakeForSign(draft)).length) return false;
    await wait(500);
    const at = nowStamp();
    const base = job.intake ?? { date: "", mileageKm: null, checks: emptyChecks(), photos: [], approvals: [], log: [] };
    if (base.approvals.some(a => a.side === side && a.result === "approved")) return false;
    const who = staff.find((x) => x.id === staffId)?.name ?? staffId;
    const intake = {
      ...base,
      ...(!intakeLocked(base) ? { date: base.date || job.direct1?.date || job.appt1?.reply?.date || nowStamp().slice(0,10), mileageKm: draft.mileage ? Number(draft.mileage.replace(/,/g,"")) : null, engineHours: draft.hours ? Number(draft.hours.replace(/,/g,"")) : null, checks: draft.checks, photos: draft.photos, delivererId: draft.delivererId, receiverId: draft.receiverId } : {}),
      ...(side === "หน่วยงาน" ? { delivererId: staffId } : { receiverId: staffId }),
      approvals: [...base.approvals.filter((a) => a.side !== side), { side, staffId, sentAt: at, requestId: crypto.randomUUID(), requestedAt: Date.now() }],
      log: [...base.log, { at, who: "กบค. (ผู้ใช้งานปัจจุบัน)", action: `ส่งให้ ${who} เซ็นลงนามการรับมอบรถ` }],
    };
    onUpdate({ ...job, intake }, T.apptSent() /* New toast "บันทึกข้อมูลสำเร็จ" */);
    return true;
  }

  // ขั้น 3 — toast แถว 18–21 · ความคืบหน้าล่าสุด (รายการท้ายสุด) = ความคืบหน้าของงาน
  async function saveProgress(d: ProgressDraft, id?: string): Promise<boolean> {
    await wait(500);
    if (fail(d.detail, d.note)) {
      { const t = T.stepSaveFail(); onNotify(t.msg, "error", t.description); } // ชีต OH-Toast แถว 26
      return false;
    }
    const log = job.progressLog ?? [];
    const next = id ? log.map((e) => (e.id === id ? { ...e, ...d } : e)) : [...log, { id: `pg-${Date.now()}`, at: nowStamp(), ...d }];
    const last = next[next.length - 1];
    set("V5", { progressLog: next, progress: last?.percent ?? 0 }, id ? T.progressEdited() : T.progressAdded() /* แถว 19 · 18 */);
    return true;
  }
  async function deleteProgress(id: string): Promise<boolean> {
    await wait(400);
    const next = (job.progressLog ?? []).filter((e) => e.id !== id);
    set("V5", { progressLog: next, progress: next[next.length - 1]?.percent ?? 0 }, T.progressDeleted() /* แถว 20 */);
    return true;
  }
  async function finishRepair(): Promise<boolean> {
    await wait(500);
    set("V6", { progress: 100, detail: [`ซ่อมเสร็จ ${nowStamp().slice(0, 10)}`, "รอตรวจสภาพ"] }, T.repairDone() /* แถว 21 */);
    return true;
  }

  async function confirmInspection(d: Omit<Inspection, "confirmedAt">): Promise<boolean> {
    await wait(600);
    if (fail(...[...d.safety, ...d.other, ...d.photos].map((f) => f.name))) {
      { const t = T.stepSaveFail(); onNotify(t.msg, "error", t.description); } // ชีต OH-Toast แถว 26
      return false;
    }
    set("V7", { inspection: { ...d, confirmedAt: nowStamp() }, detail: ["ตรวจสภาพแล้ว", "รอนัดรับรถ"] }, T.inspectionConfirmed()); // ชีต OH-Toast แถว 22
    return true;
  }

  // ขั้น 6–7 (S14 · S15 · S20)
  const closeDefaults: CloseDraft = {
    returnedAt: job.direct5?.date ?? job.appt5?.reply?.date ?? "",
    /* 18 พ.ย. 2569: ผู้รับมอบรถ = คนที่ กบค. เลือกไว้ในขั้น 5 (ไม่มีนัด หรือ มีนัด) · หน่วยงานไม่กรอกชื่อตอนตอบรับนัดแล้ว · reply.deliverer เหลือไว้อ่านข้อมูลเก่า */
    receiver: staff.find((s) => s.id === (job.direct5?.coordinatorId ?? job.appt5?.coordinatorId))?.name ?? job.appt5?.reply?.deliverer ?? "",
    body: seedSmiParts() /* บอร์ด 0.2: อะไหล่ที่เบิกจากคลัง (SMI) อยู่ในตารางตัวรถ แทนตาราง "คืนอะไหล่" แยก */,
    tools: [],
    stock: [],
    labor: null,
    other: null,
    warranty: { on: true, start: "" /* เจ้าของงาน 19 พ.ย. 2569: ไม่เติมวันเริ่มรับประกันให้ */, days: null },
  };
  async function closeJob(d: CloseDraft): Promise<boolean> {
    await wait(600);
    if (fail(d.receiver)) {
      { const t = T.stepSaveFail(); onNotify(t.msg, "error", t.description); } // ชีต OH-Toast แถว 26
      return false;
    }
    const close = { ...d, stock: d.stock.map((x) => ({ ...x, sent: x.withdrawn > x.used })), closedAt: nowStamp() };
    set("V10.2", { close, progress: 100, detail: [`ส่งมอบรถ ${d.returnedAt}`, "รอส่งอนุมัติปิดงาน"] }, T.closed()); // ชีต OH-Toast แถว 23
    return true;
  }
  /** ขั้น 7 — เจ้าของงาน 17 พ.ย. 2569 (แทนมติ Refinement 9/11/2026 ที่ปิดงานทันที): ส่งอนุมัติต้องเลือกผู้อนุมัติ (ตามจอ UAT "ส่งอนุมัติเพื่อปิดงาน Overhaul")
   *  → V10.3 รออนุมัติปิดงาน · แก้ไขผู้อนุมัติได้จนกว่าจะอนุมัติ · ผู้อนุมัติตัดสินในเมนู "อนุมัติปิดงาน" (ApprovalPages) */
  async function sendApproval(approverId: string): Promise<boolean> {
    await wait(600);
    if (!job.close) return false;
    const resend = job.code === "V10.3";
    const approver = staff.find((s) => s.id === approverId);
    set("V10.3", { progress: 100, close: { ...job.close, returned: undefined, approval: { sentAt: resend && job.close.approval ? job.close.approval.sentAt : nowStamp(), sentBy: "กบค. (ผู้ใช้งานปัจจุบัน)", approverId } }, detail: [`ส่งอนุมัติ ${todayThai()}`, `รอ ${approver?.name ?? "ผู้อนุมัติ"} อนุมัติ`] }, resend ? { msg: "แก้ไขผู้อนุมัติสำเร็จ" } /* ไม่มีในชีต */ : T.approvalSent() /* แถว 25 */);
    return true;
  }

  function renderStep(): ReactNode {
    const ro = viewOnly || view < current;
    const none = (title: string, text: string) => <EmptyState kind="data-empty" title={title} description={text} />;
    if (viewOnly && view === 1 && !job.appt1 && !job.skipped1) return none("ยังไม่มีนัดหมาย", "กบค. จะแจ้งช่วงวันนำรถเข้าอู่ทางแจ้งเตือน แล้วตอบรับหรือปฏิเสธได้ที่หน้านี้"); // S.4
    if (viewOnly && view === 5 && !job.appt5) return none("ยังไม่มีนัดหมาย", "กบค. จะแจ้งช่วงวันนัดรับรถทางแจ้งเตือน แล้วตอบรับหรือปฏิเสธได้ที่หน้านี้");
    if (viewOnly && view === 6 && !job.close) return none("ยังไม่ปิดงาน", "รายการอะไหล่และการรับประกันจะแสดงเมื่อ กบค. ปิดงาน");
    if (view === 1) {
      if (job.skipped1)
        return (
          <section className="flex flex-col gap-4">
            <SectionHeader title="นัดหมายนำรถเข้าอู่" />
            {job.direct1 ? (
              /* นำรถเข้า (16 พ.ย. 2569): แสดงข้อมูลที่บันทึกตอนเลือก "นำรถเข้า" */
              <dl className="rounded-lg bg-gray-50 p-6">
                <Row cols={3} items={[["วันที่นำรถเข้า", job.direct1.date], ["ผู้ส่งมอบรถ", staff.find((x) => x.id === job.direct1!.coordinatorId)?.name], ["เบอร์โทรศัพท์ผู้ส่งมอบรถ", staff.find((x) => x.id === job.direct1!.coordinatorId)?.phone]]} />
              </dl>
            ) : (
              <p className="text-md text-gray-600">ข้ามขั้นตอนนัดหมาย (ยานพาหนะอยู่ที่อู่แล้ว)</p>
            )}
          </section>
        );
      return (
        <StepAppointment
          key={`a1-${job.code}`}
          kind={1}
          appt={job.appt1}
          rejected={job.code === "V3"}
          garage={garage}
          staff={staff}
          readOnly={ro}
          past={view < current}
          onBack={onGoPO}
          onSubmit={(a) => sendAppt(1, a)}
          onSkip={(d) => set("V4.1", { skipped1: true, direct1: d, detail: [`นำรถเข้า ${d.date}`, "รอตรวจรับรถ"] }, { msg: "ข้ามขั้นตอนนัดหมายแล้ว", tone: "info" })}
          onSimulateReply={(ok) => reply(1, ok)}
        />
      );
    }
    if (view === 2) {
      return (
        <StepIntake
          key={`i-${job.code}`}
          intake={job.intake}
          /* 18 พ.ย. 2569: หน่วยงานไม่กรอกชื่อคนตอนตอบรับนัดแล้ว → ตั้งต้นผู้ส่งมอบรถจากขั้น 1 ทั้งกรณีไม่มีนัดและมีนัด · เปลี่ยนเป็นคนที่มาส่งจริงได้จนกว่าจะเซ็น */
          defaultDeliverer={job.direct1?.coordinatorId ?? job.appt1?.coordinatorId}
          staff={staff}
          readOnly={ro}
          onBack={onGoPO}
          onSave={saveIntake}
          onSendSign={sendSign}
        />
      );
    }
    if (view === 3) {
      return <StepProgress key={`p-${job.code}`} log={job.progressLog ?? []} readOnly={ro} onBack={onGoPO} onSave={saveProgress} onDelete={deleteProgress} onFinish={finishRepair} />;
    }
    if (view === 4) {
      return <StepInspection key={`s-${job.code}`} inspection={job.inspection} readOnly={ro} onBack={onGoPO} onConfirm={confirmInspection} />;
    }
    if (view === 5) {
      if (job.direct5) {
        const who = (id?: string) => staff.find((x) => x.id === id);
        return (
          /* ขั้น 5 "ไม่มีการนัดหมาย" (16 พ.ย. 2569): ข้อมูลที่บันทึกไว้ */
          <section className="flex flex-col gap-6">
            <SectionHeader title="รายละเอียดการรับรถคืน" />
            <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
              <Row cols={3} items={[["รูปแบบการรับรถคืน", "ไม่มีการนัดหมาย"], ["วันที่ส่งมอบรถคืน", job.direct5.date], ["ผู้รับมอบรถ", who(job.direct5.coordinatorId)?.name]]} />
              <Row cols={3} items={[["เบอร์โทรศัพท์ผู้รับมอบรถ", who(job.direct5.coordinatorId)?.phone]]} />
            </dl>
          </section>
        );
      }
      return (
        <StepAppointment
          key={`a5-${job.code}`}
          kind={5}
          appt={job.appt5}
          rejected={job.code === "V9"}
          garage={garage}
          staff={staff}
          readOnly={ro}
          past={view < current}
          onBack={onGoPO}
          onSubmit={(a) => sendAppt(5, a)}
          onSkip={(d) => set("V10.1" /* ไม่มีนัด = ไม่ใช่ "หน่วยงานตอบรับรถแล้ว" (V10) */, { skipped5: true, direct5: d, detail: [`ส่งมอบรถคืน ${d.date}`, "รอปิดงาน"] }, { msg: "บันทึกการส่งมอบรถคืนสำเร็จ" }) /* แจ้งเตือนหน่วยงานสร้างจาก direct5 ที่ page.tsx */}
          onSimulateReply={(ok) => reply(5, ok)}
        />
      );
    }
    if (view === 6) {
      return <StepClose key={`c-${job.code}`} close={job.close} defaults={closeDefaults} readOnly={ro} onBack={onGoPO} onClose={closeJob} onNotify={onNotify} />;
    }
    if (view === 7) {
      return (
        <StepSendApproval
          job={job}
          po={po}
          garage={garage}
          vehicle={vehicle}
          onBack={onGoPO}
          onSend={sendApproval}
          staff={staff}
          viewOnly={viewOnly}
        />
      );
    }
    return (
      <section className="flex flex-col gap-4">
        <SectionHeader title={JOB_STEPS[view - 1]} />
        <p className="rounded-md border border-dashed border-gray-300 p-6 text-md text-gray-600">ขั้น &quot;{JOB_STEPS[view - 1]}&quot; ยังไม่อยู่ในต้นแบบรอบนี้ (กำลังทำ scene ถัดไป)</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={crumbs ?? [{ label: "จัดการงาน Overhaul", onClick: onGoPlans }, { label: `แผน ${plan.id}`, onClick: onGoPlan }, { label: po.id, onClick: onGoPO }, { label: job.plate }]}
        title={job.plate}
        badge={<OutlineBadge tone={BADGE[st.tone]}>{st.label}</OutlineBadge>}
        /* ภาพเจ้าของงาน 16 พ.ย. 2569 · ตัดทศนิยมไม่ปัด (กติกาเดียวกับตาราง) · ไม่แสดงในหน้าขั้น 6 ปิดงาน (เจ้าของงาน 16 พ.ย. 2569) */
        /* เจ้าของงาน 16 พ.ย. 2569: ไม่แสดงในขั้น 6–7 และเมื่อครบ 100% แล้ว (ซ่อมสำเร็จ) */
        /* เจ้าของงาน 17 พ.ย. 2569: ไม่แสดง "ความคืบหน้า n%" ใต้ทะเบียนทุกหน้า (เดิมซ่อนเฉพาะขั้น 6–7 / 100%) */
        actions={actions}
      />
      {top}
      {/* P.1/P.2 (ขั้น 7): ไม่มี section ข้อมูลยานพาหนะด้านบน — ย้ายไปคอลัมน์ขวา "ยานพาหนะ" ของสรุป */}
      {view !== 7 && (
      <section className="flex flex-col gap-4">
        <SectionHeader title="ข้อมูลยานพาหนะ" />
        <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
          {/* ภาพเจ้าของงาน 16 พ.ย. 2569: 3 คอลัมน์ (ทะเบียน ยี่ห้อ/รุ่น ประเภท / อายุ เลขไมล์ ชั่วโมง) */}
          <Row cols={3} items={[["ทะเบียน", job.plate], ["ยี่ห้อ/รุ่น", vehicle ? `${vehicle.make} ${vehicle.model}` : ""], ["ประเภท", vehicle?.type]]} />
          <Row cols={3} items={[["อายุการใช้งาน", vehicle ? `${vehicle.ageYears} ปี` : ""], ["เลขไมล์สะสม", vehicle?.mileageKm !== undefined ? `${vehicle.mileageKm.toLocaleString()} กม.` : ""], ["ชั่วโมงสะสม", vehicle?.engineHours !== undefined ? `${vehicle.engineHours.toLocaleString()} ชม.` : ""]]} />
        </dl>
      </section>
      )}
      {!hideSteps && <ProgressSteps steps={JOB_STEPS} current={current} viewing={view} onSelect={setViewing} />}
      {/* มุมหน่วยงานรอตอบรับ: ข้อมูลนัดของขั้นปัจจุบันอยู่ในส่วน "ตอบรับนัดหมาย" ด้านบนแล้ว — ไม่แสดงซ้ำ (ขั้นอื่นยังกดดูย้อนหลังได้) */}
      {belowSteps && view === current ? belowSteps : renderStep()}
    </div>
  );
}
