"use client";
/** ฝั่งหน่วยงานเจ้าของยานพาหนะ (S16 ตอบกลับนัดหมาย · S17 ดูอย่างเดียว · จอ OH2 / R.1–R.4.2 · S.1–S.8)
 *  R: Page header + Badge outline Brand + Primary md "ยืนยันตอบกลับ" (ปิดจนเลือก) · Radio text card ตอบรับ/ปฏิเสธ · Text input วันนำรถเข้า/วันรับรถ ·
 *     Input dropdown ผู้นำส่งรถ/ผู้รับรถ (ถ้ามี) · Text input Readonly เบอร์โทร · Text input ช่วงวันที่สะดวก (ถ้ามี) · Text area เหตุผลที่ปฏิเสธ ·
 *     Content item row (ข้อมูลการนัดหมาย · รายละเอียดงาน Overhaul · ยานพาหนะ) · Modal Centered "ยืนยันการตอบกลับ" (ไม่ใช่ตอนนี้ / ยืนยัน)
 *  S (ย่อ): รายการงานของหน่วยงาน (Table + Pill สถานะในตาราง) → หน้างานรายคันแบบดูอย่างเดียว (JobPage viewOnly) */
import { useState } from "react";
import { OutlineBadge, Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { Combobox } from "@ui/Combobox";
import { DateField, parseThaiDate } from "@ui/DateField";
import { EmptyState } from "@ui/EmptyState";
import { Modal } from "@ui/Modal";
import { PageHeader, SectionHeader, SectionLabel } from "@ui/PageHeader";
import { RadioCard } from "@ui/RadioCard";
import { SelectField } from "@ui/SelectField";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { TextArea } from "@ui/TextArea";
import { TextField } from "@ui/TextField";
import {
  JOB_STATUS,
  type Garage,
  type PurchaseOrder,
  type Staff,
  type VehicleJob,
} from "../po/types";
import type { Plan } from "../plan/types";
import type { PlanVehicle } from "../vehicle/types";
import { useLeaveGuard } from "../shared/useLeaveGuard";
import { Row } from "./StepAppointment";

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
export const awaitingReply = (j: VehicleJob) =>
  j.code === "V2" || j.code === "V8";

export function AgencyList({
  items,
  units,
  unit,
  onUnit,
  onOpen,
}: {
  items: AgencyItem[];
  units: string[];
  unit: string;
  onUnit: (u: string) => void;
  onOpen: (po: string, plate: string) => void;
}) {
  const mine = items
    .filter((x) => x.vehicle?.affiliation === unit)
    .sort(
      (a, b) => Number(awaitingReply(b.job)) - Number(awaitingReply(a.job)),
    );
  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={[{ label: "จัดการงาน Overhaul" }]}
        title="งาน Overhaul ของหน่วยงาน"
        subtitle="ดูความคืบหน้ายานพาหนะของหน่วยงาน และตอบกลับนัดหมายจาก กบค."
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SelectField
          label="หน่วยงาน (ต้นแบบ: เลือกหน่วยงานที่ login)"
          value={unit}
          onChange={(e) => onUnit(e.target.value)}
          options={units.map((u) => ({ value: u, label: u }))}
        />
      </div>
      <section className="flex flex-col gap-4">
        <SectionHeader title={`ยานพาหนะของหน่วยงาน (${mine.length})`} />
        {mine.length === 0 ? (
          <EmptyState
            kind="data-empty"
            title="ยังไม่มียานพาหนะในงาน Overhaul"
            description="เมื่อ กบค. จัดยานพาหนะของหน่วยงานเข้า Purchase Order รายการจะแสดงที่นี่"
          />
        ) : (
          <DataTable label="ยานพาหนะของหน่วยงาน" striped>
            <thead>
              <tr>
                <Th>ทะเบียน</Th>
                <Th>ยี่ห้อ/รุ่น · ประเภท</Th>
                <Th>แผน</Th>
                <Th>Purchase Order</Th>
                <Th>สถานะงาน</Th>
                <Th>รายละเอียดตามสถานะ</Th>
                <Th className="w-16">
                  <span className="sr-only">ดูรายละเอียด</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {mine.map(({ job, po, plan, vehicle }) => (
                <tr
                  key={`${po.id}-${job.plate}`}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => onOpen(po.id, job.plate)}
                >
                  <Td>{job.plate}</Td>
                  <Td>
                    <CellStack
                      main={vehicle ? `${vehicle.make} ${vehicle.model}` : "—"}
                      sub={vehicle?.type}
                    />
                  </Td>
                  <Td>
                    <CellStack main={plan.id} sub={plan.name} />
                  </Td>
                  <Td>
                    <CellStack main={po.id} sub={po.name} />
                  </Td>
                  <Td>
                    <Pill tone={JOB_STATUS[job.code].tone}>
                      {JOB_STATUS[job.code].label}
                    </Pill>
                  </Td>
                  <Td>
                    <CellStack main={job.detail[0]} sub={job.detail[1]} />
                  </Td>
                  <Td>
                    <Button
                      variant="tertiary"
                      iconOnly="keyboard_arrow_right"
                      aria-label={`ดู ${job.plate}`}
                      onClick={() => onOpen(po.id, job.plate)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>
    </div>
  );
}

export function AgencyReply({
  item,
  staff,
  onBack,
  onSubmit,
}: {
  item: AgencyItem;
  staff: Staff[];
  onBack: () => void;
  onSubmit: (a: AgencyAnswer) => Promise<boolean>;
}) {
  const { job, po, plan, vehicle, garage } = item;
  const kind = job.code === "V8" ? 5 : 1;
  const appt = kind === 1 ? job.appt1 : job.appt5;
  const W =
    kind === 1
      ? {
          day: "วันนำรถเข้า",
          person: "ผู้นำส่งรถ",
          hint: "เลือกวันนำรถเข้าอู่จากช่วงวันที่ กบค. เสนอ",
          range: "ช่วงวันนำรถเข้า",
          step: "นัดเอารถเข้าอู่", // R.1 ตรงจอ
        }
      : {
          day: "วันรับรถ",
          person: "ผู้รับรถ",
          hint: "เลือกวันไปรับรถที่อู่จากช่วงวันที่ กบค. เสนอ",
          range: "ช่วงวันนัดรับรถ",
          step: "นัดรับรถ",
        };
  const coord = staff.find((s) => s.id === appt?.coordinatorId);
  const [pick, setPick] = useState<"accept" | "reject" | "">("");
  const [f, setF] = useState({
    date: "",
    personId: "",
    reason: "",
    convenient: "",
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const person = staff.find((s) => s.id === f.personId);
  const dirty = !!pick && Object.values(f).some(Boolean);
  const { requestLeave, runSave, dialog } = useLeaveGuard(dirty, onBack);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (pick === "accept") {
      const d = parseThaiDate(f.date);
      const a = appt ? parseThaiDate(appt.from) : null;
      const b = appt ? parseThaiDate(appt.to) : null;
      if (!f.date) e.date = `กรุณาเลือก${W.day}`;
      else if (!d) e.date = "กรุณาระบุวันที่ให้ถูกต้อง (วว/ดด/ปปปป)";
      else if (a && b && (d < a || d > b))
        e.date = `กรุณาเลือกวันระหว่าง ${appt?.from} - ${appt?.to}`;
    } else if (!f.reason.trim()) e.reason = "กรุณาระบุเหตุผลที่ปฏิเสธ";
    setErr(e);
    return !Object.keys(e).length;
  }

  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={[
          { label: "จัดการงาน Overhaul", onClick: () => requestLeave() },
          { label: `แผน ${plan.id}` },
          { label: po.id },
          { label: job.plate },
        ]}
        title={job.plate}
        badge={
          <OutlineBadge tone="brand">{JOB_STATUS[job.code].label}</OutlineBadge>
        }
        actions={
          <Button disabled={!pick} onClick={() => validate() && setAsk(true)}>
            ยืนยันตอบกลับ
          </Button>
        }
      />
      {/* R.1: 2 คอลัมน์ (ซ้าย 746 ตอบกลับ/นัดหมาย/งาน · ขวา 526 ยานพาหนะ · gap 24) · หัวข้อเป็น Section label */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,746fr)_minmax(0,526fr)]">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="flex flex-col gap-4">
            <SectionLabel title="ตอบกลับนัดหมาย" />
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2" /* R.1.4: การ์ดสูงตามเนื้อหา ไม่ยืดเท่ากัน */>
              <RadioCard
                name="reply"
                checked={pick === "accept"}
                onChange={() => setPick("accept")}
                title="ตอบรับนัดหมาย"
                description={W.hint}
              />
              <RadioCard
                name="reply"
                checked={pick === "reject"}
                onChange={() => setPick("reject")}
                title="ปฏิเสธนัดหมาย"
                description="แจ้งเหตุผลและช่วงวันที่สะดวกให้ กบค. นัดหมายใหม่"
              />
            </div>
            {pick === "accept" && (
              /* R.1.4: วันนำรถเข้าเต็มแถว · แถวถัดไป ผู้นำส่งรถ + เบอร์โทร 2 คอลัมน์ gap 24 */
              <div className="flex flex-col gap-4">
                <DateField
                  label={W.day}
                  helper={`เลือกได้ 1 วัน ระหว่าง ${appt?.from} - ${appt?.to}`}
                  value={f.date}
                  onChange={(v) => {
                    setF({ ...f, date: v });
                    setErr({});
                  }}
                  error={err.date || undefined}
                />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Combobox
                  label={W.person}
                  optional
                  placeholder="ค้นหาชื่อ-นามสกุล, รหัสพนักงาน"
                  emptyText="ไม่พบรายชื่อ"
                  value={f.personId}
                  onChange={(v) => setF({ ...f, personId: v })}
                  options={staff
                    .filter((s) => s.unit === "หน่วยงาน")
                    .map((s) => ({
                      value: s.id,
                      label: s.name,
                      sub: s.role,
                      keywords: s.id,
                    }))}
                />
                <TextField
                  label={`เบอร์โทรศัพท์${W.person}`}
                  optional
                  readOnly
                  placeholder={`แสดงเมื่อเลือก${W.person}`}
                  value={person?.phone ?? ""}
                />
                </div>
              </div>
            )}
            {pick === "reject" && (
              <div className="flex flex-col gap-4" /* R.2.3: gap 16 ตาม Section */>
                {/* R.2.3: ช่วงวันที่สะดวกเต็มแถว */}
                  <TextField
                    label="ช่วงวันที่สะดวก"
                    optional
                    placeholder="เช่น 01/12/2569 - 05/12/2569"
                    value={f.convenient}
                    onChange={(e) => setF({ ...f, convenient: e.target.value })}
                  />
                <TextArea
                  label="เหตุผลที่ปฏิเสธ"
                  placeholder="ระบุเหตุผล"
                  value={f.reason}
                  onChange={(e) => {
                    setF({ ...f, reason: e.target.value });
                    setErr({});
                  }}
                  error={err.reason || undefined}
                />
              </div>
            )}
          </section>
          <section className="flex flex-col gap-4">
            <SectionLabel title="ข้อมูลการนัดหมาย" />
            <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
              <Row cols={3}
                items={[
                  [W.range, appt ? `${appt.from} - ${appt.to}` : ""],
                  ["ผู้ประสานงาน (กบค.)", coord?.name],
                  ["เบอร์โทรผู้ประสานงาน (กบค.)", coord?.phone],
                ]}
              />
              <Row cols={3}
                items={[
                  ["ศูนย์บริการ/อู่", garage?.name],
                  ["เบอร์โทร ศูนย์บริการ/อู่", garage?.phone],
                  ["ที่อยู่", garage?.address],
                ]}
              />
              <Row cols={3} items={[["หมายเหตุจาก กบค.", appt?.note]]} />
            </dl>
          </section>
          <section className="flex flex-col gap-4">
            <SectionLabel title="รายละเอียดงาน Overhaul" />
            <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
              <Row
                cols={2}
                items={[
                  ["หมายเลขแผน", plan.id],
                  ["ชื่อแผน", plan.name],
                  ["หมายเลข Purchase Order", po.id],
                  ["ขั้นตอน", W.step],
                ]}
              />
            </dl>
          </section>
        </div>
        <div className="flex min-w-0 flex-col gap-8">
          <section className="flex flex-col gap-4">
            <SectionLabel title="ยานพาหนะ" />
            <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
              <Row
                cols={2}
                items={[
                  ["ทะเบียน", job.plate],
                  ["ยี่ห้อ/รุ่น", vehicle ? `${vehicle.make} ${vehicle.model}` : ""],
                  ["ประเภท", vehicle?.type],
                  ["อายุการใช้งาน", vehicle ? `${vehicle.ageYears} ปี` : ""],
                ]}
              />
              <Row
                cols={2}
                items={[
                  [
                    "เลขไมล์สะสม",
                    vehicle?.mileageKm != null
                      ? `${vehicle.mileageKm.toLocaleString()} กม.`
                      : "",
                  ],
                  [
                    "ชั่วโมงสะสม",
                    vehicle?.engineHours != null
                      ? `${vehicle.engineHours.toLocaleString()} ชม.`
                      : "",
                  ],
                ]}
              />
            </dl>
          </section>
        </div>
      </div>
      <Modal
        open={ask}
        variant="centered"
        icon="reply"
        title="ยืนยันการตอบกลับ"
        description="คุณต้องการยืนยันการตอบกลับหรือไม่ ?"
        cancelLabel="ไม่ใช่ตอนนี้"
        confirmLoading={busy}
        onClose={() => setAsk(false)}
        onConfirm={async () => {
          setBusy(true);
          const ok = await runSave(() =>
            onSubmit(
              pick === "accept"
                ? { accepted: true, date: f.date, personId: f.personId }
                : {
                    accepted: false,
                    reason: f.reason.trim(),
                    convenient: f.convenient.trim(),
                  },
            ),
          );
          setBusy(false);
          if (ok) setAsk(false);
        }}
      />
      {dialog}
    </div>
  );
}
