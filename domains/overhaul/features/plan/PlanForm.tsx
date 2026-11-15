"use client";
/** ฟอร์มแผน Overhaul — ใช้ทั้ง S1 สร้างแผน (Scene B) และ S2 แก้ไขแผน (Scene C) · refinement sprint 09
 *  โครงตามจอ B.3.4 / C.2 (dump): Page pad 32 · gap 32 · Section gap 16 · ฟอร์ม 2 คอลัมน์ เต็มความกว้าง (636 + 24 + 636) ระยะแถว 16 ·
 *  ช่องตามประเภทงบอยู่ใต้ "ประเภทงบประมาณ" ในคอลัมน์ขวา (B.3.2–B.3.6) · Section header "เลือกยานพาหนะที่จะเข้า Overhaul" + Badge จำนวน ·
 *  ตารางแบบ A.5 (เคาะ D2) · Section header "เอกสาร" · ปุ่มท้าย ยกเลิก / บันทึก
 *  พฤติกรรม: AC-S1 (15-overhaul-AC.md) + เคสในทะเบียน domains/overhaul/edge-cases.md (EC-03 EC-04 EC-21 EC-22 EC-23 EC-24 EC-26 EC-27)
 *  ข้อความ validation ตรงตัวจอ B.2 · B.19 · ยืนยันออก B.4 · เมนูแถวตาม D3
 *  S2 แก้ไข: ยืนยันการแก้ไข (C.4) ทำที่หน้า page — ฟอร์มส่งค่ากลับผ่าน onSave */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@ui/Button";
import { Alert } from "@ui/Alert";
import { OutlineBadge } from "@ui/Badge";
import { EmptyState } from "@ui/EmptyState";
import { Icon } from "@ui/Icon";
import { ConfirmDialog } from "@ui/Modal";
import { PageHeader, SectionHeader } from "@ui/PageHeader";
import { RowMenu } from "@ui/RowMenu";
import { SelectField } from "@ui/SelectField";
import { TextField } from "@ui/TextField";
import { currency } from "@rules/currency.mjs";
import { VehiclePickerModal } from "../vehicle/VehiclePickerModal";
import { VehicleBrowser } from "../vehicle/VehicleBrowser";
import { missingPrice, type FleetVehicle, type PlanVehicle } from "../vehicle/types";
import { FileRow } from "./PlanDetail";
import { BUDGET_TYPES, type Plan, type PlanDocs, type PlanDraft } from "./types";
import { MoneyField, PriceModal, parseMoney } from "./VehicleModals";
import { useLeaveGuard } from "../shared/useLeaveGuard";

export interface PlanFormProps {
  /** ไม่มี = สร้างแผนใหม่ (S1) */
  plan?: Plan;
  fleet: FleetVehicle[];
  /** ศูนย์ต้นทุนของหน่วยงานผู้ใช้ (งบทำการ หน่วยงานต้นสังกัด — ระบบเติมให้) */
  ownCostCenter: string;
  costCenters: string[];
  onCancel: () => void;
  /** คืน true = สำเร็จ · string = ข้อความผิดพลาดจากระบบ (B.5) */
  onSave: (draft: PlanDraft) => Promise<true | string>;
  onNotify: (msg: string, tone?: "success" | "error" | "info") => void;
  onNotInScope: (what: string) => void;
  /** ดูข้อมูลยานพาหนะ / ดูข้อมูลการซ่อม → หน้ายานพาหนะเดิมของระบบ (เปิดแท็บใหม่ ไม่ให้ค่าที่กรอกหาย) */
  onOpenVehicle: (plate: string, tab: "info" | "repair") => void;
  /** M8 เพดานจำนวนต่อครั้งใน modal เลือกยานพาหนะ (ยังไม่กำหนด) */
  maxSelect?: number;
}

/** ปีงบประมาณไทยเริ่ม 1 ต.ค. (EC-26) */
function currentFiscalYear(d = new Date()) {
  return d.getFullYear() + 543 + (d.getMonth() >= 9 ? 1 : 0);
}
export const ACCEPT = /\.(pdf|jpe?g|png)$/i;
export const MAX_MB = 10;

const emptyDraft = (): PlanDraft => ({ name: "", fiscalYear: 0 /* B.1 placeholder "เลือกปีงบประมาณ" — ไม่เติมปีให้ */, budget: NaN, budgetType: "", costCenter: "", wbs: "", network: "", activity: "", orderNo: "", budgetNote: "", vehicles: [], docs: { principle: [], budget: [], other: [] } });
const draftOf = (p: Plan): PlanDraft =>
  structuredClone({ name: p.name, fiscalYear: p.fiscalYear, budget: p.budget, budgetType: p.budgetType, costCenter: p.costCenter, wbs: p.wbs, network: p.network, activity: p.activity, orderNo: p.orderNo, budgetNote: p.budgetNote, vehicles: p.vehicles, docs: p.docs });

export function PlanForm({ plan, fleet, ownCostCenter, costCenters, onCancel, onSave, onNotify, onOpenVehicle, maxSelect }: PlanFormProps) {
  const isNew = !plan;
  const initial = useMemo(() => (plan ? draftOf(plan) : emptyDraft()), [plan]);
  const [d, setD] = useState<PlanDraft>(initial);
  const [budgetText, setBudgetText] = useState(plan ? currency(plan.budget) : "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<Partial<Record<keyof PlanDocs, string>>>({});
  const [picker, setPicker] = useState(false);
  const [priceFor, setPriceFor] = useState<PlanVehicle | null>(null);
  const [removeFor, setRemoveFor] = useState<PlanVehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const set = <K extends keyof PlanDraft>(k: K, v: PlanDraft[K]) => setD((x) => ({ ...x, [k]: v }));

  // EC-27 ออกจากหน้าระหว่างแก้ไข → modal (ของกลาง shared/useLeaveGuard)
  const { requestLeave, runSave, dialog: leaveDialog } = useLeaveGuard(dirty, onCancel);

  const years = useMemo(() => {
    const y0 = currentFiscalYear();
    return [...new Set([...(plan ? [plan.fiscalYear] : []), y0, y0 + 1, y0 + 2])].sort().map((y) => ({ value: String(y), label: String(y) }));
  }, [plan]);

  const missing = d.vehicles.filter(missingPrice);
  const totalEstimate = d.vehicles.reduce((n, v) => n + (v.overhaulEstimate ?? 0), 0);
  const overBudget = Number.isFinite(d.budget) && totalEstimate > d.budget;

  /** EC-24 เปลี่ยนประเภทงบ → ล้างค่าช่องเดิม */
  function changeBudgetType(t: string) {
    setD((x) => ({ ...x, budgetType: t, costCenter: t === BUDGET_TYPES[0] ? ownCostCenter : "", wbs: "", network: "", activity: "", orderNo: "", budgetNote: "" }));
  }

  /** ข้อความตรงตัวจอ B.2 */
  const rules = (x: PlanDraft): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!x.name.trim()) e.name = "กรุณาระบุชื่อแผน";
    if (!x.fiscalYear) e.fiscalYear = "กรุณาเลือกปีงบประมาณ";
    if (!Number.isFinite(x.budget)) e.budget = "กรุณาระบุวงเงินอนุมัติ";
    if (!x.budgetType) e.budgetType = "กรุณาเลือกประเภทงบประมาณ";
    if (!x.docs.principle.length) e.principle = "กรุณาแนบหนังสืออนุมัติหลักการ";
    if (!x.docs.budget.length) e.budgetDoc = "กรุณาแนบเอกสารอนุมัติงบ";
    return e;
  };
  /** B.2 "กรณีไม่ได้เลือก (Out of focus)": ออกจากช่องแล้วยังว่าง → แสดงข้อความของช่องนั้น */
  const blurCheck = (k: string, x: PlanDraft = d) => setErrors((e) => ({ ...e, [k]: rules(x)[k] }));
  /** มติ FigJam: ปุ่มบันทึก disable เมื่อยังกรอกข้อมูลบังคับไม่ครบ */
  const incomplete = Object.keys(rules(d)).length > 0;
  function validate() {
    const e = rules(d);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true); // EC-04 ปิดปุ่มระหว่างส่ง
    const r = await runSave(() => onSave(d)); // บันทึกสำเร็จแล้วหน้าพาออกเอง — ไม่ถาม
    setSaving(false);
    if (r !== true) onNotify(r, "error");
  }

  const budgetFields: Record<string, ReactNode> = {
    [BUDGET_TYPES[0]]: <TextField label="ศูนย์ต้นทุน" value={d.costCenter} readOnly autoFilled />,
    [BUDGET_TYPES[1]]: <SelectField label="ศูนย์ต้นทุน" optional placeholder="เลือกศูนย์ต้นทุน" value={d.costCenter} onChange={(e) => set("costCenter", e.target.value)} options={costCenters.map((c) => ({ value: c, label: c }))} />,
    [BUDGET_TYPES[2]]: (
      <div className="grid grid-cols-3 gap-6">
        <TextField label="เลข WBS" optional value={d.wbs} onChange={(e) => set("wbs", e.target.value)} />
        <TextField label="เลขโครงข่าย" optional value={d.network} onChange={(e) => set("network", e.target.value)} />
        <TextField label="เลขกิจกรรม" optional value={d.activity} onChange={(e) => set("activity", e.target.value)} />
      </div>
    ),
    [BUDGET_TYPES[3]]: <TextField label="เลขที่ใบสั่ง" optional value={d.orderNo} onChange={(e) => set("orderNo", e.target.value)} />,
    [BUDGET_TYPES[4]]: <TextField label="หมายเหตุ" optional value={d.budgetNote} onChange={(e) => set("budgetNote", e.target.value)} /> /* B.3.6 Text input (ไม่ใช่ Text area) */,
  };
  const title = isNew ? "สร้างแผน Overhaul" : `แก้ไขแผน ${plan.id}`;

  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader crumbs={[{ label: "จัดการงาน Overhaul", onClick: () => requestLeave() }, { label: title }]} title={title} />

      <section className="flex flex-col gap-4">
        <SectionHeader title="ข้อมูลแผน" />
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <TextField label="ชื่อแผน" placeholder="ระบุชื่อแผน" value={d.name} error={errors.name} onChange={(e) => set("name", e.target.value)} onBlur={() => blurCheck("name")} />
          <SelectField
            label="ประจำปีงบประมาณ"
            placeholder="เลือกปีงบประมาณ"
            value={d.fiscalYear ? String(d.fiscalYear) : ""}
            error={errors.fiscalYear}
            onChange={(e) => {
              set("fiscalYear", Number(e.target.value));
              blurCheck("fiscalYear", { ...d, fiscalYear: Number(e.target.value) });
            }}
            onBlur={() => blurCheck("fiscalYear")}
            options={years}
          />
          <MoneyField
            label="วงเงินอนุมัติ (บาท)"
            placeholder="ระบุวงเงินอนุมัติ"
            value={budgetText}
            error={errors.budget}
            onChange={(v) => {
              setBudgetText(v);
              set("budget", parseMoney(v));
            }}
            onBlurCheck={() => blurCheck("budget")}
          />
          <SelectField
            label="ประเภทงบประมาณ"
            icon="paid"
            placeholder="เลือกประเภทงบประมาณ"
            value={d.budgetType}
            error={errors.budgetType}
            onChange={(e) => {
              changeBudgetType(e.target.value);
              blurCheck("budgetType", { ...d, budgetType: e.target.value });
            }}
            onBlur={() => blurCheck("budgetType")}
            options={BUDGET_TYPES.map((t) => ({ value: t, label: t }))}
          />
          {budgetFields[d.budgetType] && <div className="md:col-start-2">{budgetFields[d.budgetType]}</div>}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="เลือกยานพาหนะที่จะเข้า Overhaul" badge={<OutlineBadge>{d.vehicles.length}</OutlineBadge>} />
        {d.vehicles.length === 0 ? (
          <EmptyState
            kind="data-empty"
            title="ยังไม่มียานพาหนะในแผน"
            description="เพิ่มยานพาหนะที่จะเข้า Overhaul และระบุราคาของแต่ละคัน"
            action={
              <Button iconLeft="add" onClick={() => setPicker(true)}>
                เพิ่มยานพาหนะ
              </Button>
            }
          />
        ) : (
          <>
            {/* B.19 Alert [Color=Warning] — ราคาไม่บังคับตอนบันทึกแผน (T13 เจ้าของงาน) จึงเป็นคำเตือน ไม่บล็อกการบันทึก */}
            {missing.length > 0 && (
              <Alert tone="warning" title="กรุณาระบุราคากลางและราคาประเมิน Overhaul ให้ครบทุกคัน">
                ยังไม่ระบุ {missing.length} คัน
              </Alert>
            )}
            {/* ตารางแบบ A.5 ครบชุด (เจ้าของงาน 13 พ.ย. 2569 · D2) */}
            <VehicleBrowser
              rows={d.vehicles}
              label="ยานพาหนะในแผน"
              toolbarActions={
                /* T1: ปุ่มเพิ่มอยู่ขวามือของปุ่มตัวกรอง · B.18 ปุ่ม "รายงาน" (มติ FigJam Scenario Export แผน: ดาวน์โหลด Excel ทันที) */
                <>
                  <Button variant="secondary" iconLeft="add" onClick={() => setPicker(true)}>
                    เพิ่มยานพาหนะ
                  </Button>
                  <Button variant="secondary" onClick={() => downloadPlanExcel(d.vehicles)}>
                    รายงาน
                  </Button>
                </>
              }
              action={(v) => (
                <RowMenu
                  label={`จัดการ ${v.plate}`}
                  items={[
                    // D3 (เจ้าของงานเคาะ 13 พ.ย. 2569)
                    { label: "ดูข้อมูลยานพาหนะ", icon: "quick_reference_all", onSelect: () => onOpenVehicle(v.plate, "info") },
                    { label: "ดูข้อมูลการซ่อม", icon: "build", onSelect: () => onOpenVehicle(v.plate, "repair") },
                    { label: "ระบุราคา", icon: "payments", onSelect: () => setPriceFor(v) },
                    { label: "ลบยานพาหนะ", icon: "delete", danger: true, onSelect: () => setRemoveFor(v) },
                  ]}
                />
              )}
            />
            {/* EC-03 ยอดรวมราคาประเมินเทียบวงเงินอนุมัติ */}
            <p className={overBudget ? "text-sm text-warning-700" : "text-sm text-gray-600"}>
              รวมราคาประเมิน Overhaul {currency(totalEstimate)} บาท{Number.isFinite(d.budget) ? ` จากวงเงินอนุมัติ ${currency(d.budget)} บาท` : ""}
              {overBudget && " — เกินวงเงินอนุมัติ (รอยืนยัน EC-03 ว่าบล็อกการบันทึกหรือไม่)"}
            </p>
          </>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="เอกสาร" />
        {(
          [
            ["principle", "หนังสืออนุมัติหลักการ", errors.principle, false],
            ["budget", "เอกสารอนุมัติงบ", errors.budgetDoc, false],
            ["other", "เอกสารอื่น ๆ", undefined, true],
          ] as const
        ).map(([k, label, err, optional]) => (
          <Uploader
            key={k}
            label={label}
            optional={optional}
            files={d.docs[k]}
            error={fileError[k] ?? err}
            onAdd={(list) => {
              const bad = list.find((f) => !ACCEPT.test(f.name) || f.size > MAX_MB * 1024 * 1024);
              setFileError((x) => ({ ...x, [k]: bad ? `${bad.name}: รองรับเฉพาะ PDF, JPG หรือ PNG ขนาดไม่เกิน ${MAX_MB} MB` : undefined }));
              const ok = list.filter((f) => ACCEPT.test(f.name) && f.size <= MAX_MB * 1024 * 1024).map((f) => ({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)) }));
              if (ok.length) {
                set("docs", { ...d.docs, [k]: [...d.docs[k], ...ok] });
                // T11: เพิ่มไฟล์ที่ถูกแล้ว ข้อความ "กรุณาแนบ…" ของกลุ่มนั้นหาย
                if (k !== "other")
                  setErrors((x) => {
                    const { [k === "principle" ? "principle" : "budgetDoc"]: _gone, ...rest } = x;
                    return rest;
                  });
              }
            }}
            onRemove={(name) => set("docs", { ...d.docs, [k]: d.docs[k].filter((f) => f.name !== name) })}
          />
        ))}
      </section>

      {/* B.1/C.2 Actions: Secondary lg · Primary lg "บันทึก" (ไม่มีเส้นคั่น) */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" size="lg" onClick={() => requestLeave()}>
          {isNew ? "ย้อนกลับ" : "ยกเลิก" /* B.1 ย้อนกลับ · C.2 ยกเลิก */}
        </Button>
        <Button size="lg" onClick={submit} loading={saving} disabled={incomplete}>
          บันทึก
        </Button>
      </div>

      <VehiclePickerModal
        open={picker}
        onClose={() => setPicker(false)}
        fleet={fleet}
        maxSelect={maxSelect}
        excludePlates={d.vehicles.map((v) => v.plate)}
        onAdd={(picked) => {
          set("vehicles", [...d.vehicles, ...picked.map((v) => ({ plate: v.plate, affiliation: v.affiliation, make: v.make, model: v.model, type: v.type, value: v.value, ageYears: v.ageYears, mileageKm: v.mileageKm, engineHours: v.engineHours, referencePrice: null, overhaulEstimate: null, progress: null }))]);
          setPicker(false);
          onNotify(`เพิ่มยานพาหนะเข้าแผน ${picked.length} คัน`); // B.18
        }}
      />
      <PriceModal
        vehicle={priceFor}
        onClose={() => setPriceFor(null)}
        onSave={(p) => {
          set("vehicles", d.vehicles.map((v) => (v.plate === priceFor?.plate ? { ...v, ...p } : v)));
          const edited = priceFor && !missingPrice(priceFor);
          setPriceFor(null);
          onNotify(edited ? "แก้ไขราคารายคันสำเร็จ" : "ระบุราคาสำเร็จ"); // B.12 ข้อความตรงจอเมื่อแก้ราคาเดิม · ระบุครั้งแรกใช้ "ระบุราคาสำเร็จ" ตามชื่อ modal
        }}
      />
      <ConfirmDialog
        open={!!removeFor}
        danger
        icon="delete"
        title="ลบยานพาหนะออกจากแผน"
        description={removeFor ? `${removeFor.plate} จะถูกนำออกจากแผนนี้ และราคาที่ระบุไว้จะหายไป` : undefined}
        onClose={() => setRemoveFor(null)}
        onConfirm={() => {
          set("vehicles", d.vehicles.filter((v) => v.plate !== removeFor?.plate));
          onNotify(`ลบ ${removeFor?.plate} ออกจากแผนแล้ว`);
          setRemoveFor(null);
        }}
      />
      {leaveDialog}
    </div>
  );
}

/** Figma: `File upload` (`_File upload base` + `_File upload item base`) — กล่องคลิก/ลากวาง + รายการไฟล์ */
export function Uploader({ label, optional, files, error, onAdd, onRemove }: { label: string; optional?: boolean; files: { name: string; sizeKb: number }[]; error?: string; onAdd: (f: File[]) => void; onRemove: (name: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <span className="text-md font-semibold text-gray-600">
        {label} {optional && <span className="font-normal text-gray-400">(ถ้ามี)</span>}
      </span>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onAdd([...e.dataTransfer.files]);
        }}
        className={`flex w-full flex-col items-center gap-3 rounded-lg border p-4 text-center ${over ? "border-brand-800 bg-brand-25" : error ? "border-error-300 bg-white" : "border-gray-300 bg-white"}`}
      >
        {/* _File upload base: Featured icon 36 วงกลม gray-100 · gap 12 · ข้อความ gap 4 */}
        <span className="flex size-9 items-center justify-center rounded-full bg-gray-100">
          <Icon name="cloud_upload" size={24} className="text-gray-500" />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-sm">
            <span className="font-semibold text-brand-900">คลิกเพื่อเลือกไฟล์</span> <span className="text-gray-600">หรือลากไฟล์มาวางบริเวณนี้</span>
          </span>
          <span className="text-xs text-gray-600">PDF, JPG หรือ PNG ขนาดไฟล์ไม่เกิน 10 MB ต่อไฟล์</span>
        </span>
      </button>
      <input
        ref={ref}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          onAdd([...(e.target.files || [])]);
          e.target.value = "";
        }}
      />
      {error && <span className="text-sm text-error-600">{error}</span>}
      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <FileRow key={f.name} file={f} onRemove={() => onRemove(f.name)} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** มติ FigJam (Scenario Export แผน): กด "รายงาน" ดาวน์โหลด Excel ทันที · ชื่อไฟล์ dd/mm/yyyy ค.ศ. (ชื่อไฟล์ใช้ "/" ไม่ได้ → dd-mm-yyyy) ·
 *  ต้นแบบสร้างไฟล์ .xls จากตาราง HTML (คอลัมน์เดียวกับตารางยานพาหนะ) */
export function downloadPlanExcel(vs: PlanVehicle[]) {
  const n = new Date();
  const name = `${String(n.getDate()).padStart(2, "0")}-${String(n.getMonth() + 1).padStart(2, "0")}-${n.getFullYear()}.xls`;
  const esc = (x: string) => x.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
  const head = ["ทะเบียน", "สังกัด", "ยี่ห้อ รุ่น", "ประเภทยานพาหนะ", "มูลค่ายานพาหนะ (บาท)", "ราคากลาง", "ประเมิน Overhaul (บาท)", "อายุการใช้งาน (ปี)"];
  const rows = vs.map((v) => [v.plate, v.affiliation, `${v.make} ${v.model}`, v.type, currency(v.value), v.referencePrice === null ? "-" : currency(v.referencePrice), v.overhaulEstimate === null ? "-" : currency(v.overhaulEstimate), String(v.ageYears)]);
  const html = `<html><head><meta charset="utf-8"></head><body><table><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + html], { type: "application/vnd.ms-excel" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
