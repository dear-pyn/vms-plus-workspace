"use client";
/** จัดการงานซ่อม — รายการ (UAT /maintain-d/repair-utility-vehicle · 20 พ.ย. 2569)
 *  คอลัมน์: หมายเลขเหตุการณ์ · วันที่สร้าง · ยานพาหนะ · ประเภทยานพาหนะ · สถานะรถ · สถานะเหตุการณ์ · วันที่อัพเดตสถานะฯ · ผู้ดำเนินการ · ปุ่มดู
 *  ค้นหา "หมายเลขเหตุการณ์, เลขทะเบียน" · ตัวกรอง (สถานะเหตุการณ์ 24 ค่า · ยี่ห้อรถ · ประเภทรถ · สถานะรถ · วันนัดหมาย) · แบ่งหน้า 10/25/50/100
 *  ข้อความในจอนี้ลอกจาก UAT ตรงตัว (รวมคำว่า "รถ")
 *  เพิ่มใหม่ (เจ้าของงาน 23 พ.ย. 2569): 2 แท็บ "ปกติ" / "ค่าซ่อมเกิน 30%" มีจำนวนในแท็บ ·
 *    แท็บเกิน 30% มีคอลัมน์ % ค่าซ่อม และเมนูในแถว "เสนอเข้าแผน Overhaul" / "เสนอจำหน่าย" (ส่งต่อโมดูลนั้น รอยืนยัน) */
import { useMemo, useState } from "react";
import { currency } from "@rules/currency.mjs";
import { Pill, RemovableBadge } from "@ui/Badge";
import { Button } from "@ui/Button";
import { CheckboxRow } from "@ui/Checkbox";
import { DateField } from "@ui/DateField";
import { EmptyState } from "@ui/EmptyState";
import { Icon } from "@ui/Icon";
import { Modal } from "@ui/Modal";
import { PageHeader } from "@ui/PageHeader";
import { Pagination } from "@ui/Pagination";
import { RowMenu } from "@ui/RowMenu";
import { SearchInput } from "@ui/SearchInput";
import { SelectField } from "@ui/SelectField";
import { PanelSection, SidePanel } from "@ui/SidePanel";
import { DataTable, Td, Th, CellStack } from "@ui/Table";
import { Tabs } from "@ui/Tabs";
import { TextArea } from "@ui/TextArea";
import { STATUSES, VEHICLES, personOf, statusOf, vehicleOf, type StatusCode } from "../mock/data";
import { COST_LIMIT_PCT, type RepairJob } from "./model";
import { costFlag } from "./parts";
import { StatusPill } from "./ui";

type SortKey = "no" | "createdAt" | "plate" | "type" | "car" | "status";
type Tab = "normal" | "over";
type Kind = "overhaul" | "dispose";
interface Filter { statuses: StatusCode[]; brand: string; model: string; car: ("ok" | "no")[]; date: string }
const EMPTY: Filter = { statuses: [], brand: "", model: "", car: [], date: "" };
const dkey = (d: string) => d.split("/").reverse().join("");
/* ลำดับในตัวกรองตาม API (sort_order) — "รอหัวหน้า กบค. อนุมัติ" (id 24) อยู่ต่อจาก "รอ กบค. ส่งนัดหมายวันคืนรถใหม่อีกครั้ง" */
const FILTER_ORDER = STATUSES;
const KIND_LABEL: Record<Kind, string> = { overhaul: "เสนอเข้าแผน Overhaul", dispose: "เสนอจำหน่าย" };

export function RepairList({ jobs, onOpen, onNew, onPropose }: { jobs: RepairJob[]; onOpen: (id: string) => void; onNew: () => void; onPropose: (id: string, kind: Kind, note: string) => void }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("normal");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Filter>(EMPTY);
  const [draft, setDraft] = useState<Filter>(EMPTY);
  const [sort, setSort] = useState<{ k: SortKey; desc: boolean }>({ k: "createdAt", desc: true });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [ask, setAsk] = useState<{ job: RepairJob; kind: Kind } | null>(null);
  const [note, setNote] = useState("");

  const flags = useMemo(() => new Map(jobs.map((j) => [j.id, costFlag(j)])), [jobs]);
  const flag = (j: RepairJob) => flags.get(j.id) ?? null;

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
  const overRows = filtered.filter((j) => flags.get(j.id));
  const normalRows = filtered.filter((j) => !flags.get(j.id));
  const rows = tab === "over" ? overRows : normalRows;

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
      <Tabs
        items={[
          { id: "normal", label: "ปกติ", count: normalRows.length },
          { id: "over", label: `ค่าซ่อมเกิน ${COST_LIMIT_PCT}%`, count: overRows.length },
        ]}
        value={tab}
        onChange={(t) => { setTab(t as Tab); setPage(1); }}
      />
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
      {tab === "over" && overRows.length > 0 && (
        <p className="-mt-2 text-sm text-gray-600">ค่าซ่อมเกิน {COST_LIMIT_PCT}% ของราคาที่ได้มา ควรพิจารณาส่งเข้าแผน Overhaul หรือจำหน่ายทรัพย์สิน · เลือกจากเมนู <Icon name="more_horiz" size={16} className="align-middle" /> ท้ายแถว</p>
      )}

      {jobs.length === 0 ? (
        <div className="py-10">
          <EmptyState kind="data-empty" title="ไม่มีรายการแจ้งซ่อม" description="เมื่อมีแจ้งเหตุ รายการจะแสดงที่นี่" action={<Button onClick={onNew}>แจ้งซ่อม</Button>} />
        </div>
      ) : rows.length === 0 ? (
        tab === "over" && filtered.length > 0 && !chips.length && !q.trim()
          ? <EmptyState kind="data-empty" title={`ไม่มีงานที่ค่าซ่อมเกิน ${COST_LIMIT_PCT}%`} description="งานที่ค่าซ่อมเกินเกณฑ์ของราคาที่ได้มาจะแสดงที่นี่" />
          : <EmptyState kind="search-not-found" title="ไม่พบรายการแจ้งซ่อม" description="ลองเปลี่ยนคำค้นหาหรือตัวกรอง" />
      ) : (
        <>
          <DataTable label={tab === "over" ? "งานซ่อมที่ค่าซ่อมเกิน 30%" : "รายการงานซ่อม"} striped>
            <thead>
              <tr>
                <SortTh k="no">หมายเลขเหตุการณ์</SortTh>
                <SortTh k="createdAt">วันที่สร้าง</SortTh>
                <SortTh k="plate">ยานพาหนะ</SortTh>
                <SortTh k="type">ประเภทยานพาหนะ</SortTh>
                {tab === "over" ? <Th>ค่าซ่อม / ราคาที่ได้มา</Th> : <SortTh k="car">สถานะรถ</SortTh>}
                <SortTh k="status">สถานะเหตุการณ์</SortTh>
                {tab === "over" ? <Th>ข้อเสนอ</Th> : <Th>วันที่อัพเดตสถานะฯ</Th>}
                <Th>ผู้ดำเนินการ</Th>
                <Th><span className="sr-only">จัดการ</span></Th>
              </tr>
            </thead>
            <tbody>
              {view.map((j) => {
                const v = vehicleOf(j.plate);
                const last = j.history[j.history.length - 1];
                const fl = flag(j);
                return (
                  <tr key={j.id}>
                    <Td className="font-semibold">{j.no}</Td>
                    <Td>{j.createdAt}</Td>
                    <Td className="font-semibold">{v.plate} {v.provinceShort}</Td>
                    <Td className="max-w-56 whitespace-normal">{v.type}</Td>
                    {tab === "over" && fl ? (
                      <Td><CellStack main={<span className="font-semibold text-warning-700">{fl.pct.toFixed(1)}%</span>} sub={`${currency(fl.cost)} / ${currency(fl.assetValue)} บาท`} /></Td>
                    ) : (
                      <Td><span className={j.carUsable ? "font-medium text-success-700" : "font-medium text-error-700"}>{j.carUsable ? "ใช้งานได้" : "ใช้งานไม่ได้"}</span></Td>
                    )}
                    <Td><StatusPill status={j.status} /></Td>
                    {tab === "over" ? (
                      <Td>{j.proposal ? <Pill tone={j.proposal.kind === "overhaul" ? "info" : "error"}>{KIND_LABEL[j.proposal.kind]}แล้ว</Pill> : <span className="text-gray-500">-</span>}</Td>
                    ) : (
                      <Td>{j.updatedAt}</Td>
                    )}
                    <Td><CellStack main={personOf(last?.byId)?.name ?? "-"} sub="หน่วยงาน" /></Td>
                    <Td className="text-right">
                      <span className="inline-flex items-center gap-1">
                        <Button variant="tertiary" iconOnly="quick_reference_all" aria-label={`ดูรายละเอียดใบแจ้งซ่อม ${j.no}`} onClick={() => onOpen(j.id)} />
                        {tab === "over" && (
                          <RowMenu
                            label={`จัดการ ${j.no}`}
                            items={[
                              { label: KIND_LABEL.overhaul, icon: "build_circle", disabled: j.proposal?.kind === "overhaul", onSelect: () => { setNote(""); setAsk({ job: j, kind: "overhaul" }); } },
                              { label: KIND_LABEL.dispose, icon: "sell", disabled: j.proposal?.kind === "dispose", onSelect: () => { setNote(""); setAsk({ job: j, kind: "dispose" }); } },
                            ]}
                          />
                        )}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
          <Pagination page={page} pageSize={size} total={rows.length} onPageChange={setPage} onPageSizeChange={(n) => { setSize(n); setPage(1); }} />
        </>
      )}

      <Modal
        open={!!ask}
        onClose={() => setAsk(null)}
        title={ask ? KIND_LABEL[ask.kind] : ""}
        description={ask ? `${vehicleOf(ask.job.plate).plate} ${vehicleOf(ask.job.plate).provinceShort} · ${ask.job.no}` : undefined}
        confirmLabel={ask?.kind === "dispose" ? "เสนอจำหน่าย" : "เสนอเข้าแผน"}
        onConfirm={() => { if (ask) onPropose(ask.job.id, ask.kind, note.trim()); setAsk(null); }}
      >
        {ask && (() => {
          const fl = flag(ask.job);
          return (
            <>
              {fl && <p className="text-sm text-gray-700">ค่าซ่อม {currency(fl.cost)} บาท คิดเป็น {fl.pct.toFixed(1)}% ของราคาที่ได้มา {currency(fl.assetValue)} บาท</p>}
              <p className="text-sm text-gray-600">{ask.kind === "overhaul" ? "ยานพาหนะจะขึ้นในรายการรอเลือกตอนสร้างแผน Overhaul" : "ส่งเรื่องให้หน่วยงานพัสดุพิจารณาจำหน่ายทรัพย์สิน (JO3)"} · ต้นแบบบันทึกข้อเสนอไว้ที่งานนี้ รอยืนยันการเชื่อมโมดูล</p>
              <TextArea label="หมายเหตุ" optional rows={3} placeholder="ระบุเหตุผลหรือข้อมูลเพิ่มเติม" value={note} onChange={(e) => setNote(e.target.value)} />
            </>
          );
        })()}
      </Modal>

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
