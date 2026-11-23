"use client";
/** กระบวนการซ่อมของงานที่ไม่ได้ซ่อมโดย กบค. — ซ่อมศูนย์บริการ/อู่ภายนอก (หน่วยงานต้นทางบันทึก) และซ่อมโดย กรย.
 *  เจ้าของงาน 23 พ.ย. 2569: "คนที่ไม่ใช่ กรย กบค ซ่อมเอง ส่วนใหญ่จะเป็นซ่อมอู่ ต้องมีหน้าบันทึกข้อมูลการซ่อม ทำคล้าย ๆ หน้าจัดการงานซ่อม กรย กบค"
 *  → แท็บ กระบวนการซ่อม แบบขั้น (เหมือนงาน กบค. 7 ขั้น แต่ย่อเหลือ 3): นำรถเข้าซ่อม → ดำเนินการซ่อม (บันทึกความคืบหน้า) → รับรถคืนและปิดงาน
 *  ⚠ UAT ไม่มีหน้าจอนี้ (งานปิดแล้วมีแค่แท็บข้อมูล) — เพิ่มใหม่ · รอยืนยัน */
import { useState } from "react";
import { currency } from "@rules/currency.mjs";
import { Alert } from "@ui/Alert";
import { Button } from "@ui/Button";
import { Combobox } from "@ui/Combobox";
import { DateField } from "@ui/DateField";
import { ProgressSteps } from "@ui/ProgressSteps";
import { TextField } from "@ui/TextField";
import { MoneyField } from "@overhaul/features/plan/VehicleModals";
import { loadGarages } from "../mock/store";
import type { RepairJob, Role } from "./model";
import { Footer, NO_WARRANTY_YET, PhotoSection, ProgressLog, VehiclePanel, WarrantyField, warrantyValid, type Act } from "./ProcessSteps";
import { CostAlert, money } from "./parts";
import { AddedNote, SectionBar, UploadBox } from "./ui";

type Ext = NonNullable<RepairJob["external"]>;
export const GARAGE_FLOW = ["self_repair_in_progress", "ecd_approved_self_repair", "returned_for_self_repair", "waiting_ecd_action"] as const;
export const inGarageFlow = (j: RepairJob) => (GARAGE_FLOW as readonly string[]).includes(j.status) || (j.status === "job_closed" && !!j.external);

const startExt = (j: RepairJob): Ext => j.external ?? {
  garageId: j.requestGarageId, garage: "", doneDate: "", cost: "", mileage: "", files: 0,
  quoteFiles: j.attachments, quote: j.estimateDetail?.method === "garage" ? currency(j.estimateDetail.total) : j.estimate ? currency(j.estimate) : "",
};

export function GarageSteps({ job, mine, act, role }: { job: RepairJob; mine: boolean; act: Act; role: Role }) {
  const ecd = job.status === "waiting_ecd_action" || job.method === "ecd";
  const steps = ecd ? ["นำรถเข้าซ่อม", "ดำเนินการซ่อม", "ส่งคืนรถและปิดงาน"] : ["นำรถเข้าอู่", "ดำเนินการซ่อม", "รับรถคืนและปิดงาน"];
  const closed = job.status === "job_closed";
  const cur = closed ? 4 : job.external?.stage ?? 1;
  const [view, setView] = useState<number | null>(null);
  const viewing = view ?? Math.min(cur, 3);
  const edit = mine && !closed && viewing === cur;
  return (
    <div className="flex flex-col gap-6">
      <ProgressSteps steps={steps} current={cur} viewing={viewing} plainNumbers size="sm" onSelect={(n) => setView(n)} label="ขั้นตอนการซ่อม" />
      <AddedNote>UAT ไม่มีหน้าบันทึกงาน{ecd ? "ที่ กรย. ซ่อมเอง" : "ซ่อมศูนย์บริการ/อู่ภายนอก"} — ต้นแบบทำเป็น 3 ขั้นแบบหน้าจัดการงานซ่อมของ กบค. (รอยืนยัน)</AddedNote>
      {job.status === "returned_for_self_repair" && job.returnReason && <Alert tone="warning" title="ส่งกลับให้ต้นทางซ่อมเอง">{job.returnReason}</Alert>}
      <Body key={`${job.status}-${viewing}-${cur}`} step={viewing} job={job} ecd={ecd} edit={edit} role={role} act={(p, o) => { setView(null); act(p, o); }} />
    </div>
  );
}

function Body({ step, job, ecd, edit, act, role }: { step: number; job: RepairJob; ecd: boolean; edit: boolean; act: Act; role: Role }) {
  const [e, setE] = useState<Ext>(() => startExt(job));
  const [garages] = useState(loadGarages);
  const ro = !edit;
  const keep = job.status === "waiting_ecd_action" ? undefined : "self_repair_in_progress" as const;

  if (step === 1) {
    const ok = !!e.inDate && !!e.inMileage && (ecd || !!e.garageId);
    return (
      <div className="flex flex-col gap-8">
        <VehiclePanel job={job} />
        {!ecd && (
          <section className="flex flex-col gap-4">
            <SectionBar description="เลือกจากรายชื่อ อู่/ศูนย์บริการ · แนบใบเสนอราคาแล้วจึงกรอกราคาประเมิน">ศูนย์บริการ/อู่</SectionBar>
            <div className="md:w-1/2">
              <Combobox
                label="ศูนย์บริการ/อู่"
                placeholder="ค้นหาชื่อศูนย์บริการ/อู่"
                disabled={ro}
                value={e.garageId ?? ""}
                onChange={(id) => setE({ ...e, garageId: id, garage: garages.find((g) => g.id === id)?.name ?? "" })}
                options={garages.map((g) => ({ value: g.id, label: g.name, sub: [g.phone, g.address].filter(Boolean).join(" · "), keywords: g.code }))}
              />
            </div>
            {e.garageId && (
              <div className="flex flex-col gap-2">
                <span className="text-md font-semibold text-black">ใบเสนอราคา <span className="font-normal text-gray-500">(ถ้ามี)</span></span>
                <UploadBox hint="PDF, JPG หรือ PNG ขนาดไฟล์ไม่เกิน 10 MB ต่อไฟล์" count={e.quoteFiles ?? 0} max={10} disabled={ro} onAdd={(n) => setE({ ...e, quoteFiles: (e.quoteFiles ?? 0) + n })} />
              </div>
            )}
            {e.garageId && (e.quoteFiles ?? 0) > 0 && (
              <div className="md:w-1/2"><MoneyField label="ราคาประเมินตามใบเสนอราคา (บาท)" optional placeholder="0.00" value={e.quote ?? ""} onChange={(v) => setE({ ...e, quote: v })} /></div>
            )}
            {e.quote && <CostAlert plate={job.plate} cost={money(e.quote)} basis="ราคาประเมินจากใบเสนอราคา" />}
          </section>
        )}
        <section className="flex flex-col gap-4">
          <SectionBar>{ecd ? "นำรถเข้าซ่อม" : "นำรถเข้าอู่"}</SectionBar>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2"><span className="text-md font-semibold text-gray-600">วันที่นำรถเข้า{ecd ? "ซ่อม" : "อู่"}</span><DateField aria-label="วันที่นำรถเข้า" readOnly={ro} value={e.inDate ?? ""} onChange={(v) => setE({ ...e, inDate: v })} /></div>
            <TextField label="เลขไมล์ก่อนซ่อม" inputMode="numeric" placeholder="ระบุเลขไมล์" readOnly={ro} value={e.inMileage ?? ""} onChange={(x) => setE({ ...e, inMileage: x.target.value.replace(/\D/g, "") })} />
          </div>
        </section>
        <PhotoSection title="รูปสภาพยานพาหนะ (ก่อนซ่อม)" optional note="บันทึกจุดชำรุดก่อนส่งซ่อมเป็นหลักฐาน" count={e.inPhotos ?? 0} readOnly={ro} onAdd={(n) => setE({ ...e, inPhotos: (e.inPhotos ?? 0) + n })} />
        {edit && (
          <Footer>
            <Button disabled={!ok} onClick={() => act({ external: { ...e, stage: 2 } }, { status: keep, log: ecd ? "กรย. นำรถเข้าซ่อม" : `นำรถเข้าอู่ ${e.garage || ""}`.trim(), toast: "บันทึกสำเร็จ" })}>บันทึกและถัดไป</Button>
          </Footer>
        )}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex flex-col gap-8">
        <ProgressLog job={job} edit={edit} act={act} role={role} />
        {edit && (
          <Footer>
            <Button onClick={() => act({ external: { ...e, stage: 3 } }, { log: "ซ่อมเสร็จ", toast: "บันทึกซ่อมเสร็จสำเร็จ" })}>ซ่อมเสร็จ</Button>
          </Footer>
        )}
      </div>
    );
  }

  const ok = !!e.doneDate && !!e.mileage && !!e.cost && money(e.cost) > 0 && (ecd || e.files > 0) && warrantyValid(e.warranty ?? NO_WARRANTY_YET);
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <SectionBar>{ecd ? "ส่งคืนรถ" : "รับรถคืนจากอู่"}</SectionBar>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2"><span className="text-md font-semibold text-gray-600">วันที่ซ่อมเสร็จ/รับรถคืน</span><DateField aria-label="วันที่ซ่อมเสร็จ" readOnly={ro} value={e.doneDate} onChange={(v) => setE({ ...e, doneDate: v })} /></div>
          <TextField label="เลขไมล์หลังซ่อม" inputMode="numeric" placeholder="ระบุเลขไมล์" readOnly={ro} value={e.mileage} onChange={(x) => setE({ ...e, mileage: x.target.value.replace(/\D/g, "") })} />
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <SectionBar description="ใช้เทียบเกณฑ์ค่าซ่อมไม่เกิน 30% ของราคาที่ได้มา">ค่าใช้จ่ายในการซ่อม</SectionBar>
        <div className="md:w-1/2"><MoneyField label="ค่าใช้จ่ายรวม (บาท)" placeholder="0.00" value={e.cost} onChange={(v) => setE({ ...e, cost: v })} /></div>
        {e.cost && <CostAlert plate={job.plate} cost={money(e.cost)} basis={ecd ? "ค่าใช้จ่ายจริง (กรย.)" : "ค่าใช้จ่ายจริงจากศูนย์บริการ/อู่"} />}
        <div className="flex flex-col gap-2">
          <span className="text-md font-semibold text-black">{ecd ? "เอกสารประกอบ" : "ใบเสร็จ/ใบแจ้งหนี้"}{ecd && <span className="font-normal text-gray-500"> (ถ้ามี)</span>}</span>
          <UploadBox hint="PDF, JPG หรือ PNG ขนาดไฟล์ไม่เกิน 10 MB ต่อไฟล์" count={e.files} max={10} disabled={ro} onAdd={(n) => setE({ ...e, files: e.files + n })} />
        </div>
      </section>
      <PhotoSection title="รูปสภาพยานพาหนะ (หลังซ่อม)" optional note="บันทึกสภาพหลังซ่อม" count={e.outPhotos ?? 0} readOnly={ro} onAdd={(n) => setE({ ...e, outPhotos: (e.outPhotos ?? 0) + n })} />
      <section className="flex flex-col gap-4">
        <SectionBar>{ecd ? "การรับประกันงานซ่อมของ กรย." : "การรับประกันของศูนย์บริการ/อู่"}</SectionBar>
        <WarrantyField who={ecd ? "ecd" : "garage"} value={e.warranty} readOnly={ro} onChange={(w) => setE({ ...e, warranty: w })} />
      </section>
      {edit && (
        <Footer>
          <Button disabled={!ok} onClick={() => act({ external: { ...e, warranty: e.warranty ?? NO_WARRANTY_YET } }, { status: "job_closed", log: "บันทึกผลการซ่อม · ปิดงาน", toast: "ปิดงานสำเร็จ", notify: [{ to: "unitHead", text: `ใบแจ้งซ่อม ${job.no} ซ่อมเสร็จและปิดงานแล้ว`, tone: "success" }] })}>บันทึกและปิดงาน</Button>
        </Footer>
      )}
    </div>
  );
}
