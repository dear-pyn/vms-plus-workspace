"use client";
/** เมนู อู่/ศูนย์บริการ — รายการ (จอเจ้าของงาน 19 พ.ย. 2569)
 *  คอลัมน์ตามจอ: รหัส · อู่/ศูนย์บริการ · ประเภท / ยี่ห้อที่รองรับ · ที่อยู่ · เบอร์โทร · เมนู 3 จุด
 *  เจ้าของงาน 19 พ.ย. 2569: "คะแนนเฉลี่ย เอาออกก่อน" (จอเดิมมีคอลัมน์นี้)
 *  เจ้าของงาน 19 พ.ย. 2569: คอลัมน์ "ที่ตั้ง" (จังหวัด / อำเภอ) → "ที่อยู่" แสดงที่อยู่เต็มต่อกันบรรทัดเดียว (ตัดที่ 2 บรรทัด · ชี้ดูเต็มได้)
 *  ค้นหา: ชื่ออู่ · จังหวัด · เบอร์โทร · รหัส · ตัวกรอง (Side panel): จังหวัด · ประเภทยานพาหนะ · ยี่ห้อ
 *  component: Page header (actions) · Search · Button ตัวกรอง/เพิ่ม · Table (Alternating) · Cell stack · Row menu · Pagination · Empty state · Side panel */
import { useMemo, useState } from "react";
import { CountPill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { CheckboxRow } from "@ui/Checkbox";
import { EmptyState } from "@ui/EmptyState";
import { PageHeader } from "@ui/PageHeader";
import { Pagination } from "@ui/Pagination";
import { RowMenu } from "@ui/RowMenu";
import { SearchInput } from "@ui/SearchInput";
import { SelectField } from "@ui/SelectField";
import { PanelSection, SidePanel } from "@ui/SidePanel";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { GARAGE_BRANDS, GARAGE_VEHICLE_TYPES } from "../../mock/garages";
import type { Garage } from "../po/types";
import { formatAddress } from "./types";

type Filter = { province: string; types: string[]; brands: string[] };
const EMPTY: Filter = { province: "", types: [], brands: [] };
const count = (f: Filter) => (f.province ? 1 : 0) + (f.types.length ? 1 : 0) + (f.brands.length ? 1 : 0);

export function GarageList({ garages, onOpen, onEdit, onDelete, onCreate }: { garages: Garage[]; onOpen: (id: string) => void; onEdit: (id: string) => void; onDelete: (id: string) => void; onCreate: () => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>(EMPTY);
  const [draft, setDraft] = useState<Filter>(EMPTY);
  const [panel, setPanel] = useState(false);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const live = useMemo(() => garages.filter((g) => !g.deleted), [garages]);
  const provinces = useMemo(() => [...new Set(live.map((g) => g.addr?.province).filter((p): p is string => !!p))].sort((a, b) => a.localeCompare(b, "th")), [live]);

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return live
      .filter((g) => !k || [g.code ?? "", g.name, g.phone, g.addr?.province ?? "", g.addr?.district ?? ""].some((s) => s.toLowerCase().includes(k)))
      .filter((g) => !filter.province || g.addr?.province === filter.province)
      .filter((g) => !filter.types.length || filter.types.some((t) => g.vehicleTypes?.includes(t)))
      .filter((g) => !filter.brands.length || filter.brands.some((b) => g.brands?.includes(b)))
      .sort((a, b) => (a.code ?? "").localeCompare(b.code ?? ""));
  }, [live, q, filter]);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const cur = Math.min(page, pages);
  const shown = rows.slice((cur - 1) * size, cur * size);
  const active = count(filter);
  const clearAll = () => { setQ(""); setFilter(EMPTY); setPage(1); };
  const toggle = (list: string[], v: string, on: boolean) => (on ? [...list, v] : list.filter((x) => x !== v));

  return (
    <div className="flex flex-col gap-6 p-8 max-md:px-4">
      <PageHeader crumbs={[{ label: "อู่/ศูนย์บริการ" }]} title="อู่/ศูนย์บริการ" />
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="ค้นหาชื่ออู่, จังหวัด, เบอร์โทร" aria-label="ค้นหาอู่/ศูนย์บริการ" className="w-80 max-md:w-full" />
        <div className="ml-auto flex items-center gap-3 max-md:ml-0">
          <Button variant="secondary" iconLeft="filter_list" onClick={() => { setDraft(filter); setPanel(true); }}>
            ตัวกรอง
            {active > 0 && <CountPill className="ml-1">{active}</CountPill>}
          </Button>
          <Button iconLeft="add" onClick={onCreate}>เพิ่มอู่/ศูนย์บริการ</Button>
        </div>
      </div>

      {live.length === 0 ? (
        <EmptyState kind="data-empty" title="ยังไม่มีอู่/ศูนย์บริการ" description="เพิ่มอู่/ศูนย์บริการเพื่อใช้เลือกใน Purchase Order" action={<Button iconLeft="add" onClick={onCreate}>เพิ่มอู่/ศูนย์บริการ</Button>} />
      ) : shown.length === 0 ? (
        <EmptyState kind="search-not-found" title="ไม่พบอู่/ศูนย์บริการ" description="ไม่มีอู่/ศูนย์บริการที่ตรงกับคำค้นหรือตัวกรอง" action={<Button variant="secondary" onClick={clearAll}>ล้างคำค้นและตัวกรอง</Button>} />
      ) : (
        <>
          <DataTable label="รายการอู่/ศูนย์บริการ" striped cols={[104, 280, 220, 340, 140, 56]}>
            <thead>
              <tr>
                <Th>รหัส</Th>
                <Th>อู่/ศูนย์บริการ</Th>
                <Th>ประเภท / ยี่ห้อที่รองรับ</Th>
                <Th>ที่อยู่</Th>
                <Th>เบอร์โทร</Th>
                <Th aria-label="จัดการ" />
              </tr>
            </thead>
            <tbody>
              {shown.map((g) => (
                <tr key={g.id}>
                  <Td>
                    <button type="button" onClick={() => onOpen(g.id)} className="font-semibold text-black hover:text-brand-900 hover:underline">{g.code ?? g.id}</button>
                  </Td>
                  <Td title={g.name}><span className="line-clamp-2 break-words whitespace-normal">{g.name}</span></Td>
                  <Td className="whitespace-normal"><CellStack main={g.vehicleTypes?.join(", ") || "-"} sub={g.brands?.join(", ") || undefined} /></Td>
                  <Td title={formatAddress(g.addr) || undefined}><span className="line-clamp-2 break-words whitespace-normal">{formatAddress(g.addr) || "-"}</span></Td>
                  <Td className="tabular-nums">{g.phone}</Td>
                  <Td className="w-14 text-right">
                    <RowMenu
                      label={`จัดการ ${g.name}`}
                      items={[
                        { label: "ดูรายละเอียด", icon: "quick_reference_all", onSelect: () => onOpen(g.id) },
                        { label: "แก้ไข", icon: "stylus", onSelect: () => onEdit(g.id) },
                        { label: "ลบอู่/ศูนย์บริการ", icon: "delete", danger: true, onSelect: () => onDelete(g.id) },
                      ]}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <Pagination page={cur} pageSize={size} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setSize(s); setPage(1); }} />
        </>
      )}

      <SidePanel
        open={panel}
        onClose={() => setPanel(false)}
        title="ตัวกรอง"
        description="กรองข้อมูลให้แสดงเฉพาะข้อมูลที่ต้องการ"
        footerLeft={<Button variant="tertiaryBrand" onClick={() => setDraft(EMPTY)}>ล้างตัวกรอง</Button>}
        footerRight={
          <>
            <Button variant="secondary" onClick={() => setPanel(false)}>ยกเลิก</Button>
            <Button onClick={() => { setFilter(draft); setPage(1); setPanel(false); }}>ตกลง</Button>
          </>
        }
      >
        <SelectField label="จังหวัด" value={draft.province} onChange={(e) => setDraft({ ...draft, province: e.target.value })} options={[{ value: "", label: "ทั้งหมด" }, ...provinces.map((p) => ({ value: p, label: p }))]} />
        <PanelSection label="ประเภทยานพาหนะที่รองรับ">
          {GARAGE_VEHICLE_TYPES.map((t) => <CheckboxRow key={t} checked={draft.types.includes(t)} onChange={(v) => setDraft({ ...draft, types: toggle(draft.types, t, v) })}>{t}</CheckboxRow>)}
        </PanelSection>
        <PanelSection label="ยี่ห้อยานพาหนะที่รองรับ">
          {GARAGE_BRANDS.map((b) => <CheckboxRow key={b} checked={draft.brands.includes(b)} onChange={(v) => setDraft({ ...draft, brands: toggle(draft.brands, b, v) })}>{b}</CheckboxRow>)}
        </PanelSection>
      </SidePanel>
    </div>
  );
}
