"use client";
/** เวอร์ชัน "ตาม UAT 100%" (ค้างไว้ตามระบบ UAT 20 พ.ย. 2569 · ไม่มี flow ที่ต้นแบบเติม) — หน้ารายละเอียดงานซ่อม
 *  UAT /maintain-d/repair-utility-vehicle/:id · ผู้ใช้คนเดียว (admin-super) ทำได้ทุกขั้น
 *    รอหัวหน้าหน่วยงานอนุมัติ: เลือกวิธีซ่อม (ซ่อมโดย กบค. / ซ่อมศูนย์บริการ/อู่ภายนอก) · ส่งคืนงานซ่อม · รับงานซ่อม → "ส่งอนุมัติเพื่อเปิดงานซ่อม"
 *    รอหัวหน้า กบค. อนุมัติ: เลือกวิธีซ่อม · ส่งคืนงานซ่อม · อนุมัติ → UAT ข้ามไป "รอตรวจสภาพก่อนซ่อม" (ขั้น 1–2 ล็อก)
 *    สถานะอื่นก่อนกระบวนการซ่อม: UAT ไม่มีหน้าจอ → แสดงแค่ข้อมูล
 *  ในกระบวนการซ่อม: แท็บ กระบวนการซ่อม 7 ขั้น + ปุ่ม "ปิดงานทันที" ที่ UAT ปิดไว้ (ยังไม่พร้อมใช้งาน) */
import { useState, type ReactNode } from "react";
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
import { Icon } from "@ui/Icon";
import { personOf } from "../mock/data";
import { processStep, PROCESS_STEPS, type RepairJob, type Role } from "./model";
import { StepAppointment, StepClose, StepIntake, StepParts, StepPost, StepReturn, StepWork, type Act } from "./ProcessSteps";
import { RequestSummary } from "./RequestSummary";
import { HeaderPill, PersonPicker } from "./ui";

type Tab = "process" | "info" | "repairs" | "log";
type Method = "med" | "garage";
const METHOD_LABEL: Record<Method, string> = { med: "ซ่อมโดย กบค.", garage: "ซ่อมศูนย์บริการ/อู่ภายนอก" };

export function RepairDetail({ job, jobs, role, act, onList, onOpen }: { job: RepairJob; jobs: RepairJob[]; role: Role; act: Act; onList: () => void; onOpen: (id: string) => void }) {
  const cur = processStep(job);
  const [tab, setTab] = useState<Tab>(cur ? "process" : "info");
  const [view, setView] = useState<number | null>(null);
  const s = job.status;
  const isUnitHead = s === "waiting_unit_head_approval";
  const isMedHead = s === "waiting_med_head_approval";
  const isApproval = isUnitHead || isMedHead;
  const [method, setMethod] = useState<Method | undefined>(isMedHead && (job.method === "med" || job.method === "garage") ? job.method : undefined);
  const [modal, setModal] = useState<null | "accept" | "return">(null);
  const [approver, setApprover] = useState("");
  const [reason, setReason] = useState("");
  const inProcess = cur !== null && cur <= 7;
  const viewing = view ?? (cur && cur <= 7 ? cur : 1);

  let actions: ReactNode = null;
  if (isApproval) {
    actions = (
      <>
        <Button variant="tertiaryDanger" onClick={() => { setReason(""); setModal("return"); }}>ส่งคืนงานซ่อม</Button>
        {isUnitHead ? (
          <Button iconLeft="build" disabled={!method} onClick={() => { setApprover(""); setModal("accept"); }}>รับงานซ่อม</Button>
        ) : (
          <Button disabled={!method} onClick={() => act({ method }, { status: "ready_to_proceed", log: `อนุมัติ · ${method ? METHOD_LABEL[method] : ""}`, toast: "อนุมัติสำเร็จ" })}>อนุมัติ</Button>
        )}
      </>
    );
  } else if (inProcess || cur === 8) {
    actions = <Button variant="tertiaryDanger" disabled title="ยังไม่พร้อมใช้งาน">ปิดงานทันที</Button>;
  }

  const tabs = [...(cur ? [{ id: "process", label: "กระบวนการซ่อม" }] : []), { id: "info", label: "ข้อมูลการซ่อม" }, { id: "repairs", label: "ประวัติการซ่อม" }, { id: "log", label: "ประวัติการดำเนินการ" }];

  return (
    <div className="flex flex-col gap-6 px-8 py-6 max-md:px-4">
      <PageHeader crumbs={[{ label: "จัดการงานซ่อม", onClick: onList }, { label: `หมายเลขเหตุการณ์ ${job.no}` }]} title={`หมายเลขเหตุการณ์ ${job.no}`} badge={<HeaderPill status={s} />} actions={actions} />
      <Tabs items={tabs} value={tab} onChange={(t) => setTab(t as Tab)} />

      {tab === "process" && cur && (
        <div className="flex flex-col gap-6">
          <ProgressSteps steps={PROCESS_STEPS} current={cur} viewing={viewing} plainNumbers size="sm" onSelect={(n) => setView(n)} label="ขั้นตอนการทำงาน" />
          <ProcessBody key={`${job.status}-${viewing}`} step={viewing} job={job} role={role} edit={viewing === cur} act={(p, o) => { setView(null); act(p, o); }} />
        </div>
      )}

      {tab === "info" && (
        <RequestSummary
          job={job}
          top={
            isApproval ? (
              <section className="flex flex-col gap-4">
                <h2 className="text-md font-semibold text-black">เลือกวิธีซ่อม</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {(["med", "garage"] as const).map((m) => <RadioCard key={m} name="method" checked={method === m} onChange={() => setMethod(m)} title={METHOD_LABEL[m]} />)}
                </div>
              </section>
            ) : null
          }
        />
      )}

      {tab === "repairs" && <RepairHistory job={job} jobs={jobs} onOpen={onOpen} />}
      {tab === "log" && <ActionLog job={job} />}

      {/* รับงานซ่อม → ส่งอนุมัติเพื่อเปิดงานซ่อม (UAT) */}
      <Modal open={modal === "accept"} onClose={() => setModal(null)} title="ส่งอนุมัติเพื่อเปิดงานซ่อม" cancelLabel="ปิด" confirmLabel="ส่งอนุมัติ" confirmDisabled={!approver} onConfirm={() => { setModal(null); act({ method, approverId: approver }, { status: "waiting_med_head_approval", log: `รับงานซ่อม · ${method ? METHOD_LABEL[method] : ""} · ส่งอนุมัติเพื่อเปิดงานซ่อม`, toast: "ส่งอนุมัติสำเร็จ" }); }}>
        <PersonPicker label="ผู้อนุมัติ" value={approver} onChange={setApprover} ids={["p7", "p3"]} />
      </Modal>

      {/* ส่งคืนงานซ่อม (UAT: เหตุผล · ปิด/ยืนยัน) — UAT ไม่บอกว่าส่งคืนแล้วไปสถานะไหน · ต้นแบบใช้ "ไม่อนุมัติ" */}
      <Modal open={modal === "return"} onClose={() => setModal(null)} title="ส่งคืนงานซ่อม" cancelLabel="ปิด" confirmLabel="ยืนยัน" confirmDisabled={!reason.trim()} onConfirm={() => { setModal(null); act({ returnReason: reason.trim() }, { status: "not_approved", log: "ส่งคืนงานซ่อม", note: reason.trim(), toast: "ส่งคืนงานซ่อมสำเร็จ" }); }}>
        <TextArea label="เหตุผล" rows={4} placeholder="ระบุเหตุผล" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>
    </div>
  );
}

export function ProcessBody({ step, job, edit, act, role }: { step: number; job: RepairJob; edit: boolean; act: Act; role: Role }) {
  const p = { job, edit, act, role };
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

