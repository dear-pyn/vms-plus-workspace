"use client";
/** ขั้น 3 ติดตามงานซ่อม (S9 เพิ่ม · S10 แก้ไข · S11 ลบ · จอ OH2 / J.1–J.3 · K.1–K.3 · L.1–L.3)
 *  component: Section header + ปุ่ม Secondary "ความคืบหน้า" · Empty state/Data empty (J.1) · Table Alternating fills (วันที่ · รายละเอียด · ความคืบหน้า Progress bar Label=Right ·
 *    หมายเหตุ · Tertiary button แก้ไข stylus / ลบ) · Pagination · Modal Form (Text input "ความคืบหน้า (%)" · Card form row รายละเอียด / หมายเหตุ (ถ้ามี)) ·
 *    Modal Destructive centered (L.2 ยืนยันการลบ) · Secondary lg "ย้อนกลับ" · Primary lg "ซ่อมสำเร็จ"
 *  FigJam Section 13 (refinement 12 พ.ย. 2569): เพิ่มช่อง percent · ฟอร์มไม่มีวันที่/เวลา (ระบบใส่ตอนเพิ่ม) · แก้ไข = พรีฟิลค่าเดิม บันทึกแล้วไม่อัปเดตวันเวลา ·
 *    แก้ได้ตลอดจนกว่าจะกดซ่อมสำเร็จ
 *  ภาพ UAT 16 พ.ย. 2569: ทั้งขั้น (หัว + ตาราง/Empty state + ปุ่มท้าย) อยู่ในการ์ดกรอบ gray-200 r-lg pad 24 · ข้อความ Empty state ตรงภาพ ·
 *    ไม่มีข้อความช่วยข้างปุ่ม · ซ่อมสำเร็จได้เมื่อมีความคืบหน้าอย่างน้อย 1 รายการ (แทน D-J1 "ต้องถึง 100%") */
import { useState } from "react";
import { Button } from "@ui/Button";
import { EmptyState } from "@ui/EmptyState";
import { ConfirmDialog, Modal } from "@ui/Modal";
import { SectionHeader } from "@ui/PageHeader";
import { Pagination } from "@ui/Pagination";
import { ProgressBar } from "@ui/ProgressBar";
import { DataTable, Td, Th } from "@ui/Table";
import { TextArea } from "@ui/TextArea";
import { TextField } from "@ui/TextField";
import type { ProgressEntry } from "../po/types";

export type ProgressDraft = Pick<ProgressEntry, "percent" | "detail" | "note">;

/** ซ่อมสำเร็จได้เมื่อมีความคืบหน้าอย่างน้อย 1 รายการ — ภาพ UAT 16 พ.ย. 2569 "เพิ่มความคืบหน้าอย่างน้อย 1 รายการก่อนกด “ซ่อมสำเร็จ”"
 *  (เดิม D-J1 ต้องมีรายการถึง 100% ตามจอ J.3/L.2) */
export const canFinish = (log: ProgressEntry[]) => log.length > 0;

export function StepProgress({
  log, readOnly, onBack, onSave, onDelete, onFinish,
}: {
  log: ProgressEntry[];
  readOnly?: boolean;
  onBack: () => void;
  /** id ว่าง = เพิ่มใหม่ */
  onSave: (d: ProgressDraft, id?: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onFinish: () => Promise<boolean>;
}) {
  const [form, setForm] = useState<{ id?: string; percent: string; detail: string; note: string } | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [del, setDel] = useState<ProgressEntry | null>(null);
  const [askFinish, setAskFinish] = useState(false);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const shown = log.slice((page - 1) * size, page * size);
  const ok = canFinish(log);

  function check(k: string, x = form): string {
    if (!x) return "";
    if (k === "percent") {
      if (!x.percent.trim()) return "กรุณาระบุความคืบหน้า";
      const n = Number(x.percent);
      if (!/^\d+(\.\d)?$/.test(x.percent.trim()) || n < 0 || n > 100) return "กรุณาระบุตัวเลข 0-100 (ทศนิยมได้ 1 ตำแหน่ง)";
    }
    if (k === "detail" && !x.detail.trim()) return "กรุณาระบุรายละเอียด";
    return "";
  }
  async function save() {
    if (!form) return;
    const e = { percent: check("percent"), detail: check("detail") };
    setErr(e);
    if (e.percent || e.detail) return;
    setBusy("save");
    const done = await onSave({ percent: Number(form.percent), detail: form.detail.trim(), note: form.note.trim() }, form.id);
    setBusy("");
    if (done) {
      setForm(null);
      if (!form.id) setPage(Math.ceil((log.length + 1) / size));
    }
  }

  return (
    <>
      {/* การ์ดครอบทั้งขั้นตามภาพ UAT (ไม่มี Card ใน packages/ui — ใช้ utility) */}
      <div className="flex flex-col gap-8 rounded-lg border border-gray-200 bg-white p-6">
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="รายละเอียดการติดตาม"
          actions={
            !readOnly && (
              <Button
                variant="secondary"
                iconLeft="add"
                onClick={() => {
                  setErr({});
                  setForm({ percent: "", detail: "", note: "" });
                }}
              >
                ความคืบหน้า
              </Button>
            )
          }
        />
        {log.length === 0 ? (
          <EmptyState kind="data-empty" title="ยังไม่มีความคืบหน้า" description={readOnly ? undefined : "เพิ่มความคืบหน้าอย่างน้อย 1 รายการก่อนกด “ซ่อมสำเร็จ”"} />
        ) : (
          <div className="flex flex-col gap-4">
            <DataTable label="รายละเอียดการติดตาม" striped>
              <thead>
                <tr>
                  <Th>วันที่</Th>
                  <Th>รายละเอียด</Th>
                  <Th className="w-48">ความคืบหน้า</Th>
                  <Th>หมายเหตุ</Th>
                  {!readOnly && <Th className="w-28"><span className="sr-only">จัดการ</span></Th>}
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => (
                  <tr key={e.id}>
                    <Td className="whitespace-nowrap">{e.at} น.</Td>
                    <Td className="whitespace-normal">{e.detail}</Td>
                    <Td>
                      <ProgressBar value={e.percent} tone="info" decimals={1} />
                    </Td>
                    <Td className="whitespace-normal">{e.note || "-"}</Td>
                    {!readOnly && (
                      <Td>
                        <div className="flex justify-end">
                          <Button
                            variant="tertiary"
                            iconOnly="stylus"
                            aria-label={`แก้ไขความคืบหน้า ${e.at}`}
                            onClick={() => {
                              setErr({});
                              setForm({ id: e.id, percent: String(e.percent), detail: e.detail, note: e.note });
                            }}
                          />
                          {/* L.1/L.3: ลบได้เมื่อมี 2 รายการขึ้นไป */}
                          {log.length > 1 && <Button variant="tertiary" iconOnly="delete" aria-label={`ลบความคืบหน้า ${e.at}`} onClick={() => setDel(e)} />}
                        </div>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <Pagination
              page={page}
              pageSize={size}
              total={log.length}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setSize(s);
                setPage(1);
              }}
            />
          </div>
        )}
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3" /* จอไม่มีเส้นคั่น */>
        <Button variant="secondary" size="lg" onClick={onBack}>
          ย้อนกลับ
        </Button>
        {!readOnly && (
          <Button size="lg" disabled={!ok} onClick={() => setAskFinish(true)}>
            ซ่อมสำเร็จ
          </Button>
        )}
      </div>
      </div>
      <Modal
        open={!!form}
        title={form?.id ? "แก้ไขความคืบหน้า" : "เพิ่มความคืบหน้า"}
        onClose={() => setForm(null)}
        confirmLabel="บันทึก"
        confirmLoading={busy === "save"}
        onConfirm={save}
      >
        {form && (
          <div className="flex flex-col gap-3">
            {/* เจ้าของงานสั่ง 16 พ.ย. 2569: ความคืบหน้า (%) อยู่บนสุด → รายละเอียด (Text area) → หมายเหตุ (Text input) (เดิม K.2 ไว้ท้ายสุด) */}
            <TextField
              label="ความคืบหน้า (%)"
              placeholder="ระบุตัวเลข 0-100"
              inputMode="decimal"
              value={form.percent}
              onChange={(e) => setForm({ ...form, percent: e.target.value })}
              onBlur={() => setErr((x) => ({ ...x, percent: check("percent") }))}
              error={err.percent || undefined}
            />
            <TextArea
              label="รายละเอียด"
              placeholder="ระบุรายละเอียด"
              value={form.detail}
              onChange={(e) => setForm({ ...form, detail: e.target.value })}
              onBlur={() => setErr((x) => ({ ...x, detail: check("detail") }))}
              error={err.detail || undefined}
            />
            <TextField label="หมายเหตุ" optional placeholder="ระบุหมายเหตุ" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={!!del}
        danger
        icon="delete"
        title="ยืนยันการลบ"
        description="เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่" /* L.2 ตรงจอ */
        loading={busy === "del"}
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          setBusy("del");
          const done = await onDelete(del.id);
          setBusy("");
          if (done) {
            setDel(null);
            setPage((p) => Math.min(p, Math.max(1, Math.ceil((log.length - 1) / size))));
          }
        }}
      />
      <ConfirmDialog
        open={askFinish}
        icon="build_circle"
        title="ยืนยันซ่อมสำเร็จ"
        description="เมื่อยืนยันแล้วจะแก้ไขหรือลบความคืบหน้าไม่ได้ ระบบจะไปขั้นตรวจสภาพ"
        loading={busy === "finish"}
        onClose={() => setAskFinish(false)}
        onConfirm={async () => {
          setBusy("finish");
          const done = await onFinish();
          setBusy("");
          if (done) setAskFinish(false);
        }}
      />
    </>
  );
}
