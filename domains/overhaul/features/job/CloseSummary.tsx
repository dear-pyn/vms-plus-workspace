"use client";
/** สรุปงานรายคัน (ดูอย่างเดียว) — ใช้ร่วม: ขั้น 7 ยืนยันการส่งอนุมัติ (P.1–P.2) · หน้าพิจารณาของผู้บังคับบัญชา (U.3–U.9) · หน้าสรุปรายคัน (T.2–T.5)
 *  จอ P.1: 2 คอลัมน์ (ซ้าย 750 / ขวา 522 gap 24) · Section label + Content item row · Table (บันทึกการติดตามงานซ่อม) · รายการอะไหล่ · File upload (ดูอย่างเดียว)
 *  Section label + Content item ของกลาง (packages/ui/PageHeader — เพิ่ม 15 พ.ย. 2569)
 *  บอร์ด P.1 ที่เจ้าของงานส่ง 16 พ.ย. 2569: ระยะสัญญา "ไม่เอา" ระยะเวลาสัญญา/ระยะเวลาดำเนินการ · scope แก้ section บันทึกการติดตามงานซ่อม (แบ่งหน้า) ·
 *    แก้ section อะไหล่ที่ใช้งาน (รายการในกล่องเทา "ชื่อ xจำนวน — ราคา" + รวมทั้งหมด) · เพิ่ม section ค่าใช้จ่ายในการดำเนินการ Overhaul */
import { useState, type ReactNode } from "react";
import { Pagination } from "@ui/Pagination";
import { Icon } from "@ui/Icon";
import { currency } from "@rules/currency.mjs";
import { ContentItem, SectionLabel as SectionHeader } from "@ui/PageHeader";
import { ProgressBar } from "@ui/ProgressBar";
import { DataTable, Td, Th } from "@ui/Table";
import type { Garage, PurchaseOrder, VehicleJob } from "../po/types";
import type { PlanVehicle } from "../vehicle/types";
import { FileRow } from "../plan/PlanDetail";
import { PhotoStrip } from "../shared/PhotoUploader";
import type { PartUsed } from "../po/types";
import { costRows, sumParts, warrantyEnd } from "./close";

const baht = (n: number) => `${currency(n)} บาท`;

/** ภาพหน้าปิดงานที่เจ้าของงานส่ง 16 พ.ย. 2569 — อะไหล่ที่ใช้งาน: กล่องเทา แถวละ "รหัส - ชื่อ xจำนวน" ซ้าย · "ราคา บาท" ชิดขวา ·
 *  เส้นคั่น แล้ว "รวมทั้งหมด" ตัวหนา · เจ้าของงาน 18 พ.ย. 2569 ให้บรรทัดรวม = font-bold text-gray-600 16px (text-base ใช้ไม่ได้ในธีม → text-md) (คงหัวย่อย ตัวรถ / เครื่องมือกล เพราะข้อมูลแยก 2 หมวด) */
function PartList({ title, parts }: { title: string; parts: PartUsed[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-md font-semibold text-black">{title}</h3>
      <dl className="flex flex-col gap-4 rounded-lg bg-gray-50 p-6">
        {parts.map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-6">
            <dt className="text-md text-black">{`${p.code ? `${p.code} - ` : ""}${p.name} x${p.qty.toLocaleString()}`}</dt>
            <dd className="shrink-0 text-md text-black tabular-nums">{baht(p.qty * p.price)}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-6 border-t border-gray-300 pt-4">
          <dt className="text-md font-bold text-gray-600">รวมทั้งหมด</dt>
          <dd className="shrink-0 text-md font-bold text-gray-600 tabular-nums">{baht(sumParts(parts))}</dd>
        </div>
      </dl>
    </div>
  );
}

/** ค่าใช้จ่ายในการดำเนินการ Overhaul — รูปแบบเดียวกับ PartList (แถวสุดท้ายของ costRows = รวมค่าใช้จ่ายทั้งสิ้น) */
function CostList({ rows }: { rows: Array<[string, number]> }) {
  const items = rows.slice(0, -1);
  const [totalLabel, total] = rows[rows.length - 1];
  return (
    <dl className="flex flex-col gap-4 rounded-lg bg-gray-50 p-6">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-6">
          <dt className="text-md text-black">{k}</dt>
          <dd className="shrink-0 text-md text-black tabular-nums">{baht(v)}</dd>
        </div>
      ))}
      <div className="flex items-center justify-between gap-6 border-t border-gray-300 pt-4">
        <dt className="text-md font-bold text-gray-600">{totalLabel}</dt>
        <dd className="shrink-0 text-md font-bold text-gray-600 tabular-nums">{baht(total)}</dd>
      </div>
    </dl>
  );
}

/** การ์ดยานพาหนะ — ไฟล์ UI Release#2 `Fleet card` (r16 พื้นขาว ขอบ gray-200 p16 gap16: รูป + เนื้อหา) + `Card item row` (ไอคอน brand · ป้าย · ค่าชิดขวา ในกล่องเทา)
 *  ตามภาพหน้าปิดงาน 16 พ.ย. 2569 · ต้นแบบยังไม่มีรูปยานพาหนะ → กรอบพื้นเทา + ไอคอน */
function VehicleCard({ plate, vehicle, lastMileage }: { plate: string; vehicle?: PlanVehicle; lastMileage?: number | null }) {
  const rows: Array<[string, string, string]> = [
    ["event", "อายุการใช้งาน", vehicle ? `${vehicle.ageYears} ปี` : "—"],
    ["schedule", "ชั่วโมงสะสม", vehicle?.engineHours != null ? `${vehicle.engineHours.toLocaleString()} ชม.` : "—"],
    ["speed", "เลขไมล์ล่าสุด", lastMileage != null ? `${lastMileage.toLocaleString()} กม.` : "—"],
    ["speed", "เลขไมล์สะสม", vehicle?.mileageKm != null ? `${vehicle.mileageKm.toLocaleString()} กม.` : "—"],
  ];
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row">
      {/* ภาพตัวอย่าง: รูปจัตุรัส สูงเท่ากับเนื้อหาทางขวา (กว้าง = สูง จาก aspect-square ตอนยืดเต็มความสูงแถว) · จอแคบเต็มกว้าง */}
      <div className="flex aspect-square w-full shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400 sm:h-auto sm:w-auto sm:self-stretch" aria-label="ยังไม่มีรูปยานพาหนะ">
        <Icon name="local_shipping" size={32} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-md font-semibold text-black">{plate}</span>
          <span className="text-sm font-semibold text-gray-600">{[vehicle ? `${vehicle.make} ${vehicle.model}` : "", vehicle?.type].filter(Boolean).join(" | ")}</span>
          {vehicle?.affiliation && <span className="text-sm text-gray-600">{vehicle.affiliation}</span>}
        </div>
        <dl className="flex flex-col gap-3 rounded-md bg-gray-50 p-3">
          {rows.map(([icon, k, v]) => (
            <div key={k} className="flex items-center gap-2 text-sm">
              <Icon name={icon} size={20} className="text-brand-900" />
              <dt className="flex-1 text-gray-700">{k}</dt>
              <dd className="text-gray-600 tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
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
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* เจ้าของงาน 17 พ.ย. 2569: ขั้น 7 แบ่ง 2 คอลัมน์เท่ากัน (ซ้าย ข้อมูลงาน · ขวา ยานพาหนะ) — เดิม 3:2 */}
      <div className="flex min-w-0 flex-col gap-8">
        <section className="flex flex-col gap-4">
          <SectionHeader title="ข้อมูลผู้ซ่อม" />
          <Box cols={2} items={[["ศูนย์บริการ/อู่", garage?.name], ["เบอร์โทร ศูนย์บริการ/อู่", garage?.phone], ["ที่อยู่", garage?.address]]} />
        </section>
        {/* เจ้าของงาน 17 พ.ย. 2569: แสดงรูปก่อน/หลัง Overhaul ในขั้น 7 แบบแถวรูป "รูปภาพเหตุการณ์" (เฉพาะคอลัมน์ซ้าย · ขวาคงเดิม) · เป็นส่วนที่ 2 ต่อจากข้อมูลผู้ซ่อม (เจ้าของงาน 17 พ.ย. 2569) */}
        <section className="flex flex-col gap-4">
          <SectionHeader title="รูปสภาพยานพาหนะก่อน Overhaul" />
          <PhotoStrip label="รูปสภาพยานพาหนะก่อน Overhaul" photos={job.intake?.photos ?? []} />
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeader title="รูปสภาพยานพาหนะหลัง Overhaul" />
          <PhotoStrip label="รูปสภาพยานพาหนะหลัง Overhaul" photos={job.inspection?.photos ?? []} />
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
          {/* เจ้าของงาน 16 พ.ย. 2569: แสดงแบบเดียวกับอะไหล่ที่ใช้งาน — รายการ … บาท ชิดขวา + เส้นคั่น + รวมค่าใช้จ่ายทั้งสิ้น ตัวหนา */}
          {c ? <CostList rows={costRows(c)} /> : <p className="text-md text-gray-600">ไม่มีข้อมูลค่าใช้จ่าย</p>}
        </section>
      </div>
      <div className="flex min-w-0 flex-col gap-8">
        <section className="flex flex-col gap-4">
          <SectionHeader title="ยานพาหนะ" />
          {/* ภาพหน้าปิดงาน 16 พ.ย. 2569: การ์ดยานพาหนะแบบมีรูป (เลขไมล์ล่าสุด = เลขไมล์ปัจจุบันที่กรอกตอนตรวจรับรถ ขั้น 2) */}
          <VehicleCard plate={job.plate} vehicle={vehicle} lastMileage={job.intake?.mileageKm} />
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
