"use client";
/** ขั้น 7 ยืนยันการส่งอนุมัติ (S15 · จอ OH2 / P.1–P.2)
 *  เจ้าของงาน 17 พ.ย. 2569 (แทนมติ Refinement 9/11/2026 ที่ตัดผู้อนุมัติ): ส่งอนุมัติต้องเลือกผู้อนุมัติ · แก้ไขได้ถ้ายังไม่อนุมัติ
 *  - V10.2 รอส่งอนุมัติ: ปุ่ม "ส่งอนุมัติ" → Modal "ส่งอนุมัติเพื่อปิดงาน Overhaul" + ช่อง "ผู้อนุมัติ" (ตามจอ UAT ที่เจ้าของงานส่ง 17 พ.ย. 2569)
 *    ถ้าเคยถูกส่งกลับแก้ไข แสดง Alert เหตุผลบนสุด
 *  - V10.3 รออนุมัติ: ปุ่ม "แก้ไขผู้อนุมัติ" เปิด Modal เดิม (ค่าเดิม) · ไม่มี Alert info (17 พ.ย. 2569)
 *  component: สรุปงานรายคัน (CloseSummary) · Alert · Secondary/Primary button lg · Modal Form (ปุ่ม ปิด / ส่งอนุมัติ ตามจอ UAT) ·
 *    Input dropdown แบบค้นหา (Combobox ไอคอน person · พิมพ์ 3 ตัวก่อนค้นรายชื่อ ตามกติกา 16 พ.ย. 2569) */
import { useState } from "react";
import { Alert } from "@ui/Alert";
import { Button } from "@ui/Button";
import { Combobox } from "@ui/Combobox";
import { Modal } from "@ui/Modal";
import type { Garage, PurchaseOrder, Staff, VehicleJob } from "../po/types";
import type { PlanVehicle } from "../vehicle/types";
import { CloseSummary } from "./CloseSummary";
import { usePrototypeFill } from "../../prototype/MockTools";

/** ผู้อนุมัติปิดงาน — ต้นแบบ: พนักงาน กบค. ทุกคน (รอยืนยันว่าเป็นตำแหน่งใด) */
export const approversOf = (staff: Staff[]) => staff.filter((s) => s.unit === "กบค.");

export function StepSendApproval({
  job, po, garage, vehicle, staff, onBack, onSend, viewOnly,
}: {
  job: VehicleJob;
  po: PurchaseOrder;
  garage?: Garage;
  vehicle?: PlanVehicle;
  staff: Staff[];
  onBack: () => void;
  onSend: (approverId: string) => Promise<boolean>;
  viewOnly?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [approverId, setApproverId] = useState("");
  const [err, setErr] = useState("");
  const approval = job.close?.approval;
  const approver = staff.find((s) => s.id === approval?.approverId);
  const returned = job.close?.returned;
  const waiting = job.code === "V10.3";
  const canAct = !viewOnly && (job.code === "V10.2" || waiting);
  const options = approversOf(staff).map((s) => ({ value: s.id, label: s.name, sub: `${s.id} · ${s.role}`, keywords: s.id }));

  usePrototypeFill((mode) => {
    setErr("");
    setApproverId(mode === "missing" ? "" : approversOf(staff)[2]?.id ?? approversOf(staff)[0]?.id ?? "");
  }, open && !busy);

  const ask = () => {
    setApproverId(waiting ? approval?.approverId ?? "" : "");
    setErr("");
    setOpen(true);
  };
  async function submit() {
    if (!approverId) return setErr("กรุณาเลือกผู้อนุมัติ");
    setBusy(true);
    const ok = await onSend(approverId);
    setBusy(false);
    if (ok) setOpen(false);
  }

  return (
    <>
      {returned && job.code === "V10.2" && (
        <Alert tone="error" title={`ผู้อนุมัติส่งกลับแก้ไข ${returned.at}`}>
          {returned.by} · เหตุผล: {returned.reason}
        </Alert>
      )}
      {/* เจ้าของงาน 17 พ.ย. 2569: ไม่ใส่ Alert info "รออนุมัติปิดงาน" — สถานะดูจาก Badge หัวหน้า · ผู้อนุมัติดู/แก้ได้จากปุ่ม "แก้ไขผู้อนุมัติ" */}
      <CloseSummary job={job} po={po} garage={garage} vehicle={vehicle} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" size="lg" onClick={onBack}>
          ย้อนกลับ
        </Button>
        {canAct &&
          (waiting ? (
            <Button variant="secondary" size="lg" iconLeft="edit" onClick={ask}>
              แก้ไขผู้อนุมัติ
            </Button>
          ) : (
            <Button size="lg" onClick={ask}>
              ส่งอนุมัติ
            </Button>
          ))}
      </div>

      <Modal
        open={open}
        title={waiting ? "แก้ไขผู้อนุมัติ" : "ส่งอนุมัติเพื่อปิดงาน Overhaul"}
        cancelLabel="ปิด"
        confirmLabel={waiting ? "บันทึก" : "ส่งอนุมัติ"}
        confirmLoading={busy}
        onClose={() => !busy && setOpen(false)}
        onConfirm={() => void submit()}
      >
        <Combobox
          label="ผู้อนุมัติ"
          icon="person"
          minChars={3}
          placeholder="ค้นหาชื่อ-นามสกุล, รหัสพนักงาน"
          emptyText="ไม่พบรายชื่อ"
          value={approverId}
          onChange={(v) => { setApproverId(v); setErr(""); }}
          options={options}
          error={err || undefined}
        />
      </Modal>
    </>
  );
}
