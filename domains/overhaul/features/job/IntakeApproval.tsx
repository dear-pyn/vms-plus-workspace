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
import type { Garage, Intake, Staff } from "../po/types";
import type { PlanVehicle } from "../vehicle/types";
import { StepIntake } from "./StepIntake";
import { Row } from "./StepAppointment";

export function IntakeApproval({
  plate, poId, vehicle, intake, me, staff, onSign, onBackToJob,
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

  async function sign() {
    if (busy) return;
    setBusy(true);
    await onSign();
    setBusy(false);
  }

  const pending = mine?.sentAt && !mine.result;
  /* เจ้าของงาน 18 พ.ย. 2569 "หน้าเซ็นลงนามมอบรถ ให้เหมือนรายคันเลยแต่เป็นแบบ view only":
     หัวหน้า + ปุ่ม "เซ็นลงนาม" ขวาบน (แบบหน้าตอบรับนัดหมาย/อนุมัติปิดงาน) · ข้อมูลยานพาหนะ (แบบหน้ารายคัน) · ขั้น 2 ตรวจรับรถ (StepIntake readOnly) */
  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={[{ label: "เซ็นลงนามการรับมอบรถ" }, { label: plate }]}
        title={plate}
        subtitle={`เซ็นลงนามการรับมอบรถ ตาม ${poId} · ผู้ลงนาม ${me?.name ?? "—"}`}
        badge={
          mine?.result === "approved" ? <Pill tone="success">เซ็นลงนามแล้ว</Pill> : pending ? undefined : <OutlineBadge tone="disabled">ไม่มีคำขอ</OutlineBadge>
        }
        actions={
          pending && (
            <Button size="lg" loading={busy} onClick={() => void sign()}>
              เซ็นลงนาม
            </Button>
          )
        }
      />
      {!intake || !mine ? (
        <>
          <EmptyState kind="data-empty" title="ไม่พบคำขอเซ็นลงนาม" description="คำขอนี้ถูกยกเลิกหรือส่งใหม่แล้ว ดูคำขอล่าสุดจากแจ้งเตือน" />
          <div>
            <Button variant="tertiary" iconLeft="arrow_back" onClick={onBackToJob}>
              ต้นแบบ: กลับหน้างานรายคัน (กบค.)
            </Button>
          </div>
        </>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <SectionHeader title="ข้อมูลยานพาหนะ" />
            <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
              <Row cols={3} items={[["ทะเบียน", plate], ["ยี่ห้อ/รุ่น", vehicle ? `${vehicle.make} ${vehicle.model}` : ""], ["ประเภท", vehicle?.type]]} />
              <Row cols={3} items={[["อายุการใช้งาน", vehicle ? `${vehicle.ageYears} ปี` : ""], ["เลขไมล์สะสม", vehicle?.mileageKm !== undefined ? `${vehicle.mileageKm.toLocaleString()} กม.` : ""], ["ชั่วโมงสะสม", vehicle?.engineHours !== undefined ? `${vehicle.engineHours.toLocaleString()} ชม.` : ""]]} />
            </dl>
          </section>
          {/* ขั้น 2 แบบดูอย่างเดียว · ปุ่ม "ย้อนกลับ" ท้ายฟอร์ม = ต้นแบบ: กลับหน้างานรายคัน (กบค.) */}
          <StepIntake intake={intake} staff={staff} readOnly onBack={onBackToJob} onSave={async () => false} onSendSign={async () => false} />
        </>
      )}
    </div>
  );
}
