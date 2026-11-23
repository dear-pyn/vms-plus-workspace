"use client";
/** ต้นแบบงานซ่อม (แจ้งซ่อม) — เวอร์ชัน "ตาม UAT 100%" (ตั้งต้น · ระบบ UAT vms-plus-uat.odds.team/maintain-d/repair-utility-vehicle ดู 20 พ.ย. 2569)
 *  ไม่มี flow ที่ต้นแบบเติม · เวอร์ชันปรับตาม feedback อยู่ branch repair-v2
 *  เส้นทาง (hash): #/ รายการ · #/empty รายการว่าง · #/new แจ้งซ่อม · #/job/<id> รายละเอียด
 *  ผู้ใช้คนเดียวเหมือน UAT (admin-super) · กระดิ่งว่าง (UAT ไม่มีแจ้งเตือน)
 *  ข้อมูลจำลองเก็บใน localStorage ของเบราว์เซอร์ (เฉพาะต้นแบบ) — ดูสรุปเทียบ UAT: public/content/repair-uat-baseline/review.md */
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@ui/AppShell";
import { Button } from "@ui/Button";
import { ConfirmDialog } from "@ui/Modal";
import { Toast } from "@ui/Toast";
import { NotificationBell } from "@ui/NotificationPanel";
import { mainNav } from "@/lib/nav";
import { seedJobs } from "@repair/mock/jobs";
import { REPAIR_KEY } from "@repair/mock/store";
import { nowBE, todayBE, type RepairJob, type Role } from "@repair/features/model";
import type { Act } from "@repair/features/ProcessSteps";
import { RepairDetail } from "@repair/features/RepairDetail";
import { RepairList } from "@repair/features/RepairList";
import { RepairNew, newDraft, type Draft } from "@repair/features/RepairNew";

type Route = { view: "list"; empty?: boolean } | { view: "new" } | { view: "job"; id: string };
const KEY = REPAIR_KEY;
const ROLE: Role = "admin";

function parse(h: string): Route {
  const x = h.replace(/^#/, "");
  if (x === "/new") return { view: "new" };
  if (x === "/empty") return { view: "list", empty: true };
  const m = x.match(/^\/job\/([^/]+)$/);
  return m ? { view: "job", id: decodeURIComponent(m[1]) } : { view: "list" };
}
const hrefOf = (r: Route) => (r.view === "new" ? "#/new" : r.view === "job" ? `#/job/${r.id}` : r.empty ? "#/empty" : "#/");

export default function RepairPrototype() {
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [route, setRoute] = useState<Route>({ view: "list" });
  const [draft, setDraft] = useState<Draft>(newDraft);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [askReset, setAskReset] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(newDraft());
  const guard = useRef({ dirty, onNew: false, skip: false });
  const prevHash = useRef("#/");
  guard.current.dirty = dirty;
  guard.current.onNew = route.view === "new";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setJobs(raw ? (JSON.parse(raw) as RepairJob[]) : seedJobs());
    } catch {
      setJobs(seedJobs());
    }
    setLoaded(true);
    setRoute(parse(location.hash));
    const sync = () => {
      const g = guard.current;
      if (g.skip) { g.skip = false; return; }
      /* EC-R04 กันออกจากหน้าแจ้งซ่อมระหว่างกรอก (ปุ่มย้อนเบราว์เซอร์/ลิงก์ hash) */
      const to = parse(location.hash).view;
      if (g.onNew && g.dirty && to !== "new") {
        const target = location.hash || "#/";
        g.skip = true;
        location.hash = prevHash.current;
        setLeaveTo(target);
        return;
      }
      prevHash.current = location.hash || "#/";
      setRoute(parse(location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", sync);
    const unload = (e: BeforeUnloadEvent) => { if (guard.current.onNew && guard.current.dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", unload);
    return () => { window.removeEventListener("hashchange", sync); window.removeEventListener("beforeunload", unload); };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(jobs)); } catch {}
  }, [jobs, loaded]);

  const go = (r: Route) => { location.hash = hrefOf(r); };
  const closeToast = useCallback(() => setToast(null), []);

  const act = (id: string): Act => (patch, o) => {
    setJobs((js) => js.map((j) => {
      if (j.id !== id) return j;
      const next: RepairJob = { ...j, ...patch, updatedAt: todayBE() };
      if (o?.status) next.status = o.status;
      if (o?.log) next.history = [...j.history, { at: nowBE(), byId: "p1", detail: o.log, note: o.note }];
      return next;
    }));
    if (o?.toast) setToast(o.toast);
  };

  const submit = (j: RepairJob) => {
    const n = Math.max(0, ...jobs.map((x) => Number(x.no.slice(-5)) || 0)) + 1;
    const no = `RRZ69${String(n).padStart(5, "0")}`;
    const id = `job-new-${n}`;
    setJobs((js) => [{ ...j, id, no }, ...js]);
    setDraft(newDraft());
    setToast(`แจ้งซ่อมสำเร็จ`);
    return no;
  };

  const job = route.view === "job" ? jobs.find((j) => j.id === route.id) : undefined;
  let body = null;
  if (!loaded) body = <div role="status" className="flex min-h-[50vh] items-center justify-center text-sm text-gray-600">กำลังโหลดข้อมูล…</div>;
  else if (route.view === "new") body = <RepairNew draft={draft} setDraft={setDraft} onSubmit={submit} onList={() => go({ view: "list" })} onBack={() => (dirty ? setLeaveTo("#/") : go({ view: "list" }))} />;
  else if (route.view === "job")
    body = job ? (
      <RepairDetail key={`${job.id}-${job.status}`} job={job} jobs={jobs} role={ROLE} act={act(job.id)} onList={() => go({ view: "list" })} onOpen={(id) => go({ view: "job", id })} />
    ) : (
      <div className="flex flex-col items-center gap-4 py-20 text-sm text-gray-600">ไม่พบงานซ่อม<Button onClick={() => go({ view: "list" })}>กลับไปรายการ</Button></div>
    );
  else body = <RepairList jobs={route.empty ? [] : jobs} onOpen={(id) => go({ view: "job", id })} onNew={() => go({ view: "new" })} />;

  return (
    <AppShell
      nav={mainNav(process.env.NEXT_PUBLIC_BASE_PATH || "")}
      activeId={route.view === "new" ? "repair-new" : "repair-list"}
      notifications={<NotificationBell items={[]} onOpenItem={() => {}} onClearAll={() => {}} />}
      user="นาย กบค"
      prototypeBar={
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">ต้นแบบ · ตาม UAT 100% (admin-super)</span>
          <Button variant="tertiary" size="sm" iconLeft="restart_alt" onClick={() => setAskReset(true)}>ล้างข้อมูลจำลอง</Button>
        </div>
      }
    >
      {body}
      <ConfirmDialog
        open={!!leaveTo}
        title="คุณต้องการออกจากหน้านี้หรือไม่ ?"
        description="หากยืนยัน ข้อมูลที่ระบุจะหาย"
        footerAlign="fill"
        onClose={() => setLeaveTo(null)}
        onConfirm={() => { const t = leaveTo!; setLeaveTo(null); setDraft(newDraft()); guard.current.dirty = false; location.hash = t; }}
      />
      <ConfirmDialog
        open={askReset}
        icon="restart_alt"
        title="ล้างข้อมูลจำลอง"
        description="งานซ่อมทั้งหมดในต้นแบบจะกลับเป็นค่าตั้งต้น"
        confirmLabel="ล้างข้อมูล"
        onClose={() => setAskReset(false)}
        onConfirm={() => { setJobs(seedJobs()); setAskReset(false); setToast("ล้างข้อมูลจำลองสำเร็จ"); go({ view: "list" }); }}
      />
      <Toast message={toast} description={toast === "แจ้งซ่อมสำเร็จ" ? "สร้างหมายเลขเหตุการณ์เรียบร้อยแล้ว" : undefined} onClose={closeToast} />
    </AppShell>
  );
}
