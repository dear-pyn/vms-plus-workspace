"use client";
/** รายละเอียดอู่/ศูนย์บริการ (19 พ.ย. 2569) — ยังไม่มีจอจากทีมออกแบบ
 *  เจ้าของงาน 19 พ.ย. 2569 "หน้ารายละเอียดต้องทำ design แบบที่เคยมี" ⇒ แบบเดียวกับหน้ารายละเอียดแผน / Purchase Order (OH2 / E.9):
 *    Page header + Secondary danger "ลบอู่/ศูนย์บริการ" + Secondary "แก้ไข" · Section label (หน้าดูรายละเอียด) ·
 *    Content item row ในกล่องพื้น gray-50 (4 คอลัมน์ xl) · ไฟล์เป็นการ์ด FileRow กว้างเต็ม
 *  เจ้าของงาน 19 พ.ย. 2569: ไม่แสดง "Purchase Order ที่ใช้อู่นี้" — หน้านี้เป็นข้อมูลหลัก (master) ของอู่ */
import { Button } from "@ui/Button";
import { ContentItem as Item, PageHeader, SectionLabel } from "@ui/PageHeader";
import { FileRow } from "../plan/PlanDetail";
import type { Garage } from "../po/types";

const BOX = "grid grid-cols-1 gap-x-6 gap-y-5 rounded-lg bg-gray-50 p-6 md:grid-cols-2 xl:grid-cols-4";
/** กล่องครึ่งจอ (ที่อยู่ · พิกัด) — แถวละ 2 ช่อง · สูงเต็มคอลัมน์ให้สองกล่องเท่ากัน */
const HALF = "grid flex-1 grid-cols-1 content-start gap-x-6 gap-y-5 rounded-lg bg-gray-50 p-6 sm:grid-cols-2";

export function GarageDetail({ garage, onBack, onEdit, onDelete }: { garage: Garage; onBack: () => void; onEdit: () => void; onDelete: () => void }) {
  const a = garage.addr;
  const map = garage.lat && garage.lng ? `https://www.google.com/maps?q=${encodeURIComponent(`${garage.lat},${garage.lng}`)}` : "";
  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader
        crumbs={[{ label: "อู่/ศูนย์บริการ", onClick: onBack }, { label: garage.code ?? garage.name }]}
        title={garage.name}
        actions={
          <>
            <Button variant="secondaryDanger" iconLeft="delete" onClick={onDelete}>ลบอู่/ศูนย์บริการ</Button>
            <Button variant="secondary" iconLeft="stylus" onClick={onEdit}>แก้ไข</Button>
          </>
        }
      />

      <section className="flex flex-col gap-5">
        <SectionLabel /* Section label (หน้าดูรายละเอียด) */ title="ข้อมูลอู่/ศูนย์บริการ" />
        <dl className={BOX}>
          <Item label="รหัส">{garage.code}</Item>
          <Item label="ชื่ออู่/ศูนย์บริการ">{garage.name}</Item>
          <Item label="เบอร์โทร">{garage.phone}</Item>
          <Item label="อีเมล">{garage.email}</Item>
          <Item label="ประเภทยานพาหนะที่รองรับ">{garage.vehicleTypes?.join(", ")}</Item>
          <Item label="ยี่ห้อยานพาหนะที่รองรับ">{garage.brands?.join(", ")}</Item>
        </dl>
      </section>

      {/* เจ้าของงาน 19 พ.ย. 2569: ลองแบบจ่าหน้าซอง (ที่อยู่ + พิกัดกล่องเดียว) แล้ว "เอาแบบเดิม ดีกว่า" — คง 6 ช่องแยก + กล่องพิกัด
          เจ้าของงาน 19 พ.ย. 2569 (ต่อ): ที่อยู่กับพิกัดแบ่ง 2 คอลัมน์ (จอกว้าง xl) · ในกล่องแถวละ 2 ช่อง · กล่องสูงเท่ากัน · จอแคบเรียงซ้อน */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:gap-6">
        <section className="flex flex-col gap-5">
          <SectionLabel /* Section label (หน้าดูรายละเอียด) */ title="ที่อยู่" />
          <dl className={HALF}>
            <Item label="เลขที่">{a?.houseNo}</Item>
            <Item label="ถนน">{a?.street}</Item>
            <Item label="ตำบล/แขวง">{a?.subdistrict}</Item>
            <Item label="อำเภอ/เขต">{a?.district}</Item>
            <Item label="จังหวัด">{a?.province}</Item>
            <Item label="รหัสไปรษณีย์">{a?.zip}</Item>
          </dl>
        </section>

        <section className="flex flex-col gap-5">
          <SectionLabel /* Section label (หน้าดูรายละเอียด) */ title="พิกัด" />
          <dl className={HALF}>
            <Item label="ละติจูด">{garage.lat}</Item>
            <Item label="ลองจิจูด">{garage.lng}</Item>
            <Item label="แผนที่">{map ? <a className="font-semibold text-brand-900 hover:underline" href={map} target="_blank" rel="noopener noreferrer">เปิดแผนที่</a> : ""}</Item>
          </dl>
        </section>
      </div>

      {/* เจ้าของงาน 19 พ.ย. 2569: ไม่มีเอกสาร = ไม่แสดงส่วนนี้ (เดิมขึ้น "ไม่มีไฟล์") */}
      {!!garage.docs?.length && (
        <section className="flex flex-col gap-5">
          <SectionLabel /* Section label (หน้าดูรายละเอียด) */ title="เอกสารอ้างอิง" />
          <ul className="flex flex-col gap-2">
            {garage.docs.map((f) => <FileRow key={f.name} file={f} />)}
          </ul>
        </section>
      )}
    </div>
  );
}
