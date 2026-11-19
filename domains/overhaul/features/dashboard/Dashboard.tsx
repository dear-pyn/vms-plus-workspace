"use client";
/** Dashboard Overhaul — 2 ระดับ (แผน / ยานพาหนะ)
 *  ข้อมูล + วิธีเลือก + สูตร: ยกจากต้นแบบ Downloads/Dashboard/dashboard-review (plan/Main.dc.html · vehicles/Vehicles.dc.html) ตามเจ้าของงาน 17 พ.ย. 2569
 *    ระดับแผน: ปีงบประมาณ + เลือกหลายแผน (เริ่มที่แผนล่าสุดของปี) · ระดับยานพาหนะ: ปีงบประมาณ + แผนเดียวหรือทุกแผน + ค้นหาทะเบียน/ยี่ห้อรุ่น
 *  CI VMS Plus (แทนสีไล่เฉด/ม่วงคราม/ฟอนต์ของต้นแบบ): ไลบรารี (Component) VMS Plus › `Page header` · `Tabs` · `Input dropdown` · `Search input` ·
 *    `Table` · `Badge` (Pill) · `Progress bar` · `Pagination` · `Side panel` · `Tertiary/Secondary button` · Material Symbols · token สีจาก tokens
 *    + หน้า UI Release#2 ที่ใช้การ์ดตัวเลขกรอบขาว/ตารางแบบเดียวกัน · การ์ดตัวเลข/โดนัท/แท่งเทียบไม่มีใน component file — อิงต้นแบบ Downloads (รอทีมออกแบบยืนยัน) */
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Pill } from "@ui/Badge";
import { Button } from "@ui/Button";
import { EmptyState } from "@ui/EmptyState";
import { FeaturedIcon, type FeaturedTone } from "@ui/Modal";
import { Icon } from "@ui/Icon";
import { PageHeader } from "@ui/PageHeader";
import { Pagination } from "@ui/Pagination";
import { ProgressBar } from "@ui/ProgressBar";
import { SearchInput } from "@ui/SearchInput";
import { SelectField } from "@ui/SelectField";
import { CellStack, DataTable, Td, Th } from "@ui/Table";
import { Tabs } from "@ui/Tabs";
import { currency } from "@rules/currency.mjs";
import { DASH_PLANS, DASH_VEHICLES, type DashPlan } from "../../mock/dashboard";
import { DASH_STATUS, DASH_STEPS, WORTH_LIMIT, groups, pctOf, summarize, toRows } from "./model";
import { PlanMultiSelect } from "./PlanMultiSelect";

type Tab = "plans" | "vehicles";
const n = (v: number) => v.toLocaleString("en-US");
const YEARS = [...new Set(DASH_PLANS.map((p) => p.fiscalYear))].sort().reverse();
const YEAR_OPTIONS = [...YEARS.map((y) => ({ value: y, label: y })), { value: "all", label: "ทุกปีงบประมาณ" }];
const plansOf = (year: string) => DASH_PLANS.filter((p) => year === "all" || p.fiscalYear === year);
/** ค่าเริ่มต้นระดับแผน = แผนล่าสุดของปีที่เลือก (ตามต้นแบบ) */
const latestPlan = (plans: DashPlan[]) => [...plans].sort((a, b) => a.planNo.localeCompare(b.planNo)).at(-1)?.id;

function Panel({ title, subtitle, actions, children, className = "" }: { title: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`flex min-w-0 flex-col gap-5 rounded-lg border border-gray-200 bg-white p-6 max-md:p-4 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

/** การ์ดตัวเลข = ไลบรารี (Component) VMS Plus › ✅ Dashboard (2259-8626) › `Metric item`:
 *  กรอบขาว ขอบ gray-300 r12 · pad 16/20 · gap 20 · แถวบน `Featured icon` md 48 วงกลม + ป้าย 16/600 ดำ (gap 12) · ตัวเลข 32/600 ดำ
 *  สีพื้นไอคอนตามไลบรารี: brand · gray · success · error (ไม่มีโทน warning — งานค้างใช้ gray) · บรรทัดรอง/หน่วย = ส่วนเพิ่มจากต้นแบบ Downloads */
function Metric({ label, value, unit, sub, icon, tone = "gray" }: { label: string; value: string; unit?: string; sub: string; icon: string; tone?: FeaturedTone }) {
  return (
    <div className="flex min-w-0 flex-col gap-5 rounded-lg border border-gray-300 bg-white px-4 py-5">
      <div className="flex items-center gap-3">
        <FeaturedIcon name={icon} tone={tone} />
        <span className="min-w-0 text-md font-semibold tracking-[-0.2px] text-black">{label}</span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="flex flex-wrap items-baseline gap-1.5">
          <strong className="text-title leading-tight font-semibold text-black tabular-nums max-sm:text-xl">{value}</strong>
          {unit && <span className="text-sm text-gray-600">{unit}</span>}
        </p>
        <span className="text-xs text-gray-600">{sub}</span>
      </div>
    </div>
  );
}

function FilterCard({ description, children }: { description: string; children: ReactNode }) {
  return (
    <section aria-label="ตัวกรอง" className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 max-md:p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-md bg-gray-100 text-gray-700"><Icon name="filter_list" size={20} /></span>
        <div className="flex flex-col">
          <strong className="text-md font-semibold text-gray-900">ตัวกรอง</strong>
          <span className="text-sm text-gray-600">{description}</span>
        </div>
      </div>
      {children}
    </section>
  );
}

export function OverhaulDashboard({ tab, onTab, onManage, onVehicle }: { tab: Tab; onTab: (tab: Tab) => void; onManage: () => void; /** 18 พ.ย. 2569: ไอคอนรูปตา → หน้ายานพาหนะของ VMS Plus ปัจจุบัน (แท็บใหม่ ตามกติกา T3) แทนหน้างานรายคัน */ onVehicle: (plate: string) => void }) {
  return (
    <div className="flex flex-col gap-6 p-8 max-md:p-4">
      <PageHeader
        crumbs={[{ label: "จัดการยานพาหนะขนาดใหญ่" }, { label: "Dashboard Overhaul" }]}
        title="Dashboard Overhaul"
        subtitle={tab === "plans" ? "ความคืบหน้าแผน งบประมาณ และความคุ้มค่าเทียบซื้อยานพาหนะใหม่ นับจากยานพาหนะใน Purchase Order ของแต่ละแผน" : "สถานะ ค่าใช้จ่าย และความคุ้มค่าของยานพาหนะแต่ละคันใน Purchase Order"}
        actions={<Button variant="secondary" iconLeft="arrow_forward" onClick={onManage}>จัดการงาน Overhaul</Button>}
      />
      <Tabs value={tab} onChange={(v) => onTab(v as Tab)} items={[{ id: "plans", label: "ระดับแผน" }, { id: "vehicles", label: "ระดับยานพาหนะ" }]} />
      {tab === "plans" ? <PlanLevel /> : <VehicleLevel onVehicle={onVehicle} />}
      <p className="text-center text-xs text-gray-500">ราคาซื้อใหม่ใช้ราคากลาง · ข้อมูลจำลองสำหรับต้นแบบ</p>
    </div>
  );
}

/* ───────── ระดับแผน ───────── */
function PlanLevel() {
  const [year, setYear] = useState(YEARS[0]);
  const plans = plansOf(year);
  const [sel, setSel] = useState<string[] | null>(null);
  const [cmpPage, setCmpPage] = useState(1);
  const [cmpSize, setCmpSize] = useState(10);
  const ids = sel ?? [latestPlan(plans)].filter((x): x is string => !!x);
  const selPlans = plans.filter((p) => ids.includes(p.id));
  const rows = useMemo(() => toRows(DASH_VEHICLES, selPlans), [selPlans]);
  const s = summarize(rows);
  const budget = selPlans.reduce((t, p) => t + p.approvedBudget, 0);
  const avgBudget = rows.length ? rows.reduce((t, x) => t + x.per, 0) / rows.length : 0;
  const g = groups(rows);
  const p1 = pctOf(g.done, rows.length);
  const p2 = pctOf(g.done + g.inProgress, rows.length);
  const steps = DASH_STEPS.map((label, i) => ({ label, count: rows.filter((x) => DASH_STATUS[x.status][1] === i + 1).length }));
  const worth = rows.length - s.rebuy;

  return (
    <>
      <FilterCard description="เลือกปีงบประมาณและแผน เลือกได้หลายแผน พิมพ์ค้นแผนได้ เริ่มต้นที่แผนล่าสุดของปี · ตัวเลขทั้งหน้ารวมผลของแผนที่เลือก">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
          <SelectField label="ปีงบประมาณ" options={YEAR_OPTIONS} value={year} onChange={(e) => { setYear(e.target.value); setSel(null); setCmpPage(1); }} />
          <PlanMultiSelect label="แผน Overhaul" plans={plans} value={ids} onChange={(v) => { setSel(v); setCmpPage(1); }} />
        </div>
      </FilterCard>

      {!rows.length ? (
        <EmptyState kind="data-empty" title="ไม่มียานพาหนะในแผนที่เลือก" description="เลือกปีงบประมาณหรือแผนอื่น" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Metric label="ความคืบหน้ารวม" value={`${s.pct}%`} sub={`เฉลี่ยจากยานพาหนะ ${n(s.total)} คัน`} icon="monitoring" tone="brand" />
            <Metric label="ยานพาหนะในแผน" value={n(s.total)} unit="คัน" sub={`${selPlans.length} แผนที่เลือก`} icon="local_shipping" />
            <Metric label="เสร็จแล้ว" value={n(s.done)} unit="คัน" sub={`${pctOf(s.done, s.total)}% ของยานพาหนะในแผน`} icon="task_alt" tone="success" />
            <Metric label="ยังไม่เสร็จ" value={n(s.pending)} unit="คัน" sub="ค้างอยู่ในแผน" icon="pending_actions" tone="gray" />
            <Metric label="ค่าใช้จ่ายจริง" value={currency(s.actual)} unit="บาท" sub={`${pctOf(s.actual, budget)}% ของวงเงินอนุมัติ`} icon="payments" />
            <Metric label="ถูกกว่าซื้อใหม่" value={currency(s.nw - s.oh)} unit="บาท" sub={`Overhaul = ${s.ratio}% ของราคาซื้อใหม่`} icon="savings" tone="success" />
          </div>

          <section aria-label="ตัวเลขงบประมาณ" className="flex flex-col gap-3">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-gray-200 bg-white p-6 max-md:p-4 md:grid-cols-3 xl:grid-cols-6">
              {[
                ["วงเงินอนุมัติ", `${currency(budget)} บาท`],
                ["งบต่อคัน (เฉลี่ย)", `${currency(avgBudget)} บาท`],
                ["ค่าใช้จ่ายจริงต่อคัน", s.actualAvg === null ? "—" : `${currency(s.actualAvg)} บาท`],
                ["ประหยัดงบต่อคัน", s.saveAvg === null ? "—" : `${currency(s.saveAvg)} บาท`],
                ["ประหยัดงบรวม", `${currency(s.save)} บาท`],
                ["ควรพิจารณาซื้อใหม่", `${n(s.rebuy)} คัน`],
              ].map(([label, value]) => (
                <div key={label} className="flex min-w-0 flex-col gap-1">
                  <dt className="text-sm text-gray-600">{label}</dt>
                  <dd className="text-md font-semibold text-gray-900 tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-gray-500">ค่าใช้จ่ายจริงนับเฉพาะยานพาหนะที่ปิดงานแล้ว {n(s.done)} คัน · งบต่อคัน = วงเงินอนุมัติ ÷ จำนวนยานพาหนะในแผน · ค่า Overhaul ของคันที่ยังไม่ปิดงานใช้งบต่อคัน</p>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Panel title="ยานพาหนะในแผน">
              <div className="flex justify-center">
                <div role="img" aria-label={`ยานพาหนะ ${s.total} คัน เสร็จแล้ว ${g.done} อยู่ระหว่างดำเนินการ ${g.inProgress} ยังไม่เข้าอู่ ${g.wait}`} className="flex size-48 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--success-600) 0 ${p1}%, var(--brand-900) ${p1}% ${p2}%, var(--gray-300) ${p2}% 100%)` }}>
                  <div className="flex size-34 flex-col items-center justify-center rounded-full bg-white">
                    <strong className="text-title font-semibold text-gray-900">{n(s.total)}</strong>
                    <span className="text-sm text-gray-600">คัน</span>
                  </div>
                </div>
              </div>
              <DataTable label="กลุ่มสถานะยานพาหนะในแผน">
                <thead><tr><Th>กลุ่ม</Th><Th className="text-right">จำนวน (คัน)</Th><Th className="text-right">%</Th></tr></thead>
                <tbody>
                  {[["เสร็จแล้ว", g.done, "bg-success-600"], ["อยู่ระหว่างดำเนินการ", g.inProgress, "bg-brand-900"], ["ยังไม่เข้าอู่", g.wait, "bg-gray-300"]].map(([label, c, dot]) => (
                    <tr key={label as string}>
                      <Td><span className="flex items-center gap-2"><span aria-hidden className={`size-2 rounded-full ${dot}`} />{label}</span></Td>
                      <Td className="text-right tabular-nums">{n(c as number)}</Td>
                      <Td className="text-right text-gray-600 tabular-nums">{pctOf(c as number, s.total)}%</Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </Panel>

            <Panel title="ยานพาหนะค้างอยู่ขั้นตอนไหน (ณ ตอนนี้)" subtitle={<>นับตาม 7 ขั้นตอนของงาน Overhaul · ไม่นับคันที่เสร็จสิ้นแล้ว · รวม {n(s.total)} · ยังไม่เสร็จ <strong className="text-warning-600">{n(s.pending)}</strong></>}>
              <ol className="flex flex-col gap-4">
                {steps.map((st, i) => (
                  <li key={st.label} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-xs bg-gray-100 text-xs font-semibold text-gray-700">{i + 1}</span>
                      <span className="flex-1 text-gray-700">{st.label}</span>
                      <strong className="tabular-nums">{n(st.count)}</strong>
                      <span className="text-gray-600">คัน</span>
                    </div>
                    <ProgressBar value={pctOf(st.count, s.total)} label={`สัดส่วน${st.label}`} />
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel title="ซื้อยานพาหนะใหม่ เทียบ Overhaul" subtitle="ประเมินความคุ้มค่าจากสัดส่วนค่า Overhaul ต่อราคาซื้อใหม่">
              <div className="flex flex-col gap-1">
                <p className="flex flex-wrap items-baseline gap-1.5"><strong className="text-title font-semibold text-success-600 tabular-nums">{currency(s.nw - s.oh)}</strong><span className="text-sm text-gray-600">บาท</span></p>
                <span className="text-sm text-gray-600">ส่วนต่างเมื่อ Overhaul แทนซื้อใหม่</span>
              </div>
              <div className="flex flex-col gap-4">
                {[["ซื้อใหม่ทดแทน (ราคากลาง)", s.nw, 100], [`Overhaul (${s.ratio}% ของราคาใหม่)`, s.oh, s.ratio]].map(([label, value, w]) => (
                  <div key={label as string} className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="text-gray-700">{label}</span><strong className="tabular-nums">{currency(value as number)}</strong></div>
                    <ProgressBar value={w as number} label={label as string} />
                  </div>
                ))}
              </div>
              <ul className="flex flex-col divide-y divide-gray-200 border-t border-gray-200">
                {[["คุ้มค่า", `Overhaul ไม่เกิน ${WORTH_LIMIT}% ของราคาใหม่`, worth, "bg-success-600"], ["ควรพิจารณาซื้อใหม่", `เกิน ${WORTH_LIMIT}% ของราคาใหม่`, s.rebuy, "bg-error-600"]].map(([label, rule, c, dot]) => (
                  <li key={label as string} className="flex items-start gap-3 py-3">
                    <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${dot}`} />
                    <span className="flex flex-1 flex-col"><strong className="text-sm">{label}</strong><span className="text-xs text-gray-600">{rule}</span></span>
                    <span className="text-sm"><strong className="tabular-nums">{n(c as number)}</strong> คัน</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          {/* เจ้าของงาน 17 พ.ย. 2569: "ความคืบหน้ารายแผนและ PO ยาวเกินถ้าหลายแผน" → รวมเข้าตารางเปรียบเทียบรายแผน (แบ่งหน้า 10 แผน)
              PO = แถวในตารางใต้แถวแผน แสดงตลอด ไม่ย่อ/ขยาย (ไลบรารีไม่มีตารางกางแถว) · แยกด้วยสีพื้นแถว: แผน = ขาว · PO = gray-50 + เยื้องด้วยไอคอน
              (เจ้าของงานเลือก 17 พ.ย. 2569 แทน Side panel / รายการในช่อง) · component: `Table` · `Progress bar` · `Badge` · `Pagination` */}
          <Panel title="เปรียบเทียบรายแผน" subtitle={`${selPlans.length} แผนที่เลือก · แถวพื้นเทาใต้แผนคือ Purchase Order ของแผนนั้น · จำนวนเงินเป็นบาท`}>
            <DataTable label="เปรียบเทียบรายแผน" className="relative">
              <thead>
                <tr>
                  <Th>แผน / Purchase Order</Th><Th className="text-right">เสร็จ/ทั้งหมด (คัน)</Th><Th className="min-w-48">ความคืบหน้า</Th>
                  <Th className="text-right">วงเงินอนุมัติ</Th><Th className="text-right">ค่าใช้จ่ายจริง</Th><Th className="text-right">ประหยัดงบต่อคัน</Th><Th>ความคุ้มค่า</Th>
                </tr>
              </thead>
              <tbody>
                {selPlans.slice((cmpPage - 1) * cmpSize, cmpPage * cmpSize).map((p) => {
                  const pr = rows.filter((x) => x.plan === p.id);
                  const ps = summarize(pr);
                  const pos = [...new Set(pr.map((x) => x.po))];
                  return (
                    <Fragment key={p.id}>
                      <tr className="bg-white">
                        <Td className="whitespace-normal"><CellStack main={<strong className="font-semibold text-black">{p.planNo}</strong>} sub={p.planName} /></Td>
                        <Td className="text-right tabular-nums">{ps.done}/{ps.total}</Td>
                        <Td><ProgressBar value={ps.pct} label={`ความคืบหน้า ${p.planNo}`} /></Td>
                        <Td className="text-right tabular-nums">{currency(p.approvedBudget)}</Td>
                        <Td className="text-right tabular-nums">{ps.done ? currency(ps.actual) : "—"}</Td>
                        <Td className="text-right tabular-nums">{currency(ps.saveAvg)}</Td>
                        <Td><Pill tone={ps.ratio <= WORTH_LIMIT ? "success" : "error"}>{ps.ratio <= WORTH_LIMIT ? "คุ้มค่า" : "ควรพิจารณาซื้อใหม่"} {ps.ratio}%</Pill></Td>
                      </tr>
                      {pos.map((po) => {
                        const v = pr.filter((x) => x.po === po);
                        const vs = summarize(v);
                        return (
                          <tr key={po} className="bg-gray-50" data-po-of={p.planNo}>
                            <Td className="whitespace-normal"><span className="flex items-center gap-2 pl-2"><Icon name="subdirectory_arrow_right" size={16} className="shrink-0 text-gray-400" /><CellStack main={po} sub={v[0].vendor} /></span></Td>
                            <Td className="text-right tabular-nums">{vs.done}/{vs.total}</Td>
                            <Td><ProgressBar value={vs.pct} label={`ความคืบหน้า ${po}`} /></Td>
                            <Td className="text-right text-gray-400">—</Td>
                            <Td className="text-right tabular-nums">{vs.done ? currency(vs.actual) : "—"}</Td>
                            <Td className="text-right tabular-nums">{currency(vs.saveAvg)}</Td>
                            <Td className="text-gray-400">—</Td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
            </DataTable>
            {selPlans.length > 10 && <Pagination page={cmpPage} pageSize={cmpSize} total={selPlans.length} onPageChange={setCmpPage} onPageSizeChange={(v) => { setCmpSize(v); setCmpPage(1); }} />}
          </Panel>
        </>
      )}
    </>
  );
}

/* ───────── ระดับยานพาหนะ ───────── */

function VehicleLevel({ onVehicle }: { onVehicle: (plate: string) => void }) {
  const [year, setYear] = useState(YEARS[0]);
  const [sel, setSel] = useState<string[] | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const plans = plansOf(year);
  /* เริ่มที่ทุกแผนของปี (ตามต้นแบบ) · เลือกหลายแผน + พิมพ์ค้นได้แบบเดียวกับระดับแผน (เจ้าของงาน 17 พ.ย. 2569) */
  const ids = sel ?? plans.map((p) => p.id);
  const selPlans = plans.filter((p) => ids.includes(p.id));
  const rows = useMemo(() => toRows(DASH_VEHICLES, selPlans), [selPlans]);
  const s = summarize(rows);
  const k = q.trim().toLowerCase();
  const shown = rows.filter((x) => !k || `${x.plate} ${x.model}`.toLowerCase().includes(k));
  const current = Math.min(page, Math.max(1, Math.ceil(shown.length / size)));
  const brandCount: Record<string, number> = {};
  rows.forEach((x) => { const b = x.model.split(" ")[0]; brandCount[b] = (brandCount[b] ?? 0) + 1; });
  const brands = Object.entries(brandCount).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3);

  return (
    <>
      <FilterCard description="เลือกปีงบประมาณและแผน เลือกได้หลายแผน พิมพ์ค้นแผนได้ เริ่มต้นแสดงทุกแผนของปี · ค้นหายานพาหนะด้วยทะเบียนหรือยี่ห้อ/รุ่น">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_minmax(0,1fr)_minmax(0,1fr)]">
          <SelectField label="ปีงบประมาณ" options={YEAR_OPTIONS} value={year} onChange={(e) => { setYear(e.target.value); setSel(null); setPage(1); }} />
          <PlanMultiSelect label="แผน Overhaul" plans={plans} value={ids} onChange={(v) => { setSel(v); setPage(1); }} />
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-md leading-6 font-semibold text-gray-600">ค้นหายานพาหนะ</span>
            <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="ทะเบียน, ยี่ห้อ/รุ่น" aria-label="ค้นหายานพาหนะ" />
          </div>
        </div>
      </FilterCard>

      {!rows.length ? (
        <EmptyState kind="data-empty" title="ไม่มียานพาหนะในช่วงที่เลือก" description="เลือกปีงบประมาณหรือแผนอื่น" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Metric label="ยานพาหนะทั้งหมด" value={n(s.total)} unit="คัน" sub={`${selPlans.length} แผน`} icon="local_shipping" />
            <Metric label="ความคืบหน้าเฉลี่ย" value={`${s.pct}%`} sub={`เฉลี่ยจากยานพาหนะ ${n(s.total)} คัน`} icon="monitoring" tone="brand" />
            <Metric label="เสร็จแล้ว" value={n(s.done)} unit="คัน" sub={`${pctOf(s.done, s.total)}% ของยานพาหนะ`} icon="task_alt" tone="success" />
            <Metric label="ยังไม่เสร็จ" value={n(s.pending)} unit="คัน" sub="ค้างอยู่ในแผน" icon="pending_actions" tone="gray" />
            <Metric label="ค่าใช้จ่ายจริงรวม" value={currency(s.actual)} unit="บาท" sub={`จากยานพาหนะที่ปิดงานแล้ว ${n(s.done)} คัน`} icon="payments" />
            <Metric label="ควรพิจารณาซื้อใหม่" value={n(s.rebuy)} unit="คัน" sub={`Overhaul เกิน ${WORTH_LIMIT}% ของราคาใหม่`} icon="warning" tone="error" />
          </div>

          <Panel title="ยี่ห้อที่ Overhaul บ่อยที่สุด 3 อันดับ" subtitle="นับจำนวนครั้งที่เข้า Overhaul ตามตัวกรองที่เลือก · ยานพาหนะคันเดียวเข้าหลายครั้งนับทุกครั้ง">
            <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {brands.map(([name, c], i) => (
                <li key={name} className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-2 text-sm">
                    <span className="text-xs text-gray-500 tabular-nums">0{i + 1}</span>
                    <strong className="flex-1">{name}</strong>
                    <span><strong className="tabular-nums">{c}</strong> ครั้ง</span>
                  </div>
                  <ProgressBar value={pctOf(c, s.total)} label={`สัดส่วนยี่ห้อ ${name}`} />
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="ยานพาหนะที่ Overhaul" subtitle={'กดไอคอนรูปตาเพื่อเปิดข้อมูลยานพาหนะ · จำนวนเงินเป็นบาท'} actions={<span className="text-sm text-gray-600">{n(shown.length)} คัน</span>}>
            {!shown.length ? (
              <EmptyState kind="search-not-found" title="ไม่พบยานพาหนะ" description="ลองเปลี่ยนคำค้นหรือแผนที่เลือก" />
            ) : (
              <>
                <DataTable label="ยานพาหนะที่ Overhaul" striped className="relative" /* sr-only ในหัวคอลัมน์สุดท้ายเป็น absolute — relative กันไม่ให้ดันหน้ากว้างเกินจอ */>
                  <thead>
                    <tr>
                      <Th>ทะเบียน</Th><Th>ยี่ห้อ/รุ่น · ประเภท</Th><Th>แผน · Purchase Order</Th><Th>สถานะ</Th><Th className="min-w-40">ความคืบหน้า</Th>
                      <Th className="text-right">งบต่อคัน</Th><Th className="text-right">ค่าใช้จ่ายจริง</Th><Th className="text-right">ประหยัดงบ</Th><Th className="text-right">ราคาซื้อใหม่</Th><Th>ความคุ้มค่า</Th>
                      <Th><span className="sr-only">ดูงานที่ทำ</span></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.slice((current - 1) * size, current * size).map((x) => (
                      <tr key={x.plate}>
                        <Td className="font-semibold text-black">{x.plate}</Td>
                        <Td><CellStack main={x.model} sub={x.type} /></Td>
                        <Td><CellStack main={x.p.planNo} sub={x.po} /></Td>
                        <Td><Pill tone={DASH_STATUS[x.status][2]}>{DASH_STATUS[x.status][0]}</Pill></Td>
                        <Td><ProgressBar value={x.progress} label={`ความคืบหน้า ${x.plate}`} /></Td>
                        <Td className="text-right tabular-nums">{currency(x.per)}</Td>
                        <Td className="text-right tabular-nums">{currency(x.actual)}</Td>
                        <Td className={`text-right tabular-nums ${x.actual !== null ? "text-success-600" : ""}`}>{x.actual === null ? "—" : currency(x.per - x.actual)}</Td>
                        <Td className="text-right tabular-nums">{currency(x.newPrice)}</Td>
                        <Td><CellStack main={<span className={x.worth ? "text-success-600" : "text-error-600"}>{x.worth ? "คุ้มค่า" : "ควรพิจารณาซื้อใหม่"}</span>} sub={`${Math.round(x.ratio)}%`} /></Td>
                        {/* เจ้าของงาน 17 พ.ย. 2569: ปุ่มไอคอนตา — `Table cell` Style=Action icons (View) · Tertiary button icon-only → ไปหน้างานรายคันจริงของต้นแบบ */}
                        <Td><Button variant="tertiary" iconOnly="visibility" aria-label={`ดูข้อมูลยานพาหนะ ${x.plate}`} title="ดูข้อมูลยานพาหนะ" onClick={() => onVehicle(x.plate)} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
                <Pagination page={current} pageSize={size} total={shown.length} onPageChange={setPage} onPageSizeChange={(v) => { setSize(v); setPage(1); }} />
              </>
            )}
            <p className="text-xs text-gray-500">ค่าใช้จ่ายจริงมีเมื่อปิดงานแล้ว · ความคุ้มค่าของคันที่ยังไม่ปิดงานคิดจากงบต่อคัน</p>
          </Panel>
        </>
      )}
    </>
  );
}
