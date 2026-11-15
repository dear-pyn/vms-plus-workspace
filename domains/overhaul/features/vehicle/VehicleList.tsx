"use client";
/** แท็บ "ยานพาหนะที่ Overhaul" — Scene A.5–A.8 (refinement sprint 09) **ไม่ทำการ์ดสรุป/กราฟ** (เจ้าของงานสั่ง 13 พ.ย. 2569)
 *  ตารางครบชุดอยู่ที่ VehicleBrowser (ใช้ร่วมกับฟอร์มแผน) · ปุ่ม > "ไปหน้ารายละเอียดรถที่เคยมี" (มติ FigJam) */
import { Button } from "@ui/Button";
import type { OverhaulVehicle } from "./types";
import { VehicleBrowser } from "./VehicleBrowser";

export function VehicleList({ vehicles, onOpenVehicle }: { vehicles: OverhaulVehicle[]; onOpenVehicle: (plate: string) => void }) {
  return (
    <VehicleBrowser
      rows={vehicles}
      label="ยานพาหนะที่ Overhaul"
      title={(n) => `ยานพาหนะที่ Overhaul (${n})`}
      showYear
      rowKey={(v) => `${v.plate}-${v.fiscalYear}`}
      action={(v) => <Button variant="tertiary" iconOnly="keyboard_arrow_right" aria-label={`ดูรายละเอียดยานพาหนะ ${v.plate}`} onClick={() => onOpenVehicle(v.plate)} />}
    />
  );
}
