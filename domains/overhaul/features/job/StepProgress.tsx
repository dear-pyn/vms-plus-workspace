"use client";
/** ขั้น 3 ติดตามงานซ่อม (S9 เพิ่ม · S10 แก้ไข · S11 ลบ · จอ OH2 / J.1–J.3 · K.1–K.3 · L.1–L.3)
 *  component: Section header + ปุ่ม Secondary "ความคืบหน้า" · Empty state/Data empty (J.1) · Table Alternating fills (วันที่ · รายละเอียด · ความคืบหน้า Progress bar Label=Right ·
 *    หมายเหตุ · Tertiary button แก้ไข stylus / ลบ) · Pagination · Modal Form (Text input "ความคืบหน้า (%)" · Card form row รายละเอียด / หมายเหตุ (ถ้ามี)) ·
 *    ลบทันทีตามคำสั่ง submit ล่าสุด 17 พ.ย. 2569 · Secondary lg "ย้อนกลับ" · Primary lg "ซ่อมสำเร็จ"
 *  FigJam Section 13 (refinement 12 พ.ย. 2569): เพิ่มช่อง percent · ฟอร์มไม่มีวันที่/เวลา (ระบบใส่ตอนเพิ่ม) · แก้ไข = พรีฟิลค่าเดิม บันทึกแล้วไม่อัปเดตวันเวลา ·
 *    แก้ได้ตลอดจนกว่าจะกดซ่อมสำเร็จ
 *  เจ้าของงาน 16 พ.ย. 2569: ไม่มีกรอบการ์ดรอบ "รายละเอียดการติดตาม" · ไม่มีข้อความช่วยข้างปุ่ม · ซ่อมสำเร็จได้เมื่อมีรายการใดรายการหนึ่งถึง 100% (D-J1 เดิม) */
import { usePrototypeFill } from "../../prototype/MockTools";
import { useState } from "react";
import { sortProgress } from "./progress-sort.mjs";
import { Icon } from "@ui/Icon";
import { Button } from "@ui/Button";
import { EmptyState } from "@ui/EmptyState";
import { Modal } from "@ui/Modal";
import { SectionHeader } from "@ui/PageHeader";
import { Pagination } from "@ui/Pagination";
import { ProgressBar } from "@ui/ProgressBar";
import { DataTable, Td, Th } from "@ui/Table";
import { TextArea } from "@ui/TextArea";
import { TextField } from "@ui/TextField";
import type { ProgressEntry } from "../po/types";

export type ProgressDraft = Pick<ProgressEntry, "percent" | "detail" | "note">;

/** ซ่อมสำเร็จได้เมื่อมีรายการใดรายการหนึ่งถึง 100% (D-J1: จอ J.3 มี 1 รายการ 40% ปุ่มยังปิด · L.2 มีรายการ 100% ปุ่มเปิด · เจ้าของงานยืนยัน 16 พ.ย. 2569) */
export const canFinish = (log: ProgressEntry[]) => log.some((e) => e.percent >= 100);

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
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  usePrototypeFill((mode) => {
    setForm({ ...(form?.id ? { id: form.id } : {}), percent: "100", detail: mode === "missing" ? "" : mode === "error" ? "error" : "ดำเนินงาน Overhaul เสร็จแล้ว (ข้อมูลจำลอง)", note: "" });
    setErr({});
  }, !readOnly && !busy);
  const [sort, setSort] = useState<{ key: "at" | "percent"; dir: 1 | -1 }>({ key: "at", dir: -1 });
  const currentPage = Math.min(page, Math.max(1, Math.ceil(log.length / size)));
  const sorted = sortProgress(log, sort.key, sort.dir) as ProgressEntry[];
  const shown = sorted.slice((currentPage - 1) * size, currentPage * size);
  function toggleSort(key: "at" | "percent") {
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === -1 ? 1 : -1 }));
    setPage(1);
  }
  function sortHeader(key: "at" | "percent", text: string) {
    return <Th aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={key === "percent" ? "w-48" : undefined}>
      <button type="button" className="flex items-center gap-2 font-semibold" onClick={() => toggleSort(key)}>
        {text}<Icon name={sort.key === key ? (sort.dir === 1 ? "arrow_upward" : "arrow_downward") : "swap_vert"} size={20} className="text-gray-500" />
      </button>
    </Th>;
  }
  const ok = canFinish(log);

  function check(k: string, x = form): string {
    if (!x) return "";
    if (k === "percent") {
      if (!x.percent.trim()) return "กรุณาระบุความคืบหน้า";
      const n = Number(x.percent);
      if (!/^\d+$/.test(x.percent) || !Number.isInteger(n) || n < 0 || n > 100) return "กรุณาระบุจำนวนเต็มตั้งแต่ 0 ถึง 100";
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
      if (!form.id) {
        setSort({ key: "at", dir: -1 });
        setPage(1);
      }
    }
  }

  return (
    <>
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
          <EmptyState kind="data-empty" title="ยังไม่มีความคืบหน้า" description={readOnly ? undefined : "เพิ่มความคืบหน้าอย่างน้อย 1 รายการ และบันทึกถึง 100% ก่อนกด “ซ่อมสำเร็จ”"} />
        ) : (
          <div className="flex flex-col gap-4">
            <DataTable label="รายละเอียดการติดตาม" striped>
              <thead>
                <tr>
                  {sortHeader("at", "วันที่")}
                  <Th>รายละเอียด</Th>
                  {sortHeader("percent", "ความคืบหน้า")}
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
                          {log.length > 1 && <Button variant="tertiary" iconOnly="delete" aria-label={`ลบความคืบหน้า ${e.at}`} disabled={!!busy} onClick={async () => {
                            if (busy) return;
                            setBusy("del");
                            try {
                              if (await onDelete(e.id)) setPage((p) => Math.min(p, Math.max(1, Math.ceil((log.length - 1) / size))));
                            } finally { setBusy(""); }
                          }} />}
                        </div>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <Pagination
              page={currentPage}
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
          <Button size="lg" disabled={!ok || !!busy} loading={busy === "finish"} onClick={async () => {
            if (!ok || busy) return;
            setBusy("finish");
            try { await onFinish(); } finally { setBusy(""); }
          }}>
            ซ่อมสำเร็จ
          </Button>
        )}
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
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.percent}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || (/^\d+$/.test(value) && Number(value) <= 100)) {
                  setForm({ ...form, percent: value });
                  setErr((x) => ({ ...x, percent: "" }));
                }
              }}
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


    </>
  );
}
