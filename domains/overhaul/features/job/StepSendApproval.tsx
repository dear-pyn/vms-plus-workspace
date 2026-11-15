"use client";
/** ขั้น 7 ยืนยันการส่งอนุมัติ (S15 · จอ OH2 / P.1–P.2)
 *  มติ Refinement 9/11/2026: ตัดผู้อนุมัติ — กด "ส่งอนุมัติ" แล้วปิดงานทันที + แจ้งเตือนปิดงาน (ไม่มีขั้นรอ ผบช. · ไม่มีหน้าผู้บังคับบัญชา Scene U)
 *  component (P.1): สรุปงานรายคัน 2 คอลัมน์ (CloseSummary) · Secondary lg ย้อนกลับ · Primary lg ส่งอนุมัติ (จอไม่มี modal ยืนยัน) ·
 *    P.2 ปิดงานแล้ว: เหลือปุ่มย้อนกลับ + Secondary "ดูสรุปรายคัน" (T.1) */
import { useState } from "react";
import { Button } from "@ui/Button";
import type { Garage, PurchaseOrder, VehicleJob } from "../po/types";
import type { PlanVehicle } from "../vehicle/types";
import { CloseSummary } from "./CloseSummary";

export function StepSendApproval({
  job, po, garage, vehicle, onBack, onSend, onOpenSummary, viewOnly,
}: {
  job: VehicleJob;
  po: PurchaseOrder;
  garage?: Garage;
  vehicle?: PlanVehicle;
  onBack: () => void;
  onSend: () => Promise<boolean>;
  onOpenSummary: () => void;
  viewOnly?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <>
      <CloseSummary job={job} po={po} garage={garage} vehicle={vehicle} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" size="lg" onClick={onBack}>
          ย้อนกลับ
        </Button>
        {job.code === "V10.2" && !viewOnly && (
          <Button
            size="lg"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await onSend();
              setBusy(false);
            }}
          >
            ส่งอนุมัติ
          </Button>
        )}
        {job.code === "V11" && (
          <Button variant="secondary" size="lg" iconLeft="summarize" onClick={onOpenSummary}>
            ดูสรุปรายคัน
          </Button>
        )}
      </div>
    </>
  );
}
