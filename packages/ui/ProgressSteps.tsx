/** Figma (Component) VMS Plus › ↳ ✅ Progress steps › `Progress steps` Type=Horizontal + `Horizontal step item` (2-10.json · จอ OH2 / K.1)
 *  กรอบ r8 ขอบ gray-300 · item pad 16/·/16/24 gap 8 พื้นขาว · Content gap 16 · วงกลม 40 r-full pad 8 ·
 *    Completed: พื้น+ขอบ brand-900 ไอคอน check 24 ขาว · ข้อความ 16/600 ดำ
 *    Current:   พื้นขาว ขอบ brand-900 เลข 16/600 brand-900 · ข้อความ 16/600 brand-900
 *    Incomplete: พื้นขาว ขอบ gray-300 เลข 16/600 gray-400 · ข้อความ 16/600 gray-600
 *  Connector = เส้นหักมุม (chevron) สูงเต็ม item ขอบ gray-300 คั่นระหว่างขั้น
 *  ไลบรารีมี 5 ขั้น — จอจริงใช้ 6–7 ขั้น (หน้างานรายคัน) จึงรับจำนวนขั้นเท่าไรก็ได้ · คลิกขั้นที่ผ่านแล้วเพื่อดูย้อนหลังได้ (S17 "ดูย้อนหลัง")
 *  ย้อนดูขั้นที่ผ่านแล้ว (ตามภาพ UAT 16 พ.ย. 2569): ขั้นที่กำลังดู = Current · ขั้นที่งานอยู่จริง = Incomplete · ขั้นอื่นที่ผ่านแล้ว = Completed · ไม่มีพื้นเน้น */
import { Icon } from "./Icon";
import { cx } from "./cx";

export function ProgressSteps({ steps, current, viewing, onSelect, label = "ขั้นตอนงาน" }: { steps: readonly string[]; /** 1-based ขั้นปัจจุบัน · เกินจำนวนขั้น = ครบทุกขั้น */ current: number; /** ขั้นที่กำลังดู (เน้นด้วยพื้น) */ viewing?: number; onSelect?: (step: number) => void; label?: string }) {
  return (
    <ol aria-label={label} className="flex overflow-x-auto rounded-md border border-gray-300 bg-white">
      {steps.map((s, i) => {
        const n = i + 1;
        const past = viewing !== undefined && viewing < current;
        const state = past ? (n === viewing ? "current" : n < current ? "done" : "todo") : n < current ? "done" : n === current ? "current" : "todo";
        const clickable = !!onSelect && n <= current;
        return (
          <li key={s} className="relative flex min-w-0 flex-1 items-stretch">
            <button
              type="button"
              disabled={!clickable}
              aria-current={state === "current" ? "step" : undefined}
              title={past && n === current ? "ขั้นปัจจุบันของงาน" : undefined}
              onClick={() => onSelect?.(n)}
              className={cx("flex min-w-0 flex-1 items-center gap-4 py-4 pr-2 pl-6 text-left", clickable ? "cursor-pointer" : "cursor-default")}
            >
              <span
                className={cx(
                  "flex size-10 shrink-0 items-center justify-center rounded-full border text-md font-semibold",
                  state === "done" ? "border-brand-900 bg-brand-900 text-white" : state === "current" ? "border-brand-900 bg-white text-brand-900" : "border-gray-300 bg-white text-gray-400",
                )}
              >
                {state === "done" ? <Icon name="check" size={24} /> : String(n).padStart(2, "0")}
              </span>
              <span className={cx("py-1 text-md leading-6 font-semibold", state === "done" ? "text-black" : state === "current" ? "text-brand-900" : "text-gray-600")}>{s}</span>
            </button>
            {i < steps.length - 1 && (
              <span aria-hidden className="relative w-5 shrink-0">
                <span className="absolute top-0 left-0 h-1/2 w-px origin-top skew-x-[16deg] bg-gray-300" />
                <span className="absolute bottom-0 left-0 h-1/2 w-px origin-bottom -skew-x-[16deg] bg-gray-300" />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
