"use client";
/** หน้าเซ็นลงนามการรับมอบรถ (ขั้น 2) — เจ้าของงาน 17 พ.ย. 2569: บันทึกขั้น 2 แล้วส่งแจ้งเตือนให้ผู้ส่งมอบรถ/ผู้รับมอบรถ "เซ็นรับทราบจากอีกหน้า"
 *  → ปุ่มเดียว "เซ็นลงนาม" (ไม่มีปฏิเสธ) · เซ็นแล้วขั้น 2 แสดง "เซ็นลงนามแล้ว" ใต้ชื่อ
 *  เดิม FigJam Section 12 (refinement 12 พ.ย. 2569):
 *  "เข้ามาด้วยวิธีกด Noti เห็นหัวข้อการอนุมัติว่าคือเรื่องอะไร ของรถคันไหน กดเข้าไปดูรายละเอียด ให้ CF ด้วยปุ่มยืนยันอนุมัติ/ปฏิเสธ
 *   หลังจาก action เสร็จ จะแสดงว่าอนุมัติแล้ว/ปฏิเสธแล้ว" · จอฝั่งผู้ยืนยัน "**รอ UI" → ต้นแบบประกอบจากของกลางไปก่อน (D-I2)
 *  component: Page header + Badge outline · Content item row · Table (ดูอย่างเดียว) · File upload Gallery (ดูอย่างเดียว) · Alert ·
 *    อนุมัติทันที (กติกา submit 17 พ.ย. 2569) · Modal Form + Text area (เหตุผลที่ปฏิเสธ) · Secondary danger / Primary button lg */
import { useState } from "react";
import { EmptyState } from "@ui/EmptyState";
import { OutlineBadge, Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { PageHeader, SectionHeader } from "@ui/PageHeader";
import { DataTable, Td, Th } from "@ui/Table";
import type { Garage, Intake, Staff } from "../po/types";
import type { PlanVehicle } from "../vehicle/types";
import { PhotoUploader } from "../shared/PhotoUploader";
import { Row } from "./StepAppointment";

export function IntakeApproval({
  plate, poId, vehicle, garage, intake, me, staff, onSign, onBackToJob,
}: {
  plate: string;
  poId: string;
  vehicle?: PlanVehicle;
  garage?: Garage;
  intake?: Intake;
  me?: Staff;
  staff: Staff[];
  onSign: () => Promise<boolean>;
  /** ต้นแบบ: กลับไปหน้างานรายคันของ กบค. */
  onBackToJob: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const mine = intake?.approvals.find((a) => a.staffId === me?.id);
  const other = intake?.approvals.find((a) => a.staffId !== me?.id);
  const name = (id?: string) => staff.find((s) => s.id === id)?.name ?? "—";

  async function sign() {
    if (busy) return;
    setBusy(true);
    await onSign();
    setBusy(false);
  }

  const pending = mine?.sentAt && !mine.result;
  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={[{ label: "เซ็นลงนามการรับมอบรถ" }, { label: plate }]}
        title={`เซ็นลงนามการรับมอบรถ ${plate}`}
        subtitle={`ตรวจรับยานพาหนะเข้า Overhaul ตาม ${poId} · ผู้ลงนาม ${me?.name ?? "—"}`}
        badge={
          mine?.result === "approved" ? <Pill tone="success">เซ็นลงนามแล้ว</Pill> : pending ? undefined : <OutlineBadge tone="disabled">ไม่มีคำขอ</OutlineBadge>
        }
      />
      {!intake || !mine ? (
        <EmptyState kind="data-empty" title="ไม่พบคำขอเซ็นลงนาม" description="คำขอนี้ถูกยกเลิกหรือส่งใหม่แล้ว ดูคำขอล่าสุดจากแจ้งเตือน" />
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <SectionHeader title="ข้อมูลการรับรถเข้าอู่" />
            <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
              <Row items={[["ทะเบียน", plate], ["ยี่ห้อ/รุ่น", vehicle ? `${vehicle.make} ${vehicle.model}` : ""], ["สังกัด", vehicle?.affiliation], ["อู่", garage?.name]]} />
              <Row items={[["วันที่รับรถเข้าอู่", intake.date], ["เลขไมล์ ณ วันรับรถ (กม.)", intake.mileageKm?.toLocaleString()], ["ชั่วโมงการทำงาน (ชม.)", intake.engineHours != null ? intake.engineHours.toLocaleString() : "—"], ["ผู้ลงนามอีกฝ่าย", `${name(other?.staffId)} (${other?.side ?? "—"})`], ["ส่งคำขอเมื่อ", mine.sentAt], ["เซ็นลงนามเมื่อ", mine.at ?? "—"]]} />
            </dl>
          </section>
          <section className="flex flex-col gap-4">
            <SectionHeader title="รูปสภาพยานพาหนะก่อน Overhaul" />
            <PhotoUploader label="รูปสภาพยานพาหนะ" photos={intake.photos} readOnly />
          </section>
          <section className="flex flex-col gap-4">
            <SectionHeader title="รายการตรวจสอบก่อนซ่อม" />
            <DataTable label="รายการตรวจสอบก่อนซ่อม" striped>
              <thead>
                <tr>
                  <Th>รายการตรวจสอบ</Th>
                  <Th className="w-36">ผลตรวจ</Th>
                  <Th>หมายเหตุ</Th>
                </tr>
              </thead>
              <tbody>
                {intake.checks.map((c) => (
                  <tr key={c.item}>
                    <Td>{c.item}</Td>
                    <Td>{c.has ? <Pill tone="success">มี</Pill> : c.has === false ? "ไม่มี" : "—"}</Td>
                    <Td>{c.note || "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </section>
        </>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-6">
        <Button variant="tertiary" iconLeft="arrow_back" onClick={onBackToJob}>
          ต้นแบบ: กลับหน้างานรายคัน (กบค.)
        </Button>
        {pending && (
          <Button size="lg" loading={busy} onClick={() => void sign()}>
            เซ็นลงนาม
          </Button>
        )}
      </div>
    </div>
  );
}
