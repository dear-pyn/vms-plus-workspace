"use client";
/** ต้นแบบงานซ่อม (แจ้งซ่อม) — ยึดระบบ UAT vms-plus-uat.odds.team/maintain-d/repair-utility-vehicle (ดู 20 พ.ย. 2569) + flow ที่ UAT ยังขาด (ป้าย "เพิ่มใหม่ · รอยืนยัน")
 *  เส้นทาง (hash): #/ รายการ · #/empty รายการว่าง · #/new แจ้งซ่อม · #/job/<id> รายละเอียด
 *    เพิ่มใหม่: #/reply ตอบรับนัดหมายงานซ่อม (หน่วยงานต้นทาง) · #/reply/<id>/<kind> · #/approvals อนุมัติงานซ่อม · กระดิ่งแจ้งเตือนตาม role
 *  แถบต้นแบบบน header: เลือก role (admin-super = เหมือน UAT เห็นทุกปุ่ม) · ล้างข้อมูลจำลอง
 *  ข้อมูลจำลองเก็บใน localStorage ของเบราว์เซอร์ (เฉพาะต้นแบบ) — ดูสรุปเทียบ UAT: public/content/repair-uat-baseline/review.md */
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@ui/AppShell";
import { Button } from "@ui/Button";
import { ConfirmDialog } from "@ui/Modal";
import { SelectField } from "@ui/SelectField";
import { Toast } from "@ui/Toast";
import { mainNav } from "@/lib/nav";
import { seedJobs } from "@repair/mock/jobs";
import { REPAIR_KEY, mergedHref } from "@repair/mock/store";
import { COST_LIMIT_PCT, ROLES, costRatio, nowBE, todayBE, type RepairJob, type Role } from "@repair/features/model";
import { jobCost } from "@repair/features/parts";
import { warrantyEnd, warrantyLeft } from "@overhaul/features/job/close";
import { vehicleOf } from "@repair/mock/data";
import type { Act } from "@repair/features/ProcessSteps";
import { RepairDetail } from "@repair/features/RepairDetail";
import { RepairList } from "@repair/features/RepairList";
import { RepairNew, draftFromJob, newDraft, type Draft } from "@repair/features/RepairNew";
import { RepairOverview } from "@repair/prototype/RepairOverview";
import { ReplyPage, replyItems, type ReplyKind } from "@repair/features/RepairInbox";
import { NotificationBell } from "@ui/NotificationPanel";

type Route = { view: "list"; empty?: boolean } | { view: "new" } | { view: "job"; id: string } | { view: "reply" } | { view: "replyJob"; id: string; kind: ReplyKind } | { view: "approvals" } | { view: "overview" };
const KEY = REPAIR_KEY;
const ROLE_PERSON: Record<Role, string> = { admin: "p1", origin: "p6", unitHead: "p3", ecd: "p8", med: "p4", medHead: "p7" };

function parse(h: string): Route {
  const x = h.replace(/^#/, "");
  if (x === "/new") return { view: "new" };
  if (x === "/empty") return { view: "list", empty: true };
  if (x === "/reply") return { view: "reply" };
  if (x === "/approvals") return { view: "approvals" };
  const rj = x.match(/^\/reply\/([^/]+)\/(appt|return|signIntake|signPost|self)$/);
  if (rj) return { view: "replyJob", id: decodeURIComponent(rj[1]), kind: rj[2] as ReplyKind };
  if (x === "/overview" || x === "/cases") return { view: "overview" };
  const m = x.match(/^\/job\/([^/]+)$/);
  return m ? { view: "job", id: decodeURIComponent(m[1]) } : { view: "list" };
}
const hrefOf = (r: Route) => {
  switch (r.view) {
    case "new": return "#/new";
    case "job": return `#/job/${r.id}`;
    case "reply": return "#/reply";
    case "replyJob": return `#/reply/${r.id}/${r.kind}`;
    case "approvals": return "#/approvals";
    case "overview": return "#/overview";
    default: return r.empty ? "#/empty" : "#/";
  }
};

export default function RepairPrototype() {
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [route, setRoute] = useState<Route>({ view: "list" });
  const [role, setRole] = useState<Role>("admin");
  const [draft, setDraft] = useState<Draft>(newDraft);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [askReset, setAskReset] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [clearedIds, setClearedIds] = useState<string[]>([]);
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
  /* 23 พ.ย. 2569: รายการตอบรับนัดหมาย/อนุมัติ ย้ายไปเมนูรวมกับ Overhaul (แท็บ งานซ่อม) */
  useEffect(() => {
    if (route.view === "reply") location.replace(mergedHref("agency", "repair"));
    if (route.view === "approvals") location.replace(mergedHref("approval", "repair"));
  }, [route.view]);
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
      if (o?.log) next.history = [...j.history, { at: nowBE(), byId: ROLE_PERSON[role], detail: o.log, note: o.note }];
      if (o?.notify?.length) next.notices = [...(j.notices ?? []), ...o.notify.map((n, k) => ({ id: `${j.id}-${Date.now()}-${k}`, at: nowBE(), to: n.to, text: n.text, tone: n.tone ?? "info" }))];
      return next;
    }));
    if (o?.toast) setToast(o.toast);
  };

  const submit = (j: RepairJob) => {
    const n = Math.max(0, ...jobs.map((x) => Number(x.no.slice(-5)) || 0)) + 1;
    const no = `RRZ69${String(n).padStart(5, "0")}`;
    const id = `job-new-${n}`;
    const c = jobCost(j);
    const over = costRatio(c.cost, vehicleOf(j.plate).assetValue).over;
    setJobs((js) => [{ ...j, id, no, notices: [{ id: `${id}-n0`, at: nowBE(), to: "unitHead", text: `ใบแจ้งซ่อม ${no} รอหัวหน้าหน่วยงานอนุมัติ${over ? ` · ค่าซ่อมเกิน ${COST_LIMIT_PCT}% ของราคาที่ได้มา ควรพิจารณาจำหน่าย` : ""}`, tone: "warning" }] }, ...js]);
    setDraft(newDraft());
    setToast(`แจ้งซ่อมสำเร็จ`);
    return no;
  };

  const job = route.view === "job" ? jobs.find((j) => j.id === route.id) : undefined;
  let body = null;
  if (!loaded) body = <div role="status" className="flex min-h-[50vh] items-center justify-center text-sm text-gray-600">กำลังโหลดข้อมูล…</div>;
  else if (route.view === "new") body = <RepairNew draft={draft} setDraft={setDraft} onSubmit={submit} onList={() => go({ view: "list" })} onBack={() => (dirty ? setLeaveTo("#/") : go({ view: "list" }))} />;
  else if (route.view === "overview") {
    body = (
      <RepairOverview
        jobs={jobs}
        onReset={() => setAskReset(true)}
        onOpen={(t, r) => { setRole(r); if (t.url) location.href = t.url; else location.hash = t.hash!.slice(1); }}
      />
    );
  } else if (route.view === "job")
    body = job ? (
      <RepairDetail key={`${job.id}-${job.status}-${role}`} job={job} jobs={jobs} role={role} act={act(job.id)} onList={() => go({ view: "list" })} onOpen={(id) => go({ view: "job", id })} />
    ) : (
      <div className="flex flex-col items-center gap-4 py-20 text-sm text-gray-600">ไม่พบงานซ่อม<Button onClick={() => go({ view: "list" })}>กลับไปรายการ</Button></div>
    );
  else if (route.view === "reply" || route.view === "approvals") body = <div role="status" className="flex min-h-[50vh] items-center justify-center text-sm text-gray-600">กำลังไปเมนูรวม…</div>; // redirect ใน useEffect
  else if (route.view === "replyJob") {
    const j = jobs.find((x) => x.id === route.id);
    const still = j && replyItems([j]).some((x) => x.kind === route.kind);
    body = j && still ? (
      <ReplyPage key={`${j.id}-${route.kind}-${role}`} job={j} kind={route.kind} role={role} act={act(j.id)} onList={() => { location.href = mergedHref("agency", "repair"); }} />
    ) : (
      <div className="flex flex-col items-center gap-4 py-20 text-sm text-gray-600">ตอบรับรายการนี้แล้ว หรือรายการไม่อยู่ในสถานะที่รอตอบรับ<Button onClick={() => { location.href = mergedHref("agency", "repair"); }}>กลับไปรายการ</Button></div>
    );
  }
  else body = <RepairList jobs={route.empty ? [] : jobs} onOpen={(id) => go({ view: "job", id })} onNew={() => go({ view: "new" })} onPropose={(id, kind, note) => act(id)({ proposal: { kind, at: nowBE(), byId: ROLE_PERSON[role], note } }, { log: kind === "overhaul" ? "เสนอเข้าแผน Overhaul (ค่าซ่อมเกิน 30%)" : "เสนอจำหน่าย (ค่าซ่อมเกิน 30%)", note, toast: kind === "overhaul" ? "เสนอเข้าแผน Overhaul สำเร็จ" : "เสนอจำหน่ายสำเร็จ" })} />;

  return (
    <AppShell
      nav={mainNav(process.env.NEXT_PUBLIC_BASE_PATH || "")}
      activeId={route.view === "new" ? "repair-new" : route.view === "reply" || route.view === "replyJob" ? "overhaul-reply" : route.view === "approvals" ? "overhaul-approval" : "repair-list"}
      notifications={(() => {
        /* แจ้งเตือนของ role ที่ login (admin-super เห็นทั้งหมด) · กดแล้วไปหน้าที่ต้องทำต่อ */
        /* แจ้งเตือนประกันใกล้หมด 30 / 15 วัน → เจ้าของยานพาหนะ และ กบค. (แบบ Overhaul) */
        const warrantyNotices = jobs.flatMap((j) => {
          const w = j.status === "job_closed" ? j.post?.warranty ?? j.external?.warranty : undefined;
          const left = w?.on ? warrantyLeft(w.start, w.days) : null;
          if (!w || left === null || left < 0 || left > 30) return [];
          const v = vehicleOf(j.plate);
          const text = `แจ้งวันสิ้นสุดประกัน วันที่ ${warrantyEnd(w.start, w.days)} ของ ${j.no} (${v.plate} ${v.provinceShort}) เหลือ ${left} วัน โปรดตรวจสอบความสมบูรณ์ของยานพาหนะก่อนหมดประกัน`;
          const tone = left <= 15 ? ("error" as const) : ("warning" as const);
          return (["med", "origin"] as const).map((to) => ({ id: `${j.id}-w${left <= 15 ? 15 : 30}-${to}`, at: `${todayBE()} 09:00`, to, text, tone }));
        });
        const all = jobs.flatMap((j) => [...(j.notices ?? []), ...warrantyNotices.filter((n) => n.id.startsWith(`${j.id}-w`))].filter((n) => role === "admin" || n.to === role).map((n) => ({ n, j })));
        all.sort((a, b) => b.n.at.split(" ")[0].split("/").reverse().join("").localeCompare(a.n.at.split(" ")[0].split("/").reverse().join("")) || b.n.at.localeCompare(a.n.at));
        const items = all.filter(({ n }) => !clearedIds.includes(n.id)).map(({ n }) => ({ id: n.id, text: n.text, time: `${n.at} · ถึง ${ROLES.find((r) => r.value === n.to)?.label ?? n.to}`, status: n.tone, unread: !readIds.includes(n.id) }));
        return (
          <NotificationBell
            items={items}
            onOpenItem={(id) => {
              setReadIds((r) => [...r, id]);
              const hit = all.find(({ n }) => n.id === id);
              if (!hit) return;
              const reply = replyItems([hit.j])[0];
              if (hit.n.to === "origin" && reply) go(reply.kind === "self" ? { view: "job", id: hit.j.id } : { view: "replyJob", id: hit.j.id, kind: reply.kind });
              else go({ view: "job", id: hit.j.id });
            }}
            onClearAll={() => setClearedIds(all.map(({ n }) => n.id))}
          />
        );
      })()}
      user="นาย กบค"
      prototypeBar={
        <div className="flex items-center gap-2">
          <SelectField aria-label="ต้นแบบ: login เป็น" className="w-80 max-md:w-48" icon="science" value={role} onChange={(e) => setRole(e.target.value as Role)} options={ROLES.map((r) => ({ value: r.value, label: `ต้นแบบ · ${r.label}` }))} />
          <Button variant="tertiary" size="sm" iconLeft="list_alt" onClick={() => go({ view: "overview" })}>Overview</Button>
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
