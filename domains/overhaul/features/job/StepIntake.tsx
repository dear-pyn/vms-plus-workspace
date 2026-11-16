"use client";
/** ขั้น 2 ตรวจรับรถ — ตามภาพ UAT ที่เจ้าของงานส่ง 16 พ.ย. 2569 (แทนจอ OH2 / I.1–I.7 และการส่งขอยืนยัน 2 ฝ่ายของ FigJam Section 12)
 *  ลำดับ: Section header "รายการเอกสารรับรถ" · Table Alternating fills
 *    (รายการ · มี/ไม่มี = Radio button · ชำรุด/ผิดรุ่น = Checkbox (เลือกได้เมื่อ "มี") · หมายเหตุ = Text input · ข้อแบตเตอรี่มีช่องยี่ห้อ + จำนวน ลูก)
 *  → Section header "ลงนามการรับมอบรถ" · Input dropdown พิมพ์ค้น 2 ช่อง (ผู้ส่งมอบรถ · ผู้รับมอบ (กบค.))
 *  → File upload Type=Gallery "รูปสภาพยานพาหนะ (ก่อน Overhaul)" (ตาม I.1 + FigJam Section 12)
 *  → Secondary button lg "ย้อนกลับ" · Primary button lg "บันทึกและถัดไป" (disable จนตอบ มี/ไม่มี ครบทุกข้อ + เลือกผู้ลงนามครบ)
 *  ย้อนดู (ขั้นที่ผ่านแล้ว) = ตารางปิดแก้ไข · ผู้ลงนามเป็น Text input Readonly (ภาพ UAT ชุดแรก)
 *  เจ้าของงานสั่ง 16 พ.ย. 2569: เลขไมล์ย้ายมาจากขั้น 1 ("ไม่มีการนัดหมาย") → ขั้น 2 ช่อง "เลขไมล์ปัจจุบัน (กม.)" บังคับกรอก
 *    วางใต้ Section header "ข้อมูลการรับรถเข้าอู่" ตามโครงจอ OH2 / I.1 (Text input "เลขไมล์ ณ วันรับรถ (กม.)") · ใส่จุลภาคหลักพันอัตโนมัติ · เต็มจำนวนไม่เกิน 7 หลัก
 *  component: Radio button · Checkbox · Text input · Input dropdown (Combobox) · Table — ไฟล์ Component VMS Plus */
import { usePrototypeFill } from "../../prototype/MockTools";
import { useMemo, useState } from "react";
import { Button } from "@ui/Button";
import { Checkbox } from "@ui/Checkbox";
import { Combobox } from "@ui/Combobox";
import { SectionHeader } from "@ui/PageHeader";
import { Radio } from "@ui/Radio";
import { DataTable, Td, Th } from "@ui/Table";
import { TextField } from "@ui/TextField";
import { useLeaveGuard } from "../shared/useLeaveGuard";
import { PhotoUploader } from "../shared/PhotoUploader";
import type { CheckItem, Intake, Staff, Photo } from "../po/types";
import { BATTERY, emptyChecks, intakeComplete } from "./intake";

export interface IntakeDraft {
  /** เลขไมล์ปัจจุบัน (กม.) — ข้อความที่มีจุลภาค ("182,400") */
  mileage: string;
  photos: Photo[];
  checks: CheckItem[];
  delivererId: string;
  receiverId: string;
}

export function StepIntake({
  intake, staff, readOnly, onBack, onSave,
}: {
  intake?: Intake;
  staff: Staff[];
  readOnly?: boolean;
  onBack: () => void;
  /** บันทึกและไปขั้นติดตามงานซ่อม — คืน true เมื่อสำเร็จ */
  onSave: (d: IntakeDraft) => Promise<boolean>;
}) {
  const init = useMemo<IntakeDraft>(
    () => ({ mileage: intake?.mileageKm != null ? intake.mileageKm.toLocaleString() : "", photos: intake?.photos ?? [], checks: intake?.checks ?? emptyChecks(), delivererId: intake?.delivererId ?? "", receiverId: intake?.receiverId ?? "" }),
    [intake],
  );
  const [f, setF] = useState(init);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  usePrototypeFill((mode) => {
    setF({ mileage: mode === "missing" ? "" : mode === "error" ? "12a" : "182,400", photos: f.photos, checks: emptyChecks().map((c, i) => ({ ...c, has: mode === "missing" && i === 0 ? null : true, note: mode === "error" && i === 0 ? "error" : "", ...(c.item === BATTERY ? { brand: "ยี่ห้อจำลอง", count: "2" } : {}) })), delivererId: staff.find((s) => s.unit !== "กบค.")?.id || "", receiverId: staff.find((s) => s.unit === "กบค.")?.id || "" });
  }, !readOnly && !busy);
  const locked = !!readOnly;
  const dirty = !locked && JSON.stringify(f) !== JSON.stringify(init);
  const { requestLeave, runSave, dialog } = useLeaveGuard(dirty, onBack);
  const name = (id: string) => staff.find((s) => s.id === id)?.name ?? "";
  const [mileErr, setMileErr] = useState("");
  const checkMileage = (v = f.mileage) => (!v.trim() ? "กรุณาระบุเลขไมล์ปัจจุบัน" : /^\d{1,7}$/.test(v.replace(/,/g, "")) ? "" : "กรุณาระบุเลขไมล์เป็นตัวเลข");
  const ready = intakeComplete(f.checks, f.delivererId, f.receiverId) && !checkMileage();

  const patch = (i: number, p: Partial<CheckItem>) => setF((x) => ({ ...x, checks: x.checks.map((c, j) => (j === i ? { ...c, ...p } : c)) }));

  async function save() {
    const e = checkMileage();
    setMileErr(e);
    if (e) return;
    setBusy(true);
    await runSave(() => onSave(f), (r) => r);
    setBusy(false);
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionHeader title="ข้อมูลการรับรถเข้าอู่" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <TextField
            label="เลขไมล์ปัจจุบัน (กม.)"
            inputMode="numeric"
            placeholder="ระบุเลขไมล์"
            readOnly={locked}
            value={f.mileage}
            onChange={(e) => {
              const n = e.target.value.replace(/[^\d]/g, "").slice(0, 7);
              setF((x) => ({ ...x, mileage: n ? Number(n).toLocaleString() : "" }));
              setMileErr("");
            }}
            onBlur={() => !locked && setMileErr(checkMileage())}
            error={mileErr || undefined}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="รายการเอกสารรับรถ" />
        <DataTable label="รายการเอกสารรับรถ" striped>
          <thead>
            <tr>
              <Th>รายการ</Th>
              <Th className="w-28">มี</Th>
              <Th className="w-28">ไม่มี</Th>
              <Th className="w-28">ชำรุด</Th>
              <Th className="w-28">ผิดรุ่น</Th>
              <Th className="w-80">หมายเหตุ</Th>
            </tr>
          </thead>
          <tbody>
            {f.checks.map((c, i) => (
              <tr key={c.item}>
                <Td>
                  {c.item === BATTERY ? (
                    /* ภาพ UAT: "5. แบตเตอรี่ยี่ห้อ [ระบุยี่ห้อ] จำนวน [ระบุจำนวน] ลูก" */
                    <span className="flex flex-wrap items-center gap-2">
                      {i + 1}. {c.item}ยี่ห้อ
                      <TextField aria-label="ยี่ห้อแบตเตอรี่" placeholder="ระบุยี่ห้อ" className="w-28" readOnly={locked} value={c.brand ?? ""} onChange={(e) => patch(i, { brand: e.target.value })} />
                      จำนวน
                      <TextField aria-label="จำนวนแบตเตอรี่" placeholder="ระบุจำนวน" inputMode="numeric" className="w-32" readOnly={locked} value={c.count ?? ""} onChange={(e) => patch(i, { count: e.target.value.replace(/\D/g, "") })} />
                      ลูก
                    </span>
                  ) : (
                    `${i + 1}. ${c.item}`
                  )}
                </Td>
                <Td>
                  <Radio name={`has-${i}`} label={`มี ${c.item}`} checked={c.has === true} disabled={locked} onChange={() => patch(i, { has: true })} />
                </Td>
                <Td>
                  {/* ไม่มี → ล้างชำรุด/ผิดรุ่น (เลือกได้เฉพาะของที่มี) */}
                  <Radio name={`has-${i}`} label={`ไม่มี ${c.item}`} checked={c.has === false} disabled={locked} onChange={() => patch(i, { has: false, damaged: false, wrongModel: false })} />
                </Td>
                <Td>
                  <Checkbox label={`ชำรุด ${c.item}`} checked={c.damaged} disabled={locked || c.has !== true} onChange={(v) => patch(i, { damaged: v })} />
                </Td>
                <Td>
                  <Checkbox label={`ผิดรุ่น ${c.item}`} checked={c.wrongModel} disabled={locked || c.has !== true} onChange={(v) => patch(i, { wrongModel: v })} />
                </Td>
                <Td>
                  <TextField aria-label={`หมายเหตุ ${c.item}`} placeholder="ระบุหมายเหตุ" readOnly={locked} value={c.note} onChange={(e) => patch(i, { note: e.target.value })} />
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="ลงนามการรับมอบรถ" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {locked ? (
            <>
              <TextField label="ผู้ส่งมอบรถ" readOnly value={name(f.delivererId)} />
              <TextField label="ผู้รับมอบ (กบค.)" readOnly value={name(f.receiverId)} />
            </>
          ) : (
            <>
              <Combobox
                minChars={3}
                label="ผู้ส่งมอบรถ"
                placeholder="เลือกหรือค้นหาผู้ส่งมอบรถ"
                emptyText="ไม่พบรายชื่อ"
                value={f.delivererId}
                onChange={(v) => setF({ ...f, delivererId: v })}
                options={staff.filter((s) => s.unit === "หน่วยงาน").map((s) => ({ value: s.id, label: s.name, sub: s.role, keywords: s.id }))}
              />
              <Combobox
                minChars={3}
                label="ผู้รับมอบ (กบค.)"
                placeholder="เลือกหรือค้นหาผู้รับมอบ (กบค.)"
                emptyText="ไม่พบรายชื่อ"
                value={f.receiverId}
                onChange={(v) => setF({ ...f, receiverId: v })}
                options={staff.filter((s) => s.unit === "กบค.").map((s) => ({ value: s.id, label: s.name, sub: s.role, keywords: s.id }))}
              />
            </>
          )}
        </div>
      </section>

      {/* OH2 I.1: รูปก่อน Overhaul หลังส่วนรับมอบ · File upload Type=Gallery ตาม FigJam Section 12 */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="รูปสภาพยานพาหนะ (ก่อน Overhaul)" />
        <PhotoUploader label="รูปสภาพยานพาหนะ (ก่อน Overhaul)" optional photos={f.photos} readOnly={locked} disabled={busy} onBusyChange={setUploading} onChange={(photos) => setF((prev) => ({ ...prev, photos }))} />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3" /* ภาพ UAT ไม่มีเส้นคั่น */>
        <Button variant="secondary" size="lg" onClick={() => requestLeave()}>
          ย้อนกลับ
        </Button>
        {!locked && (
          <Button size="lg" disabled={!ready || uploading} loading={busy} onClick={save}>
            บันทึกและถัดไป
          </Button>
        )}
      </div>
      {dialog}
    </>
  );
}
