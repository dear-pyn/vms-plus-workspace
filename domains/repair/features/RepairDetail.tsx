"use client";
/** หมายเลขเหตุการณ์ {เลข} — หน้ารายละเอียดงานซ่อม (UAT /maintain-d/repair-utility-vehicle/:id · 20 พ.ย. 2569)
 *  ก่อนเข้ากระบวนการซ่อม: แท็บ ข้อมูลการซ่อม · ประวัติการซ่อม · ประวัติการดำเนินการ
 *    รอหัวหน้าหน่วยงานอนุมัติ: "เลือกวิธีซ่อม" (ซ่อมโดย กบค. / ซ่อมศูนย์บริการ/อู่ภายนอก) + ส่งคืนงานซ่อม + รับงานซ่อม → กล่อง "ส่งอนุมัติเพื่อเปิดงานซ่อม"
 *    รอหัวหน้า กบค. อนุมัติ: เลือกวิธีซ่อม + ส่งคืนงานซ่อม + อนุมัติ
 *  ในกระบวนการซ่อม: แท็บ กระบวนการซ่อม (7 ขั้น) นำหน้า + ปุ่ม "ปิดงานทันที" มุมขวาบน (UAT ปิดไว้ "ยังไม่พร้อมใช้งาน" → ต้นแบบเปิดให้ลอง · รอยืนยัน) */
import { useState, type ReactNode } from "react";
import { currency } from "@rules/currency.mjs";
import { Alert } from "@ui/Alert";
import { Button } from "@ui/Button";
import { Checkbox } from "@ui/Checkbox";
import { Modal } from "@ui/Modal";
import { PageHeader } from "@ui/PageHeader";
import { Pagination } from "@ui/Pagination";
import { ProgressSteps } from "@ui/ProgressSteps";
import { RadioCard } from "@ui/RadioCard";
import { SearchInput } from "@ui/SearchInput";
import { DataTable, Td, Th, CellStack } from "@ui/Table";
import { Tabs } from "@ui/Tabs";
import { TextArea } from "@ui/TextArea";
import { TextField } from "@ui/TextField";
import { Icon } from "@ui/Icon";
import { personOf, statusOf, type StatusCode } from "../mock/data";
import { canAct, processStep, PROCESS_STEPS, todayBE, type RepairJob, type Role } from "./model";
import { StepAppointment, StepClose, StepIntake, StepParts, StepPost, StepReturn, StepWork, type Act } from "./ProcessSteps";
import { RequestSummary } from "./RequestSummary";
import { GarageSteps, inGarageFlow } from "./GarageSteps";
import { CostAlert, jobCost, money, partTotals } from "./parts";
import { MoneyField } from "@overhaul/features/plan/VehicleModals";
import { AddedNote, AddedTag, HeaderPill, PersonPicker } from "./ui";

type Tab = "process" | "info" | "repairs" | "log";
type Method = "med" | "garage" | "ecd";
const METHOD_LABEL: Record<Method, string> = { ecd: "ซ่อมโดย กรย.", med: "ซ่อมโดย กบค.", garage: "ซ่อมศูนย์บริการ/อู่ภายนอก" };

export function RepairDetail({ job, jobs, role, act, onList, onOpen }: { job: RepairJob; jobs: RepairJob[]; role: Role; act: Act; onList: () => void; onOpen: (id: string) => void }) {
  const cur = processStep(job);
  const garage = inGarageFlow(job);
  const [tab, setTab] = useState<Tab>(cur || garage ? "process" : "info");
  const [view, setView] = useState<number | null>(null);
  /* flow อนุมัติก่อนซ่อม (เจ้าของงาน 23 พ.ย. 2569):
   *  รอหัวหน้าหน่วยงานอนุมัติ (อนุมัติ/ส่งคืน) → รอ กรย พิจารณา (เลือก ซ่อมโดย กรย. · ซ่อมโดย กบค. · อู่ภายนอก + ประเมินราคา)
   *  → รอ กบค รับเรื่อง (= หน้า UAT: เลือกวิธีซ่อม + ประเมินราคา + รับงานซ่อม → ส่งอนุมัติ) → รอหัวหน้า กบค. อนุมัติ
   *  ⚠ UAT แสดงหน้า "เลือกวิธีซ่อม + รับงานซ่อม" ที่สถานะรอหัวหน้าหน่วยงานอนุมัติ — มตินี้ย้ายไปเป็นขั้น กบค รับเรื่อง */
  const s = job.status;
  const isUnitHead = s === "waiting_unit_head_approval";
  const isEcd = s === "waiting_ecd_review";
  const isMedReceive = s === "waiting_med_receive" || s === "waiting_med_review";
  const isMedHead = s === "waiting_med_head_approval";
  const methodOptions: Method[] = isEcd ? ["ecd", "med", "garage"] : isMedReceive || isMedHead ? ["med", "garage"] : [];
  /* EC-R02: หัวหน้า กบค. เห็นวิธีซ่อม + ราคาประเมินที่รับงานไว้ · เปลี่ยนได้ */
  const [method, setMethod] = useState<Method | undefined>(isMedHead && (job.method === "med" || job.method === "garage") ? job.method : undefined);
  /* ประเมินค่าซ่อมก่อนอนุมัติ/รับงาน — ซ่อมโดย กบค. / กรย. = ค่าอะไหล่ + ค่าแรง + อื่น ๆ · อู่ = ราคาตามใบเสนอราคา (ใช้เทียบ 30%) */
  const prevEst = job.estimateDetail;
  const [est, setEst] = useState({ labor: prevEst?.labor ?? "", other: prevEst?.other ?? "", quote: prevEst?.method === "garage" ? currency(prevEst.total) : job.estimate ? currency(job.estimate) : "" });
  const internal = method === "med" || method === "ecd";
  const estParts = partTotals(job.requestedParts).all;
  const estTotal = internal ? estParts + money(est.labor) + money(est.other) : money(est.quote);
  const estOk = internal ? !!est.labor.trim() : method === "garage" ? !!est.quote.trim() && money(est.quote) > 0 : false;
  const estimateDetail = method ? { method, parts: internal ? estParts : 0, labor: internal ? est.labor : "", other: internal ? est.other : "", total: estTotal } : undefined;
  const [modal, setModal] = useState<null | "accept" | "return" | "closeNow" | "cancel">(null);
  const [approver, setApprover] = useState("");
  const [reason, setReason] = useState("");
  const mine = canAct(role, job.status);
  const isApproval = isUnitHead || isEcd || isMedReceive || isMedHead;
  const inProcess = cur !== null && cur <= 7;
  const viewing = view ?? (cur && cur <= 7 ? cur : 1);

  /* เจ้าของงาน 23 พ.ย. 2569: อนุมัติ = อนุมัติทันที · ไม่อนุมัติ = Modal ใส่เหตุผล (แบบ Overhaul) */
  const returnBtn = <Button variant="tertiaryDanger" onClick={() => { setReason(""); setModal("return"); }}>ไม่อนุมัติ</Button>;
  const ecdApprove = () => {
    if (!method) return;
    const go: Record<Method, { status: StatusCode; to: Role; text: string }> = {
      ecd: { status: "waiting_ecd_action", to: "ecd", text: `${job.no} กรย. อนุมัติซ่อมเอง รอ กรย ดำเนินการ` },
      med: { status: "waiting_med_receive", to: "med", text: `ใบแจ้งซ่อม ${job.no} ส่งต่อจาก กรย. รอ กบค รับเรื่อง` },
      garage: { status: "ecd_approved_self_repair", to: "origin", text: `ใบแจ้งซ่อม ${job.no} กรย. เห็นชอบให้ซ่อมศูนย์บริการ/อู่ภายนอก กรุณาบันทึกผลการซ่อม` },
    };
    act({ method, estimateDetail }, { status: go[method].status, log: `กรย อนุมัติ · ${METHOD_LABEL[method]}`, toast: "อนุมัติสำเร็จ", notify: [{ to: go[method].to, text: go[method].text, tone: "warning" }] });
  };

  let actions: ReactNode = null;
  if (isApproval && mine) {
    actions = isUnitHead ? (
      <>
        {returnBtn}
        <Button onClick={() => act({}, { status: "waiting_ecd_review", log: "หัวหน้าหน่วยงานอนุมัติ · ส่ง กรย พิจารณา", toast: "อนุมัติสำเร็จ", notify: [{ to: "ecd", text: `ใบแจ้งซ่อม ${job.no} รอ กรย พิจารณา`, tone: "warning" }] })}>อนุมัติ</Button>
      </>
    ) : isEcd ? (
      <>
        {returnBtn}
        <Button disabled={!method || !estOk} onClick={ecdApprove}>อนุมัติ</Button>
      </>
    ) : isMedHead ? (
      <>
        {returnBtn}
        <Button disabled={!method || !estOk} onClick={() => act({ method, estimateDetail }, { status: method === "med" ? "preparing_spare_parts" : "self_repair_in_progress", log: `อนุมัติ · ${method ? METHOD_LABEL[method] : ""}`, toast: "อนุมัติสำเร็จ", notify: method === "med" ? [{ to: "med", text: `${job.no} อนุมัติให้ กบค. ซ่อม รอเตรียมอะไหล่`, tone: "success" }, { to: "origin", text: `ใบแจ้งซ่อม ${job.no} ได้รับอนุมัติ`, tone: "success" }] : [{ to: "origin", text: `ใบแจ้งซ่อม ${job.no} อนุมัติให้ซ่อมศูนย์บริการ/อู่ภายนอก กรุณาบันทึกผลการซ่อม`, tone: "info" }] })}>อนุมัติ</Button>
      </>
    ) : (
      <>
        {returnBtn}
        <Button iconLeft="build" disabled={!method || !estOk} onClick={() => { setApprover(""); setModal("accept"); }}>รับงานซ่อม</Button>
      </>
    );
  } else if (s === "not_approved" && (role === "admin" || role === "origin")) {
    /* เจ้าของงาน 23 พ.ย. 2569: ไม่อนุมัติ → ยกเลิกอย่างเดียว (ไม่แก้ไขส่งใหม่) · ต้องสร้างใบแจ้งซ่อมใหม่ */
    actions = <Button variant="secondaryDanger" onClick={() => { setReason(""); setModal("cancel"); }}>ยกเลิกใบแจ้งซ่อม</Button>;
  } else if (inProcess || (cur === 8)) {
    actions = (
      <Button variant="tertiaryDanger" disabled={!inProcess || role === "origin"} title={inProcess ? "ต้นแบบ: UAT ยังปิดปุ่มนี้ (ยังไม่พร้อมใช้งาน)" : "ยังไม่พร้อมใช้งาน"} onClick={() => { setReason(""); setModal("closeNow"); }}>
        ปิดงานทันที
      </Button>
    );
  }

  const tabs = [...(cur || garage ? [{ id: "process", label: "กระบวนการซ่อม" }] : []), { id: "info", label: "ข้อมูลการซ่อม" }, { id: "repairs", label: "ประวัติการซ่อม" }, { id: "log", label: "ประวัติการดำเนินการ" }];

  return (
    <div className="flex flex-col gap-6 px-8 py-6 max-md:px-4">
      <PageHeader crumbs={[{ label: "จัดการงานซ่อม", onClick: onList }, { label: `หมายเลขเหตุการณ์ ${job.no}` }]} title={`หมายเลขเหตุการณ์ ${job.no}`} badge={<HeaderPill status={s} />} actions={actions} />
      {!mine && !statusOf(s).terminal && role !== "admin" && (
        <Alert tone="info" title="งานนี้รอผู้อื่นดำเนินการ">ต้นแบบ: เปลี่ยน role ที่แถบด้านบนเพื่อทำขั้นถัดไป</Alert>
      )}
      {s !== "not_approved" && !(isApproval && mine && method) && <CostAlert plate={job.plate} {...jobCost(job)} />}
      <Tabs items={tabs} value={tab} onChange={(t) => setTab(t as Tab)} />

      {tab === "process" && garage && <GarageSteps job={job} mine={mine} act={act} role={role} />}
      {tab === "process" && cur && (
        <div className="flex flex-col gap-6">
          <ProgressSteps steps={PROCESS_STEPS} current={cur} viewing={viewing} plainNumbers size="sm" onSelect={(n) => setView(n)} label="ขั้นตอนการทำงาน" />
          <ProcessBody key={`${job.status}-${viewing}`} step={viewing} job={job} role={role} edit={mine && viewing === cur} act={(p, o) => { setView(null); act(p, o); }} />
        </div>
      )}

      {tab === "info" && (
        <RequestSummary
          job={job}
          top={
            <>
              <PreProcess job={job} mine={mine} act={act} />
              {methodOptions.length > 0 && (
                <section className="flex flex-col gap-4">
                  <h2 className="text-md font-semibold text-black">เลือกวิธีซ่อม</h2>
                  <div className={(mine ? "" : "pointer-events-none opacity-70 ") + (methodOptions.length === 3 ? "grid grid-cols-1 gap-4 md:grid-cols-3" : "grid grid-cols-1 gap-4 md:grid-cols-2")}>
                    {methodOptions.map((m) => <RadioCard key={m} name="method" checked={method === m} onChange={() => setMethod(m)} title={METHOD_LABEL[m]} />)}
                  </div>
                  {method && (
                    <>
                      <h2 className="flex items-center gap-2 pt-2 text-md font-semibold text-black">ประเมินค่าซ่อม <AddedTag /></h2>
                      <p className="-mt-2 text-sm text-gray-600">ต้องกรอกก่อน{isMedReceive ? "รับงานซ่อม" : "อนุมัติ"} — ใช้เทียบเกณฑ์ค่าซ่อมไม่เกิน 30% ของราคาที่ได้มา</p>
                      {internal ? (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <TextField label="ค่าอะไหล่ประเมิน (บาท)" autoFilled value={currency(estParts)} helper="จากอะไหล่ที่ผู้แจ้งเลือกไว้" />
                          <MoneyField label="ค่าแรงประเมิน (บาท)" placeholder="0.00" value={est.labor} onChange={(v) => setEst({ ...est, labor: v })} />
                          <MoneyField label="ค่าใช้จ่ายอื่น ๆ (บาท)" optional placeholder="0.00" value={est.other} onChange={(v) => setEst({ ...est, other: v })} />
                          <TextField label="รวมราคาประเมิน (บาท)" autoFilled value={currency(estTotal)} />
                        </div>
                      ) : (
                        <MoneyField label="ราคาประเมินตามใบเสนอราคา (บาท)" placeholder="0.00" value={est.quote} onChange={(v) => setEst({ ...est, quote: v })} />
                      )}
                      <CostAlert plate={job.plate} cost={estTotal} basis={method === "garage" ? "ราคาประเมินจากใบเสนอราคา" : `ราคาประเมินค่าซ่อม (${method === "ecd" ? "กรย." : "กบค."})`} />
                    </>
                  )}
                </section>
              )}
            </>
          }
        />
      )}

      {tab === "repairs" && <RepairHistory job={job} jobs={jobs} onOpen={onOpen} />}
      {tab === "log" && <ActionLog job={job} />}

      {/* รับงานซ่อม → ส่งอนุมัติเพื่อเปิดงานซ่อม (UAT) */}
      <Modal open={modal === "accept"} onClose={() => setModal(null)} title="ส่งอนุมัติเพื่อเปิดงานซ่อม" cancelLabel="ปิด" confirmLabel="ส่งอนุมัติ" confirmDisabled={!approver} onConfirm={() => { setModal(null); act({ method, approverId: approver, estimateDetail }, { status: "waiting_med_head_approval", log: `กบค รับงานซ่อม · ${method ? METHOD_LABEL[method] : ""} · ส่งอนุมัติ`, toast: "ส่งอนุมัติสำเร็จ", notify: [{ to: "medHead", text: `ใบแจ้งซ่อม ${job.no} รอหัวหน้า กบค. อนุมัติ`, tone: "warning" }] }); }}>
        <PersonPicker label="ผู้อนุมัติ" value={approver} onChange={setApprover} ids={["p7", "p3"]} />
      </Modal>

      {/* ส่งคืนงานซ่อม (UAT: เหตุผล · ปิด/ยืนยัน) + ต้นแบบเติมตัวเลือกผลการส่งคืน */}
      <Modal open={modal === "return"} onClose={() => setModal(null)} title="ไม่อนุมัติ" description={`แจ้งเหตุผลให้ผู้แจ้งซ่อม ${job.no}`} confirmLabel="ไม่อนุมัติ" confirmVariant="danger" confirmDisabled={!reason.trim()} onConfirm={() => { setModal(null); act({ returnReason: reason.trim() }, { status: "not_approved", log: "ไม่อนุมัติ", note: reason.trim(), toast: "บันทึกไม่อนุมัติสำเร็จ", notify: [{ to: "origin", text: `ใบแจ้งซ่อม ${job.no} ไม่ได้รับอนุมัติ เหตุผล: ${reason.trim()}`, tone: "error" }] }); }}>
        <TextArea label="เหตุผลที่ไม่อนุมัติ" rows={4} placeholder="ระบุเหตุผล" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>

      <Modal open={modal === "cancel"} onClose={() => setModal(null)} title="ยกเลิกใบแจ้งซ่อม" cancelLabel="ปิด" description={`ยกเลิก ${job.no} แล้วแก้ไขต่อไม่ได้ หากยังต้องซ่อมให้สร้างใบแจ้งซ่อมใหม่`} confirmLabel="ยกเลิกใบแจ้งซ่อม" confirmVariant="danger" confirmDisabled={!reason.trim()} onConfirm={() => { setModal(null); act({ closedEarly: reason.trim() }, { status: "cancelled", log: "ยกเลิกใบแจ้งซ่อม", note: reason.trim(), toast: "ยกเลิกใบแจ้งซ่อมสำเร็จ" }); }}>
        <TextArea label="เหตุผลการยกเลิก" rows={4} placeholder="ระบุเหตุผลการยกเลิก" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>

      <Modal open={modal === "closeNow"} onClose={() => setModal(null)} title="ปิดงานทันที" description="งานจะสิ้นสุดที่ขั้นปัจจุบัน และแก้ไขต่อไม่ได้" confirmLabel="ปิดงาน" confirmVariant="danger" confirmDisabled={!reason.trim()} onConfirm={() => { setModal(null); act({ closedEarly: reason.trim() }, { status: "job_closed", log: "ปิดงานทันที", note: reason.trim(), toast: "ปิดงานสำเร็จ" }); }}>
        <AddedNote>UAT มีปุ่มนี้แต่ปิดไว้ (&quot;ยังไม่พร้อมใช้งาน&quot;) — ต้นแบบเติมให้ระบุเหตุผลก่อนปิด</AddedNote>
        <TextArea label="เหตุผล" rows={4} placeholder="ระบุเหตุผลการปิดงาน" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>
    </div>
  );
}

export function ProcessBody({ step, job, edit, act, role }: { step: number; job: RepairJob; edit: boolean; act: Act; role: Role }) {
  const p = { job, edit, act, role };
  if (job.closedEarly && step >= 1) return <><Alert tone="warning" title="ปิดงานทันที">{job.closedEarly}</Alert>{body(step, p)}</>;
  return body(step, p);
}
function body(step: number, p: { job: RepairJob; edit: boolean; act: Act; role: Role }) {
  switch (step) {
    case 1: return <StepParts {...p} />;
    case 2: return <StepAppointment {...p} />;
    case 3: return <StepIntake {...p} />;
    case 4: return <StepWork {...p} />;
    case 5: return <StepReturn {...p} />;
    case 6: return <StepPost {...p} />;
    default: return <StepClose {...p} />;
  }
}

/** หน้าจอก่อนเข้ากระบวนการซ่อม ที่ UAT มีแค่ชื่อสถานะ (ต้นแบบเติม) */
function PreProcess({ job, mine, act }: { job: RepairJob; mine: boolean; act: Act }) {
  const s: StatusCode = job.status;
  if (s === "not_approved") return <Alert tone="error" title="ไม่อนุมัติ">{job.returnReason ?? "-"} · กดยกเลิกใบแจ้งซ่อม แล้วสร้างใบแจ้งซ่อมใหม่หากยังต้องซ่อม</Alert>;
  if (s === "cancelled") return <Alert tone="info" title="ยกเลิกใบแจ้งซ่อมแล้ว">{job.returnReason ? `ไม่อนุมัติ: ${job.returnReason} · ` : ""}เหตุผลการยกเลิก: {job.closedEarly ?? "-"}</Alert>;
  if (s === "waiting_origin_pickup" || s === "waiting_reporter_confirm_return_date")
    return <AddedNote>สถานะ &quot;{statusOf(s).name}&quot; มีใน API แต่ยังไม่พบว่าเกิดตอนไหนใน UAT — ต้นแบบยังไม่ทำ flow (รอถาม กฟภ.)</AddedNote>;
  return null;
}


/** แท็บ ประวัติการซ่อม (UAT: ค้นหา "อาการเสีย" · ตัวกรอง · รายงาน (n) · ตาราง checkbox) — งานที่ปิดแล้วของยานพาหนะคันเดียวกัน */
function RepairHistory({ job, jobs, onOpen }: { job: RepairJob; jobs: RepairJob[]; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const rows = jobs.filter((j) => j.plate === job.plate && j.id !== job.id && j.status === "job_closed" && (!q.trim() || j.symptoms.join(" ").includes(q.trim())));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput className="w-80" value={q} onChange={setQ} placeholder="อาการเสีย" aria-label="ค้นหาอาการเสีย" />
        <div className="flex items-center gap-3">
          <Button variant="secondary" iconLeft="filter_list">ตัวกรอง</Button>
          <Button variant="secondary" iconLeft="download" disabled={!sel.length}>รายงาน <span className="ml-1 rounded-full bg-gray-100 px-2 text-xs">{sel.length}</span></Button>
        </div>
      </div>
      <DataTable label="ประวัติการซ่อม">
        <thead>
          <tr>
            <Th><Checkbox label="เลือกทั้งหมด" checked={rows.length > 0 && sel.length === rows.length} onChange={(on) => setSel(on ? rows.map((r) => r.id) : [])} /></Th>
            <Th>หมายเลขเหตุการณ์</Th><Th>วันที่แจ้งซ่อม</Th><Th>วันที่ซ่อมเสร็จ</Th><Th>ผู้ซ่อม</Th><Th>ช่างซ่อม</Th><Th>ชั่วโมงการใช้งาน</Th><Th>เลขไมล์</Th><Th>อาการเสีย</Th><Th><span className="sr-only">ดู</span></Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><Td colSpan={10} className="py-8 text-center text-gray-600">ยังไม่มีประวัติการซ่อมของยานพาหนะคันนี้</Td></tr>
          ) : rows.map((r) => (
            <tr key={r.id}>
              <Td><Checkbox label={`เลือก ${r.no}`} checked={sel.includes(r.id)} onChange={(on) => setSel(on ? [...sel, r.id] : sel.filter((x) => x !== r.id))} /></Td>
              <Td className="font-semibold">{r.no}</Td>
              <Td>{r.createdAt}</Td>
              <Td>{r.updatedAt}</Td>
              <Td className="max-w-32 truncate">{r.method === "med" ? "กบค." : "ศูนย์บริการ/อู่ภายนอก"}</Td>
              <Td>{personOf(r.appt?.mechanicId)?.name ?? "-"}</Td>
              <Td>{r.hours ? `${r.hours.toLocaleString("en-US")} ชม.` : "-"}</Td>
              <Td>{r.mileage ? `${r.mileage.toLocaleString("en-US")} กม.` : "-"}</Td>
              <Td className="max-w-40 truncate">{r.symptoms.join(", ")}</Td>
              <Td><Button variant="tertiary" iconOnly="quick_reference_all" aria-label={`ดู ${r.no}`} onClick={() => onOpen(r.id)} /></Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}

/** แท็บ ประวัติการดำเนินการ (UAT: วันที่ / เวลา · ผู้ดำเนินการ · ตำแหน่ง / สังกัด · รายละเอียด · หมายเหตุ) */
function ActionLog({ job }: { job: RepairJob }) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const rows = [...job.history].reverse();
  return (
    <div className="flex flex-col gap-4">
      <DataTable label="ประวัติการดำเนินการ">
        <thead>
          <tr><Th><span className="inline-flex items-center gap-1">วันที่ / เวลา <Icon name="arrow_downward" size={16} /></span></Th><Th>ผู้ดำเนินการ</Th><Th>ตำแหน่ง / สังกัด</Th><Th>รายละเอียด</Th><Th>หมายเหตุ</Th></tr>
        </thead>
        <tbody>
          {rows.slice((page - 1) * size, page * size).map((h, i) => {
            const p = personOf(h.byId);
            return (
              <tr key={i}>
                <Td className="font-semibold">{h.at}</Td>
                <Td><CellStack main={<span className="font-semibold">{p?.name ?? "-"}</span>} sub={p?.position} /></Td>
                <Td>{p?.unit ?? "-"}</Td>
                <Td>{h.detail || "-"}</Td>
                <Td className="text-gray-600">{h.note || "-"}</Td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
      <Pagination page={page} pageSize={size} total={rows.length} onPageChange={setPage} onPageSizeChange={(n) => { setSize(n); setPage(1); }} />
    </div>
  );
}

