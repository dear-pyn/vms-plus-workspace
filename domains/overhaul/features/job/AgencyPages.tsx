"use client";
/** ฝั่งหน่วยงานเจ้าของยานพาหนะ — S16 ตอบรับนัดหมาย (+ S17 ดูอย่างเดียว)
 *  เจ้าของงานเคาะ 16 พ.ย. 2569 (แทนหน้าตอบกลับแยกแบบ Radio text card ของจอ OH2 / R.1–R.4.2):
 *  - เมนูใหม่ "ตอบรับนัดหมาย" ใต้ Overhaul = รายการรายคันที่รอหน่วยงานตอบรับ (V2 นัดเข้าอู่ · V8 นัดรับรถ)
 *  - กดแถว → หน้ายานพาหนะรายคัน (หน้าเดียวกับ กบค. แบบดูอย่างเดียว ซ่อนปุ่มจัดการ) + ส่วน "ตอบรับนัดหมาย" บนสุด
 *    ใช้ Text input วันที่ (ปฏิทินเลือกได้เฉพาะช่วงที่ กบค. เสนอ) ไม่ใช้ Radio · ปุ่มขวาบน "ปฏิเสธนัดหมาย" / "ตอบรับนัดหมาย"
 *  - ตอบรับนัดหมาย = ตรวจวันที่ (บังคับ) → Modal ยืนยัน · ปฏิเสธนัดหมาย = ไม่ตรวจ → Modal ใส่เหตุผล (ไม่บังคับ) + ช่วงวันที่สะดวก (ถ้ามี)
 *  - เจ้าของงาน 18 พ.ย. 2569 (แทนแบบ 16 พ.ย. ด้านบน · ทั้งนัดนำรถเข้าอู่และนัดรับรถ) "ต้องหน้าคล้ายๆ อนุมัติ แต่มี input ด้านบนให้เลือกวันที่แบบ single" · "เป็นหน้าใหม่ของเมนูตอบรับนัดหมายเลย":
 *    หน้าแบบ ApprovalReview (แถบขั้นตอน + ไล่ดูทุกขั้นได้) · ช่อง "วันที่นำรถเข้า" / "วันที่รับรถ" (Date picker single · ตัดช่องผู้นำส่ง/ผู้รับรถ) ใต้หัวหน้า ·
 *    ปุ่มขวาบน "ปฏิเสธนัดหมาย" (ไม่ตรวจ → Modal) / "ยืนยันนัดหมาย" (ตรวจวันที่)
 *  component: Page header (actions) · Section header · Content item row · Text input/Date picker · Input dropdown · Text input Readonly ·
 *    Table + Pill (รายการ) · Modal Centered (ยืนยันตอบรับ) · Modal Form + Text area (ปฏิเสธ) · Secondary danger / Primary button */
import { useState } from "react";
import { OutlineBadge, Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { DateField, DateRangeField, parseThaiDate } from "@ui/DateField";
import { EmptyState } from "@ui/EmptyState";
import { Modal } from "@ui/Modal";
import { PageHeader, SectionHeader, SectionLabel } from "@ui/PageHeader";
import { SelectField } from "@ui/SelectField";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { TextArea } from "@ui/TextArea";
import { JOB_STATUS, type Garage, type PurchaseOrder, type Staff, type VehicleJob } from "../po/types";
import type { Plan } from "../plan/types";
import type { PlanVehicle } from "../vehicle/types";
import { JobPage } from "./JobPage";
import { Box, VehicleCard } from "./CloseSummary";

/* สีป้ายสถานะหัวหน้า — ชุดเดียวกับ JobPage */
const BADGE = { gray: "gray", warning: "gray", error: "error", info: "brand", success: "success", brand: "brand", disabled: "disabled", purple: "brand" } as const;
import { usePrototypeFill } from "../../prototype/MockTools";

export interface AgencyItem {
  job: VehicleJob;
  po: PurchaseOrder;
  plan: Plan;
  vehicle?: PlanVehicle;
  garage?: Garage;
}
export type AgencyAnswer =
  | { accepted: true; date: string; personId: string }
  | { accepted: false; reason: string; convenient: string };

/** สถานะที่หน่วยงานต้องตอบ: V2 (นัดเข้าอู่) · V8 (นัดรับรถ) */
export const awaitingReply = (j: VehicleJob) => j.code === "V2" || j.code === "V8";

const kindOf = (j: VehicleJob) => (j.code === "V8" ? 5 : 1);
const apptOf = (j: VehicleJob) => (kindOf(j) === 5 ? j.appt5 : j.appt1);
const WORD = {
  /* เจ้าของงาน 18 พ.ย. 2569: 2 แบบ "ตอบรับส่งมอบรถ" (ขั้น 1) / "ตอบรับรับรถ" (ขั้น 5) · คำในช่องตามขั้น 1 และ 5 ของฝั่ง กบค. (StepAppointment) */
  1: { what: "ตอบรับส่งมอบรถ", range: "ช่วงเวลาที่นำรถเข้า", day: "วันที่นำรถเข้า", dayPh: "เลือกวันที่นำรถเข้า", person: "ผู้ส่งมอบรถ", phone: "เบอร์โทรศัพท์ผู้ส่งมอบรถ" },
  5: { what: "ตอบรับรับรถ", range: "ช่วงเวลาที่นัดรับรถ", day: "วันที่ส่งมอบรถคืน", dayPh: "เลือกวันที่ส่งมอบรถคืน", person: "ผู้รับมอบรถ", phone: "เบอร์โทรศัพท์ผู้รับมอบรถ" },
} as const;

/** เมนู "ตอบรับนัดหมาย" — รายการรายคันที่รอหน่วยงานตอบรับ */
export function AgencyList({ items, units, unit, onUnit, onOpen }: { items: AgencyItem[]; units: string[]; unit: string; onUnit: (u: string) => void; onOpen: (po: string, plate: string) => void }) {
  const mine = items.filter((x) => x.vehicle?.affiliation === unit && awaitingReply(x.job));
  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader crumbs={[{ label: "ตอบรับนัดหมาย" }]} title="ตอบรับนัดหมาย" subtitle="ยานพาหนะของหน่วยงานที่ กบค. ส่งนัดหมายมา รอตอบรับหรือปฏิเสธ" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SelectField label="หน่วยงาน (ต้นแบบ: เลือกหน่วยงานที่ login)" value={unit} onChange={(e) => onUnit(e.target.value)} options={units.map((u) => ({ value: u, label: u }))} />
      </div>
      <section className="flex flex-col gap-4">
        <SectionHeader title={`รอตอบรับนัดหมาย (${mine.length})`} />
        {mine.length === 0 ? (
          <EmptyState kind="data-empty" title="ไม่มีนัดหมายที่รอตอบรับ" description="เมื่อ กบค. ส่งนัดหมายยานพาหนะของหน่วยงาน รายการจะแสดงที่นี่" />
        ) : (
          <DataTable label="รอตอบรับนัดหมาย" striped>
            <thead>
              <tr>
                <Th>ทะเบียน</Th>
                <Th>ยี่ห้อ/รุ่น · ประเภท</Th>
                <Th>ประเภท</Th>
                <Th>ช่วงวันที่เสนอ</Th>
                <Th>แผน / Purchase Order</Th>
                <Th>ส่งเมื่อ</Th>
                <Th>สถานะ</Th>
                <Th className="w-16">
                  <span className="sr-only">ตอบรับนัดหมาย</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {mine.map(({ job, po, plan, vehicle }) => {
                const a = apptOf(job);
                return (
                  <tr key={`${po.id}-${job.plate}`} className="cursor-pointer hover:bg-gray-100" onClick={() => onOpen(po.id, job.plate)}>
                    <Td className="font-semibold">{job.plate}</Td>
                    <Td>
                      <CellStack main={vehicle ? `${vehicle.make} ${vehicle.model}` : "—"} sub={vehicle?.type} />
                    </Td>
                    <Td>{WORD[kindOf(job)].what}</Td>
                    <Td>{a ? `${a.from} - ${a.to}` : "—"}</Td>
                    <Td>
                      <CellStack main={plan.id} sub={po.id} />
                    </Td>
                    <Td>{a?.sentAt ?? "—"}</Td>
                    <Td>
                      <Pill tone={JOB_STATUS[job.code].tone}>{JOB_STATUS[job.code].label}</Pill>
                    </Td>
                    <Td>
                      <Button variant="tertiary" iconOnly="keyboard_arrow_right" aria-label={`ตอบรับนัดหมาย ${job.plate}`} onClick={() => onOpen(po.id, job.plate)} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </section>
    </div>
  );
}

/** หน้ายานพาหนะรายคัน (มุมหน่วยงาน) + ตอบรับนัดหมาย */
export function AgencyReply({ item, staff, onBack, onSubmit, onNotify }: { item: AgencyItem; staff: Staff[]; onBack: () => void; onSubmit: (a: AgencyAnswer) => Promise<boolean>; onNotify: (msg: string, tone?: "success" | "error" | "info" | "warning", description?: string) => void }) {
  const { job, po, plan, vehicle, garage } = item;
  const kind = kindOf(job);
  const W = WORD[kind];
  const appt = apptOf(job);
  const from = appt ? parseThaiDate(appt.from) : null;
  const to = appt ? parseThaiDate(appt.to) : null;
  const [date, setDate] = useState("");
  /* ปุ่ม Mock (17 พ.ย. 2569): ครบ = วันแรกของช่วงที่เสนอ + ผู้นำส่ง/ผู้รับรถ · ไม่ครบ = ไม่มีวันที่ · บันทึกไม่สำเร็จ = วันนอกช่วง */
  usePrototypeFill((mode) => {
    setDateErr("");
    setDate(mode === "missing" ? "" : mode === "error" ? "01/01/2500" : appt?.from ?? "");
  }, awaitingReply(job));
  const [dateErr, setDateErr] = useState("");
  const [ask, setAsk] = useState<"" | "reject">("");
  const [reason, setReason] = useState("");
  const [convenient, setConvenient] = useState({ from: "", to: "" });
  const [busy, setBusy] = useState(false);

  function checkDate(v = date): string {
    if (!v) return `กรุณาเลือก${W.day}`;
    const d = parseThaiDate(v);
    if (!d) return "กรุณาระบุวันที่ให้ถูกต้อง (วว/ดด/ปปปป)";
    if (from && to && (d < from || d > to)) return `กรุณาเลือกวันระหว่าง ${appt?.from} - ${appt?.to}`;
    return "";
  }

  async function send(a: AgencyAnswer) {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await onSubmit(a);
      if (ok) setAsk("");
    } finally { setBusy(false); }
  }

  const awaiting = awaitingReply(job);
  const coord = staff.find((s) => s.id === appt?.coordinatorId);
  const dateField = (
    <DateField
      label={W.day}
      placeholder={W.dayPh}
      helper={appt ? `เลือกได้ 1 วัน ระหว่าง ${appt.from} - ${appt.to}` : undefined}
      min={from ?? undefined}
      max={to ?? undefined}
      value={date}
      onChange={(v) => { setDate(v); setDateErr(""); }}
      onBlur={() => date && setDateErr(checkDate())}
      error={dateErr || undefined}
    />
  );
  return (
    <>
      {!awaiting ? (
      <JobPage
        viewOnly
        plan={plan}
        po={po}
        job={job}
        vehicle={vehicle}
        garage={garage}
        staff={staff}
        crumbs={[{ label: "ตอบรับนัดหมาย", onClick: onBack }, { label: job.plate }]}
        onGoPlans={onBack}
        onGoPlan={onBack}
        onGoPO={onBack}
        onUpdate={() => undefined}
        onNotify={onNotify}
        onOpenApproval={() => undefined}
      />
      ) : (
        /* เจ้าของงาน 18 พ.ย. 2569 "หน้าใหม่ของเมนูตอบรับนัดหมายเลย" · "หน้าจะคล้ายๆ step 7 แบบไม่มี step":
           หัวหน้า + ปุ่มขวาบน · ช่องวันที่ (Date picker single) ด้านบน · 2 คอลัมน์แบบขั้น 7 (ซ้าย รายละเอียดการนัดหมาย/ข้อมูลผู้ซ่อม · ขวา การ์ดยานพาหนะ) ไม่มี Progress steps
           component: Page header + Badge outline · Date picker · Section label · Content item (กล่องเทา) · Fleet card — ตามหน้าขั้น 7 (CloseSummary) */
        <div className="flex flex-col gap-8 p-8 max-md:px-4">
          <PageHeader
            crumbs={[{ label: "ตอบรับนัดหมาย", onClick: onBack }, { label: job.plate }]}
            title={job.plate}
            subtitle={W.what}
            badge={<OutlineBadge tone={BADGE[JOB_STATUS[job.code].tone]}>{JOB_STATUS[job.code].label}</OutlineBadge>}
            actions={
            <>
              {/* ปฏิเสธ: ไม่ตรวจช่องในหน้า เปิด Modal ใส่เหตุผลเลย · ปุ่ม ghost (Tertiary danger button) ตามที่เจ้าของงานกำหนด 16 พ.ย. 2569 */}
              <Button variant="tertiaryDanger" size="lg" disabled={busy} onClick={() => { setReason(""); setConvenient({ from: "", to: "" }); setAsk("reject"); }}>
                ปฏิเสธนัดหมาย
              </Button>
              {/* เจ้าของงาน 16 พ.ย. 2569: ตรวจวันที่แล้วส่งตอบรับทันที ไม่มี modal ยืนยัน */}
              <Button
                size="lg"
                loading={busy}
                onClick={() => {
                  const e = checkDate();
                  setDateErr(e);
                  if (!e) void send({ accepted: true, date, personId: "" });
                }}
              >
                ยืนยันนัดหมาย
              </Button>
            </>
            }
          />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-8">
              {/* เจ้าของงาน 18 พ.ย. 2569: ช่องวันที่อยู่คอลัมน์ซ้าย */}
              {dateField}
              {/* ตามภาพเจ้าของงาน 18 พ.ย. 2569: "ข้อมูลการนัดหมาย" 3 คอลัมน์ (ช่วงวัน · ผู้ประสานงาน · เบอร์ / อู่ · เบอร์อู่ · ที่อยู่) + "รายละเอียดงาน Overhaul" 2 คอลัมน์ (ไม่เอา "ขั้นตอน") */}
              <section className="flex flex-col gap-4">
                <SectionLabel title="ข้อมูลการนัดหมาย" />
                <Box cols={3} items={[[W.range, appt ? `${appt.from} - ${appt.to}` : ""], [W.person, coord?.name], [W.phone, coord?.phone], ["ศูนย์บริการ/อู่", garage?.name], ["เบอร์โทร ศูนย์บริการ/อู่", garage?.phone], ["ที่อยู่", garage?.address]]} />
              </section>
              <section className="flex flex-col gap-4">
                <SectionLabel title="รายละเอียดงาน Overhaul" />
                <Box cols={2} items={[["หมายเลขแผน", plan.id], ["ชื่อแผน", plan.name], ["หมายเลข Purchase Order", po.id]]} />
              </section>
            </div>
            <div className="flex min-w-0 flex-col gap-8">
              <section className="flex flex-col gap-4">
                <SectionLabel title="ยานพาหนะ" />
                <VehicleCard plate={job.plate} vehicle={vehicle} lastMileage={job.intake?.mileageKm} />
              </section>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={ask === "reject"}
        title="ปฏิเสธนัดหมาย"
        description="แจ้งเหตุผลและช่วงวันที่สะดวกให้ กบค. นัดหมายใหม่"
        confirmLabel="ปฏิเสธนัดหมาย"
        confirmVariant="danger"
        confirmLoading={busy}
        onClose={() => setAsk("")}
        onConfirm={() => send({ accepted: false, reason: reason.trim(), convenient: convenient.from ? `${convenient.from} - ${convenient.to || convenient.from}` : "" })}
      >
        <div className="flex flex-col gap-4">
          <TextArea label="เหตุผลที่ปฏิเสธ" optional placeholder="ระบุเหตุผล" value={reason} onChange={(e) => setReason(e.target.value)} />
          <DateRangeField label="ช่วงวันที่สะดวก" optional min={new Date()} from={convenient.from} to={convenient.to} onChange={(f, t) => setConvenient({ from: f, to: t })} />
        </div>
      </Modal>
    </>
  );
}
