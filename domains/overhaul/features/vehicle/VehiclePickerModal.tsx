"use client";
/** Modal เพิ่มยานพาหนะเข้าแผน — จอ OH2 / B.15–B.17 · เคาะ D1 = modal (13 พ.ย. 2569)
 *  ฟีดแบ็กเจ้าของงาน 14 พ.ย. 2569 (docs/TODO-overhaul.md):
 *    T4 ตัวกรองกางลงมาในตัว modal · T5 ไม่มี "แสดงเฉพาะที่เลือก" · T6 title "เพิ่มยานพาหนะ" (common) subtitle จาก senior-ux-writing ·
 *    T8 สถานะดูแค่ ระหว่างซ่อม / รอจำหน่าย · T9 แถบเลือกทั้งหมดไม่มีพื้นชมพู · T16 เลื่อนเฉพาะตาราง (หัว/เครื่องมือ/ท้ายอยู่กับที่)
 *  การเลือกจำนวนมาก: ติ๊กหัวตาราง = หน้านี้ + ลิงก์เลือกทั้งหมดตามคำค้นและตัวกรอง · ที่เลือกค้างข้ามหน้า/คำค้น/ตัวกรอง (M3 M4)
 *  M8 เพดานต่อครั้ง = prop maxSelect (ยังไม่กำหนด)
 *  เจ้าของงานสั่ง 16 พ.ย. 2569: เรียงคอลัมน์ได้แบบแท็บยานพาหนะที่ Overhaul (SortTh/sortRows ตัวเดียวกัน) — มูลค่า · อายุการใช้งาน
 *    (+ ราคากลาง · ประเมิน Overhaul เมื่อ showPrices) · ไม่มีข้อมูลอยู่ท้าย · เปลี่ยนการเรียงแล้วกลับหน้า 1 · ที่เลือกไว้ค้างอยู่ */
import { useMemo, useState } from "react";
import { Button } from "@ui/Button";
import { CountPill, OutlineBadge } from "@ui/Badge";
import { Checkbox } from "@ui/Checkbox";
import { EmptyState } from "@ui/EmptyState";
import { Modal } from "@ui/Modal";
import { Pagination } from "@ui/Pagination";
import { SearchInput } from "@ui/SearchInput";
import { SelectField } from "@ui/SelectField";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { cx } from "@ui/cx";
import { currency } from "@rules/currency.mjs";
import type { VehicleInfo } from "./types";
import { nextSort, SortTh, sortRows, type VehicleSort } from "./VehicleTable";

/** แถวที่เลือกได้ — fleet (เพิ่มเข้าแผน B.15) หรือยานพาหนะในแผน (เพิ่มเข้า Purchase Order E.5) */
export type PickRow = VehicleInfo & { unavailableReason?: string; referencePrice?: number | null; overhaulEstimate?: number | null };

type Key = "type" | "make" | "affiliation";
type PickSortKey = "value" | "referencePrice" | "overhaulEstimate" | "ageYears";
type Filter = Record<Key, string>;
const EMPTY: Filter = { type: "", make: "", affiliation: "" };
const LABEL: Record<Key, string> = { type: "ประเภทยานพาหนะ", make: "ยี่ห้อ", affiliation: "สังกัด" };

export function VehiclePickerModal<T extends PickRow>({
  open,
  onClose,
  fleet,
  excludePlates,
  onAdd,
  maxSelect,
  description = "ยานพาหนะในระบบที่ยังไม่อยู่ในแผนนี้" /* B.15 (จอ: "รถในระบบที่ยังไม่อยู่ในแผนนี้") */,
  showPrices,
}: {
  open: boolean;
  onClose: () => void;
  fleet: T[];
  /** ยานพาหนะที่เลือกไว้แล้ว — ไม่แสดง */
  excludePlates: string[];
  onAdd: (picked: T[]) => void;
  maxSelect?: number;
  description?: string;
  /** E.5 แสดงราคากลาง/ประเมิน Overhaul ที่ได้มาจากแผน (FigJam Section 10) */
  showPrices?: boolean;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>(EMPTY);
  const [showFilter, setShowFilter] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [sort, setSort] = useState<VehicleSort<PickSortKey>>(null);
  const onSort = (k: PickSortKey) => {
    setSort((s) => nextSort(s, k));
    setPage(1);
  };

  const pool = useMemo(() => fleet.filter((v) => !excludePlates.includes(v.plate)), [fleet, excludePlates]);
  const opts = (k: Key) => [...new Set(pool.map((v) => String(v[k])))].sort((a, b) => a.localeCompare(b, "th"));
  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    const out = pool.filter(
      (v) => (!k || [v.plate, `${v.make} ${v.model}`, v.type, v.affiliation].some((s) => s.toLowerCase().includes(k))) && (Object.keys(filter) as Key[]).every((f) => !filter[f] || v[f] === filter[f]),
    );
    return sortRows(out, sort);
  }, [pool, q, filter, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const cur = Math.min(page, pages);
  const shown = rows.slice((cur - 1) * size, cur * size);
  const pageEligible = shown.filter((v) => !v.unavailableReason);
  const allEligible = rows.filter((v) => !v.unavailableReason);
  const pagePicked = pageEligible.filter((v) => picked.has(v.plate)).length;
  const over = maxSelect !== undefined && picked.size > maxSelect;
  const active = (Object.keys(filter) as Key[]).filter((k) => filter[k]).length;
  const anyUnavailable = pool.some((v) => v.unavailableReason);

  const set = (plates: string[], on: boolean) =>
    setPicked((s) => {
      const n = new Set(s);
      plates.forEach((p) => (on ? n.add(p) : n.delete(p)));
      return n;
    });
  const reset = () => {
    setQ("");
    setFilter(EMPTY);
    setShowFilter(false);
    setPicked(new Set());
    setPage(1);
    setSort(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      fill
      title="เพิ่มยานพาหนะ"
      description={description}
      footer={
        <>
          {/* B.15–B.17: ไม่มีข้อความ "เลือกแล้ว n คัน" — จำนวนอยู่ในปุ่มเพิ่ม · เหลือแค่ข้อความเกินเพดาน (M8) */}
          <span className="text-sm text-error-600">{over && `เลือกได้ไม่เกิน ${maxSelect} คันต่อครั้ง`}</span>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={close}>
              ยกเลิก
            </Button>
            <Button
              disabled={picked.size === 0 || over}
              onClick={() => {
                onAdd(pool.filter((v) => picked.has(v.plate)));
                reset();
              }}
            >
              เพิ่มยานพาหนะ{picked.size > 0 ? ` (${picked.size})` : ""}
            </Button>
          </div>
        </>
      }
    >
      {/* แถวเครื่องมือ (อยู่กับที่) */}
      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="ค้นหาทะเบียน, ยี่ห้อ/รุ่น, ประเภท, สังกัด"
            aria-label="ค้นหายานพาหนะที่จะเพิ่ม"
            className="w-90 max-md:w-full"
          />
          <Button variant="secondary" iconLeft="filter_list" iconRight={showFilter ? "keyboard_arrow_up" : "keyboard_arrow_down"} aria-expanded={showFilter} onClick={() => setShowFilter((x) => !x)} className="ml-auto">
            ตัวกรอง
            {active > 0 && <CountPill className="ml-1">{active}</CountPill>}
          </Button>
        </div>
        {/* T4 ตัวกรองกางลงมา — เลือกแล้วมีผลทันที */}
        {showFilter && (
          <div className="grid grid-cols-1 items-end gap-4 rounded-md border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
            {(Object.keys(LABEL) as Key[]).map((k) => (
              <SelectField
                key={k}
                label={LABEL[k]}
                value={filter[k]}
                onChange={(e) => {
                  setFilter({ ...filter, [k]: e.target.value });
                  setPage(1);
                }}
                options={[{ value: "", label: "ทั้งหมด" }, ...opts(k).map((o) => ({ value: o, label: o }))]}
              />
            ))}
            <Button variant="tertiaryBrand" disabled={active === 0} onClick={() => setFilter(EMPTY)}>
              ล้างตัวกรอง
            </Button>
          </div>
        )}
        {/* M3 เลือกทั้งหน้าแล้ว → เสนอเลือกทั้งหมดตามคำค้นและตัวกรอง (T9 ไม่มีพื้นชมพู) */}
        {pageEligible.length > 0 && pagePicked === pageEligible.length && allEligible.length > pageEligible.length && (
          <div role="status" className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
            {allEligible.every((v) => picked.has(v.plate)) ? (
              <>
                เลือกทั้งหมด {allEligible.length} คันตามคำค้นและตัวกรองแล้ว
                <Button variant="tertiaryBrand" size="sm" onClick={() => set(allEligible.map((v) => v.plate), false)}>
                  ล้างที่เลือก
                </Button>
              </>
            ) : (
              <>
                เลือก {pagePicked} คันในหน้านี้แล้ว
                <Button variant="tertiaryBrand" size="sm" onClick={() => set(allEligible.map((v) => v.plate), true)}>
                  เลือกทั้งหมด {allEligible.length} คันตามคำค้นและตัวกรอง
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <EmptyState kind="search-not-found" title="ไม่พบยานพาหนะ" description="เปลี่ยนคำค้นหรือตัวกรอง" />
      ) : (
        <>
          {/* T16 เลื่อนเฉพาะตาราง */}
          <DataTable label="ยานพาหนะที่เลือกได้" striped scrollY>
            <thead>
              <tr>
                <Th className="w-12">
                  <Checkbox
                    label="เลือกทุกคันในหน้านี้"
                    checked={pageEligible.length > 0 && pagePicked === pageEligible.length}
                    indeterminate={pagePicked > 0 && pagePicked < pageEligible.length}
                    disabled={pageEligible.length === 0}
                    onChange={(on) => set(pageEligible.map((v) => v.plate), on)}
                  />
                </Th>
                <Th>ทะเบียน</Th>
                <Th>ประเภทยานพาหนะ</Th>
                <SortTh k="value" sort={sort} onSort={onSort}>{showPrices ? "ราคาที่ได้มา (บาท)" : "มูลค่ายานพาหนะ (บาท)"}</SortTh>
                {showPrices && <SortTh k="referencePrice" sort={sort} onSort={onSort}>ราคากลาง (บาท)</SortTh>}
                {showPrices && <SortTh k="overhaulEstimate" sort={sort} onSort={onSort}>ประเมิน Overhaul (บาท)</SortTh>}
                <SortTh k="ageYears" sort={sort} onSort={onSort}>อายุการใช้งาน</SortTh>
                {anyUnavailable && <Th>สถานะ</Th>}
              </tr>
            </thead>
            <tbody>
              {shown.map((v) => {
                const why = v.unavailableReason;
                return (
                  <tr key={v.plate} className={cx(why && "text-gray-400")}>
                    <Td>
                      <Checkbox label={`เลือก ${v.plate}`} checked={picked.has(v.plate)} disabled={!!why} onChange={(on) => set([v.plate], on)} />
                    </Td>
                    <Td>
                      <CellStack main={<span className="font-semibold">{v.plate}</span>} sub={v.affiliation} />
                    </Td>
                    <Td>
                      <CellStack main={`${v.make} ${v.model}`} sub={v.type} />
                    </Td>
                    <Td className="tabular-nums">{currency(v.value)}</Td>
                    {showPrices && <Td className="tabular-nums">{v.referencePrice == null ? "—" : currency(v.referencePrice)}</Td>}
                    {showPrices && <Td className="tabular-nums">{v.overhaulEstimate == null ? "—" : currency(v.overhaulEstimate)}</Td>}
                    <Td>{v.ageYears} ปี</Td>
                    {anyUnavailable && <Td>{why ? <OutlineBadge>{why}</OutlineBadge> : "—"}</Td>}
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
          <Pagination
            className="shrink-0"
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
    </Modal>
  );
}
