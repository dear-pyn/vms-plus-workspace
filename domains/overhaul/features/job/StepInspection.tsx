"use client";
/** ขั้น 4 ตรวจสภาพ (S12 · จอ OH2 / M.1–M.2)
 *  component: Section header "เอกสารแนบ" · File upload Type=Default (เอกสาร Safety Inspection (ถ้ามี) · เอกสารอื่น ๆ (ถ้ามี)) ·
 *    File upload Type=Gallery (รูปสภาพรถ — FigJam) · Secondary lg "ย้อนกลับ" · Primary lg "ยืนยันการตรวจสภาพ"
 *  FigJam Section 14 (refinement 12 พ.ย. 2569): เพิ่ม upload "เอกสารอื่น ๆ" และ "รูปสภาพรถ" รูปภาพเหมือนขั้น 2 (ไม่จำกัดจำนวน 10 MB/ไฟล์ "จำนวน n ไฟล์") */
import { usePrototypeFill } from "../../prototype/MockTools";
import { mockFile } from "../../prototype/fixtures";
import { useMemo, useState } from "react";
import { Button } from "@ui/Button";
import { SectionHeader } from "@ui/PageHeader";
import { ACCEPT, MAX_MB, Uploader } from "../plan/PlanForm";
import { FileRow } from "../plan/PlanDetail";
import { PhotoUploader } from "../shared/PhotoUploader";
import { useLeaveGuard } from "../shared/useLeaveGuard";
import type { Inspection } from "../po/types";
import type { PlanFile } from "../plan/types";

const MAX_FILES = 10;
type Docs = Omit<Inspection, "confirmedAt">;

export function StepInspection({ inspection, readOnly, onBack, onConfirm }: { inspection?: Inspection; readOnly?: boolean; onBack: () => void; onConfirm: (d: Docs) => Promise<boolean> }) {
  const init = useMemo<Docs>(() => ({ safety: inspection?.safety ?? [], other: inspection?.other ?? [], photos: inspection?.photos ?? [] }), [inspection]);
  const [d, setD] = useState<Docs>(init);
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  usePrototypeFill((mode) => {
    setD({ safety: mode === "missing" ? [] : [mockFile(mode === "error" ? "error" : "safety")], other: [], photos: d.photos });
    setErr({});
  }, !readOnly && !busy);
  const dirty = !readOnly && JSON.stringify(d) !== JSON.stringify(init);
  const { requestLeave, runSave, dialog } = useLeaveGuard(dirty, onBack);

  function add(k: "safety" | "other", list: File[]) {
    const bad = list.find((f) => !ACCEPT.test(f.name) || f.size > MAX_MB * 1024 * 1024);
    const ok: PlanFile[] = list.filter((f) => ACCEPT.test(f.name) && f.size <= MAX_MB * 1024 * 1024).map((f) => ({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)) }));
    const room = MAX_FILES - d[k].length;
    setErr((e) => ({ ...e, [k]: bad ? `${bad.name}: รองรับเฉพาะ PDF, JPG หรือ PNG ขนาดไม่เกิน ${MAX_MB} MB` : ok.length > room ? `แนบได้ไม่เกิน ${MAX_FILES} ไฟล์` : "" }));
    setD({ ...d, [k]: [...d[k], ...ok.filter((f) => !d[k].some((x) => x.name === f.name)).slice(0, Math.max(0, room))] });
  }
  const remove = (k: "safety" | "other", name: string) => setD({ ...d, [k]: d[k].filter((f) => f.name !== name) });

  if (readOnly) {
    const list = (label: string, files: PlanFile[]) => (
      <div className="flex flex-col gap-3">
        <span className="text-md font-semibold text-gray-600">{label}</span>
        {files.length ? <ul className="flex flex-col gap-2">{files.map((f) => <FileRow key={f.name} file={f} />)}</ul> : <span className="text-md text-gray-600">ไม่มีเอกสาร</span>}
      </div>
    );
    return (
      <>
        <section className="flex flex-col gap-6">
          <SectionHeader title="เอกสารแนบ" description={inspection?.confirmedAt ? `ยืนยันการตรวจสภาพแล้ว ${inspection.confirmedAt}` : undefined} />
          {list("เอกสาร Safety Inspection", init.safety)}
          {list("เอกสารอื่น ๆ", init.other)}
          <PhotoUploader label="รูปสภาพยานพาหนะ (หลัง Overhaul)" photos={init.photos} readOnly />
        </section>
        <div className="flex justify-start">
          <Button variant="secondary" size="lg" onClick={onBack}>
            ย้อนกลับ
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-6">
        <SectionHeader title="เอกสารแนบ" />
        <Uploader label="เอกสาร Safety Inspection" optional files={d.safety} error={err.safety || undefined} onAdd={(l) => add("safety", l)} onRemove={(n) => remove("safety", n)} />
        <Uploader label="เอกสารอื่น ๆ" optional files={d.other} error={err.other || undefined} onAdd={(l) => add("other", l)} onRemove={(n) => remove("other", n)} />
        </section>
      <section className="flex flex-col gap-4">
        <SectionHeader title="รูปสภาพยานพาหนะ (หลัง Overhaul)" />
        <PhotoUploader label="รูปสภาพยานพาหนะ (หลัง Overhaul)" optional photos={d.photos} disabled={busy} onBusyChange={setUploading} onChange={(photos) => setD((prev) => ({ ...prev, photos }))} />
      </section>
      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" size="lg" onClick={() => requestLeave()}>
          ย้อนกลับ
        </Button>
        <Button
          size="lg"
          loading={busy}
          disabled={uploading}
          onClick={async () => {
            setBusy(true);
            await runSave(() => onConfirm(d), () => false);
            setBusy(false);
          }}
        >
          ยืนยันการตรวจสภาพ
        </Button>
      </div>
      {dialog}
    </>
  );
}
