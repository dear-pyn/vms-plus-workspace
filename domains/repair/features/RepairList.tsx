"use client";
/** จัดการงานซ่อม — รายการ (UAT /maintain-d/repair-utility-vehicle · 20 พ.ย. 2569)
 *  คอลัมน์: หมายเลขเหตุการณ์ · วันที่สร้าง · ยานพาหนะ · ประเภทยานพาหนะ · สถานะรถ · สถานะเหตุการณ์ · วันที่อัพเดตสถานะฯ · ผู้ดำเนินการ · ปุ่มดู
 *  ค้นหา "หมายเลขเหตุการณ์, เลขทะเบียน" · ตัวกรอง (สถานะเหตุการณ์ 24 ค่า · ยี่ห้อรถ · ประเภทรถ · สถานะรถ · วันนัดหมาย) · แบ่งหน้า 10/25/50/100
 *  ข้อความในจอนี้ลอกจาก UAT ตรงตัว (รวมคำว่า "รถ") */
import { useMemo, useState } from "react";
import { RemovableBadge } from "@ui/Badge";
import { Button } from "@ui/Button";
import { CheckboxRow } from "@ui/Checkbox";
import { DateField } from "@ui/DateField";
import { EmptyState } from "@ui/EmptyState";
import { Icon } from "@ui/Icon";
import { PageHeader } from "@ui/PageHeader";
import { Pagination } from "@ui/Pagination";
import { SearchInput } from "@ui/SearchInput";
import { SelectField } from "@ui/SelectField";
import { PanelSection, SidePanel } from "@ui/SidePanel";
import { DataTable, Td, Th, CellStack } from "@ui/Table";
import { STATUSES, VEHICLES, personOf, statusOf, vehicleOf, type StatusCode } from "../mock/data";
import type { RepairJob } from "./model";
import { StatusPill } from "./ui";

type SortKey = "no" | "createdAt" | "plate" | "type" | "car" | "status";
interface Filter { statuses: StatusCode[]; brand: string; model: string; car: ("ok" | "no")[]; date: string }
const EMPTY: Filter = { statuses: [], brand: "", model: "", car: [], date: "" };
const dkey = (d: string) => d.split("/").reverse().join("");
/* ลำดับในตัวกรองตาม API (sort_order) — "รอหัวหน้า กบค. อนุมัติ" (id 24) อยู่ต่อจาก "รอ กบค. ส่งนัดหมายวันคืนรถใหม่อีกครั้ง" */
const FILTER_ORDER = STATUSES;

export function RepairList({ jobs, onOpen, onNew }: { jobs: RepairJob[]; onOpen: (id: string) => void; onNew: () => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Filter>(EMPTY);
  const [draft, setDraft] = useState<Filter>(EMPTY);
  const [sort, setSort] = useState<{ k: SortKey; desc: boolean }>({ k: "createdAt", desc: true });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    const list = jobs.filter((j) => {
      const v = vehicleOf(j.plate);
      if (k && !j.no.toLowerCase().includes(k) && !`${v.plate} ${v.provinceShort}`.toLowerCase().includes(k)) return false;
      if (f.statuses.length && !f.statuses.includes(j.status)) return false;
      if (f.brand && v.brand !== f.brand) return false;
      if (f.model && v.model !== f.model) return false;
      if (f.car.length && !f.car.includes(j.carUsable ? "ok" : "no")) return false;
      if (f.date && j.appt?.from !== f.date && j.returnAppt?.from !== f.date) return false;
      return true;
    });
    const val = (j: RepairJob): string => {
      const v = vehicleOf(j.plate);
      return { no: j.no, createdAt: dkey(j.createdAt) + j.no, plate: v.plate, type: v.type, car: j.carUsable ? "1" : "0", status: statusOf(j.status).name }[sort.k];
    };
    return [...list].sort((a, b) => (sort.desc ? -1 : 1) * val(a).localeCompare(val(b), "th"));
  }, [jobs, q, f, sort]);
  const rows = filtered;

  const chips: { label: string; clear: () => void }[] = [
    ...f.statuses.map((s) => ({ label: statusOf(s).name, clear: () => setF({ ...f, statuses: f.statuses.filter((x) => x !== s) }) })),
    ...(f.brand ? [{ label: f.brand, clear: () => setF({ ...f, brand: "" }) }] : []),
    ...(f.model ? [{ label: f.model, clear: () => setF({ ...f, model: "" }) }] : []),
    ...f.car.map((c) => ({ label: c === "ok" ? "ใช้งานได้" : "ใช้งานไม่ได้", clear: () => setF({ ...f, car: f.car.filter((x) => x !== c) }) })),
    ...(f.date ? [{ label: `วันนัดหมาย ${f.date}`, clear: () => setF({ ...f, date: "" }) }] : []),
  ];
  const view = rows.slice((page - 1) * size, page * size);
  const SortTh = ({ k, children }: { k: SortKey; children: string }) => (
    <Th>
      <button type="button" onClick={() => setSort((s) => ({ k, desc: s.k === k ? !s.desc : false }))} className="inline-flex items-center gap-1 font-semibold">
        {children}
        <Icon name={sort.k === k ? (sort.desc ? "arrow_downward" : "arrow_upward") : "import_export"} size={16} className="text-gray-400" />
      </button>
    </Th>
  );

  return (
    <div className="flex flex-col gap-6 px-8 py-6 max-md:px-4">
      <PageHeader crumbs={[{ label: "จัดการงานซ่อม" }]} title="จัดการงานซ่อม" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput className="w-80 max-md:w-full" value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="หมายเลขเหตุการณ์, เลขทะเบียน" aria-label="ค้นหาหมายเลขเหตุการณ์ หรือเลขทะเบียน" />
        <div className="flex items-center gap-3">
          <Button variant="secondary" iconLeft="filter_list" onClick={() => { setDraft(f); setOpen(true); }}>ตัวกรอง</Button>
          <Button onClick={onNew}>แจ้งซ่อม</Button>
        </div>
      </div>
      {chips.length > 0 && (
        <div className="-mt-2 flex flex-wrap items-center gap-2">
          {chips.map((c) => <RemovableBadge key={c.label} onRemove={() => { c.clear(); setPage(1); }} removeLabel={`ล้าง ${c.label}`}>{c.label}</RemovableBadge>)}
          <Button variant="tertiaryBrand" size="sm" onClick={() => setF(EMPTY)}>ล้างตัวกรอง</Button>
        </div>
      )}
      {jobs.length === 0 ? (
        <div className="py-10">
          <EmptyState kind="data-empty" title="ไม่มีรายการแจ้งซ่อม" description="เมื่อมีแจ้งเหตุ รายการจะแสดงที่นี่" action={<Button onClick={onNew}>แจ้งซ่อม</Button>} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState kind="search-not-found" title="ไม่พบรายการแจ้งซ่อม" description="ลองเปลี่ยนคำค้นหาหรือตัวกรอง" />
      ) : (
        <>
          <DataTable label="รายการงานซ่อม" striped>
            <thead>
              <tr>
                <SortTh k="no">หมายเลขเหตุการณ์</SortTh>
                <SortTh k="createdAt">วันที่สร้าง</SortTh>
                <SortTh k="plate">ยานพาหนะ</SortTh>
                <SortTh k="type">ประเภทยานพาหนะ</SortTh>
                <SortTh k="car">สถานะรถ</SortTh>
                <SortTh k="status">สถานะเหตุการณ์</SortTh>
                <Th>วันที่อัพเดตสถานะฯ</Th>
                <Th>ผู้ดำเนินการ</Th>
                <Th><span className="sr-only">จัดการ</span></Th>
              </tr>
            </thead>
            <tbody>
              {view.map((j) => {
                const v = vehicleOf(j.plate);
                const last = j.history[j.history.length - 1];
                return (
                  <tr key={j.id}>
                    <Td className="font-semibold">{j.no}</Td>
                    <Td>{j.createdAt}</Td>
                    <Td className="font-semibold">{v.plate} {v.provinceShort}</Td>
                    <Td className="max-w-56 whitespace-normal">{v.type}</Td>
                    <Td><span className={j.carUsable ? "font-medium text-success-700" : "font-medium text-error-700"}>{j.carUsable ? "ใช้งานได้" : "ใช้งานไม่ได้"}</span></Td>
                    <Td><StatusPill status={j.status} /></Td>
                    <Td>{j.updatedAt}</Td>
                    <Td><CellStack main={personOf(last?.byId)?.name ?? "-"} sub="หน่วยงาน" /></Td>
                    <Td className="text-right">
                      <Button variant="tertiary" iconOnly="quick_reference_all" aria-label={`ดูรายละเอียดใบแจ้งซ่อม ${j.no}`} onClick={() => onOpen(j.id)} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
          <Pagination page={page} pageSize={size} total={rows.length} onPageChange={setPage} onPageSizeChange={(n) => { setSize(n); setPage(1); }} />
        </>
      )}


      <SidePanel
        open={open}
        onClose={() => setOpen(false)}
        title="ตัวกรอง"
        description="กรองข้อมูลให้แสดงเฉพาะข้อมูลที่ต้องการ"
        footerLeft={<Button variant="tertiaryBrand" onClick={() => setDraft(EMPTY)}>ล้างตัวกรอง</Button>}
        footerRight={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={() => { setF(draft); setPage(1); setOpen(false); }}>ตกลง</Button>
          </>
        }
      >
        <PanelSection label="สถานะเหตุการณ์">
          {FILTER_ORDER.map((s) => (
            <CheckboxRow key={s.code} checked={draft.statuses.includes(s.code)} onChange={(on) => setDraft({ ...draft, statuses: on ? [...draft.statuses, s.code] : draft.statuses.filter((x) => x !== s.code) })}>
              {s.name}
            </CheckboxRow>
          ))}
        </PanelSection>
        <SelectField label="ยี่ห้อรถ" placeholder="ทั้งหมด" value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} options={[...new Set(VEHICLES.map((v) => v.brand))].sort().map((b) => ({ value: b, label: b }))} />
        <SelectField label="ประเภทรถ" placeholder="ทั้งหมด" value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} options={[...new Set(VEHICLES.map((v) => v.model))].sort().map((m) => ({ value: m, label: m }))} />
        <PanelSection label="สถานะรถ">
          {(["ok", "no"] as const).map((c) => (
            <CheckboxRow key={c} checked={draft.car.includes(c)} onChange={(on) => setDraft({ ...draft, car: on ? [...draft.car, c] : draft.car.filter((x) => x !== c) })}>
              {c === "ok" ? "ใช้งานได้" : "ใช้งานไม่ได้"}
            </CheckboxRow>
          ))}
        </PanelSection>
        <div className="flex flex-col gap-2 pb-6">
          <span className="text-md font-semibold text-gray-600">วันนัดหมาย</span>
          <DateField aria-label="วันนัดหมาย" value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} />
        </div>
      </SidePanel>
    </div>
  );
}
