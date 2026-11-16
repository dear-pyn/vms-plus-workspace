"use client";
/** ต้นแบบ Overhaul — refinement sprint 09
 *  Scene A รายการแผน + ยานพาหนะที่ Overhaul · Scene B (S1) สร้างแผน · S2 แก้ไขแผน · S3 ลบแผน
 *  เส้นทาง (hash): #/ รายการ · #/empty ยังไม่มีแผน (A.4) · #/vehicles แท็บยานพาหนะ · #/new สร้างแผน · #/plan/<id> รายละเอียด · #/plan/<id>/edit แก้ไข ·
 *    #/vehicle/<ทะเบียน>/<info|repair|…> หน้ารายละเอียดยานพาหนะ (หน้าเดิมของระบบ)
 *  จำลอง B.5 บันทึกไม่สำเร็จ: ตั้งชื่อแผนให้มีคำว่า "error"
 *  ข้อมูล mock ใช้ snapshot เดียวใน localStorage เพื่อ sync ข้ามแท็บและรีเฟรช */
import { downloadPlanExcel } from "@overhaul/features/plan/PlanForm";
import { usePrototypeData } from "@overhaul/prototype/usePrototypeData";
import { MockTools } from "@overhaul/prototype/MockTools";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@ui/AppShell";
import { ConfirmDialog } from "@ui/Modal";
import { Toast, type ToastTone } from "@ui/Toast";
import { NotificationBell, type NotificationItem } from "@ui/NotificationPanel";
import { warrantyEnd, warrantyLeft } from "@overhaul/features/job/close";
import { PlanDetail } from "@overhaul/features/plan/PlanDetail";
import { PlanForm } from "@overhaul/features/plan/PlanForm";
import { blockHashLeave } from "@overhaul/features/shared/leaveGuard";
import { PlanList } from "@overhaul/features/plan/PlanList";
import { OverhaulHome } from "@overhaul/features/OverhaulHome";
import { VehicleList } from "@overhaul/features/vehicle/VehicleList";
import { VehicleDetailPage, type RepairRecord, type VehicleTab } from "@overhaul/features/vehicle/VehicleDetailPage";
import type { Plan, PlanDraft } from "@overhaul/features/plan/types";
import { missingPrice } from "@overhaul/features/vehicle/types";
import { seedFleet } from "@overhaul/mock/fleet";
import { seedPlans } from "@overhaul/mock/plans";
import { seedGarages } from "@overhaul/mock/garages";
import { seedStaff } from "@overhaul/mock/staff";
import { JobPage } from "@overhaul/features/job/JobPage";
import { IntakeApproval } from "@overhaul/features/job/IntakeApproval";
import { decideIntake } from "@overhaul/features/job/intake";
import type { PendingClose } from "@overhaul/features/po/types";
import { SummaryPage } from "@overhaul/features/job/SummaryPage";
import { AgencyList, AgencyReply, awaitingReply, type AgencyAnswer, type AgencyItem } from "@overhaul/features/job/AgencyPages";
import { nowStamp } from "@overhaul/features/shared/time";
import { seedPOs } from "@overhaul/mock/pos";
import { POForm, type POSaveResult } from "@overhaul/features/po/POForm";
import { PODetail } from "@overhaul/features/po/PODetail";
import type { PODraft, PurchaseOrder, VehicleJob } from "@overhaul/features/po/types";
import { seedVehicles } from "@overhaul/mock/vehicles";
import { mainNav } from "@/lib/nav";

type Route =
  | { view: "list"; empty?: boolean }
  | { view: "vehicles" }
  | { view: "new" }
  | { view: "detail"; id: string }
  | { view: "edit"; id: string }
  | { view: "vehicle"; plate: string; tab: VehicleTab; from?: string }
  | { view: "poNew"; id: string }
  | { view: "po"; id: string; po: string }
  | { view: "poEdit"; id: string; po: string; from?: string }
  | { view: "job"; po: string; plate: string }
  | { view: "approve"; po: string; plate: string; staff: string }
  | { view: "summary"; po: string; plate: string }
  | { view: "agency" }
  | { view: "agencyJob"; po: string; plate: string };

function parse(hash: string): Route {
  const h = hash.replace(/^#/, "");
  if (h === "/empty") return { view: "list", empty: true };
  if (h === "/vehicles") return { view: "vehicles" };
  if (h === "/new") return { view: "new" };
  // from = หน้าที่มา (plan:<id> · vehicles · new) ใช้ทำ breadcrumb ย้อนกลับ (T2)
  const vm = h.match(/^\/vehicle\/([^/]+)\/(info|trips|fuel|maintenance|repair)(?:\?from=(.+))?$/);
  if (vm) return { view: "vehicle", plate: decodeURIComponent(vm[1]), tab: vm[2] as VehicleTab, from: vm[3] ? decodeURIComponent(vm[3]) : undefined };
  // S4–S6 Purchase Order · งานรายคัน
  const pn = h.match(/^\/plan\/([^/]+)\/po\/new$/);
  if (pn) return { view: "poNew", id: decodeURIComponent(pn[1]) };
  const pe = h.match(/^\/plan\/([^/]+)\/po\/([^/?]+)\/edit(?:\?from=(\w+))?$/);
  if (pe) return { view: "poEdit", id: decodeURIComponent(pe[1]), po: decodeURIComponent(pe[2]), from: pe[3] };
  const pd = h.match(/^\/plan\/([^/]+)\/po\/([^/]+)$/);
  if (pd) return { view: "po", id: decodeURIComponent(pd[1]), po: decodeURIComponent(pd[2]) };
  if (h === "/agency") return { view: "agency" };
  const ag = h.match(/^\/agency\/job\/([^/]+)\/([^/]+)$/);
  if (ag) return { view: "agencyJob", po: decodeURIComponent(ag[1]), plate: decodeURIComponent(ag[2]) };
  const sm = h.match(/^\/summary\/([^/]+)\/([^/]+)$/);
  if (sm) return { view: "summary", po: decodeURIComponent(sm[1]), plate: decodeURIComponent(sm[2]) };
  const ap = h.match(/^\/approve\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (ap) return { view: "approve", po: decodeURIComponent(ap[1]), plate: decodeURIComponent(ap[2]), staff: decodeURIComponent(ap[3]) };
  const jb = h.match(/^\/job\/([^/]+)\/(.+)$/);
  if (jb) return { view: "job", po: decodeURIComponent(jb[1]), plate: decodeURIComponent(jb[2]) };
  const m = h.match(/^\/plan\/([^/]+)(\/edit)?$/);
  if (!m) return { view: "list" };
  return m[2] ? { view: "edit", id: decodeURIComponent(m[1]) } : { view: "detail", id: decodeURIComponent(m[1]) };
}
function href(r: Route): string {
  switch (r.view) {
    case "list": return "/";
    case "vehicles": return "/vehicles";
    case "new": return "/new";
    case "vehicle": return `/vehicle/${encodeURIComponent(r.plate)}/${r.tab}${r.from ? `?from=${encodeURIComponent(r.from)}` : ""}`;
    case "detail": return `/plan/${r.id}`;
    case "edit": return `/plan/${r.id}/edit`;
    case "poNew": return `/plan/${r.id}/po/new`;
    case "po": return `/plan/${r.id}/po/${r.po}`;
    case "poEdit": return `/plan/${r.id}/po/${r.po}/edit${r.from ? `?from=${r.from}` : ""}`;
    case "job": return `/job/${r.po}/${encodeURIComponent(r.plate)}`;
    case "approve": return `/approve/${r.po}/${encodeURIComponent(r.plate)}/${r.staff}`;
    case "summary": return `/summary/${r.po}/${encodeURIComponent(r.plate)}`;
    case "agency": return "/agency";
    case "agencyJob": return `/agency/job/${r.po}/${encodeURIComponent(r.plate)}`;
  }
}

/** ประวัติซ่อมจำลอง (รูปแบบตามภาพหน้าเดิม: RAM000168 · 29/07/2569 20:00 · TOYOTA · รถเสีย · BRD000083 · อยู่ระหว่างซ่อม) */
const repairsOf = (plate: string): RepairRecord[] => {
  const n = [...plate].reduce((a, c) => a + c.charCodeAt(0), 0) % 3;
  return Array.from({ length: n + 1 }, (_, i) => ({ no: `RAM${String(168 - i * 7).padStart(6, "0")}`, appointment: `${String(29 - i * 6).padStart(2, "0")}/07/2569 ${i ? "09:00" : "20:00"}`, doneAt: i ? `${String(30 - i * 6).padStart(2, "0")}/07/2569 16:30` : null, center: i % 2 ? "ศูนย์ซ่อม กฟภ." : "TOYOTA", kind: i % 2 ? "บำรุงรักษาตามระยะ" : "รถเสีย", ref: `BRD${String(83 - i).padStart(6, "0")}`, status: i ? "เสร็จสิ้น" : "อยู่ระหว่างซ่อม" }));
};

/** ข้อมูลจำลองศูนย์ต้นทุน (จอ B.3.3) */
const OWN_COST_CENTER = "Z903021100  ผจค.กพค.-บริหาร";
const COST_CENTERS = ["Z903021100  ผจค.กพค.-บริหาร", "Z903022100  ผจค.กพค.-ปฏิบัติการ", "Z903031100  ผบร.กบค.-บริหาร"];
const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear() + 543}`;
};
/** EC-05 เลขแผนออกที่ server — ต้นแบบรันต่อจากเลขสูงสุดของปีงบ (OR + เขต Z + ปี 2 หลัก + ลำดับ 5 หลัก) */
const nextId = (plans: Plan[], fy: number) => {
  const prefix = `ORZ${String(fy).slice(-2)}`;
  const max = Math.max(0, ...plans.filter((p) => p.id.startsWith(prefix)).map((p) => Number(p.id.slice(prefix.length))));
  return `${prefix}${String(max + 1).padStart(5, "0")}`;
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function OverhaulPrototype() {
  const [seed] = useState(() => seedPOs(seedPlans(), seedVehicles()));
  const { plans, pos, jobs, setPlans, setPos, setJobs } = usePrototypeData(seed);
  const [garages] = useState(seedGarages);
  const [staff] = useState(seedStaff);
  const [poDelete, setPoDelete] = useState<string | null>(null);
  const [vehicles] = useState(seedVehicles);
  const [fleet] = useState(seedFleet);
  const [route, setRoute] = useState<Route>({ view: "list" });
  const [toast, setToast] = useState<{ msg: string; tone: ToastTone; description?: string } | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const confirmEdit = useRef<((ok: boolean) => void) | null>(null);
  const [askEdit, setAskEdit] = useState(false);
  const [agencyUnit, setAgencyUnit] = useState("");
  /** Q แจ้งเตือน (กระดิ่ง): อ่านแล้ว / ลบทั้งหมด — เก็บในหน่วยความจำ */
  const [readIds, setReadIds] = useState<string[]>([]);
  const [clearedIds, setClearedIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      if (blockHashLeave(window.location.hash)) return; // EC-27 ฟอร์มค้างแก้ไข → modal ออกจากหน้า
      setRoute(parse(window.location.hash));
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const go = (r: Route) => {
    window.location.hash = href(r);
  };
  const notify = useCallback((msg: string, tone: ToastTone = "success", description?: string) => setToast({ msg, tone, description }), []);
  const notInScope = (what: string) => notify(`"${what}" ยังไม่อยู่ในต้นแบบรอบนี้`, "info");
  const closeToast = useCallback(() => setToast(null), []);
  const plan = route.view === "detail" || route.view === "edit" || route.view === "poNew" || route.view === "po" || route.view === "poEdit" ? plans.find((p) => p.id === route.id) : undefined;
  const home = (tab: "plans" | "vehicles", body: React.ReactNode) => (
    <OverhaulHome tab={tab} onReport={() => downloadPlanExcel(plans.flatMap((p) => p.vehicles))} onTab={(t) => go(t === "plans" ? { view: "list" } : { view: "vehicles" })}>
      {body}
    </OverhaulHome>
  );

  /** บันทึกจริง (จำลองเครือข่าย 600 ms) — ชื่อมี "error" = B.5 */
  async function persist(draft: PlanDraft, id?: string): Promise<true | string> {
    await wait(600);
    if (/error/i.test(draft.name)) return "500 Internal Server Error";
    if (id) {
      setPlans((ps) => ps.map((p) => (p.id === id ? { ...p, ...draft } : p)));
      go({ view: "detail", id });
      notify("บันทึกการแก้ไขแผนสำเร็จ"); // C.5
    } else {
      const newId = nextId(plans, draft.fiscalYear);
      const created: Plan = { ...draft, id: newId, progress: null, status: "รอเลข Purchase Order", createdAt: today(), poCount: 0 };
      setPlans((ps) => [created, ...ps]);
      go({ view: "list" });
      notify("สร้างแผน Overhaul สำเร็จ"); // B.6 ข้อความตรงจอ (AC-S1 ใส่เลขแผน — Figma ชนะ)
    }
    return true;
  }

  /** S4/S5 บันทึก Purchase Order (จำลองเครือข่าย 600 ms) — ชื่อมี "error" = E.7 · ชื่อมี "นำออกจากแผน" = จำลองยานพาหนะถูกนำออกจากแผน (FigJam Section 10) */
  async function persistPO(planId: string, draft: PODraft, poId?: string, from?: string): Promise<POSaveResult> {
    await wait(600);
    if (/error/i.test(draft.name)) return "500 Internal Server Error";
    const p = plans.find((x) => x.id === planId);
    if (!p) return "ไม่พบแผน";
    const removed = draft.plates.filter((pl) => !p.vehicles.some((v) => v.plate === pl));
    if (/นำออกจากแผน/.test(draft.name) && draft.plates.length) removed.push(draft.plates[0]);
    if (removed.length) return { removed: [...new Set(removed)] };
    const newJobs = (id: string, plates: string[]): VehicleJob[] => plates.map((plate) => ({ poId: id, plate, code: "V1", progress: 0, detail: ["ยังไม่นัดหมาย"] }));
    if (poId) {
      const before = pos.find((x) => x.id === poId);
      const added = draft.plates.filter((pl) => !before?.plates.includes(pl));
      setPos((ps) => ps.map((x) => (x.id === poId ? { ...x, ...draft } : x)));
      setJobs((js) => [...js.filter((j) => j.poId !== poId || draft.plates.includes(j.plate)), ...newJobs(poId, added)]); // AC-S5 คันที่เพิ่มทีหลังเริ่มขั้น 1
      go(from === "po" ? { view: "po", id: planId, po: poId } : { view: "detail", id: planId });
      notify("บันทึกการแก้ไข Purchase Order สำเร็จ"); // F.4
    } else {
      const prefix = `PO-${String(p.fiscalYear).slice(-2)}`;
      const max = Math.max(0, ...pos.filter((x) => x.id.startsWith(prefix)).map((x) => Number(x.id.slice(prefix.length))));
      const id = `${prefix}${String(max + 1).padStart(4, "0")}`;
      setPos((ps) => [...ps, { ...draft, id, planId, createdAt: today() }]);
      setJobs((js) => [...js, ...newJobs(id, draft.plates)]);
      setPlans((ps) => ps.map((x) => (x.id === planId ? { ...x, status: x.status === "รอเลข Purchase Order" ? "รอดำเนินการ" : x.status, poCount: x.poCount + 1 } : x))); // AC-S4 ใบแรก → รอดำเนินการ
      go({ view: "detail", id: planId });
      notify("การเพิ่ม Purchase Order สำเร็จ"); // E.8 toast 7
    }
    return true;
  }
  const planPOs = (planId: string) => pos.filter((x) => x.planId === planId);
  const takenBy = (planId: string, except?: string) => Object.fromEntries(planPOs(planId).filter((x) => x.id !== except).flatMap((x) => x.plates.map((pl) => [pl, x.id])));
  const confirmThen = async (save: () => Promise<POSaveResult>): Promise<POSaveResult> => {
    setAskEdit(true);
    const ok = await new Promise<boolean>((res) => (confirmEdit.current = res));
    setAskEdit(false);
    return ok ? save() : true;
  };

  /** งานรายคัน + PO + อู่ + ยานพาหนะ (ใช้ในหน้าผู้บังคับบัญชาและหน้าสรุปรายคัน) */
  const closeItem = (poId: string, plate: string): PendingClose | undefined => {
    const job = jobs.find((j) => j.poId === poId && j.plate === plate);
    const po = pos.find((x) => x.id === poId);
    if (!job || !po) return undefined;
    const jp = plans.find((x) => x.id === po.planId);
    return { job, po, garage: garages.find((g) => g.id === po.garageId), vehicle: jp?.vehicles.find((v) => v.plate === plate) };
  };
  const agencyItems = (): AgencyItem[] =>
    jobs.flatMap((job) => {
      const c = closeItem(job.poId, job.plate);
      const plan = c && plans.find((x) => x.id === c.po.planId);
      return c && plan ? [{ ...c, plan }] : [];
    });
  /** S16 หน่วยงานตอบกลับนัด — ต้นแบบ: ตอบรับแล้วถือว่าถึงวันนัด (D-H5) */
  async function agencyAnswer(item: AgencyItem, a: AgencyAnswer): Promise<boolean> {
    await wait(600);
    if (!a.accepted && /error/i.test(a.reason)) {
      notify("500 Internal Server Error", "error");
      return false;
    }
    const j = item.job;
    const kind = j.code === "V8" ? 5 : 1;
    const appt = kind === 1 ? j.appt1 : j.appt5;
    if (!appt) return false;
    const reply = a.accepted
      ? { accepted: true, date: a.date, deliverer: staff.find((s) => s.id === a.personId)?.name, at: today() }
      : { accepted: false, reason: a.convenient ? `${a.reason} (สะดวกช่วง ${a.convenient})` : a.reason, at: today() };
    const next: VehicleJob =
      kind === 1
        ? { ...j, code: a.accepted ? "V4.1" : "V3", appt1: { ...appt, reply }, detail: a.accepted ? [`นัดเข้าอู่ ${a.date}`, "รอตรวจรับรถ"] : ["หน่วยงานปฏิเสธนัด", "รอแก้นัดหมาย"] }
        : { ...j, code: a.accepted ? "V10" : "V9", appt5: { ...appt, reply }, detail: a.accepted ? [`นัดรับรถ ${a.date}`, "รอปิดงาน"] : ["หน่วยงานปฏิเสธนัด", "รอแก้นัดหมาย"] };
    setJobs((js) => js.map((x) => (x.poId === j.poId && x.plate === j.plate ? { ...x, code: next.code, appt1: next.appt1, appt5: next.appt5, detail: next.detail } : x)));
    go({ view: "agency" });
    notify("ตอบกลับสำเร็จ", "success", a.accepted ? `ส่งตอบรับนัดหมายยานพาหนะ ${j.plate} ให้ กบค. เรียบร้อยแล้ว` : "ส่งเหตุผลการปฏิเสธนัดหมายให้ กบค. เรียบร้อยแล้ว"); // R.1.6 / R.2.5 ตรงจอ (รถ → ยานพาหนะ)
    return true;
  }

  /** ข้อมูลยานพาหนะ: หาในระบบ (fleet) ก่อน แล้วค่อยหาในแผน */
  const vehicleOf = (plate: string) => fleet.find((v) => v.plate === plate) ?? plans.flatMap((p) => p.vehicles).find((v) => v.plate === plate);
  /** T3 (เจ้าของงาน 14 พ.ย. 2569): ดูข้อมูลยานพาหนะ / ดูข้อมูลการซ่อม เปิดแท็บใหม่ทุกที่ · from = หน้าที่มาสำหรับ breadcrumb */
  const openVehicle = (from: string) => (plate: string, tab: "info" | "repair") => {
    window.open(window.location.pathname + `#${href({ view: "vehicle", plate, tab, from })}`, "_blank", "noopener");
  };
  const formProps = { fleet, ownCostCenter: OWN_COST_CENTER, costCenters: COST_CENTERS, onNotify: notify, onNotInScope: notInScope, onOpenVehicle: openVehicle(route.view === "edit" ? `plan:${route.id}` : "new") };
  let body;
  const vInfo = route.view === "vehicle" ? vehicleOf(route.plate) : undefined;
  if (route.view === "vehicle" && vInfo) {
    // T2 breadcrumb: จัดการงาน Overhaul > (แผน X | ยานพาหนะที่ Overhaul) > ทะเบียน — กดย้อนกลับได้ทุกชั้น
    const from = route.from ?? "";
    const crumbs = [
      { label: "จัดการงาน Overhaul", onClick: () => go({ view: "list" }) },
      ...(from.startsWith("plan:") ? [{ label: `แผน ${from.slice(5)}`, onClick: () => go({ view: "detail", id: from.slice(5) }) }] : from === "vehicles" ? [{ label: "ยานพาหนะที่ Overhaul", onClick: () => go({ view: "vehicles" }) }] : []),
      { label: route.plate },
    ];
    body = <VehicleDetailPage vehicle={vInfo} crumbs={crumbs} tab={route.tab} onTab={(t) => go({ view: "vehicle", plate: route.plate, tab: t, from: route.from })} repairs={repairsOf(route.plate)} onNotInScope={notInScope} />;
  } else if (route.view === "vehicles") {
    body = home("vehicles", <VehicleList vehicles={vehicles} onOpenVehicle={(plate) => openVehicle("vehicles")(plate, "info")} />);
  } else if (route.view === "new") {
    body = <PlanForm key="new" {...formProps} onCancel={() => go({ view: "list" })} onSave={(d) => persist(d)} />;
  } else if (route.view === "edit" && plan) {
    body = (
      <PlanForm
        key={`edit-${plan.id}`}
        {...formProps}
        plan={plan}
        onCancel={() => window.history.back()}
        onSave={async (d) => {
          // C.4 ยืนยันการแก้ไขก่อนบันทึก
          setAskEdit(true);
          const ok = await new Promise<boolean>((res) => (confirmEdit.current = res));
          setAskEdit(false);
          return ok ? persist(d, plan.id) : true;
        }}
      />
    );
  } else if (route.view === "detail" && plan) {
    body = (
      <PlanDetail
        plan={plan}
        onBack={() => go({ view: "list" })}
        onEdit={() => go({ view: "edit", id: plan.id })}
        onDelete={() => setToDelete(plan.id)}
        onNotInScope={notInScope}
        onOpenVehicle={openVehicle(`plan:${plan.id}`)}
        onSavePrice={(plate, pr) => {
          const before = plan.vehicles.find((v) => v.plate === plate);
          setPlans((ps) => ps.map((x) => (x.id === plan.id ? { ...x, vehicles: x.vehicles.map((v) => (v.plate === plate ? { ...v, ...pr } : v)) } : x)));
          notify(before && !missingPrice(before) ? "แก้ไขราคารายคันสำเร็จ" : "ระบุราคาสำเร็จ"); // ข้อความเดียวกับฟอร์มแผน (B.12)
        }}
        pos={planPOs(plan.id)}
        jobs={jobs}
        garages={garages}
        onAddPO={() => go({ view: "poNew", id: plan.id })}
        onOpenPO={(po) => go({ view: "po", id: plan.id, po })}
        onEditPO={(po) => go({ view: "poEdit", id: plan.id, po, from: "plan" })}
        onDeletePO={(po) => setPoDelete(po)}
      />
    );
  } else if (route.view === "poNew" && plan) {
    body = (
      <POForm
        key={`po-new-${plan.id}`}
        plan={plan}
        garages={garages}
        takenBy={takenBy(plan.id)}
        onCancel={() => go({ view: "detail", id: plan.id })}
        onGoPlans={() => go({ view: "list" })}
        onGoPlan={() => go({ view: "detail", id: plan.id })}
        onSave={(d) => persistPO(plan.id, d)}
        onNotify={notify}
      />
    );
  } else if (route.view === "poEdit" && plan && pos.some((x) => x.id === route.po)) {
    const po = pos.find((x) => x.id === route.po)!;
    const back = () => go(route.from === "po" ? { view: "po", id: plan.id, po: po.id } : { view: "detail", id: plan.id });
    body = (
      <POForm
        key={`po-edit-${po.id}`}
        plan={plan}
        po={po}
        garages={garages}
        takenBy={takenBy(plan.id, po.id)}
        locked={jobs.filter((j) => j.poId === po.id && j.code !== "V1").map((j) => j.plate)}
        onCancel={back}
        onGoPlans={() => go({ view: "list" })}
        onGoPlan={() => go({ view: "detail", id: plan.id })}
        onSave={(d) => confirmThen(() => persistPO(plan.id, d, po.id, route.from))} /* F.3 ยืนยันการแก้ไข */
        onNotify={notify}
      />
    );
  } else if (route.view === "po" && plan && pos.some((x) => x.id === route.po)) {
    const po = pos.find((x) => x.id === route.po)!;
    body = (
      <PODetail
        plan={plan}
        po={po}
        garage={garages.find((g) => g.id === po.garageId)}
        jobs={jobs}
        onGoPlans={() => go({ view: "list" })}
        onGoPlan={() => go({ view: "detail", id: plan.id })}
        onEdit={() => go({ view: "poEdit", id: plan.id, po: po.id, from: "po" })}
        onDelete={() => setPoDelete(po.id)}
        onOpenJob={(plate) => go({ view: "job", po: po.id, plate })}
        onOpenSummary={(plate) => go({ view: "summary", po: po.id, plate })}
      />
    );
  } else if (route.view === "job" && jobs.some((j) => j.poId === route.po && j.plate === route.plate)) {
    const po = pos.find((x) => x.id === route.po)!;
    const jp = plans.find((x) => x.id === po.planId)!;
    const job = jobs.find((j) => j.poId === route.po && j.plate === route.plate)!;
    body = (
      <JobPage
        key={`${po.id}-${job.plate}`}
        plan={jp}
        po={po}
        job={job}
        vehicle={jp.vehicles.find((v) => v.plate === job.plate)}
        garage={garages.find((g) => g.id === po.garageId)}
        staff={staff}
        onGoPlans={() => go({ view: "list" })}
        onGoPlan={() => go({ view: "detail", id: jp.id })}
        onGoPO={() => go({ view: "po", id: jp.id, po: po.id })}
        onUpdate={(next, t) => {
          const nextJobs = jobs.map((j) => (j.poId === next.poId && j.plate === next.plate ? next : j));
          setJobs((js) => js.map((j) => (j.poId === next.poId && j.plate === next.plate ? next : j)));
          // AC-S14: ยานพาหนะทุกคันในทุก PO ของแผนปิดงาน (V11) → แผนเสร็จสิ้น (เดิมทำตอน ผบช. อนุมัติ — ตัดผู้อนุมัติแล้วจึงทำตอนส่งขั้น 7)
          const planPOIds = pos.filter((x) => x.planId === jp.id).map((x) => x.id);
          if (next.code === "V11" && nextJobs.filter((x) => planPOIds.includes(x.poId)).every((x) => x.code === "V11")) setPlans((ps) => ps.map((x) => (x.id === jp.id ? { ...x, status: "เสร็จสิ้น", progress: 100 } : x)));
          if (t) notify(t.msg, t.tone);
        }}
        onNotify={notify}
        onOpenApproval={(sid) => go({ view: "approve", po: po.id, plate: job.plate, staff: sid })}
        onOpenSummary={() => go({ view: "summary", po: po.id, plate: job.plate })}
      />
    );
  } else if (route.view === "approve" && jobs.some((j) => j.poId === route.po && j.plate === route.plate)) {
    // FigJam Section 12: ผู้ยืนยันการรับมอบ login แล้วเข้าจากแจ้งเตือน → อนุมัติ/ปฏิเสธ (ต้นแบบเข้าจากหน้างานรายคัน)
    const po = pos.find((x) => x.id === route.po)!;
    const jp = plans.find((x) => x.id === po.planId)!;
    const job = jobs.find((j) => j.poId === route.po && j.plate === route.plate)!;
    const me = staff.find((s) => s.id === route.staff);
    body = (
      <IntakeApproval
        key={`ap-${route.staff}`}
        plate={job.plate}
        poId={po.id}
        vehicle={jp.vehicles.find((v) => v.plate === job.plate)}
        garage={garages.find((g) => g.id === po.garageId)}
        intake={job.intake}
        me={me}
        staff={staff}
        onBackToJob={() => go({ view: "job", po: po.id, plate: job.plate })}
        onDecide={async (ok, reason) => {
          await wait(600);
          if (!job.intake || !me) return false;
          if (/error/i.test(reason ?? "")) {
            notify("500 Internal Server Error", "error");
            return false;
          }
          const intake = decideIntake(job.intake, me.id, ok, reason ?? "", nowStamp(), me.name);
          setJobs((js) => js.map((j) => (j === job ? { ...j, intake, detail: ok ? j.detail : ["ผู้ยืนยันปฏิเสธการรับมอบ", "รอแก้ไขแล้วส่งใหม่"] } : j)));
          notify(ok ? "อนุมัติการรับมอบสำเร็จ" : "ปฏิเสธการรับมอบสำเร็จ");
          return true;
        }}
      />
    );
  } else if (route.view === "agency") {
    const items = agencyItems();
    const units = [...new Set(items.map((x) => x.vehicle?.affiliation).filter((u): u is string => !!u))].sort();
    const unit = agencyUnit || items.find((x) => awaitingReply(x.job))?.vehicle?.affiliation || units[0] || "";
    body = (
      <AgencyList
        items={items} units={units} unit={unit} onUnit={setAgencyUnit}
        onOpen={(po, plate) => {
          setAgencyUnit(unit); // คงหน่วยงานที่เลือกไว้เมื่อกลับมาหน้ารายการ
          go({ view: "agencyJob", po, plate });
        }}
      />
    );
  } else if (route.view === "agencyJob" && closeItem(route.po, route.plate)) {
    /* เจ้าของงาน 16 พ.ย. 2569: หน้ายานพาหนะรายคันมุมหน่วยงาน — รอตอบรับ = ส่วนตอบรับนัดหมายบนสุด + ปุ่มขวาบน · สถานะอื่น = ดูอย่างเดียว */
    const item = agencyItems().find((x) => x.po.id === route.po && x.job.plate === route.plate)!;
    body = (
      <AgencyReply
        key={`ar-${item.po.id}-${item.job.plate}-${item.job.code}`}
        item={item}
        staff={staff}
        onBack={() => go({ view: "agency" })}
        onSubmit={(a) => agencyAnswer(item, a)}
        onNotify={notify}
        onOpenSummary={() => go({ view: "summary", po: item.po.id, plate: item.job.plate })}
      />
    );
  } else if (route.view === "summary" && closeItem(route.po, route.plate)) {
    const item = closeItem(route.po, route.plate)!;
    const jp = plans.find((x) => x.id === item.po.planId)!;
    body = (
      <SummaryPage
        item={item}
        plan={jp}
        staff={staff}
        onGoPlans={() => go({ view: "list" })}
        onGoPlan={() => go({ view: "detail", id: jp.id })}
        onGoPO={() => go({ view: "po", id: jp.id, po: item.po.id })}
        onNotify={notify}
      />
    );
  } else {
    body = home(
      "plans",
      <PlanList
        plans={route.view === "list" && route.empty ? [] : plans}
        onOpen={(id) => go({ view: "detail", id })}
        onEdit={(id) => go({ view: "edit", id })}
        onDelete={(id) => setToDelete(id)}
        onCreate={() => go({ view: "new" })}
        onNotInScope={notInScope}
      />,
    );
  }

  /** Q.1–Q.5 + มติ FigJam (notification ล่วงหน้า 30 วัน และ 15 วัน นับจากวันสิ้นสุดประกัน · badge dot สีเขียว · list):
   *  ต้นแบบสร้างรายการจากข้อมูลงาน — ประกันเหลือ ≤ 30 วัน (Warning) / ≤ 15 วัน (Error) · หน่วยงานยืนยันนัดหมาย (Success) · ปิดงาน (Brand)
   *  ข้อความประกันตาม FigJam: "แจ้งวันสิ้นสุดประกัน วันที่ {วันสิ้นสุดประกัน} ของรถ {เลขทะเบียน} โปรดตรวจสอบควา…" (โน้ตถูกตัด — เติมท้ายจากข้อความ Alert ขั้น 6) */
  const notiAll: Array<NotificationItem & { go: Route }> = jobs.flatMap((j) => {
    const out: Array<NotificationItem & { go: Route }> = [];
    const w = j.close?.warranty;
    const left = j.code === "V11" && w?.on ? warrantyLeft(w.start, w.days) : null;
    if (left !== null && left >= 0 && left <= 30 && w)
      out.push({ id: `w-${j.poId}-${j.plate}-${left <= 15 ? 15 : 30}`, status: left <= 15 ? "error" : "warning", time: "วันนี้ 09:00", text: `แจ้งวันสิ้นสุดประกัน วันที่ ${warrantyEnd(w.start, w.days)} ของยานพาหนะ ${j.plate} (${j.poId}) เหลือ ${left} วัน โปรดตรวจสอบความสมบูรณ์ของยานพาหนะก่อนหมดประกัน`, go: { view: "summary", po: j.poId, plate: j.plate } });
    const unit = plans.flatMap((p) => p.vehicles).find((v) => v.plate === j.plate)?.affiliation ?? "";
    /* เจ้าของงาน 16 พ.ย. 2569: ขั้น 5 "ไม่มีการนัดหมาย" ต้องแจ้งเตือนหน่วยงานว่าส่งมอบรถคืนแล้ว (แทนแจ้งเตือนนัดรับรถ) */
    if (j.direct5)
      out.push({ id: `r-${j.poId}-${j.plate}`, status: "info", time: j.direct5.date, text: `ส่งมอบยานพาหนะ ${j.plate} (${j.poId}) คืนหน่วยงาน ${unit} แล้ว วันที่ ${j.direct5.date} · ผู้รับรถ ${staff.find((s) => s.id === j.direct5!.receiverId)?.name ?? "—"}`, go: { view: "agencyJob", po: j.poId, plate: j.plate } });
    if (j.code === "V4.1" && j.appt1?.reply?.accepted)
      out.push({ id: `a-${j.poId}-${j.plate}-${j.code}`, status: "success", time: j.appt1.reply.at ?? "", text: `หน่วยงาน ${unit} ของ ${j.poId} ยืนยันนัดหมายแล้ว (${j.plate})`, go: { view: "job", po: j.poId, plate: j.plate } });
    return out;
  }).sort((a, b) => Number(b.id.startsWith("w-")) - Number(a.id.startsWith("w-")));
  const noti = notiAll.filter((n) => !clearedIds.includes(n.id)).map((n) => ({ ...n, unread: !readIds.includes(n.id) }));

  return (
    <AppShell
      nav={mainNav(process.env.NEXT_PUBLIC_BASE_PATH || "")}
      activeId={route.view === "agency" || route.view === "agencyJob" ? "overhaul-reply" : "overhaul"}
      notifications={
        <NotificationBell
          items={noti}
          onOpenItem={(id) => {
            setReadIds((r) => [...r, id]);
            const n = notiAll.find((x) => x.id === id);
            if (n) go(n.go); // Q.5 กดแจ้งเตือนประกัน → หน้าสรุปรายคัน
          }}
          onClearAll={() => setClearedIds(notiAll.map((n) => n.id))}
        />
      }
    >
      {/* D-R1 เดิม: แถบ "ต้นแบบ: มุมมอง" — เอาออก 16 พ.ย. 2569 · มุมหน่วยงานเข้าจากเมนู "ตอบรับนัดหมาย" ใต้ Overhaul แทน */}
      {body}
      <MockTools />
      <ConfirmDialog
        open={askEdit}
        icon="edit"
        title="ยืนยันการแก้ไข"
        description="เมื่อยืนยันการแก้ไขแล้วจะไม่สามารถย้อนกลับได้ โปรดตรวจสอบก่อนยืนยัน"
        onClose={() => confirmEdit.current?.(false)}
        onConfirm={() => confirmEdit.current?.(true)}
      />
      <ConfirmDialog
        open={!!toDelete}
        danger
        icon="delete"
        title="ยืนยันการลบแผน"
        description="เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่"
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          setPlans((ps) => ps.filter((p) => p.id !== toDelete));
          const gone = pos.filter((x) => x.planId === toDelete).map((x) => x.id); // ลบแผน → ลบ Purchase Order + งานรายคันของแผนด้วย
          setPos((ps) => ps.filter((x) => x.planId !== toDelete));
          setJobs((js) => js.filter((j) => !gone.includes(j.poId)));
          setToDelete(null);
          go({ view: "list" });
          notify("ลบแผน overhaul สำเร็จ");
        }}
      />
      {/* G.1 ยืนยันการลบ Purchase Order (Modal Destructive centered · ปุ่มยืนยันสีแดง) */}
      <ConfirmDialog
        open={!!poDelete}
        danger
        icon="delete"
        title="ยืนยันการลบ"
        description={(() => {
          const started = jobs.filter((j) => j.poId === poDelete && j.code !== "V1").length;
          return `เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่${started ? ` (มียานพาหนะที่เริ่มงานแล้ว ${started} คัน ข้อมูลงานรายคันจะถูกลบด้วย)` : ""}`;
        })()}
        onClose={() => setPoDelete(null)}
        onConfirm={() => {
          const po = pos.find((x) => x.id === poDelete);
          setPoDelete(null);
          if (!po) return;
          const left = pos.filter((x) => x.planId === po.planId && x.id !== po.id).length;
          setPos((ps) => ps.filter((x) => x.id !== po.id));
          setJobs((js) => js.filter((j) => j.poId !== po.id));
          setPlans((ps) => ps.map((x) => (x.id === po.planId ? { ...x, poCount: left, status: left === 0 ? "รอเลข Purchase Order" : x.status } : x))); // P1 เมื่อลบ PO หมด
          go({ view: "detail", id: po.planId });
          notify("ลบ Purchase Order สำเร็จ"); // G.2 (FigJam: คำ PO → Purchase Order)
        }}
      />
      <Toast message={toast?.msg ?? null} description={toast?.description} tone={toast?.tone} onClose={closeToast} />
    </AppShell>
  );
}
