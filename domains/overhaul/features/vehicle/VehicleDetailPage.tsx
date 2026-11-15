"use client";
/** หน้ารายละเอียดยานพาหนะ (หน้าที่มีอยู่แล้วในระบบ VMS Plus) — ปลายทางของเมนู "ดูข้อมูลยานพาหนะ" / "ดูข้อมูลการซ่อม" (D3) และปุ่ม > ในแท็บยานพาหนะ (A.5)
 *  ⚠ ไม่มีจอใน Figma refinement 09 — โครงอิงภาพหน้าจอระบบเดิม vmsplus-dev ที่เจ้าของงานส่ง (13 พ.ย. 2569):
 *    แท็บ ข้อมูลยานพาหนะ (การ์ดข้อมูล 2 คอลัมน์ + คอลัมน์ขวา รูป/ใบคู่มือ/บัตรเติมน้ำมัน/การใช้งานล่าสุด) · แท็บ ประวัติการซ่อมบำรุง (ตาราง)
 *  ใช้ component กลาง (Page header · Tabs · Pill · Badge outline with indicator · Table · Pagination) — สีและระยะยังไม่ได้เทียบกับ UI Kit */
import type { ReactNode } from "react";
import { Button } from "@ui/Button";
import { OutlineBadge, Pill, StatusBadge } from "@ui/Badge";
import { EmptyState } from "@ui/EmptyState";
import { Icon } from "@ui/Icon";
import { PageHeader, type Crumb } from "@ui/PageHeader";
import { Pagination } from "@ui/Pagination";
import { RowMenu } from "@ui/RowMenu";
import { SearchInput } from "@ui/SearchInput";
import { SelectField } from "@ui/SelectField";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { Tabs } from "@ui/Tabs";
import { TextField } from "@ui/TextField";
import { currency } from "@rules/currency.mjs";
import type { VehicleInfo } from "./types";

export type VehicleTab = "info" | "trips" | "fuel" | "maintenance" | "repair";

export interface RepairRecord {
  no: string;
  appointment: string;
  doneAt: string | null;
  center: string;
  kind: string;
  ref: string;
  status: string;
}

function Card({ title, children, onEdit }: { title: string; children: ReactNode; onEdit?: () => void }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold text-black">{title}</h3>
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-sm font-semibold text-brand-900 hover:underline">
            แก้ไข
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
function Grid({ items, cols = 2 }: { items: Array<[string, ReactNode]>; cols?: 2 | 4 }) {
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-5 rounded-lg bg-gray-50 p-5 ${cols === 4 ? "md:grid-cols-4" : "md:grid-cols-2"}`}>
      {items.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-1">
          <dt className="text-sm font-semibold text-black">{k}</dt>
          <dd className="text-sm text-gray-700">{v ?? "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function VehicleDetailPage({
  vehicle,
  crumbs,
  tab,
  onTab,
  repairs,
  onNotInScope,
}: {
  vehicle: VehicleInfo;
  /** breadcrumb ตามหน้าที่มา (T2) */
  crumbs: Crumb[];
  tab: VehicleTab;
  onTab: (t: VehicleTab) => void;
  repairs: RepairRecord[];
  onNotInScope: (what: string) => void;
}) {
  const edit = (what: string) => () => onNotInScope(`แก้ไข${what}`);
  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={crumbs}
        title={vehicle.plate}
        badge={<Pill tone="error">ส่งซ่อม</Pill>}
        actions={
          <>
            <Button variant="secondary" iconLeft="edit_calendar" onClick={() => onNotInScope("เปลี่ยนเลขทะเบียน")}>
              เปลี่ยนเลขทะเบียน
            </Button>
            <Button variant="secondary" iconLeft="chair" onClick={() => onNotInScope("เปลี่ยนสังกัด")}>
              เปลี่ยนสังกัด
            </Button>
            <label className="flex cursor-pointer items-center gap-2 text-md text-black">
              <input type="checkbox" defaultChecked className="peer sr-only" onChange={() => onNotInScope("เปิด/ปิดใช้งานยานพาหนะ")} />
              <span className="relative h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-brand-900 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
              เปิดใช้งาน
            </label>
          </>
        }
      />
      <Tabs
        value={tab}
        onChange={(t) => onTab(t as VehicleTab)}
        items={[
          { id: "info", label: "ข้อมูลยานพาหนะ" },
          { id: "trips", label: "ข้อมูลการเดินทาง" },
          { id: "fuel", label: "การเติมเชื้อเพลิง" },
          { id: "maintenance", label: "ตารางบำรุงรักษา" },
          { id: "repair", label: "ประวัติการซ่อมบำรุง" },
        ]}
      />

      {tab === "info" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
          <div className="flex flex-col gap-6">
            <Card title="ข้อมูลทั่วไป" onEdit={edit("ข้อมูลทั่วไป")}>
              <Grid items={[["หมวดหมู่ยานพาหนะหลัก", "รถยนต์ของหน่วยงาน"], ["หมวดหมู่ยานพาหนะย่อย", vehicle.type], ["ประเภทยานพาหนะหลัก", "รถใช้งานเฉพาะ"], ["ประเภทยานพาหนะย่อย", vehicle.type], ["ลักษณะการใช้งาน", "รถส่วนกลาง"], ["ประเภทเกียร์", "ธรรมดา"], ["หมายเหตุ", "-"]]} />
            </Card>
            <Card title="ข้อมูลการเงินและสัญญา" onEdit={edit("ข้อมูลการเงินและสัญญา")}>
              <Grid items={[["ประเภทการจัดหา", "รถซื้อ"], ["เลขที่สัญญา", "-"], ["วันที่ส่งมอบ", "-"], ["มูลค่ายานพาหนะ", currency(vehicle.value)], ["เครดิตภาษี", "ได้"]]} />
            </Card>
            <Card title="ข้อมูลสังกัดยานพาหนะ" onEdit={edit("ข้อมูลสังกัดยานพาหนะ")}>
              <Grid items={[["สังกัดยานพาหนะ", vehicle.affiliation], ["รหัสข้างรถ", "-"], ["ศูนย์ต้นทุน", "-"], ["รหัสประเภทธุรกิจ (BA)", "-"], ["รหัสทรัพย์สิน", "-"], ["วันที่ได้รับยานพาหนะ", "-"]]} />
            </Card>
            <Card title="ข้อมูลการจดทะเบียน" onEdit={edit("ข้อมูลการจดทะเบียน")}>
              <Grid cols={4} items={[["ประเภทยานพาหนะ", vehicle.type], ["ยี่ห้อรถ", vehicle.make], ["แบบ / รุ่น", vehicle.model], ["อายุการใช้งาน", `${vehicle.ageYears} ปี`], ["เลขตัวรถ", "-"], ["เลขเครื่องยนต์", "-"], ["ประเภทเชื้อเพลิง", "ดีเซล"], ["จำนวนล้อ", "-"]]} />
            </Card>
          </div>
          <div className="flex flex-col gap-6">
            <Card title="รูปยานพาหนะ" onEdit={edit("รูปยานพาหนะ")}>
              <div className="flex aspect-[444/308] items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                <Icon name="local_shipping" size={32} label="ยังไม่มีรูปยานพาหนะ" />
              </div>
            </Card>
            <Card title="ใบคู่มือจดทะเบียน" onEdit={edit("ใบคู่มือจดทะเบียน")}>
              <span className="text-sm text-gray-600">ยังไม่มีไฟล์</span>
            </Card>
            <Card title="บัตรเติมน้ำมัน" onEdit={edit("บัตรเติมน้ำมัน")}>
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
                <span className="text-md font-semibold text-black">ยังไม่มีบัตรเติมน้ำมัน</span>
                <div className="flex gap-2">
                  <OutlineBadge>Fleet Card</OutlineBadge>
                </div>
              </div>
            </Card>
            <Card title="การใช้งานล่าสุด" onEdit={edit("การใช้งานล่าสุด")}>
              <ul className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 text-sm">
                {(
                  [
                    ["speed", "เลขไมล์", vehicle.mileageKm !== undefined ? vehicle.mileageKm.toLocaleString() : "-"],
                    ["schedule", "ชั่วโมงการทำงาน", vehicle.engineHours !== undefined ? vehicle.engineHours.toLocaleString() : "-"],
                    ["local_gas_station", "ปริมาณเชื้อเพลิง", "-"],
                    ["local_parking", "สถานที่จอดรถ", "-"],
                  ] as const
                ).map(([ic, k, v]) => (
                  <li key={k} className="flex items-center gap-3">
                    <Icon name={ic} size={20} className="text-brand-900" />
                    <span className="flex-1 font-semibold text-black">{k}</span>
                    <span className="text-black">{v}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {tab === "repair" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value="" onChange={() => onNotInScope("ค้นหาประวัติการซ่อม")} placeholder="หมายเลขงานซ่อม, หมายเลขอ้างอิง" aria-label="ค้นหาประวัติการซ่อม" className="w-80" />
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <TextField icon="calendar_month" placeholder="ระบุช่วงวันที่นัดหมาย" aria-label="ช่วงวันที่นัดหมาย" readOnly onClick={() => onNotInScope("เลือกช่วงวันที่")} className="w-72" />
              <SelectField aria-label="ประเภทการซ่อม" options={[{ value: "", label: "ทุกประเภท" }]} className="w-56" />
              <SelectField aria-label="สถานะงานซ่อม" options={[{ value: "", label: "ทุกสถานะ" }]} className="w-56" />
            </div>
          </div>
          {repairs.length === 0 ? (
            <EmptyState kind="data-empty" title="ยังไม่มีประวัติการซ่อมบำรุง" />
          ) : (
            <>
              <DataTable label="ประวัติการซ่อมบำรุง" striped>
                <thead>
                  <tr>
                    <Th>หมายเลขงานซ่อม</Th>
                    <Th>วันที่ / เวลานัดหมาย</Th>
                    <Th>วันที่ / เวลาที่ซ่อมเสร็จ</Th>
                    <Th>ศูนย์บริการ</Th>
                    <Th>ประเภทการซ่อม</Th>
                    <Th>หมายเลขอ้างอิง</Th>
                    <Th>สถานะงานซ่อม</Th>
                    <Th aria-label="ดูรายละเอียด" />
                  </tr>
                </thead>
                <tbody>
                  {repairs.map((r) => {
                    const [d, t] = r.appointment.split(" ");
                    return (
                      <tr key={r.no}>
                        <Td className="font-semibold">{r.no}</Td>
                        <Td>
                          <CellStack main={d} sub={t} />
                        </Td>
                        <Td>{r.doneAt ?? "-"}</Td>
                        <Td>{r.center}</Td>
                        <Td>{r.kind}</Td>
                        <Td>{r.ref}</Td>
                        <Td>
                          <StatusBadge tone={r.status === "เสร็จสิ้น" ? "success" : "brand"}>{r.status}</StatusBadge>
                        </Td>
                        <Td className="w-14 text-right">
                          <RowMenu label={`จัดการ ${r.no}`} icon="quick_reference_all" items={[{ label: "ดูรายละเอียดงานซ่อม", icon: "quick_reference_all", onSelect: () => onNotInScope(`รายละเอียดงานซ่อม ${r.no}`) }]} />
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </DataTable>
              <Pagination page={1} pageSize={10} total={repairs.length} onPageChange={() => {}} />
            </>
          )}
        </div>
      )}

      {tab !== "info" && tab !== "repair" && <EmptyState kind="data-empty" title="ยังไม่อยู่ในต้นแบบรอบนี้" description="แท็บนี้เป็นหน้าเดิมของระบบ VMS Plus" />}
    </div>
  );
}
