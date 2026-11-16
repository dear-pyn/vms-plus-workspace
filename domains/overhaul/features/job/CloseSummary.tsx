"use client";
/** สรุปงานรายคัน (ดูอย่างเดียว) — ใช้ร่วม: ขั้น 7 ยืนยันการส่งอนุมัติ (P.1–P.2) · หน้าพิจารณาของผู้บังคับบัญชา (U.3–U.9) · หน้าสรุปรายคัน (T.2–T.5)
 *  จอ P.1: 2 คอลัมน์ (ซ้าย 750 / ขวา 522 gap 24) · Section label + Content item row · Table (บันทึกการติดตามงานซ่อม) · รายการอะไหล่ · File upload (ดูอย่างเดียว)
 *  Section label + Content item ของกลาง (packages/ui/PageHeader — เพิ่ม 15 พ.ย. 2569)
 *  บอร์ด P.1 ที่เจ้าของงานส่ง 16 พ.ย. 2569: ระยะสัญญา "ไม่เอา" ระยะเวลาสัญญา/ระยะเวลาดำเนินการ · scope แก้ section บันทึกการติดตามงานซ่อม (แบ่งหน้า) ·
 *    แก้ section อะไหล่ที่ใช้งาน (รายการในกล่องเทา "ชื่อ xจำนวน — ราคา" + รวมทั้งหมด) · เพิ่ม section ค่าใช้จ่ายในการดำเนินการ Overhaul */
import { useState, type ReactNode } from "react";
import { Pagination } from "@ui/Pagination";
import { currency } from "@rules/currency.mjs";
import { ContentItem, SectionLabel as SectionHeader } from "@ui/PageHeader";
import { ProgressBar } from "@ui/ProgressBar";
import { DataTable, Td, Th } from "@ui/Table";
import type { Garage, PurchaseOrder, VehicleJob } from "../po/types";
import type { PlanVehicle } from "../vehicle/types";
import { FileRow } from "../plan/PlanDetail";
import type { PartUsed } from "../po/types";
import { costRows, sumParts, warrantyEnd } from "./close";

/** P.1 อะไหล่ที่ใช้งาน: กล่องเทา แถวละ "ชื่อ xจำนวน" — ราคารวม · ท้ายกลุ่ม "รวมทั้งหมด" */
function PartList({ title, parts }: { title: string; parts: PartUsed[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-md font-semibold text-black">{title}</h3>
      <dl className="flex flex-col gap-4 rounded-lg bg-gray-50 p-6">
        {parts.map((p) => (
          <div key={p.id} className="grid grid-cols-2 gap-6">
            <dt className="text-md text-black">{`${p.name} x${p.qty.toLocaleString()}`}</dt>
            <dd className="text-md text-black tabular-nums">{currency(p.qty * p.price)}</dd>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-6">
          <dt className="text-md font-semibold text-black">รวมทั้งหมด</dt>
          <dd className="text-md font-semibold text-black tabular-nums">{currency(sumParts(parts))}</dd>
        </div>
      </dl>
    </div>
  );
}

function Box({ items, cols = 3 }: { items: Array<[string, ReactNode]>; cols?: 2 | 3 }) {
  return (
    <dl className={cols === 2 ? "grid grid-cols-1 gap-x-6 gap-y-5 rounded-lg bg-gray-50 p-6 sm:grid-cols-2" : "grid grid-cols-1 gap-x-6 gap-y-5 rounded-lg bg-gray-50 p-6 sm:grid-cols-2 xl:grid-cols-3"}>
      {items.map(([k, v]) => (
        <ContentItem key={k} label={k}>
          {v || "—"}
        </ContentItem>
      ))}
    </dl>
  );
}

export function CloseSummary({ job, po, garage, vehicle, warrantyExtra }: { job: VehicleJob; po: PurchaseOrder; garage?: Garage; vehicle?: PlanVehicle; warrantyExtra?: Array<[string, ReactNode]> }) {
  const c = job.close;
  const w = c?.warranty;
  const log = job.progressLog ?? [];
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const rows = log.slice((page - 1) * size, page * size);
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex min-w-0 flex-col gap-8">
        <section className="flex flex-col gap-4">
          <SectionHeader title="ข้อมูลผู้ซ่อม" />
          <Box cols={2} items={[["ศูนย์บริการ/อู่", garage?.name], ["เบอร์โทร ศูนย์บริการ/อู่", garage?.phone], ["ที่อยู่", garage?.address]]} />
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeader title="การรับประกันงานซ่อม" />
          <Box
            cols={2}
            items={[
              ...(w?.on
                ? ([["วันเริ่มรับประกัน", w.start], ["วันหมดอายุประกัน", warrantyEnd(w.start, w.days)], ["จำนวนวันที่รับประกัน", w.days ? String(w.days) : ""]] as Array<[string, ReactNode]>)
                : ([["การรับประกันงานซ่อม", "ไม่มี"]] as Array<[string, ReactNode]>)),
              ...(warrantyExtra ?? []),
            ]}
          />
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeader title="ระยะสัญญา" />
          {/* บอร์ด P.1: "ไม่เอา" ระยะเวลาสัญญา และระยะเวลาดำเนินการ */}
          <Box
            cols={2}
            items={[
              ["วันเริ่มสัญญา", po.contractStart],
              ["วันสิ้นสุดสัญญา", po.contractEnd],
              ["วันที่รับรถเข้าอู่", job.intake?.date],
              ["วันที่ส่งมอบรถคืน", c?.returnedAt],
            ]}
          />
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeader title="บันทึกการติดตามงานซ่อม" /* P.1 ไม่มีจำนวนในหัว */ />
          <DataTable label="บันทึกการติดตามงานซ่อม" striped>
            <thead>
              <tr>
                <Th>วันที่</Th>
                <Th>รายละเอียด</Th>
                <Th className="w-44">ความคืบหน้า</Th>
                <Th>หมายเหตุ</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <Td className="whitespace-nowrap">{e.at} น.</Td>
                  <Td className="whitespace-normal">{e.detail}</Td>
                  <Td>
                    <ProgressBar value={e.percent} tone="info" decimals={1} />
                  </Td>
                  <Td className="whitespace-normal">{e.note || "-"}</Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          {/* บอร์ด P.1: แบ่งหน้า "แสดง 1 ถึง n จาก n รายการ" + จำนวนต่อหน้า */}
          {log.length > 0 && <Pagination page={page} pageSize={size} total={log.length} onPageChange={setPage} onPageSizeChange={(n) => { setSize(n); setPage(1); }} />}
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeader title="อะไหล่ที่ใช้งาน" />
          {/* P.1: หัวย่อย "อะไหล่ — ตัวรถ" / "อะไหล่ — เครื่องมือกล" เหนือแต่ละกลุ่ม */}
          {c?.body.length ? <PartList title="อะไหล่ — ตัวรถ" parts={c.body} /> : null}
          {c?.tools.length ? <PartList title="อะไหล่ — เครื่องมือกล" parts={c.tools} /> : null}
          {!c?.body.length && !c?.tools.length && <p className="text-md text-gray-600">ไม่มีข้อมูลอะไหล่</p>}
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeader title="ค่าใช้จ่ายในการดำเนินการ Overhaul" />
          <Box items={c ? costRows(c).map(([k, v]) => [`${k} (บาท)`, currency(v)]) : []} />
        </section>
      </div>
      <div className="flex min-w-0 flex-col gap-8">
        <section className="flex flex-col gap-4">
          <SectionHeader title="ยานพาหนะ" />
          {/* P.1 คอลัมน์ขวา: ทะเบียน · ยี่ห้อ/รุ่น · ประเภท · สังกัด · อายุการใช้งาน · เลขไมล์สะสม (2 คอลัมน์) */}
          <Box cols={2} items={[["ทะเบียน", job.plate], ["ยี่ห้อ/รุ่น", vehicle ? `${vehicle.make} ${vehicle.model}` : ""], ["ประเภท", vehicle?.type], ["สังกัด", vehicle?.affiliation], ["อายุการใช้งาน", vehicle ? `${vehicle.ageYears} ปี` : ""], ["เลขไมล์สะสม", vehicle?.mileageKm != null ? `${vehicle.mileageKm.toLocaleString()} กม.` : ""]]} />
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeader title="เอกสาร Safety Inspection" />
          {job.inspection?.safety.length ? (
            <ul className="flex flex-col gap-2">
              {job.inspection.safety.map((f) => (
                <FileRow key={f.name} file={f} />
              ))}
            </ul>
          ) : (
            <p className="text-md text-gray-600">ไม่มีเอกสาร</p>
          )}
        </section>
      </div>
    </div>
  );
}
