"use client";
/** แจ้งซ่อม 4 ขั้น (UAT /maintain-d/repair-utility-vehicle/new · 20 พ.ย. 2569)
 *  1 ข้อมูลยานพาหนะและผู้แจ้ง · 2 อาการเสียและรายละเอียดเหตุการณ์ · 3 อะไหล่ที่แนะนำ · 4 ยืนยันการแจ้งซ่อม
 *  พฤติกรรมที่เห็นใน UAT: เลือกยานพาหนะแล้วมีกล่องสรุป (ทะเบียน · จังหวัด · ช่างคุมรถ) · ยานพาหนะที่มีกระเช้า/เครน มีช่อง "ส่วนที่ต้องการแจ้งซ่อม" ·
 *    ช่องเอกสารแนบแสดงเฉพาะ "ซ่อมศูนย์บริการ/อู่" · ช่องตามงบ: หน่วยงานอื่น = ศูนย์ต้นทุน · งบลงทุน = WBS/โครงข่าย/กิจกรรม · อื่น ๆ = โปรดระบุเหตุผล ·
 *    ส่งอนุมัติ → กล่อง "ยืนยันการส่งอนุมัติ" → การ์ดส่งเรื่องเรียบร้อย + toast "แจ้งซ่อมสำเร็จ"
 *  pending: ช่องบังคับของขั้น 1–2 (UAT ไม่แสดงข้อความ error ใต้ช่อง แค่ปิดปุ่มต่อไป) */
import { useState } from "react";
import { Button } from "@ui/Button";
import { CheckboxRow } from "@ui/Checkbox";
import { Combobox } from "@ui/Combobox";
import { Icon } from "@ui/Icon";
import { Modal } from "@ui/Modal";
import { PageHeader } from "@ui/PageHeader";
import { ProgressSteps } from "@ui/ProgressSteps";
import { SelectField } from "@ui/SelectField";
import { TextArea } from "@ui/TextArea";
import { TextField } from "@ui/TextField";
import { cx } from "@ui/cx";
import { BUDGETS, COST_CENTERS, SYMPTOMS, VEHICLES, personOf, vehicleOf, type BudgetType } from "../mock/data";
import { nowBE, todayBE, type PartLine, type RepairJob } from "./model";
import { PartsPicker } from "./parts";
import { RequestSummary } from "./RequestSummary";
import { MultiSelect, PersonPicker, UploadBox } from "./ui";

const STEPS = ["ข้อมูลยานพาหนะและผู้แจ้ง", "อาการเสียและรายละเอียดเหตุการณ์", "อะไหล่ที่แนะนำ", "ยืนยันการแจ้งซ่อม"];

export interface Draft {
  plate: string; carUsable: boolean; requestMode: "self" | "med"; repairParts: ("chassis" | "equipment")[]; attachments: number;
  budget: RepairJob["budget"] | { type: "" }; reporterId: string; receiverId: string;
  symptoms: string[]; otherSymptom: string; mileage: string; hours: string; photos: number; note: string; parts: PartLine[];
}
export const newDraft = (): Draft => ({ plate: "", carUsable: true, requestMode: "self", repairParts: [], attachments: 0, budget: { type: "" }, reporterId: "p1", receiverId: "", symptoms: [], otherSymptom: "", mileage: "", hours: "", photos: 0, note: "", parts: [] });

function toJob(d: Draft): RepairJob {
  return {
    id: "draft", no: "-", createdAt: todayBE(), updatedAt: todayBE(), status: "waiting_unit_head_approval", plate: d.plate, carUsable: d.carUsable, requestMode: d.requestMode,
    repairParts: d.repairParts, attachments: d.attachments, budget: d.budget as RepairJob["budget"], reporterId: d.reporterId, receiverId: d.receiverId, symptoms: d.symptoms,
    otherSymptom: d.otherSymptom, mileage: Number(d.mileage || 0), hours: Number(d.hours || 0), photos: d.photos, note: d.note, requestedParts: d.parts,
    history: [{ at: nowBE(), byId: d.reporterId, detail: "แจ้งซ่อม" }],
  };
}

export function RepairNew({ draft, setDraft, onSubmit, onList, onBack }: { draft: Draft; setDraft: (d: Draft) => void; onSubmit: (j: RepairJob) => string; onList: () => void; onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [ask, setAsk] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const d = draft;
  const set = (p: Partial<Draft>) => setDraft({ ...d, ...p });
  const v = d.plate ? vehicleOf(d.plate) : null;
  const b = d.budget;
  const budgetOk = b.type !== "" && (b.type !== "other" || !!b.costCenter) && (b.type !== "invest" || (!!b.wbs && !!b.network && !!b.activity)) && (b.type !== "etc" || !!b.reason?.trim());
  const ok1 = !!v && budgetOk && !!d.receiverId && (!v.crane || d.repairParts.length > 0);
  const ok2 = d.symptoms.length > 0 || !!d.otherSymptom.trim();
  const next = () => { setStep((s) => s + 1); window.scrollTo({ top: 0 }); };

  if (done) {
    const head = personOf("p3");
    return (
      <div className="flex flex-col gap-6 px-8 py-6 max-md:px-4">
        <ProgressSteps steps={STEPS} current={5} plainNumbers size="sm" />
        <div className="mx-auto flex w-full max-w-120 flex-col items-center gap-4 rounded-xl border border-gray-200 px-8 py-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success-50 text-success-600"><Icon name="check_circle" size={32} /></span>
          <p className="text-sm text-gray-700">ส่งเรื่องเรียบร้อย เลขที่ใบแจ้งซ่อม</p>
          <p className="text-xl font-semibold text-black">{done}</p>
          <span className="rounded-full border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-900">ส่งขออนุมัติแล้ว — รอ {head?.name} อนุมัติ</span>
          <p className="text-xs text-gray-600">ใบแจ้งซ่อมจะยังไม่เดินต่อจนกว่าหัวหน้าจะอนุมัติ · เมื่ออนุมัติแล้วจะไปยัง &quot;งานคัดแยก กรย.&quot; อัตโนมัติ</p>
          <Button block onClick={onList}>ดูสถานะเรื่องของฉัน</Button>
          <Button block variant="secondary" onClick={() => { setDraft(newDraft()); setStep(1); setDone(null); }}>แจ้งซ่อมเรื่องใหม่</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-8 py-6 max-md:px-4">
      <PageHeader crumbs={[{ label: "จัดการงานซ่อม", onClick: onList }, { label: "แจ้งซ่อม" }]} title={<span className="text-xl">แจ้งซ่อม</span>} />
      <ProgressSteps steps={STEPS} current={step} plainNumbers size="sm" onSelect={(n) => n < step && setStep(n)} label="ขั้นตอนการแจ้งซ่อม" />

      {step === 1 && (
        <div className="flex flex-col gap-5 pt-4">
          <Combobox
            label="ยานพาหนะ"
            value={d.plate}
            onChange={(p) => set({ plate: p, repairParts: [] })}
            placeholder="ค้นหายานพาหนะด้วยหมายเลขทะเบียน"
            options={VEHICLES.map((x) => ({ value: x.plate, label: `${x.plate} ${x.province} ${x.brand} ${x.model}` }))}
          />
          {v && (
            <dl className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-6 md:grid-cols-3" aria-label="สรุปข้อมูลยานพาหนะ">
              {[["ทะเบียน", `${v.plate} ${v.province}`], ["จังหวัด", v.province], ["ช่างคุมรถ", v.mechanic || "-"]].map(([k, val]) => (
                <div key={k} className="flex flex-col gap-1"><dt className="text-sm font-semibold text-black">{k}</dt><dd className="text-sm text-gray-700">{val}</dd></div>
              ))}
            </dl>
          )}
          <div className={cx("grid grid-cols-1 gap-5", v?.crane ? "md:grid-cols-3" : "md:grid-cols-[1fr_2fr]")}>
            <RadioRow label="สถานะรถตอนนี้" value={d.carUsable ? "1" : "0"} onChange={(x) => set({ carUsable: x === "1" })} options={[["1", "ใช้งานได้"], ["0", "ใช้งานไม่ได้"]]} />
            <RadioRow label="รูปแบบการซ่อม" value={d.requestMode} onChange={(x) => set({ requestMode: x as Draft["requestMode"] })} options={[["self", "ซ่อมศูนย์บริการ/อู่"], ["med", "ซ่อมโดย กบค."]]} />
            {v?.crane && (
              <div className="flex flex-col gap-3">
                <span className="text-md font-semibold text-black">ส่วนที่ต้องการแจ้งซ่อม</span>
                <div className="flex flex-wrap gap-6">
                  {(["chassis", "equipment"] as const).map((p) => (
                    <CheckboxRow key={p} checked={d.repairParts.includes(p)} onChange={(on) => set({ repairParts: on ? [...d.repairParts, p] : d.repairParts.filter((x) => x !== p) })}>
                      {p === "chassis" ? "ตัวรถ" : v.type.includes("เครน") ? "เครน" : "กระเช้าแก้ไฟ"}
                    </CheckboxRow>
                  ))}
                </div>
              </div>
            )}
          </div>
          {d.requestMode === "self" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-md font-semibold text-black">เอกสารแนบ (ซ่อมศูนย์บริการ/อู่) <span className="font-normal text-gray-500">(ถ้ามี)</span></span>
                <span className="text-xs text-gray-600">({d.attachments}/10)</span>
              </div>
              <UploadBox hint="PDF, JPG หรือ PNG ขนาดไฟล์ไม่เกิน 10 MB ต่อไฟล์" count={d.attachments} max={10} onAdd={(n) => set({ attachments: d.attachments + n })} />
            </div>
          )}
          <div className={cx("grid grid-cols-1 gap-5", b.type === "invest" ? "md:grid-cols-[2fr_1fr_1fr_1fr]" : b.type && b.type !== "own" && b.type !== "maint" ? "md:grid-cols-2" : "")}>
            <SelectField label="งบที่ตัด" icon="paid" placeholder="เลือกงบที่ตัด" value={b.type} onChange={(e) => set({ budget: { type: e.target.value as BudgetType } })} options={BUDGETS.map((x) => ({ value: x.value, label: x.label }))} />
            {b.type === "other" && <SelectField label="ศูนย์ต้นทุน" icon="account_balance" placeholder="เลือกศูนย์ต้นทุน" value={b.costCenter ?? ""} onChange={(e) => set({ budget: { ...b, costCenter: e.target.value } })} options={COST_CENTERS.map((c) => ({ value: c, label: c }))} />}
            {b.type === "invest" && (
              <>
                <TextField label="เลขที่ WBS" placeholder="ระบุเลขที่ WBS" value={b.wbs ?? ""} onChange={(e) => set({ budget: { ...b, wbs: e.target.value } })} />
                <TextField label="เลขที่โครงข่าย" placeholder="ระบุเลขที่โครงข่าย" value={b.network ?? ""} onChange={(e) => set({ budget: { ...b, network: e.target.value } })} />
                <TextField label="เลขที่กิจกรรม" placeholder="ระบุเลขที่กิจกรรม" value={b.activity ?? ""} onChange={(e) => set({ budget: { ...b, activity: e.target.value } })} />
              </>
            )}
            {b.type === "etc" && <TextField label="โปรดระบุเหตุผล" placeholder="ระบุเหตุผล" value={b.reason ?? ""} onChange={(e) => set({ budget: { ...b, reason: e.target.value } })} />}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PersonPicker label="ผู้แจ้งเหตุ" value={d.reporterId} onChange={(x) => set({ reporterId: x })} />
            <PersonPicker label="ผู้รับแจ้งเหตุ" info={{ title: "ผู้รับแจ้งเหตุ", text: "หัวหน้างาน / ผู้ควบคุมดูแลยานพาหนะที่รับแจ้ง" }} value={d.receiverId} onChange={(x) => set({ receiverId: x })} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5 pt-4">
          <h2 className="text-md font-semibold text-black">อาการเสีย</h2>
          <div className="flex flex-col gap-2 md:w-1/2">
            <span className="text-md font-semibold text-black">ระบบเครนและอุปกรณ์พิเศษ <span className="font-normal text-gray-500">(ถ้ามี)</span></span>
            <MultiSelect value={d.symptoms} onChange={(s) => set({ symptoms: s })} options={SYMPTOMS} placeholder="ค้นหาหรือเลือกอาการ" />
          </div>
          <TextArea label="อาการเสียอื่น ๆ" optional rows={4} placeholder="ระบุอาการเสียอื่น ๆ (หากไม่มีในตัวเลือก)" value={d.otherSymptom} onChange={(e) => set({ otherSymptom: e.target.value })} />
          <h2 className="pt-4 text-md font-semibold text-black">รายละเอียดเหตุการณ์</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField label="เลขไมล์ปัจจุบัน" optional inputMode="numeric" placeholder="ระบุเลขไมล์ปัจจุบัน" value={d.mileage} onChange={(e) => set({ mileage: e.target.value.replace(/\D/g, "") })} />
            <TextField label="ชั่วโมงใช้งานเครื่องจักร" optional inputMode="numeric" placeholder="ระบุชั่วโมงใช้งานเครื่องจักร" value={d.hours} onChange={(e) => set({ hours: e.target.value.replace(/\D/g, "") })} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-md font-semibold text-black">รูปภาพเหตุการณ์ <span className="font-normal text-gray-500">(ถ้ามี)</span></span>
            <UploadBox hint="PNG, JPG, GIF หรือ WebP (สูงสุด 20 ไฟล์)" count={d.photos} max={20} onAdd={(n) => set({ photos: d.photos + n })} />
          </div>
          <TextArea label="หมายเหตุ" optional rows={4} placeholder="ระบุหมายเหตุ" value={d.note} onChange={(e) => set({ note: e.target.value })} />
        </div>
      )}

      {step === 3 && (
        <div className="pt-4">
          <PartsPicker lines={d.parts} onChange={(p) => set({ parts: p })} />
        </div>
      )}

      {step === 4 && <div className="pt-4"><RequestSummary job={toJob(d)} receiverFull /></div>}

      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => (step === 1 ? onBack() : setStep(step - 1))}>ย้อนกลับ</Button>
        {step < 4 ? (
          <Button disabled={(step === 1 && !ok1) || (step === 2 && !ok2)} onClick={next}>ต่อไป</Button>
        ) : (
          <Button onClick={() => setAsk(true)}>ส่งอนุมัติ</Button>
        )}
      </div>

      <Modal
        open={ask}
        onClose={() => setAsk(false)}
        variant="centered"
        icon="send"
        title="ยืนยันการส่งอนุมัติ"
        description="คุณต้องการยืนยันคำขอนี้หรือไม่ ?"
        cancelLabel="ไม่ใช่ตอนนี้"
        confirmLabel="อนุมัติคำขอ"
        footerAlign="fill"
        onConfirm={() => { setAsk(false); setDone(onSubmit(toJob(d))); }}
      />
    </div>
  );
}

function RadioRow({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-md font-semibold text-black">{label}</legend>
      <div className="flex flex-wrap gap-4">
        {options.map(([val, text]) => (
          <label key={val} className="flex cursor-pointer items-center gap-2 text-md text-black">
            <input type="radio" className="peer sr-only" checked={value === val} onChange={() => onChange(val)} />
            <span aria-hidden className={cx("flex size-5 items-center justify-center rounded-full border-2 peer-focus-visible:shadow-ring", value === val ? "border-brand-900 bg-brand-900" : "border-gray-300 bg-white")}>
              {value === val && <span className="size-2 rounded-full bg-white" />}
            </span>
            {text}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
