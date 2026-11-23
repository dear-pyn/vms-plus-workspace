"use client";
/** สรุปใบแจ้งซ่อม 2 คอลัมน์ — ใช้ที่ แจ้งซ่อมขั้น 4 "ยืนยันการแจ้งซ่อม" และแท็บ "ข้อมูลการซ่อม" ของหน้ารายละเอียด (UAT 20 พ.ย. 2569)
 *  ซ้าย: ข้อมูลยานพาหนะและผู้แจ้ง · อาการเสียและรายละเอียดเหตุการณ์ · รูปภาพเหตุการณ์ · อะไหล่ที่ผู้แจ้งเลือกไว้
 *  ขวา: ยานพาหนะ (การ์ด) · ผู้แจ้งเหตุ · ข้อมูลติดต่อหน่วยงานที่แจ้งซ่อม (ผู้ขับขี่ · ช่างคุมรถ) */
import type { ReactNode } from "react";
import { Icon } from "@ui/Icon";
import { BUDGETS, personOf, vehicleOf } from "../mock/data";
import { num, type RepairJob } from "./model";
import { PartsReadList } from "./parts";
import { InfoPanel, PlainTitle } from "./ui";
import { currency } from "@rules/currency.mjs";
import { loadGarages } from "../mock/store";

export function RequestSummary({ job, receiverFull, top }: { job: RepairJob; receiverFull?: boolean; top?: ReactNode }) {
  const v = vehicleOf(job.plate);
  const rep = personOf(job.reporterId);
  const rcv = personOf(job.receiverId);
  const b = job.budget;
  const budgetRows: [ReactNode, ReactNode][] =
    b.type === "invest" ? [["เลขที่ WBS", b.wbs], ["เลขที่โครงข่าย", b.network], ["เลขที่กิจกรรม", b.activity]] : b.type === "other" ? [["ศูนย์ต้นทุน", b.costCenter]] : b.type === "etc" ? [["เหตุผล", b.reason]] : [];
  const parts = job.repairParts.map((p) => (p === "chassis" ? "ตัวรถ" : v.type.includes("เครน") ? "เครน" : "กระเช้าแก้ไฟ")).join(", ");
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-6">
        {top}
        <section className="flex flex-col gap-4">
          <PlainTitle>ข้อมูลยานพาหนะและผู้แจ้ง</PlainTitle>
          <InfoPanel
            items={[
              ["วันที่สร้าง", job.createdAt],
              ["วันที่อัพเดตสถานะ", receiverFull ? "-" : job.updatedAt], /* receiverFull = ร่างก่อนส่ง (ขั้น 4) */
              ["หน่วยงานที่แจ้งซ่อม", rep?.unit],
              ["สถานะรถ", job.carUsable ? "ใช้งานได้" : "ใช้งานไม่ได้"],
              ["รูปแบบการซ่อม", job.requestMode === "med" ? "ซ่อมโดย กบค." : "ซ่อมศูนย์บริการ/อู่"],
              ["ส่วนที่ต้องการซ่อม", parts || "ตัวรถ"],
              ["งบที่ตัด", BUDGETS.find((x) => x.value === b.type)?.label],
              ...budgetRows,
              ...(job.requestMode === "self" ? ([["ศูนย์บริการ/อู่", loadGarages().find((g) => g.id === job.requestGarageId)?.name ?? "-"], ["ราคาประเมินค่าซ่อม", job.estimate ? `${currency(job.estimate)} บาท` : "-"]] as [ReactNode, ReactNode][]) : []),
              ["ผู้รับแจ้งเหตุ", receiverFull && rcv ? `${rcv.name}, ${rcv.position}, ${rcv.unit}` : rcv?.name],
            ]}
          />
        </section>
        <section className="flex flex-col gap-4">
          <PlainTitle>อาการเสียและรายละเอียดเหตุการณ์</PlainTitle>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 rounded-xl bg-gray-50 p-6 md:grid-cols-2">
            <Item label="อาการเสีย" wide>{job.symptoms.join(", ")}</Item>
            {!receiverFull && <Item label="อาการเสียอื่น ๆ" wide>{job.otherSymptom || "ไม่มี"}</Item>}
            <Item label="หมายเหตุ" wide>{job.note}</Item>
            <Item label="เลขไมล์ปัจจุบัน">{num(job.mileage ?? 0)}</Item>
            <Item label="ชั่วโมงใช้งานเครื่องจักร">{num(job.hours ?? 0)}</Item>
          </dl>
        </section>
        <section className="flex flex-col gap-4">
          <PlainTitle>รูปภาพเหตุการณ์</PlainTitle>
          {job.photos ? (
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: job.photos }, (_, i) => (
                <span key={i} className="flex size-24 items-center justify-center rounded-lg bg-gray-100 text-gray-400"><Icon name="image" size={32} /></span>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 px-6 py-8 text-center text-sm text-gray-600">ไม่มีรูปภาพเหตุการณ์</div>
          )}
        </section>
        <section className="flex flex-col gap-4">
          <PlainTitle>อะไหล่ที่ผู้แจ้งเลือกไว้</PlainTitle>
          <PartsReadList lines={job.requestedParts} />
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <section className="flex flex-col gap-4">
          <PlainTitle>ยานพาหนะ</PlainTitle>
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-semibold text-black">{v.plate} {v.provinceShort}</span>
              <span className="text-md font-semibold text-gray-600">{v.brand} {v.model}</span>
              <span className="text-sm text-gray-600">- <span className="mx-1 text-gray-300">|</span> {v.unit}</span>
            </div>
            <div className="flex flex-col gap-3 rounded-lg bg-gray-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-gray-700"><Icon name="calendar_clock" size={24} className="text-brand-900" />อายุการใช้งาน</span><span className="text-gray-700">{v.age}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-gray-700"><Icon name="swap_driving_apps_wheel" size={24} className="text-brand-900" />เลขไมล์ล่าสุด</span><span className="text-gray-700">{num(job.mileage ?? v.mileage)}</span></div>
            </div>
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <PlainTitle>ผู้แจ้งเหตุ</PlainTitle>
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 p-4">
            <span className="flex size-16 items-center justify-center rounded-lg bg-brand-50 text-brand-200"><Icon name="person" size={32} filled /></span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-black">{rep?.name}</span>
              <span className="text-xs text-gray-600">9121 | {rep?.unit}</span>
            </div>
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <PlainTitle>ข้อมูลติดต่อหน่วยงานที่แจ้งซ่อม</PlainTitle>
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
            {[["ผู้ขับขี่", v.driver], ["ช่างคุมรถ", v.mechanic]].map(([k, n]) => (
              <div key={k} className="flex flex-col gap-2">
                <span className="text-md font-semibold text-black">{k}</span>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-4">
                  <span className="text-sm font-semibold text-black">{n || "-"}</span>
                  <span className="flex items-center gap-1 text-sm text-gray-500"><Icon name="smartphone" size={24} />-</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Item({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "flex min-w-0 flex-col gap-1 md:col-span-2" : "flex min-w-0 flex-col gap-1"}>
      <dt className="text-sm font-semibold text-black">{label}</dt>
      <dd className="text-sm break-words text-gray-700">{children === "" || children == null ? "-" : children}</dd>
    </div>
  );
}
