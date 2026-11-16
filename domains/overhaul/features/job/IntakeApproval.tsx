"use client";
/** หน้าผู้ยืนยันการรับมอบยานพาหนะ (ขั้น 2) — FigJam Section 12 (refinement 12 พ.ย. 2569):
 *  "เข้ามาด้วยวิธีกด Noti เห็นหัวข้อการอนุมัติว่าคือเรื่องอะไร ของรถคันไหน กดเข้าไปดูรายละเอียด ให้ CF ด้วยปุ่มยืนยันอนุมัติ/ปฏิเสธ
 *   หลังจาก action เสร็จ จะแสดงว่าอนุมัติแล้ว/ปฏิเสธแล้ว" · จอฝั่งผู้ยืนยัน "**รอ UI" → ต้นแบบประกอบจากของกลางไปก่อน (D-I2)
 *  component: Page header + Badge outline · Content item row · Table (ดูอย่างเดียว) · File upload Gallery (ดูอย่างเดียว) · Alert ·
 *    Modal Centered (ยืนยันอนุมัติ) · Modal Form + Text area (เหตุผลที่ปฏิเสธ) · Secondary danger / Primary button lg */
import { useState } from "react";
import { Alert } from "@ui/Alert";
import { OutlineBadge, Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { ConfirmDialog, Modal } from "@ui/Modal";
import { PageHeader, SectionHeader } from "@ui/PageHeader";
import { DataTable, Td, Th } from "@ui/Table";
import { TextArea } from "@ui/TextArea";
import type { Garage, Intake, Staff } from "../po/types";
import type { PlanVehicle } from "../vehicle/types";
import { PhotoUploader } from "../shared/PhotoUploader";
import { Row } from "./StepAppointment";

export function IntakeApproval({
  plate, poId, vehicle, garage, intake, me, staff, onDecide, onBackToJob,
}: {
  plate: string;
  poId: string;
  vehicle?: PlanVehicle;
  garage?: Garage;
  intake?: Intake;
  me?: Staff;
  staff: Staff[];
  onDecide: (approved: boolean, reason?: string) => Promise<boolean>;
  /** ต้นแบบ: กลับไปหน้างานรายคันของ กบค. */
  onBackToJob: () => void;
}) {
  const [ask, setAsk] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const mine = intake?.approvals.find((a) => a.staffId === me?.id);
  const other = intake?.approvals.find((a) => a.staffId !== me?.id);
  const name = (id?: string) => staff.find((s) => s.id === id)?.name ?? "—";

  async function decide(ok: boolean) {
    if (!ok && !reason.trim()) {
      setErr("กรุณาระบุเหตุผลที่ปฏิเสธ");
      return;
    }
    setBusy(true);
    const done = await onDecide(ok, reason.trim());
    setBusy(false);
    if (done) {
      setAsk(null);
      setReason("");
    }
  }

  const pending = mine?.sentAt && !mine.result;
  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={[{ label: "รายการอนุมัติ" }, { label: plate }]}
        title={`ยืนยันการรับมอบยานพาหนะ ${plate}`}
        subtitle={`ตรวจรับยานพาหนะเข้า Overhaul ตาม ${poId} · ผู้ยืนยัน ${me?.name ?? "—"}`}
        badge={
          mine?.result === "approved" ? <OutlineBadge tone="success">อนุมัติแล้ว</OutlineBadge> : mine?.result === "rejected" ? <OutlineBadge tone="error">ปฏิเสธแล้ว</OutlineBadge> : pending ? <OutlineBadge tone="brand">รอยืนยัน</OutlineBadge> : <OutlineBadge tone="disabled">ไม่มีคำขอ</OutlineBadge>
        }
      />
      {!intake || !mine ? (
        <Alert tone="info" title="ไม่พบคำขอยืนยัน">คำขอนี้ถูกยกเลิกหรือส่งใหม่แล้ว ดูคำขอล่าสุดจากแจ้งเตือน</Alert>
      ) : (
        <>
          {mine.result === "approved" && <Alert tone="success" title={`คุณอนุมัติการรับมอบแล้ว ${mine.at}`} />}
          {mine.result === "rejected" && <Alert tone="error" title={`คุณปฏิเสธการรับมอบแล้ว ${mine.at}`}>เหตุผล: {mine.reason}</Alert>}
          {!mine.sentAt && <Alert tone="info" title="คำขอนี้ถูกส่งกลับไปแก้ไขแล้ว">รอ กบค. ส่งคำขอยืนยันใหม่</Alert>}
          <section className="flex flex-col gap-4">
            <SectionHeader title="ข้อมูลการรับรถเข้าอู่" />
            <dl className="flex flex-col gap-5 rounded-lg bg-gray-50 p-6">
              <Row items={[["ทะเบียน", plate], ["ยี่ห้อ/รุ่น", vehicle ? `${vehicle.make} ${vehicle.model}` : ""], ["สังกัด", vehicle?.affiliation], ["อู่", garage?.name]]} />
              <Row items={[["วันที่รับรถเข้าอู่", intake.date], ["เลขไมล์ ณ วันรับรถ (กม.)", intake.mileageKm?.toLocaleString()], ["ผู้ยืนยันอีกฝ่าย", `${name(other?.staffId)} (${other?.side ?? "—"})`], ["ส่งคำขอเมื่อ", mine.sentAt]]} />
            </dl>
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
          <section className="flex flex-col gap-4">
            <SectionHeader title="รูปสภาพยานพาหนะ (ก่อน Overhaul)" />
            <PhotoUploader label="รูปสภาพยานพาหนะ" photos={intake.photos} readOnly />
          </section>
        </>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-6">
        <Button variant="tertiary" iconLeft="arrow_back" onClick={onBackToJob}>
          ต้นแบบ: กลับหน้างานรายคัน (กบค.)
        </Button>
        {pending && (
          <div className="flex items-center gap-3">
            <Button variant="secondaryDanger" size="lg" onClick={() => setAsk("reject")}>
              ปฏิเสธ
            </Button>
            <Button size="lg" onClick={() => setAsk("approve")}>
              อนุมัติ
            </Button>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={ask === "approve"}
        icon="check_circle"
        title="ยืนยันการอนุมัติ"
        description={`อนุมัติการรับมอบยานพาหนะ ${plate} เข้า Overhaul`}
        loading={busy}
        onClose={() => setAsk(null)}
        onConfirm={() => decide(true)}
      />
      <Modal
        open={ask === "reject"}
        title="ปฏิเสธการรับมอบ"
        description="กบค. จะเห็นเหตุผลนี้และแก้ไขข้อมูลก่อนส่งขอยืนยันใหม่"
        onClose={() => {
          setAsk(null);
          setErr("");
        }}
        confirmLabel="ปฏิเสธ"
        confirmVariant="danger"
        confirmLoading={busy}
        onConfirm={() => decide(false)}
      >
        <TextArea
          label="เหตุผลที่ปฏิเสธ"
          placeholder="ระบุเหตุผล"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setErr("");
          }}
          error={err || undefined}
        />
      </Modal>
    </div>
  );
}
