/** Figma (Component) VMS Plus › ↳ ✅ Page headers › `Page header` + ↳ ✅ Breadcrumbs (`_Breadcrumbs item / Home` · `/ Link` · `/ Separator`)
 *  + ↳ ✅ Section headers › `Section header`
 *  Breadcrumb: ไอคอน home 20 gray-500 · ตัวคั่น chevron_right 16 gray-300 · ลิงก์ 14 gray-600 · หน้าปัจจุบัน 14/600 brand-900 (ตรงกับระบบเดิม)
 *  Title: 32/600/48 (มือถือ 22/32) — ค่าเดียวกับ .page-title ของ components.css (text-title ในธีม)
 *  Section header: 20/600/30 (text-lg)
 *  อ้างอิงหน้าจอ: refinement sprint 09 (OH2 / C.2 แก้ไขแผน · C.5 แผน ORZ7000011) */
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { cx } from "./cx";

export interface Crumb {
  label: string;
  href?: string;
  onClick?: () => void;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  // `Breadcrumbs` (จอ OH2 / B.3.4): แถวสูง 26 · gap 4 · ไอคอน home 20 · ข้อความ 12/400 · ลิงก์ gray-600 · หน้าปัจจุบัน brand-900 (ไม่หนา) · ช่องในรายการ pad 0/4
  return (
    <nav aria-label="ตำแหน่งหน้า" className="flex min-h-[26px] flex-wrap items-center gap-1 text-xs tracking-[-0.2px]">
      <Icon name="home" size={20} className="text-gray-500" label="หน้าหลัก" />
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            <Icon name="chevron_right" size={20} className="text-gray-300" />
            {last ? (
              <span aria-current="page" className="px-1 text-brand-900">{c.label}</span>
            ) : c.onClick ? (
              <button type="button" onClick={c.onClick} className="px-1 text-gray-600 hover:text-gray-700">{c.label}</button>
            ) : (
              <Link href={c.href || "#"} className="px-1 text-gray-600 no-underline hover:text-gray-700">{c.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function PageHeader({ crumbs, title, badge, subtitle, actions, className }: { crumbs?: Crumb[]; title: ReactNode; badge?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-col gap-6", className)}>
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-title font-semibold text-black max-md:text-title-m">{title}</h1>
            {badge}
          </div>
          {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

/** `Section header` (Breakpoint=Desktop · dump 2011-6955.json): แถบ Line 4×24 r-full brand-900 · gap 12 · หัวข้อ 20/600 ดำ ·
 *  ป้าย `Badge outline` ต่อท้ายหัวข้อ (เช่นจำนวนรถ) · ข้อความรอง 14 gray-600 · ปุ่มชิดขวา gap 12 */
export function SectionHeader({ title, badge, description, actions, className }: { title: ReactNode; badge?: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cx("flex items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-6 w-1 shrink-0 rounded-full bg-brand-900" />
          <h2 className="text-lg font-semibold text-black">{title}</h2>
          {badge}
        </div>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

/** `Section label` (Breakpoint=Desktop · dump 2011-6955.json): หัวข้อ 16/600 ดำ · ข้อความรอง 12 gray-600 (gap 4) · ปุ่มชิดขวา (gap 12) · สูงขั้นต่ำ 40 ·
 *  ใช้ในหน้าดูรายละเอียด (B.7 รายละเอียดแผน · E.9 รายละเอียด PO · A.5 หัวตาราง) — ฟอร์มใช้ SectionHeader (มีแถบสี) */
export function SectionLabel({ title, description, actions, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cx("flex min-h-10 items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-md font-semibold text-black">{title}</h2>
        {description && <p className="text-xs text-gray-600">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

/** `_Content item base` ใน `Content item row` (B.7): หัว 16/600 ดำ · ค่า 16/400 ดำ · gap 4 */
export function ContentItem({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-md font-semibold tracking-[-0.2px] text-black">{label}</dt>
      <dd className="text-md break-words text-black">{children === "" || children == null ? "-" : children}</dd>
    </div>
  );
}
