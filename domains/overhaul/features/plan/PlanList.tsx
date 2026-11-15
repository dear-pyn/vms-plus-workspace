"use client";
/** หน้ารายการแผน Overhaul — Scene A (refinement sprint 09): A.1 รายการ · A.2 ตัวกรอง · A.3 ค้นไม่เจอ · A.4 ยังไม่มีแผน
 *  + เมนูแถวของ S2/S3 (C.1 · D.1.1)
 *  ลำดับแหล่ง (docs/WORKFLOW.md): หน้าตา = จอ Figma (dump figma-overhaul-refinement-09) · FigJam refinement 09 ไม่มีมติของ Scene A ·
 *  พฤติกรรม = AC หน้า 1 (Maintenance-Request-Form/Diagram/01-บำรุงรักษาตามวาระ/18-overhaul-AC-หน้า1-รายการแผน.md)
 *  จุดที่ Figma กับ AC ขัดกัน → ยึด Figma (ใหม่กว่า) และจดไว้ใน public/content/overhaul-scene-a/requirements.md
 *  component: Page header · Tab item · Table header · Table (Alternating fills) · Table cell Lead Progress Bar · Pill outline ·
 *  Dropdown menu · Table pagination · Side panel (A.2) · Checkbox with description/badge · Input dropdown · Empty state */
import { useMemo, useState } from "react";
import { Button } from "@ui/Button";
import { CountPill, Pill } from "@ui/Badge";
import { CheckboxRow } from "@ui/Checkbox";
import { EmptyState } from "@ui/EmptyState";
import { Icon } from "@ui/Icon";
import { Pagination } from "@ui/Pagination";
import { ProgressBar } from "@ui/ProgressBar";
import { RowMenu } from "@ui/RowMenu";
import { SearchInput } from "@ui/SearchInput";
import { SelectField } from "@ui/SelectField";
import { PanelSection, SidePanel } from "@ui/SidePanel";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { currency } from "@rules/currency.mjs";
import { budgetCode, type Plan, type PlanStatus } from "./types";
import { statusTone } from "./status";

export interface PlanListProps {
  plans: Plan[];
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  /** ปุ่มที่อยู่นอกขอบเขตต้นแบบรอบนี้ */
  onNotInScope: (what: string) => void;
}

/** ช่วงงบประมาณตามจอ A.2 (ข้อความตรงตัว) */
const BUDGET_RANGES: Array<{ id: string; label: string; test: (b: number) => boolean }> = [
  { id: "lt1", label: "น้อยกว่า 1,000,000.00", test: (b) => b < 1_000_000 },
  { id: "1-5", label: "มากกว่า 1,000,000.00 - 5,000,000.00", test: (b) => b >= 1_000_000 && b <= 5_000_000 },
  { id: "5-10", label: "มากกว่า 5,000,000.00 - 10,000,000.00", test: (b) => b > 5_000_000 && b <= 10_000_000 },
  { id: "10-15", label: "มากกว่า 10,000,000.00 - 15,000,000.00", test: (b) => b > 10_000_000 && b <= 15_000_000 },
  { id: "15-20", label: "มากกว่า 15,000,000.00 - 20,000,000.00", test: (b) => b > 15_000_000 && b <= 20_000_000 },
  { id: "gt20", label: "มากกว่า 20,000,000.00", test: (b) => b > 20_000_000 },
];
const STATUSES: PlanStatus[] = ["รอเลข Purchase Order", "รอดำเนินการ", "เสร็จสิ้น"];

interface Filter {
  year: string;
  budgets: string[];
  statuses: PlanStatus[];
}
const EMPTY: Filter = { year: "", budgets: [], statuses: [] };
const filterCount = (f: Filter) => (f.year ? 1 : 0) + (f.budgets.length ? 1 : 0) + (f.statuses.length ? 1 : 0);

type SortKey = "id" | "budgetType" | "status";

export function PlanList({ plans, onOpen, onEdit, onDelete, onCreate, onNotInScope }: PlanListProps) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>(EMPTY);
  const [draft, setDraft] = useState<Filter>(EMPTY);
  const [panel, setPanel] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "id", dir: -1 });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const years = useMemo(() => [...new Set(plans.map((p) => p.fiscalYear))].sort((a, b) => b - a), [plans]);

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    const out = plans.filter((p) => {
      if (k && ![p.id, p.name, p.budgetType, budgetCode(p), ...p.vehicles.map((v) => v.plate)] /* FigJam: ค้นหาประเภทงบประมาณ + รายละเอียดย่อย (เลขศูนย์ต้นทุน) ได้ */.some((v) => v.toLowerCase().includes(k))) return false;
      if (filter.year && String(p.fiscalYear) !== filter.year) return false;
      if (filter.budgets.length && !BUDGET_RANGES.some((r) => filter.budgets.includes(r.id) && r.test(p.budget))) return false;
      if (filter.statuses.length && !filter.statuses.includes(p.status)) return false;
      return true;
    });
    const val = (p: Plan) => (sort.key === "id" ? p.id : sort.key === "budgetType" ? p.budgetType : p.status);
    return out.sort((a, b) => val(a).localeCompare(val(b), "th") * sort.dir || b.id.localeCompare(a.id));
  }, [plans, q, filter, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / size));
  const cur = Math.min(page, pages);
  const shown = rows.slice((cur - 1) * size, cur * size);
  const active = filterCount(filter);
  const clearAll = () => {
    setQ("");
    setFilter(EMPTY);
    setPage(1);
  };
  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "id" ? -1 : 1 }));
    setPage(1);
  };
  const sortTh = (k: SortKey, label: string) => (
    <Th aria-sort={sort.key === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => toggleSort(k)} className="flex items-center gap-2 font-semibold">
        {label}
        <Icon name={sort.key === k ? (sort.dir === 1 ? "arrow_upward" : "arrow_downward") : "swap_vert"} size={20} className="text-gray-500" />
      </button>
    </Th>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="ค้นหาเลขแผน, ชื่อแผน, เลขศูนย์ต้นทุน"
          aria-label="ค้นหาแผน"
          className="w-80 max-md:w-full"
        />
        <div className="ml-auto flex items-center gap-3 max-md:ml-0">
          <Button
            variant="secondary"
            iconLeft="filter_list"
            onClick={() => {
              setDraft(filter);
              setPanel(true);
            }}
          >
            ตัวกรอง
            {active > 0 && <CountPill className="ml-1">{active}</CountPill>}
          </Button>
          <Button iconLeft="add" onClick={onCreate}>
            สร้างแผน Overhaul
          </Button>
        </div>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          kind="data-empty"
          title="ยังไม่มีแผน Overhaul"
          description="สร้างแผน Overhaul เพื่อเพิ่ม Purchase Order และติดตามสถานะซ่อมของยานพาหนะแต่ละคัน"
          action={
            <Button iconLeft="add" onClick={onCreate}>
              สร้างแผน Overhaul
            </Button>
          }
        />
      ) : shown.length === 0 ? (
        <EmptyState
          kind="search-not-found"
          title="ไม่พบแผน Overhaul"
          description="ไม่มีแผนที่ตรงกับคำค้นหรือตัวกรอง"
          action={
            <Button variant="secondary" onClick={clearAll}>
              ล้างคำค้นและตัวกรอง
            </Button>
          }
        />
      ) : (
        <>
          {/* T17 คอลัมน์คงที่ รวม 1,296 = ความกว้างหน้า desktop · T18 ชื่อแผนสูงสุด 216 ตัด 2 บรรทัด */}
          <DataTable label="รายการแผน Overhaul" striped cols={[132, 216, 188, 104, 148, 160, 180, 112, 56]}>
            <thead>
              <tr>
                {sortTh("id", "หมายเลขแผน")}
                <Th>ชื่อแผน</Th>
                {sortTh("budgetType", "ประเภทงบ")}
                <Th>ปีงบประมาณ</Th>
                <Th>งบประมาณ (บาท)</Th>
                <Th>ความคืบหน้า</Th>
                {sortTh("status", "สถานะ")}
                <Th>วันที่สร้าง</Th>
                <Th aria-label="จัดการ" />
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <button type="button" onClick={() => onOpen(p.id)} className="font-semibold text-black hover:text-brand-900 hover:underline">
                      {p.id}
                    </button>
                  </Td>
                  <Td title={p.name}>
                    <span className="line-clamp-2 break-words whitespace-normal">{p.name}</span>
                  </Td>
                  <Td>
                    <CellStack main={p.budgetType} sub={budgetCode(p)} />
                  </Td>
                  <Td>{p.fiscalYear}</Td>
                  <Td className="tabular-nums">{currency(p.budget)}</Td>
                  <Td className="w-40">{p.progress === null ? "-" : <ProgressBar tone="info" decimals={1} value={p.progress} label={`ความคืบหน้าแผน ${p.id}`} />}</Td>
                  <Td>
                    <Pill tone={statusTone(p.status)}>{p.status}</Pill>
                  </Td>
                  <Td>{p.createdAt}</Td>
                  <Td className="w-14 text-right">
                    <RowMenu
                      label={`จัดการแผน ${p.id}`}
                      items={[
                        // ไอคอนตาม Figma D.1.1 · AC 3.2: แก้ไข/ลบ เฉพาะสถานะ รอเลข PO / รอดำเนินการ · ลบระบุสิ่งที่ลบ + สีแดง (เจ้าของงาน 13 พ.ย. 2569)
                        { label: "ดูรายละเอียด", icon: "quick_reference_all", onSelect: () => onOpen(p.id) },
                        ...(p.status !== "เสร็จสิ้น"
                          ? [
                              { label: "แก้ไข", icon: "stylus", onSelect: () => onEdit(p.id) },
                              { label: "ลบแผน", icon: "delete", danger: true, onSelect: () => onDelete(p.id) }, // จอ C.1/D.1.1 "ลบ" — เจ้าของงาน 13 พ.ย. ให้ระบุสิ่งที่ลบ
                            ]
                          : []),
                      ]}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <Pagination
            page={cur}
            pageSize={size}
            total={rows.length}
            pageSizes={[10, 20, 50]}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setSize(s);
              setPage(1);
            }}
          />
        </>
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
        <SelectField
          label="ปีงบประมาณ"
          value={draft.year}
          onChange={(e) => setDraft({ ...draft, year: e.target.value })}
          options={[{ value: "", label: "ทั้งหมด" }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
        />
        <PanelSection label="งบประมาณ (บาท)">
          {BUDGET_RANGES.map((r) => (
            <CheckboxRow
              key={r.id}
              checked={draft.budgets.includes(r.id)}
              onChange={(v) => setDraft({ ...draft, budgets: v ? [...draft.budgets, r.id] : draft.budgets.filter((x) => x !== r.id) })}
            >
              {r.label}
            </CheckboxRow>
          ))}
        </PanelSection>
        <PanelSection label="สถานะ">
          {STATUSES.map((s) => (
            <CheckboxRow key={s} checked={draft.statuses.includes(s)} onChange={(v) => setDraft({ ...draft, statuses: v ? [...draft.statuses, s] : draft.statuses.filter((x) => x !== s) })}>
              <Pill tone={statusTone(s)}>{s}</Pill>
            </CheckboxRow>
          ))}
        </PanelSection>
      </SidePanel>
    </div>
  );
}
