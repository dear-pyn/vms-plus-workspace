"use client";
/** Modal ของยานพาหนะในแผน — Scene B (refinement sprint 09)
 *  PriceModal = B.13 (ยังไม่กรอก) · B.10 (แก้ไข) · B.11 (validation) → B.12 (บันทึกสำเร็จ)
 *    ⚠ หัวข้อในจอเขียน "แก้ไขข้อมูลผู้ใช้ยานพาหนะ" (ก๊อปจากจออื่น) → ใช้ "ระบุราคารายคัน" (บันทึกใน review.md)
 *    ช่อง: ราคากลาง (บาท) · ราคาประเมิน Overhaul (บาท) · หมายเหตุ (ถ้ามี) · validation "กรุณาระบุจำนวนเงินตั้งแต่ 0.00 ขึ้นไป" (B.11)
 *    EC-22 ประเมิน Overhaul มากกว่าราคากลาง → เตือน ไม่บล็อก · EC-23 รับจุลภาค/ช่องว่าง ปัด 2 ตำแหน่ง (MONEY-001)
 *  VehicleInfoModal = B.9 ดูรายละเอียดรถจากแผน: ข้อมูลยานพาหนะ + ราคาในแผน (อ่านอย่างเดียว) */
import { usePrototypeFill } from "../../prototype/MockTools";
import { useState, type ReactNode } from "react";
import { Modal } from "@ui/Modal";
import { TextField } from "@ui/TextField";
import { currency } from "@rules/currency.mjs";
import type { PlanVehicle } from "../vehicle/types";

/** แปลงข้อความเงินเป็นตัวเลข — ตัดจุลภาค/ช่องว่าง · ไม่ใช่ตัวเลขหรือติดลบ = NaN */
export function parseMoney(t: string): number {
  const raw = t.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(raw)) return NaN;
  return Math.round(Number(raw) * 100) / 100;
}

/** T12 ระหว่างพิมพ์: เก็บแค่ตัวเลขกับจุดทศนิยมจุดเดียว (ไม่เกิน 2 ตำแหน่ง) แล้วใส่จุลภาคหลักพันทันที — ทศนิยม 2 ตำแหน่งเติมตอน blur */
export function formatMoneyTyping(t: string): string {
  const clean = t.replace(/[^\d.]/g, "");
  const [int = "", ...rest] = clean.split(".");
  const dec = rest.length ? "." + rest.join("").slice(0, 2) : "";
  const intFmt = int.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return intFmt + dec;
}

export function MoneyField({ label, value, onChange, error, placeholder, onBlurCheck, optional }: { label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; onBlurCheck?: () => void; optional?: boolean }) {
  return (
    <TextField
      label={label}
      optional={optional}
      inputMode="decimal"
      placeholder={placeholder}
      value={value}
      error={error}
      onChange={(e) => onChange(formatMoneyTyping(e.target.value))}
      onBlur={() => {
        const n = parseMoney(value);
        if (Number.isFinite(n)) onChange(currency(n));
        onBlurCheck?.();
      }}
    />
  );
}

/** T14 (เจ้าของงาน 14 พ.ย. 2569): title "ระบุราคา" · subtitle = ทะเบียน · ยี่ห้อ รุ่น (senior-ux-writing: บอกว่ากำลังระบุให้คันไหน) · ไม่มีช่องหมายเหตุ
 *  ช่องบังคับทั้งสอง (ราคาไม่บังคับตอนบันทึกแผน แต่เปิด modal แล้วต้องกรอกครบ — T13) */
export function PriceModal({ vehicle, onClose, onSave }: { vehicle: PlanVehicle | null; onClose: () => void; onSave: (p: { referencePrice: number; overhaulEstimate: number }) => void }) {
  const [ref, setRef] = useState("");
  const [est, setEst] = useState("");
  const [err, setErr] = useState<{ ref?: string; est?: string }>({});
  const [forPlate, setForPlate] = useState<string | null>(null);
  usePrototypeFill((mode) => {
    setRef(mode === "missing" ? "" : "500,000.00");
    setEst(mode === "error" ? "-1" : "100,000.00");
    setErr({});
  }, !!vehicle);

  if (vehicle && vehicle.plate !== forPlate) {
    setForPlate(vehicle.plate);
    setRef(vehicle.referencePrice === null ? "" : currency(vehicle.referencePrice));
    setEst(vehicle.overhaulEstimate === null ? "" : currency(vehicle.overhaulEstimate));
    setErr({});
  }
  const r = parseMoney(ref);
  const e = parseMoney(est);
  const warn = Number.isFinite(r) && Number.isFinite(e) && e > r;
  const msg = "กรุณาระบุจำนวนเงินตั้งแต่ 0.00 ขึ้นไป";
  return (
    <Modal
      open={!!vehicle}
      onClose={() => {
        setForPlate(null);
        onClose();
      }}
      title="ระบุราคา"
      description={vehicle ? `${vehicle.plate} · ${vehicle.make} ${vehicle.model}` : undefined}
      confirmLabel="บันทึก"
      confirmDisabled={!Number.isFinite(r) || !Number.isFinite(e)} /* มติ FigJam: บันทึก disable เมื่อยังไม่ได้กรอกข้อมูล (B.13) */
      onConfirm={() => {
        const next = { ref: Number.isFinite(r) ? undefined : msg, est: Number.isFinite(e) ? undefined : msg };
        setErr(next);
        if (next.ref || next.est) return;
        onSave({ referencePrice: r, overhaulEstimate: e });
        setForPlate(null);
      }}
    >
      <div className="flex flex-col gap-4">
        <MoneyField label="ราคากลาง (บาท)" placeholder="ระบุราคากลาง" value={ref} onChange={setRef} error={err.ref} />
        <MoneyField label="ราคาประเมิน Overhaul (บาท)" placeholder="ระบุราคาประเมิน Overhaul" value={est} onChange={setEst} error={err.est} />
        {warn && <p className="text-sm text-warning-700">ราคาประเมิน Overhaul สูงกว่าราคากลาง (ซ่อมแพงกว่าซื้อใหม่)</p>}
      </div>
    </Modal>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-200 py-2 text-sm last:border-0">
      <dt className="text-gray-600">{label}</dt>
      <dd className="text-right text-black">{children}</dd>
    </div>
  );
}

export function VehicleInfoModal({ vehicle, onClose }: { vehicle: PlanVehicle | null; onClose: () => void }) {
  return (
    <Modal open={!!vehicle} onClose={onClose} title={vehicle ? `รายละเอียดยานพาหนะ ${vehicle.plate}` : ""} hideCancel confirmLabel="ปิด" onConfirm={onClose}>
      {vehicle && (
        <div className="flex flex-col gap-4 pb-2">
          <section>
            <h3 className="mb-1 text-md font-semibold text-black">ข้อมูลยานพาหนะ</h3>
            <dl>
              <Row label="ยี่ห้อ/รุ่น">{`${vehicle.make} ${vehicle.model}`}</Row>
              <Row label="ประเภท">{vehicle.type}</Row>
              <Row label="สังกัด">{vehicle.affiliation}</Row>
              <Row label="เลขไมล์สะสม">{vehicle.mileageKm !== undefined ? `${vehicle.mileageKm.toLocaleString()} กม.` : "-"}</Row>
              <Row label="ชั่วโมงสะสม">{vehicle.engineHours !== undefined ? `${vehicle.engineHours.toLocaleString()} ชม.` : "-"}</Row>
            </dl>
          </section>
          <section>
            <h3 className="mb-1 text-md font-semibold text-black">ราคาในแผน</h3>
            <dl>
              <Row label="ราคากลาง (บาท)">{vehicle.referencePrice === null ? "ยังไม่ระบุ" : `${currency(vehicle.referencePrice)} บาท`}</Row>
              <Row label="ราคาประเมิน Overhaul (บาท)">{vehicle.overhaulEstimate === null ? "ยังไม่ระบุ" : `${currency(vehicle.overhaulEstimate)} บาท`}</Row>
              <Row label="หมายเหตุ">{vehicle.note || "-"}</Row>
            </dl>
          </section>
        </div>
      )}
    </Modal>
  );
}
