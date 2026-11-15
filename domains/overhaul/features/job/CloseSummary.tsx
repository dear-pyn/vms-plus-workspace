"use client";
/** สรุปงานรายคัน (ดูอย่างเดียว) — ใช้ร่วม: ขั้น 7 ยืนยันการส่งอนุมัติ (P.1–P.2) · หน้าพิจารณาของผู้บังคับบัญชา (U.3–U.9) · หน้าสรุปรายคัน (T.2–T.5)
 *  จอ P.1: 2 คอลัมน์ (ซ้าย 750 / ขวา 522 gap 24) · Section label + Content item row · Table (บันทึกการติดตามงานซ่อม) · รายการอะไหล่ · File upload (ดูอย่างเดียว)
 *  Section label + Content item ของกลาง (packages/ui/PageHeader — เพิ่ม 15 พ.ย. 2569) */
import type { ReactNode } from "react";
import { currency } from "@rules/currency.mjs";
import { ContentItem, SectionLabel as SectionHeader } from "@ui/PageHeader";
import { ProgressBar } from "@ui/ProgressBar";
import { DataTable, Td, Th } from "@ui/Table";
import { parseThaiDate } from "@ui/DateField";
import type { Garage, PurchaseOrder, VehicleJob } from "../po/types";
import type { PlanVehicle } from "../vehicle/types";
import { FileRow } from "../plan/PlanDetail";
import { PartsTable } from "./StepClose";
import { costRows, warrantyEnd } from "./close";

const days = (a?: string, b?: string) => {
  const x = a ? parseThaiDate(a) : null;
  const y = b ? parseThaiDate(b) : null;
  return x && y ? `${Math.round((y.getTime() - x.getTime()) / 86_400_000) + 1} วัน` : "";
};

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
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex min-w-0 flex-col gap-8">
        <section className="flex flex-col gap-4">
          <SectionHeader title="ข้อมูลผู้ซ่อม" />
          <Box items={[["ศูนย์บริการ/อู่", garage?.name], ["เบอร์โทร ศูนย์บริการ/อู่", garage?.phone], ["ที่อยู่", garage?.address]]} />
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeader title="การรับประกันงานซ่อม" />
          <Box
            items={[
              ...(w?.on
                ? ([["วันเริ่มรับประกัน", w.start], ["วันหมดอายุประกัน", warrantyEnd(w.start, w.days)], ["จำนวนวันที่รับประกัน", w.days ? `${w.days} วัน` : ""], ["แจ้งเตือนก่อนหมด", "เจ้าของยานพาหนะ และ กบค. 30 วัน และ 15 วัน"]] as Array<[string, ReactNode]>)
                : ([["การรับประกันงานซ่อม", "ไม่มี"], ["แจ้งเตือนก่อนหมด", "ไม่แจ้งเตือน"]] as Array<[string, ReactNode]>)),
              ...(warrantyExtra ?? []),
            ]}
          />
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeader title="ระยะสัญญา" />
          <Box
            items={[
              ["วันเริ่มสัญญา", po.contractStart],
              ["วันสิ้นสุดสัญญา", po.contractEnd],
              ["ระยะเวลาสัญญา", days(po.contractStart, po.contractEnd)],
              ["วันที่รับรถเข้าอู่", job.intake?.date],
              ["วันที่ส่งมอบรถคืน", c?.returnedAt],
              ["ระยะเวลาดำเนินการ", days(job.intake?.date, c?.returnedAt)],
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
              {(job.progressLog ?? []).map((e) => (
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
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeader title="อะไหล่ที่ใช้งาน" />
          {/* P.1: หัวย่อย "อะไหล่ — ตัวรถ" / "อะไหล่ — เครื่องมือกล" เหนือแต่ละกลุ่ม */}
          {c?.body.length ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-md font-semibold text-black">อะไหล่ — ตัวรถ</h3>
              <PartsTable label="อะไหล่ — ตัวรถ" parts={c.body} />
            </div>
          ) : null}
          {c?.tools.length ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-md font-semibold text-black">อะไหล่ — เครื่องมือกล</h3>
              <PartsTable label="อะไหล่ — เครื่องมือกล" parts={c.tools} />
            </div>
          ) : null}
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
