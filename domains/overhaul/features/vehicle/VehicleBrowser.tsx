"use client";
/** ตารางยานพาหนะแบบ A.5 ครบชุด — ค้นหา · (ปีงบประมาณ) · ตัวกรอง (A.6) · ไม่แสดงชิปตัวกรอง (เจ้าของงาน 14 พ.ย. 2569: pill มีเฉพาะในตาราง) · ตาราง + เรียง · แบ่งหน้า · ไม่พบ (A.8)
 *  ใช้ร่วม: แท็บยานพาหนะที่ Overhaul (A.5) และตารางยานพาหนะในฟอร์มแผน (เจ้าของงาน 13 พ.ย. 2569 "ต้องเหมือนตารางรถทุกอย่าง")
 *  มติ FigJam: ค้นหา "ทะเบียน, ยี่ห้อ/รุ่น" (ไม่เอาสังกัด) · ความคืบหน้าทศนิยม 1 ตำแหน่ง */
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@ui/Button";
import { CountPill } from "@ui/Badge";
import { EmptyState } from "@ui/EmptyState";
import { Pagination } from "@ui/Pagination";
import { SearchInput } from "@ui/SearchInput";
import { SelectField } from "@ui/SelectField";
import { SidePanel } from "@ui/SidePanel";
import { nextSort, sortRows, VehicleTable, type VehicleRow, type VehicleSortKey } from "./VehicleTable";

type Key = "type" | "make" | "model";
type Filter = Record<Key, string>;
const EMPTY: Filter = { type: "", make: "", model: "" };
const LABEL: Record<Key, string> = { type: "ประเภทยานพาหนะ", make: "ยี่ห้อ", model: "รุ่น" };

export function VehicleBrowser<T extends VehicleRow & { fiscalYear?: number }>({
  rows: all,
  label,
  title,
  action,
  rowKey,
  showYear,
  toolbarExtra,
  toolbarActions,
  hideProgress,
}: {
  rows: T[];
  label: string;
  /** หัวตาราง "ยานพาหนะที่ Overhaul (n)" (A.5) — ฟอร์มแผนใช้ Section header แทน */
  title?: (n: number) => string;
  action?: (v: T) => ReactNode;
  rowKey?: (v: T) => string;
  /** ช่องเลือกปีงบประมาณในแถวเครื่องมือ (A.5) */
  showYear?: boolean;
  toolbarExtra?: ReactNode;
  /** ปุ่มต่อท้ายปุ่มตัวกรอง (เช่น "เพิ่มยานพาหนะ" ในฟอร์มแผน — T1) */
  toolbarActions?: ReactNode;
  /** ไม่มีคอลัมน์ความคืบหน้า (ฟอร์มแผน) */
  hideProgress?: boolean;
}) {
  const [q, setQ] = useState("");
  const [year, setYear] = useState("");
  const [filter, setFilter] = useState<Filter>(EMPTY);
  const [draft, setDraft] = useState<Filter>(EMPTY);
  const [panel, setPanel] = useState(false);
  const [sort, setSort] = useState<{ key: VehicleSortKey; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const years = useMemo(() => [...new Set(all.map((v) => v.fiscalYear).filter((y): y is number => !!y))].sort((a, b) => b - a), [all]);
  const opts = (k: Key, src: T[] = all) => [...new Set(src.map((v) => v[k]))].sort((a, b) => a.localeCompare(b, "th"));

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    const out = all.filter(
      (v) =>
        (!k || [v.plate, `${v.make} ${v.model}`].some((s) => s.toLowerCase().includes(k))) &&
        (!year || String(v.fiscalYear) === year) &&
        (Object.keys(filter) as Key[]).every((f) => !filter[f] || v[f] === filter[f]),
    );
    return sortRows(out, sort); // ไม่มีข้อมูล (null) อยู่ท้ายเสมอ
  }, [all, q, year, filter, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / size));
  const cur = Math.min(page, pages);
  const shown = rows.slice((cur - 1) * size, cur * size);
  const active = (Object.keys(filter) as Key[]).filter((k) => filter[k]);

  return (
    <div className="flex flex-col gap-6">
      {/* Search and filters: Dashboard toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="ค้นหาทะเบียน, ยี่ห้อ/รุ่น"
            aria-label={`ค้นหา${label}`}
            className="w-80 max-md:w-full"
          />
          <div className="ml-auto flex flex-wrap items-center gap-3 max-md:ml-0">
            {toolbarExtra}
            {showYear && (
              <>
                <span className="text-sm font-semibold text-gray-600">ปีงบประมาณ</span>
                <SelectField
                  aria-label="ปีงบประมาณ"
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    setPage(1);
                  }}
                  options={[{ value: "", label: "ทั้งหมด" }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
                  className="w-36"
                />
              </>
            )}
            <Button
              variant="secondary"
              iconLeft="filter_list"
              onClick={() => {
                setDraft(filter);
                setPanel(true);
              }}
            >
              ตัวกรอง
              {active.length > 0 && <CountPill className="ml-1">{active.length}</CountPill>}
            </Button>
            {toolbarActions}
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        /* A.8: Section label "ยานพาหนะที่ Overhaul (0)" อยู่เหนือ Empty state/Search not found */
        <section className="flex flex-col gap-4">
          {title && <h2 className="text-md font-semibold text-black">{title(0)}</h2>}
          <EmptyState kind="search-not-found" title="ไม่พบยานพาหนะตามตัวกรอง" description="เปลี่ยนตัวกรองเพื่อดูข้อมูลยานพาหนะและสรุปใหม่" />
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          {title && <h2 className="text-md font-semibold text-black">{title(rows.length)}</h2>}
          <VehicleTable
            rows={shown}
            label={label}
            hideProgress={hideProgress}
            rowKey={rowKey}
            sort={sort}
            onSort={(k) => {
              setSort((s) => nextSort(s, k));
              setPage(1);
            }}
            action={action}
          />
          <Pagination
            page={cur}
            pageSize={size}
            total={rows.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setSize(s);
              setPage(1);
            }}
          />
        </section>
      )}

      <SidePanel
        open={panel}
        onClose={() => setPanel(false)}
        title="ตัวกรอง"
        description="กรองข้อมูลให้แสดงเฉพาะข้อมูลที่ต้องการ"
        footerLeft={
          <Button variant="tertiaryBrand" onClick={() => setDraft(EMPTY)}>
            ล้างตัวกรอง
          </Button>
        }
        footerRight={
          <>
            <Button variant="secondary" onClick={() => setPanel(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                setFilter(draft);
                setPage(1);
                setPanel(false);
              }}
            >
              ตกลง
            </Button>
          </>
        }
      >
        <SelectField label={LABEL.type} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} options={[{ value: "", label: "ทั้งหมด" }, ...opts("type").map((o) => ({ value: o, label: o }))]} />
        <SelectField label={LABEL.make} value={draft.make} onChange={(e) => setDraft({ ...draft, make: e.target.value, model: "" })} options={[{ value: "", label: "ทั้งหมด" }, ...opts("make").map((o) => ({ value: o, label: o }))]} />
        <SelectField
          label={LABEL.model}
          value={draft.model}
          onChange={(e) => setDraft({ ...draft, model: e.target.value })}
          options={[{ value: "", label: "ทั้งหมด" }, ...opts("model", draft.make ? all.filter((v) => v.make === draft.make) : all).map((o) => ({ value: o, label: o }))]}
        />
      </SidePanel>
    </div>
  );
}
