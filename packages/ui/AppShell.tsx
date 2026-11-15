"use client";
/** โครงแอป = Figma (Component) VMS Plus › ↳ ✅Sidebar navigation (`Sidebar navigation` State=Expanded|Collapsed · `Nav item` · `Nav list item` · `Nav button`)
 *  + ↳ Header navigation (`Header navigation` Breakpoint=Desktop)
 *
 *  พฤติกรรม (เจ้าของงานสั่ง 13 พ.ย. 2569 "ต้อง hover ถึง expand · out hover ก็หุบ" + ให้ดูระบบเดิม
 *  vmsplus-dev.pea.co.th/vehicle-booking/request-list — วัดจริง 13 พ.ย. 2569):
 *    ปกติ = Collapsed 80 · ชี้เมาส์ (หรือ Tab เข้าด้วยคีย์บอร์ด — :focus-visible ไม่ใช่ focus-within เพื่อไม่ให้ค้างกางหลังคลิกเมาส์) = Expanded 280 **ลอยทับเนื้อหา ไม่ดัน** ไม่มีเงา ไม่มีฉากหลัง · เอาเมาส์ออก = หุบ
 *    ปุ่มข้างโลโก้ (keyboard_tab) = ปักหมุด: ค้างกาง 280 และ **ดันเนื้อหา** · ไอคอนเป็น keyboard_tab_rtl · กดอีกครั้ง = เลิกปักหมุด
 *    transition ทุกค่า 300ms ease-in-out (cubic-bezier(.4,0,.2,1)) ตามระบบเดิม
 *  - Expanded: pad 12/16 · gap 20 · ขอบขวา gray-200 · โลโก้ `Brand logo` 98×40
 *    `Nav item` h40 r8 pad 8 gap 8 · 14/600 ดำ · ไอคอน 24 gray-500 · Active พื้น gray-200 ตัว+ไอคอน brand-900 · ลูกศร 20
 *    `Nav list item` (เมนูย่อย) h40 r8 pad 8/16/8/40 · 14/400 ดำ · Active พื้น gray-200 ตัว brand-900
 *  - Collapsed: `PEA logo` 32 · `Nav button` 40×40 r8 · Active พื้น gray-200 ไอคอน brand-900 · เมนูย่อยซ่อน
 *  - Header: h64 · pad 12/32 · ขอบล่าง gray-200 · ชิดขวา: ปุ่มไอคอน + `Avatar` 36
 *  โครงเมนู/ลำดับ: design/reference/navigation.md · อ้างอิงหน้าจอ: refinement sprint 09 (ทุกจอ OH2) */
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { cx } from "./cx";

export interface NavChild {
  id: string;
  label: string;
  href?: string;
}
export interface NavGroup {
  id: string;
  label: string;
  icon: string;
  href?: string;
  children?: NavChild[];
}

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
const EASE = "duration-300 ease-[cubic-bezier(.4,0,.2,1)]";
/** คลาสของสภาพ "กาง" 3 แบบ: ชี้เมาส์ · focus จากคีย์บอร์ด (:focus-visible) · ปักหมุด (data-pinned) — เขียนเป็นข้อความตรงๆ เพราะ Tailwind สแกนจากซอร์ส
 *  (ห้ามประกอบชื่อคลาสด้วยฟังก์ชัน ไม่งั้นไม่มี CSS ถูกสร้าง) */
const OPEN_HIDDEN = "group-hover/side:hidden group-has-[:focus-visible]/side:hidden group-data-[pinned=true]/side:hidden";
const OPEN_BLOCK = "group-hover/side:block group-has-[:focus-visible]/side:block group-data-[pinned=true]/side:block";
const OPEN_FLEX = "group-hover/side:flex group-has-[:focus-visible]/side:flex group-data-[pinned=true]/side:flex";
const OPEN_FULL = "group-hover/side:w-full group-has-[:focus-visible]/side:w-full group-data-[pinned=true]/side:w-full";
const LABEL = cx("min-w-0 overflow-hidden whitespace-nowrap text-ellipsis max-w-0 opacity-0 transition-[max-width,opacity]", EASE, "group-hover/side:max-w-[188px] group-has-[:focus-visible]/side:max-w-[188px] group-data-[pinned=true]/side:max-w-[188px] group-hover/side:opacity-100 group-has-[:focus-visible]/side:opacity-100 group-data-[pinned=true]/side:opacity-100");

export function AppShell({ nav, activeId, children, user = "ผู้ใช้", notifications }: { nav: NavGroup[]; activeId: string; children: ReactNode; user?: string; /** มีค่า = กระดิ่งเปิดแผง Notification card */ notifications?: ReactNode }) {
  const activeGroup = nav.find((g) => g.id === activeId || g.children?.some((c) => c.id === activeId))?.id;
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => (activeGroup ? { [activeGroup]: true } : {}));
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    try {
      setPinned(localStorage.getItem("vms-side-pinned") === "1");
    } catch {}
  }, []);
  const togglePin = () => {
    setPinned((v) => {
      try {
        localStorage.setItem("vms-side-pinned", v ? "0" : "1");
      } catch {}
      return !v;
    });
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* ช่องจองที่ให้ sidebar: ปกติ 80 (แผงกางทับเนื้อหา) · ปักหมุด 280 (ดันเนื้อหา) */}
      <aside aria-label="เมนูหลัก" className={cx("sticky top-0 z-40 h-screen shrink-0 transition-[width] max-md:hidden", EASE, pinned ? "w-70" : "w-20")}>
        <div
          data-pinned={pinned}
          className={cx(
            "group/side absolute inset-y-0 left-0 flex flex-col gap-5 overflow-x-hidden overflow-y-auto border-r border-gray-200 bg-white py-3 transition-[width,padding]",
            EASE,
            pinned ? "w-70 px-4" : "w-20 px-5 hover:w-70 hover:px-4 has-[:focus-visible]:w-70 has-[:focus-visible]:px-4",
          )}
        >
          {/* `Logo wrap`: โลโก้ + ปุ่มปักหมุด (Secondary button ไอคอน 40) */}
          <div className="flex h-10 shrink-0 items-center justify-between gap-2">
            <img src={`${base}/brand/pea-logo.svg`} alt="VMS Plus" width={32} height={32} className={cx("mx-1", OPEN_HIDDEN)} />
            <img src={`${base}/brand/brand-logo.svg`} alt="VMS Plus" width={98} height={40} className={cx("hidden px-1", OPEN_BLOCK)} />
            <button
              type="button"
              onClick={togglePin}
              aria-pressed={pinned}
              aria-label={pinned ? "เลิกปักหมุดเมนู" : "ปักหมุดเมนู"}
              title={pinned ? "เลิกปักหมุดเมนู" : "ปักหมุดเมนู"}
              className={cx("hidden size-10 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 shadow-field hover:bg-gray-50", OPEN_FLEX)}
            >
              <Icon name={pinned ? "keyboard_tab_rtl" : "keyboard_tab"} size={20} />
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {nav.map((g) => {
              const on = g.id === activeGroup;
              const isOpen = !!expanded[g.id];
              const rowCls = cx(
                "flex h-10 w-10 shrink-0 items-center gap-2 rounded-md p-2 no-underline transition-[width,background-color]",
                EASE,
                "hover:bg-gray-200",
                OPEN_FULL,
                on && "bg-gray-200",
              );
              const inner = (
                <>
                  <Icon name={g.icon} size={24} className={on ? "text-brand-900" : "text-gray-500"} />
                  <span className={cx(LABEL, "flex-1 text-left text-sm font-semibold", on ? "text-brand-900" : "text-black")}>{g.label}</span>
                  {g.children && (
                    <span className={cx("hidden", OPEN_BLOCK)}>
                      <Icon name={isOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={20} className="text-gray-500" />
                    </span>
                  )}
                </>
              );
              return (
                <div key={g.id} className="flex flex-col gap-1">
                  {g.children ? (
                    <button type="button" aria-expanded={isOpen} aria-label={g.label} title={g.label} onClick={() => setExpanded((o) => ({ ...o, [g.id]: !o[g.id] }))} className={rowCls}>
                      {inner}
                    </button>
                  ) : (
                    <Link href={g.href || "#"} aria-label={g.label} title={g.label} className={rowCls}>
                      {inner}
                    </Link>
                  )}
                  {g.children && isOpen && (
                    <ul className={cx("hidden flex-col gap-1", OPEN_FLEX)}>
                      {g.children.map((c) => {
                        const cur = c.id === activeId;
                        return (
                          <li key={c.id}>
                            <Link
                              href={c.href || "#"}
                              aria-current={cur ? "page" : undefined}
                              aria-disabled={c.href ? undefined : true}
                              title={c.href ? undefined : "ยังไม่มีในต้นแบบ"}
                              className={cx(
                                "flex min-h-10 items-center rounded-md py-2 pr-4 pl-10 text-sm whitespace-nowrap no-underline hover:bg-gray-200",
                                cur ? "bg-gray-200 text-brand-900" : "text-black",
                                !c.href && "pointer-events-none text-gray-400",
                              )}
                            >
                              {c.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-end gap-2 border-b border-gray-200 bg-white px-8 py-3 max-md:px-4">
          {notifications ?? (
            <button type="button" aria-label="การแจ้งเตือน" className="flex size-10 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200">
              <Icon name="notifications" size={24} />
            </button>
          )}
          <span aria-label={user} title={user} className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-900">
            {user.slice(0, 1)}
          </span>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
