"use client";
/** ฟอร์ม Purchase Order — S4 สร้าง (OH2 / E.2–E.7) · S5 แก้ไข (F.2–F.3)
 *  component (ไฟล์ Component): Page header · Section header · Text input · Input dropdown (พิมพ์ค้น) + Dropdown list item ·
 *    Empty state/Data empty · Alert (Color=Error) · Table (Alternating fills) · Pagination · File upload · Secondary/Primary button lg
 *  มติ FigJam Section 10 (refinement 12 พ.ย. 2569): เพิ่มวันเริ่ม/สิ้นสุดสัญญา · คำ "PO" → "Purchase Order" (รหัสคงเดิม) ·
 *    ยานพาหนะมาจากที่เลือกไว้ตอนสร้างแผนเท่านั้น (ราคากลาง/ประเมิน Overhaul ได้มาจากแผน) · ตาราง + แบ่งหน้า 10 แถว ·
 *    ไม่มีคอลัมน์ความคืบหน้า · ปุ่มท้ายแถว = ลบออกจาก Purchase Order อย่างเดียว (ตาม F.2 ไอคอน delete) ·
 *    บันทึกไม่ได้เมื่อยานพาหนะถูกนำออกจากแผน → modal แจ้ง */
import { GENERAL_ERROR, T } from "../shared/messages";
import { usePrototypeFill } from "../../prototype/MockTools";
import { mockDate, mockFile } from "../../prototype/fixtures";
import { useMemo, useState } from "react";
import { Alert } from "@ui/Alert";
import { OutlineBadge } from "@ui/Badge";
import { Button } from "@ui/Button";
import { Combobox } from "@ui/Combobox";
import { DateField, parseThaiDate } from "@ui/DateField";
import { EmptyState } from "@ui/EmptyState";
import { PageHeader, SectionHeader } from "@ui/PageHeader";
import { Pagination } from "@ui/Pagination";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { TextField } from "@ui/TextField";
import { currency } from "@rules/currency.mjs";
import { ACCEPT, MAX_MB, Uploader } from "../plan/PlanForm";
import type { Plan } from "../plan/types";
import { useLeaveGuard } from "../shared/useLeaveGuard";
import { VehiclePickerModal } from "../vehicle/VehiclePickerModal";
import type { PlanVehicle } from "../vehicle/types";
import type { Garage, PODocs, PODraft, PurchaseOrder } from "./types";

export type POSaveResult = true | string | { removed: string[] };

export interface POFormProps {
  plan: Plan;
  po?: PurchaseOrder;
  garages: Garage[];
  /** ทะเบียนที่อยู่ใน Purchase Order อื่นของแผนนี้แล้ว → เลือกไม่ได้ (AC-S4 ยังไม่เคาะ: ควรไม่ได้) */
  takenBy: Record<string, string>;
  /** ทะเบียนที่เริ่มงานรายคันไปแล้ว (เลยขั้นนัดหมาย) → นำออกจาก Purchase Order ไม่ได้ (AC-S5 ยังไม่เคาะ) */
  locked?: string[];
  onCancel: () => void;
  onGoPlans: () => void;
  onGoPlan: () => void;
  onSave: (d: PODraft) => Promise<POSaveResult>;
  onNotify: (msg: string, tone?: "success" | "error" | "info" | "warning", description?: string) => void;
}

const MAX_FILES = 10;
const empty = (): PODraft => ({ name: "", garageId: "", contractStart: "", contractEnd: "", plates: [], docs: { order: [], other: [] } });

export function POForm({ plan, po, garages, takenBy, locked = [], onCancel, onGoPlans, onGoPlan, onSave, onNotify }: POFormProps) {
  const isNew = !po;
  const initial = useMemo<PODraft>(() => (po ? structuredClone({ name: po.name, garageId: po.garageId, contractStart: po.contractStart, contractEnd: po.contractEnd, plates: po.plates, docs: po.docs }) : empty()), [po]);
  const [d, setD] = useState<PODraft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  usePrototypeFill((mode) => {
    setD({ ...d, name: mode === "missing" ? "" : mode === "error" ? "error — Purchase Order ทดสอบ" : /error/i.test(d.name) ? "Purchase Order ทดสอบ" : d.name || "Purchase Order ทดสอบ", garageId: d.garageId || garages[0]?.id || "", contractStart: mockDate(), contractEnd: mockDate(), plates: d.plates.length ? d.plates : plan.vehicles.filter((v) => !takenBy[v.plate]).slice(0, 2).map((v) => v.plate), docs: { ...d.docs, order: mode === "missing" ? [] : d.docs.order.length ? d.docs.order : [mockFile("order")] } });
    setErrors({});
  }, !saving && !picker);
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const { requestLeave, runSave, dialog } = useLeaveGuard(dirty, onCancel);
  const set = <K extends keyof PODraft>(k: K, v: PODraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const title = isNew ? "เพิ่ม Purchase Order" : `แก้ไข ${po.id}`;

  const vehicles = d.plates.map((p) => plan.vehicles.find((v) => v.plate === p)).filter((v): v is PlanVehicle => !!v);
  const pages = Math.max(1, Math.ceil(vehicles.length / size));
  const cur = Math.min(page, pages);
  const shown = vehicles.slice((cur - 1) * size, cur * size);

  /** ข้อความผิดพลาดของแต่ละช่อง — ใช้ตอน out of focus (E.3) และตอนกดบันทึก */
  function check(k: string, x: PODraft = d): string | undefined {
    if (k === "name") return x.name.trim() ? undefined : "กรุณาระบุชื่อ Purchase Order";
    if (k === "garage") return x.garageId ? undefined : "กรุณาเลือกศูนย์บริการ/อู่";
    if (k === "start") return x.contractStart && !parseThaiDate(x.contractStart) ? "กรุณาระบุวันที่ให้ถูกต้อง (วว/ดด/ปปปป)" : undefined;
    if (k === "end") {
      if (!x.contractEnd) return undefined;
      const e = parseThaiDate(x.contractEnd);
      if (!e) return "กรุณาระบุวันที่ให้ถูกต้อง (วว/ดด/ปปปป)";
      const s = parseThaiDate(x.contractStart);
      return s && e < s ? "วันสิ้นสุดสัญญาต้องไม่ก่อนวันเริ่มสัญญา" : undefined;
    }
    if (k === "vehicles") return x.plates.length ? undefined : "กรุณาเลือกยานพาหนะอย่างน้อย 1 คัน";
    if (k === "order") return x.docs.order.length ? undefined : "กรุณาแนบใบสั่งจ้าง";
  }
  const touch = (k: string, x?: PODraft) => setErrors((e) => ({ ...e, [k]: check(k, x) ?? "" }));
  const err = (k: string) => errors[k] || undefined;

  async function submit() {
    const keys = ["name", "garage", "start", "end", "vehicles", "order"];
    const next = Object.fromEntries(keys.map((k) => [k, check(k) ?? ""]));
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSaving(true);
    const r = await runSave(() => onSave(d));
    setSaving(false);
    // ชีต OH-Toast แถว 11: General Error → หัวข้อ "บันทึกข้อมูลไม่สำเร็จ" + Status Code · แถว 12 ไม่พบแผน = ข้อความเดียว
    if (typeof r === "string") { if (r === GENERAL_ERROR) onNotify(T.poSaveFail().msg, "error", r); else onNotify(r, "error"); }
    else if (r !== true) {
      // EC-31 เจ้าของงานสั่ง 16 พ.ย. 2569: error toast (ข้อความตรงตัว) + นำคันที่ไม่อยู่ในแผนออกจากตารางทันที (แทน modal ของ FigJam Section 10)
      setD((x) => ({ ...x, plates: x.plates.filter((pl) => !r.removed.includes(pl)) }));
      onNotify(`บันทึกข้อมูลไม่สำเร็จ รถบางคันไม่อยู่ในแผน ${plan.id}`, "error");
    }
  }

  function addFiles(k: keyof PODocs, list: File[]) {
    const bad = list.find((f) => !ACCEPT.test(f.name) || f.size > MAX_MB * 1024 * 1024);
    const ok = list.filter((f) => ACCEPT.test(f.name) && f.size <= MAX_MB * 1024 * 1024).map((f) => ({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)) }));
    const room = MAX_FILES - d.docs[k].length;
    const msg = bad ? `${bad.name}: รองรับเฉพาะ PDF, JPG หรือ PNG ขนาดไม่เกิน ${MAX_MB} MB` : ok.length > room ? `แนบได้ไม่เกิน ${MAX_FILES} ไฟล์` : "";
    const docs = { ...d.docs, [k]: [...d.docs[k], ...ok.slice(0, Math.max(0, room))] };
    set("docs", docs);
    setErrors((e) => ({ ...e, [`${k}File`]: msg, ...(k === "order" && docs.order.length ? { order: "" } : {}) }));
  }

  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={[
          { label: "จัดการงาน Overhaul", onClick: () => requestLeave(onGoPlans) },
          { label: `แผน ${plan.id}`, onClick: () => requestLeave(onGoPlan) },
          { label: title },
        ]}
        title={title}
      />

      <section className="flex flex-col gap-4">
        <SectionHeader title="รายละเอียด Purchase Order" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextField label="ชื่อ Purchase Order" placeholder="เช่น ซ่อมระบบแอร์" value={d.name} onChange={(e) => set("name", e.target.value)} onBlur={() => touch("name")} error={err("name")} />
          <Combobox
            label="ศูนย์บริการ/อู่"
            placeholder="ค้นหาชื่อศูนย์บริการ/อู่"
            emptyText="ไม่พบศูนย์บริการ/อู่"
            value={d.garageId}
            onChange={(v) => {
              const x = { ...d, garageId: v };
              setD(x);
              touch("garage", x);
            }}
            options={garages.map((g) => ({ value: g.id, label: g.name, sub: `${g.phone} · ${g.address}`, keywords: `${g.phone} ${g.address}` }))}
            error={err("garage")}
          />
        </div>
        {/* เจ้าของงาน 16 พ.ย. 2569: วันเริ่ม/สิ้นสุดสัญญา กว้างช่องละ 50% (เดิม 1 ใน 3 ตามจอ E.2) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DateField label="วันเริ่มสัญญา" optional value={d.contractStart} onChange={(v) => set("contractStart", v)} onBlur={() => touch("start")} error={err("start")} />
          <DateField label="วันสิ้นสุดสัญญา" optional value={d.contractEnd} onChange={(v) => set("contractEnd", v)} onBlur={() => touch("end")} error={err("end")} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          title="ยานพาหนะที่จะเข้า Overhaul"
          badge={<OutlineBadge>{vehicles.length}</OutlineBadge>}
          actions={
            vehicles.length > 0 && (
              <Button variant="secondary" iconLeft="add" onClick={() => setPicker(true)}>
                เพิ่มยานพาหนะ
              </Button>
            )
          }
        />
        {vehicles.length === 0 ? (
          <EmptyState
            kind="data-empty"
            title="ยังไม่ได้เลือกยานพาหนะ"
            description="เลือกยานพาหนะจากยานพาหนะในแผนนี้" /* E.2 (จอ: "เลือกรถจากรถในแผนนี้") */
            action={
              <Button iconLeft="add" onClick={() => setPicker(true)}>
                เพิ่มยานพาหนะ
              </Button>
            }
          />
        ) : (
          <>
            <DataTable label="ยานพาหนะที่จะเข้า Overhaul" striped>
              <thead>
                <tr>
                  <Th>ทะเบียน</Th>
                  <Th>ข้อมูลยานพาหนะ</Th>
                  <Th>ราคาที่ได้มา (บาท)</Th>
                  <Th>ราคากลาง</Th>
                  <Th>ประเมิน Overhaul (บาท)</Th>
                  <Th>อายุการใช้งาน</Th>
                  <Th className="w-14">
                    <span className="sr-only">จัดการ</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {shown.map((v) => {
                  const lock = locked.includes(v.plate);
                  return (
                    <tr key={v.plate}>
                      <Td className="font-semibold">{v.plate}</Td>
                      <Td>
                        <CellStack main={`${v.make} ${v.model}`} sub={`${v.type} · ${v.affiliation}`} />
                      </Td>
                      <Td className="tabular-nums">{currency(v.value)}</Td>
                      <Td className="tabular-nums">{v.referencePrice === null ? "—" : currency(v.referencePrice)}</Td>
                      <Td className="tabular-nums">{v.overhaulEstimate === null ? "—" : currency(v.overhaulEstimate)}</Td>
                      <Td>{v.ageYears} ปี</Td>
                      <Td>
                        <Button
                          variant="tertiary"
                          iconOnly="delete"
                          aria-label={lock ? `${v.plate} เริ่มงานแล้ว นำออกไม่ได้` : `นำ ${v.plate} ออกจาก Purchase Order`}
                          title={lock ? "เริ่มงานแล้ว นำออกไม่ได้" : undefined}
                          disabled={lock}
                          onClick={() => {
                            const x = { ...d, plates: d.plates.filter((p) => p !== v.plate) };
                            setD(x);
                            if (errors.vehicles !== undefined) touch("vehicles", x);
                          }}
                        />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
            <Pagination
              page={cur}
              pageSize={size}
              total={vehicles.length}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setSize(s);
                setPage(1);
              }}
            />
          </>
        )}
        {err("vehicles") && <Alert title={err("vehicles")} />}
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="เอกสาร" />
        <Uploader label="ใบสั่งจ้าง" files={d.docs.order} error={errors.orderFile || err("order")} onAdd={(l) => addFiles("order", l)} onRemove={(n) => set("docs", { ...d.docs, order: d.docs.order.filter((f) => f.name !== n) })} />
        <Uploader label="เอกสารอื่น ๆ" optional files={d.docs.other} error={errors.otherFile || undefined} onAdd={(l) => addFiles("other", l)} onRemove={(n) => set("docs", { ...d.docs, other: d.docs.other.filter((f) => f.name !== n) })} />
      </section>

      {/* E.2 "ย้อนกลับ" + "บันทึก" (Size=lg) · F.2 แก้ไข = "ยกเลิก" ชิดซ้าย "บันทึก" ชิดขวา (AC-S5) */}
      <div className="flex items-center justify-between gap-3" /* จอไม่มีเส้นคั่นเหนือปุ่ม */>
        <Button variant="secondary" size="lg" onClick={() => requestLeave()}>
          {isNew ? "ย้อนกลับ" : "ยกเลิก"}
        </Button>
        <Button size="lg" onClick={submit} loading={saving}>
          บันทึก
        </Button>
      </div>

      <VehiclePickerModal
        open={picker}
        onClose={() => setPicker(false)}
        fleet={plan.vehicles.map((v) => ({ ...v, unavailableReason: takenBy[v.plate] ? `อยู่ใน ${takenBy[v.plate]}` : undefined }))}
        excludePlates={d.plates}
        description={`ยานพาหนะในแผน ${plan.id}`}
        onAdd={(picked) => {
          const x = { ...d, plates: [...d.plates, ...picked.map((v) => v.plate)] };
          setD(x);
          if (errors.vehicles !== undefined) touch("vehicles", x);
          setPicker(false);
          onNotify(`เพิ่มยานพาหนะ ${picked.length} คันสำเร็จ`);
        }}
      />
      {dialog}
    </div>
  );
}
