"use client";
/** เพิ่ม/แก้ไข อู่/ศูนย์บริการ — จอเจ้าของงาน 19 พ.ย. 2569 (ภาพ "เพิ่มอู่/ศูนย์บริการ") + เปลี่ยนที่อยู่เป็นแบบเต็ม
 *  ส่วน: ข้อมูลอู่/ศูนย์บริการ · ที่อยู่ (ใหม่ แยก section แทน Text area) · พิกัด · เอกสารอ้างอิง · ปุ่ม ยกเลิก (ซ้าย) / บันทึก (ขวา)
 *  บังคับ: ชื่อ · ประเภทยานพาหนะที่รองรับ (เจ้าของงาน 19 พ.ย. 2569 · จอเดิมเป็น "(ถ้ามี)") · เบอร์โทร (จอไม่มี "(ถ้ามี)") · ที่เหลือ "(ถ้ามี)" ตามจอ · ที่อยู่พิมพ์เองทุกช่อง (ไม่มี API ที่อยู่) บังคับทุกช่องยกเว้นถนน (เจ้าของงาน 19 พ.ย. 2569)
 *  บันทึกไม่มี modal ยืนยัน (กติกา submit 17 พ.ย. 2569) · ออกจากหน้าระหว่างแก้ = modal ออกจากหน้า (EC-27)
 *  component: Page header · Section header · Text input · multi-select (ประกอบ ดู TagMultiSelect) · File upload · Button lg */
import { useCallback, useState } from "react";
import { Button } from "@ui/Button";
import { PageHeader, SectionHeader } from "@ui/PageHeader";
import { TextField } from "@ui/TextField";
import { GENERAL_ERROR } from "../shared/messages";
import { useLeaveGuard } from "../shared/useLeaveGuard";
import { ACCEPT, MAX_MB, Uploader } from "../plan/PlanForm";
import { usePrototypeFill } from "../../prototype/MockTools";
import { mockFile } from "../../prototype/fixtures";
import { GARAGE_BRANDS, GARAGE_VEHICLE_TYPES } from "../../mock/garages";
import type { Garage } from "../po/types";
import { AddressFields, addressErrors } from "./AddressFields";
import { TagMultiSelect } from "./TagMultiSelect";
import { draftOf, emptyGarage, type GarageDraft } from "./types";

const MAX_FILES = 10;
const PHONE = /^0[0-9-]{8,11}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Key = "name" | "types" | "phone" | "email" | "lat" | "lng" | "houseNo" | "province" | "district" | "subdistrict" | "zip";

export function GarageForm({ garage, all, onCancel, onGoList, onSave, onNotify }: {
  garage?: Garage;
  /** ทุกอู่ (กันชื่อซ้ำ) */
  all: Garage[];
  onCancel: () => void;
  onGoList: () => void;
  onSave: (d: GarageDraft) => Promise<true | string>;
  onNotify: (msg: string, tone?: "success" | "error", description?: string) => void;
}) {
  const isNew = !garage;
  const [initial] = useState<GarageDraft>(() => (garage ? draftOf(garage) : emptyGarage()));
  const [d, setD] = useState<GarageDraft>(initial);
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [fileError, setFileError] = useState("");
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const { requestLeave, runSave, dialog } = useLeaveGuard(dirty, onCancel, "fill"); // modal แบบใหม่: ปุ่ม 50/50 (design/figma-overhaul-ui/Modal footer.png)
  const set = <K extends keyof GarageDraft>(k: K, v: GarageDraft[K]) => setD((x) => ({ ...x, [k]: v }));

  usePrototypeFill((mode) => {
    setD({
      ...d,
      name: mode === "missing" ? "" : mode === "error" ? "error — อู่ทดสอบ" : d.name && !/error/i.test(d.name) ? d.name : "อู่ทดสอบ นครปฐม",
      vehicleTypes: d.vehicleTypes.length ? d.vehicleTypes : [GARAGE_VEHICLE_TYPES[0]],
      brands: d.brands.length ? d.brands : [GARAGE_BRANDS[1]],
      phone: mode === "missing" ? "" : d.phone || "034-000-999",
      addr: d.addr.province ? d.addr : { houseNo: "55/2 หมู่ 3", street: "เพชรเกษม", subdistrict: "ตำบลพระปฐมเจดีย์", district: "อำเภอเมืองนครปฐม", province: "นครปฐม", zip: "73000" },
      docs: d.docs.length ? d.docs : [mockFile("garage")],
    });
    setTouched({});
  }, !saving);

  const errorOf = (k: Key, x: GarageDraft = d): string | undefined => {
    const ae = addressErrors(x.addr);
    switch (k) {
      case "name": {
        const n = x.name.trim();
        if (!n) return "กรุณากรอกชื่ออู่/ศูนย์บริการ";
        if (all.some((g) => !g.deleted && g.id !== garage?.id && g.name.trim() === n)) return "มีอู่/ศูนย์บริการชื่อนี้แล้ว";
        return undefined;
      }
      case "types": return x.vehicleTypes.length ? undefined : "กรุณาเลือกประเภทยานพาหนะที่รองรับ";
      case "phone": return !x.phone.trim() ? "กรุณากรอกเบอร์โทร" : PHONE.test(x.phone.trim()) ? undefined : "รูปแบบเบอร์โทรไม่ถูกต้อง เช่น 02-000-0000";
      case "email": return x.email.trim() && !EMAIL.test(x.email.trim()) ? "รูปแบบอีเมลไม่ถูกต้อง" : undefined;
      case "lat": return x.lat.trim() && !(Math.abs(Number(x.lat)) <= 90 && x.lat.trim() !== "") ? "ละติจูดต้องอยู่ระหว่าง -90 ถึง 90" : undefined;
      case "lng": return x.lng.trim() && !(Math.abs(Number(x.lng)) <= 180) ? "ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180" : undefined;
      default: return ae[k];
    }
  };
  const err = (k: Key) => (touched[k] ? errorOf(k) : undefined);
  const touch = (k: Key) => setTouched((t) => ({ ...t, [k]: true }));
  const touchTypes = useCallback(() => setTouched((t) => (t.types ? t : { ...t, types: true })), []);

  function addFiles(list: File[]) {
    const bad = list.find((f) => !ACCEPT.test(f.name) || f.size > MAX_MB * 1024 * 1024);
    const ok = list.filter((f) => ACCEPT.test(f.name) && f.size <= MAX_MB * 1024 * 1024).map((f) => ({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)) }));
    const room = MAX_FILES - d.docs.length;
    setFileError(bad ? `${bad.name}: รองรับเฉพาะ PDF, JPG หรือ PNG ขนาดไม่เกิน ${MAX_MB} MB` : ok.length > room ? `แนบได้ไม่เกิน ${MAX_FILES} ไฟล์` : "");
    set("docs", [...d.docs, ...ok.filter((f) => !d.docs.some((x) => x.name === f.name)).slice(0, Math.max(0, room))]);
  }

  async function submit() {
    if (saving) return;
    const keys: Key[] = ["name", "types", "phone", "email", "houseNo", "subdistrict", "district", "province", "zip", "lat", "lng"];
    setTouched(Object.fromEntries(keys.map((k) => [k, true])));
    if (keys.some((k) => errorOf(k))) return;
    setSaving(true);
    const addr = Object.fromEntries(Object.entries(d.addr).map(([k, v]) => [k, v.trim()])) as GarageDraft["addr"];
    const r = await runSave(() => onSave({ ...d, name: d.name.trim(), phone: d.phone.trim(), email: d.email.trim(), addr }));
    setSaving(false);
    if (r !== true) onNotify(r === GENERAL_ERROR ? "บันทึกข้อมูลไม่สำเร็จ" : r, "error", r === GENERAL_ERROR ? r : undefined);
  }

  const title = isNew ? "เพิ่มอู่/ศูนย์บริการ" : `แก้ไข ${garage.code ?? garage.name}`;
  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader crumbs={[{ label: "อู่/ศูนย์บริการ", onClick: () => requestLeave(onGoList) }, { label: title }]} title={title} />

      <section className="flex flex-col gap-4">
        <SectionHeader title="ข้อมูลอู่/ศูนย์บริการ" />
        <TextField label="ชื่ออู่/ศูนย์บริการ" placeholder="เช่น บริษัท ตัวอย่างมอเตอร์ จำกัด" value={d.name} onChange={(e) => set("name", e.target.value)} onBlur={() => touch("name")} error={err("name")} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TagMultiSelect label="ประเภทยานพาหนะที่รองรับ" placeholder="เลือกประเภทยานพาหนะ" options={GARAGE_VEHICLE_TYPES} value={d.vehicleTypes} onChange={(v) => { set("vehicleTypes", v); touch("types"); }} onClose={touchTypes} error={err("types")} />
          <TagMultiSelect label="ยี่ห้อยานพาหนะที่รองรับ" optional placeholder="เลือกยี่ห้อ" options={GARAGE_BRANDS} value={d.brands} onChange={(v) => set("brands", v)} />
          <TextField label="เบอร์โทร" type="tel" inputMode="tel" placeholder="เช่น 02-000-0000" value={d.phone} onChange={(e) => set("phone", e.target.value)} onBlur={() => touch("phone")} error={err("phone")} />
          <TextField label="อีเมล" optional type="email" placeholder="เช่น service@example.com" value={d.email} onChange={(e) => set("email", e.target.value)} onBlur={() => touch("email")} error={err("email")} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="ที่อยู่" />
        <AddressFields
          value={d.addr}
          onChange={(a) => set("addr", a)}
          onBlur={(k) => k !== "street" && touch(k)}
          errors={{ houseNo: err("houseNo"), subdistrict: err("subdistrict"), district: err("district"), province: err("province"), zip: err("zip") }}
        />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="พิกัด" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextField label="ละติจูด" optional inputMode="decimal" placeholder="เช่น 13.7563" value={d.lat} onChange={(e) => set("lat", e.target.value)} onBlur={() => touch("lat")} error={err("lat")} />
          <TextField label="ลองจิจูด" optional inputMode="decimal" placeholder="เช่น 100.5018" value={d.lng} onChange={(e) => set("lng", e.target.value)} onBlur={() => touch("lng")} error={err("lng")} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="เอกสารอ้างอิง" />
        <Uploader label="เอกสารที่เกี่ยวข้อง" optional files={d.docs} error={fileError || undefined} onAdd={addFiles} onRemove={(n) => set("docs", d.docs.filter((f) => f.name !== n))} />
        <p className="-mt-2 text-xs text-gray-600">แนบได้สูงสุด {MAX_FILES} ไฟล์ · {d.docs.length}/{MAX_FILES} ไฟล์</p>
      </section>

      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" size="lg" onClick={() => requestLeave()}>ยกเลิก</Button>
        <Button size="lg" onClick={submit} loading={saving}>บันทึก</Button>
      </div>
      {dialog}
    </div>
  );
}
