"use client";
/** คลังข้อมูลต้นแบบ — ทุกหน้าใช้ snapshot ชุดเดียว (plans · pos · jobs)
 *  19 พ.ย. 2569: เก็บใน Supabase (ตาราง prototype_snapshot · 1 แถวต่อชุดข้อมูล) เมื่อตั้งค่า NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *    ⇒ ทุกเครื่องเห็นข้อมูลชุดเดียวกันและอัปเดตตามกันทันที (realtime) · ไม่ได้ตั้งค่า หรือต่อไม่ได้ ⇒ ใช้ localStorage ของเบราว์เซอร์เหมือนเดิม
 *  กันเขียนทับ: บันทึกได้เฉพาะเมื่อ version ใน DB ยังเท่าที่อ่านไว้ · ถ้ามีคนบันทึกก่อน ดึงของล่าสุดแล้วทำการแก้ของเราซ้ำบนนั้น
 *  19 พ.ย. 2569 เจ้าของงาน: "กด mock data ทุกเคส ให้สร้างเพิ่มใน localStorage และถ้ากดจากข้อมูลนั้นไม่ต้องเพิ่มใน supa จริง"
 *    ⇒ ชุดเคสทดสอบ (addMockSet) เก็บแยกใน localStorage (MOCK_KEY) แสดงต่อท้ายข้อมูลกลาง · แผน mock + PO ใต้แผนนั้น + งานใต้ PO นั้น
 *      บันทึกลงเครื่องนี้เท่านั้น ไม่ส่งขึ้น Supabase · ของอื่นบันทึกขึ้นข้อมูลกลางตามเดิม
 *  ⚠ ข้อมูลจำลองเท่านั้น — ใครมีลิงก์ต้นแบบก็อ่านได้ ห้ามใส่ชื่อ/เบอร์/ข้อมูลคนจริง (PDPA) */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type SetStateAction } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "../features/plan/types";
import type { PurchaseOrder, VehicleJob } from "../features/po/types";
import { protoKey } from "@/lib/protoNs";

type Data = { plans: Plan[]; pos: PurchaseOrder[]; jobs: VehicleJob[] };
type Row = { version: number; data: Data };

const KEY = protoKey("vms-plus:overhaul-prototype:v1");
const RESET_FLAG = protoKey("vms-plus:overhaul-prototype:reset");
const MOCK_KEY = protoKey("vms-plus:overhaul-prototype:mock:v1");
const EMPTY: Data = { plans: [], pos: [], jobs: [] };
const TABLE = "prototype_snapshot";
const DATASET = protoKey("overhaul-main");
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;
function db(): SupabaseClient | null {
  if (!SB_URL || !SB_KEY) return null;
  return (client ??= createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false } }));
}

/* สถานะที่เก็บข้อมูล — ให้ปุ่ม Mock บอกได้ว่าตอนนี้ใช้ DB กลางหรือเฉพาะเบราว์เซอร์นี้ */
export type StorageMode = "connecting" | "remote" | "local";
let mode: StorageMode = SB_URL && SB_KEY ? "connecting" : "local";
const modeListeners = new Set<() => void>();
function setMode(m: StorageMode) { mode = m; modeListeners.forEach((f) => f()); }
export function useStorageMode(): StorageMode {
  return useSyncExternalStore((f) => { modeListeners.add(f); return () => { modeListeners.delete(f); }; }, () => mode, () => "local");
}

const valid = (d: unknown): d is Data => {
  const x = d as Data | undefined;
  return !!x && Array.isArray(x.plans) && Array.isArray(x.pos) && Array.isArray(x.jobs);
};
function readLocal(fallback: Data): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const value = JSON.parse(raw);
    return value.version === 1 && valid(value.data) ? value.data : fallback;
  } catch { return fallback; }
}
function writeLocal(d: Data) {
  try { localStorage.setItem(KEY, JSON.stringify({ version: 1, data: d })); } catch { /* storage unavailable */ }
}
function readMock(): Data {
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    const value = raw ? JSON.parse(raw) : null;
    return value?.version === 1 && valid(value.data) ? value.data : EMPTY;
  } catch { return EMPTY; }
}
function writeMock(d: Data) {
  try {
    if (!d.plans.length && !d.pos.length && !d.jobs.length) localStorage.removeItem(MOCK_KEY);
    else localStorage.setItem(MOCK_KEY, JSON.stringify({ version: 1, data: d }));
  } catch { /* storage unavailable */ }
}
const merge = (r: Data, m: Data): Data => (m.plans.length || m.pos.length || m.jobs.length ? { plans: [...r.plans, ...m.plans], pos: [...r.pos, ...m.pos], jobs: [...r.jobs, ...m.jobs] } : r);
/** แยกข้อมูลที่แก้แล้วกลับเป็น ข้อมูลกลาง / ข้อมูล mock — ยึดแผน mock ที่มีอยู่ก่อนแก้ (prev) */
function split(next: Data, prev: Data): { remote: Data; mock: Data } {
  const planIds = new Set(prev.plans.map((p) => p.id));
  const poIds = new Set(prev.pos.map((p) => p.id));
  next.pos.forEach((p) => { if (planIds.has(p.planId)) poIds.add(p.id); });
  const isPlan = (p: Plan) => planIds.has(p.id);
  const isPo = (p: PurchaseOrder) => planIds.has(p.planId) || poIds.has(p.id);
  const isJob = (j: VehicleJob) => poIds.has(j.poId);
  return {
    remote: { plans: next.plans.filter((p) => !isPlan(p)), pos: next.pos.filter((p) => !isPo(p)), jobs: next.jobs.filter((j) => !isJob(j)) },
    mock: { plans: next.plans.filter(isPlan), pos: next.pos.filter(isPo), jobs: next.jobs.filter(isJob) },
  };
}
const sameList = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((x, i) => x === b[i]);

function takeResetFlag(): boolean {
  try { const v = localStorage.getItem(RESET_FLAG) === "1"; localStorage.removeItem(RESET_FLAG); return v; } catch { return false; }
}

export function usePrototypeData(seed: Data) {
  const [data, setData] = useState<Data>(seed);
  /** โหลดข้อมูลจริงเสร็จแล้ว (DB กลาง หรือ localStorage) — ก่อนหน้านั้นหน้าจอไม่ควรวาดข้อมูลตั้งต้น (จอแว้บ 19 พ.ย. 2569) */
  const [loaded, setLoaded] = useState(false);
  /** ข้อมูลกลาง (Supabase หรือ localStorage KEY เมื่อไม่มี DB) — ไม่รวม mock */
  const current = useRef(seed);
  /** ชุดเคสทดสอบ — localStorage เครื่องนี้เท่านั้น */
  const mockRef = useRef<Data>(EMPTY);
  const version = useRef(0);
  const ready = useRef<Promise<boolean>>(Promise.resolve(false));
  const queue = useRef<Promise<void>>(Promise.resolve());

  /* ใช้ DB กลาง → ไม่เก็บสำเนาใน localStorage (สำเนาเก่าทำให้จอแว้บของเดิมก่อนโหลด) · เก็บเฉพาะโหมดเบราว์เซอร์นี้ */
  const show = useCallback((d: Data) => { current.current = d; setData(merge(d, mockRef.current)); if (mode === "local") writeLocal(d); }, []);
  const showMock = useCallback((m: Data) => { mockRef.current = m; writeMock(m); setData(merge(current.current, m)); }, []);

  useEffect(() => {
    const sb = db();
    mockRef.current = readMock();
    const syncMock = () => { mockRef.current = readMock(); setData(merge(current.current, mockRef.current)); };
    const syncLocal = () => { current.current = readLocal(current.current); mockRef.current = readMock(); setData(merge(current.current, mockRef.current)); };
    const receive = (e: StorageEvent) => {
      if (e.key === MOCK_KEY) syncMock();
      else if (e.key === KEY && mode !== "remote") syncLocal();
    };
    window.addEventListener("storage", receive);
    const onFocus = () => { if (mode !== "remote") syncLocal(); else syncMock(); };
    window.addEventListener("focus", onFocus);
    const reset = takeResetFlag();
    if (!sb) {
      syncLocal();
      setLoaded(true);
      return () => { window.removeEventListener("storage", receive); window.removeEventListener("focus", onFocus); };
    }
    let alive = true;
    const fetchRow = async (): Promise<Row | null> => {
      const { data: row, error } = await sb.from(TABLE).select("version,data").eq("id", DATASET).maybeSingle();
      if (error) throw error;
      return row && valid(row.data) ? (row as Row) : null;
    };
    const apply = (row: Row | null) => {
      if (!alive || !row || row.version < version.current) return;
      version.current = row.version;
      show(row.data);
    };
    ready.current = (async () => {
      try {
        let row = await fetchRow();
        if (!row) {
          // ยังไม่มีชุดข้อมูลใน DB → ใช้ข้อมูลตั้งต้น (คนแรกที่เปิดสร้างให้ · ถ้าชนกันอีกเครื่องสร้างก่อน ให้อ่านของเขา)
          const ins = await sb.from(TABLE).insert({ id: DATASET, version: 1, data: seed }).select("version,data").single();
          row = ins.error ? await fetchRow() : (ins.data as Row);
        } else if (reset) {
          // ปุ่ม "รีเซ็ตข้อมูลต้นแบบ" = รีเซ็ตชุดข้อมูลกลางให้ทุกคน
          const up = await sb.from(TABLE).update({ data: seed, version: row.version + 1, updated_at: new Date().toISOString() }).eq("id", DATASET).select("version,data").single();
          if (!up.error) row = up.data as Row;
        }
        setMode("remote");
        try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
        apply(row);
        if (alive) setLoaded(true);
        return true;
      } catch (e) {
        console.warn("[prototype] ต่อฐานข้อมูลกลางไม่ได้ ใช้ข้อมูลในเบราว์เซอร์นี้แทน", e);
        setMode("local");
        if (alive) { syncLocal(); setLoaded(true); }
        return false;
      }
    })();
    // อีกเครื่องบันทึก → ดึงแถวล่าสุด (ไม่ใช้ payload ของ realtime เพราะแถวใหญ่อาจถูกตัด)
    const channel = sb
      .channel(`prototype-${DATASET}`)
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE, filter: `id=eq.${DATASET}` }, (p) => {
        const v = (p.new as { version?: number } | undefined)?.version ?? Infinity;
        if (v > version.current) void fetchRow().then(apply).catch(() => undefined);
      })
      .subscribe();
    return () => {
      alive = false;
      void sb.removeChannel(channel);
      window.removeEventListener("storage", receive);
      window.removeEventListener("focus", onFocus);
    };
  }, [seed, show]);

  const update = useCallback(<K extends keyof Data>(key: K, action: SetStateAction<Data[K]>) => {
    const compute = (base: Data): Data => ({ ...base, [key]: typeof action === "function" ? (action as (prev: Data[K]) => Data[K])(base[key]) : action });
    /** ทำการแก้บนข้อมูลรวม (กลาง + mock) แล้วแยกกลับ → ส่วน mock เก็บเครื่องนี้ทันที · คืนเฉพาะส่วนข้อมูลกลาง */
    const prevMock = readMock(); // ยึดสถานะ mock ก่อนแก้ — ทำซ้ำ (ชนเวอร์ชัน) แล้วไม่แก้ mock ซ้อนสองรอบ
    const apply = (remoteBase: Data): Data => {
      const { remote, mock } = split(compute(merge(remoteBase, prevMock)), prevMock);
      mockRef.current = mock;
      writeMock(mock);
      return remote;
    };
    const beforeReady = mode === "connecting";
    const base = mode === "local" ? readLocal(current.current) : current.current;
    const next = apply(base);
    if (sameList(next[key], base[key])) {
      // แก้เฉพาะข้อมูล mock → ไม่แตะข้อมูลกลาง / Supabase
      setData(merge(current.current, mockRef.current));
      return;
    }
    show(next);
    const sb = db();
    if (!sb) return;
    queue.current = queue.current.then(async () => {
      if (!(await ready.current)) return;
      // แก้ก่อนโหลดจาก DB เสร็จ → ทำการแก้ซ้ำบนข้อมูลจาก DB (ข้อมูลในจอถูกแทนด้วยของ DB แล้ว)
      let payload = beforeReady ? apply(current.current) : current.current;
      if (beforeReady) show(payload);
      for (let attempt = 0; attempt < 4; attempt++) {
        const v = version.current;
        const { data: rows, error } = await sb.from(TABLE).update({ data: payload, version: v + 1, updated_at: new Date().toISOString() }).eq("id", DATASET).eq("version", v).select("version");
        if (error) { console.warn("[prototype] บันทึกขึ้นฐานข้อมูลกลางไม่สำเร็จ", error); return; }
        if (rows && rows.length) { version.current = (rows[0] as { version: number }).version; return; }
        // มีคนบันทึกก่อน → ดึงของล่าสุด แล้วทำการแก้นี้ซ้ำบนนั้น
        const { data: row } = await sb.from(TABLE).select("version,data").eq("id", DATASET).single();
        if (!row || !valid(row.data)) return;
        version.current = row.version;
        payload = apply(row.data);
        show(payload);
      }
    }).catch((e) => console.warn("[prototype] บันทึกไม่สำเร็จ", e));
  }, [show]);

  /** เพิ่มชุดเคสทดสอบลงเครื่องนี้ (ไม่ขึ้น Supabase) */
  const addMockSet = useCallback((set: Data) => {
    const m = readMock();
    showMock({ plans: [...m.plans, ...set.plans], pos: [...m.pos, ...set.pos], jobs: [...m.jobs, ...set.jobs] });
  }, [showMock]);
  /** ลบชุดเคสทดสอบทั้งหมดของเครื่องนี้ (ข้อมูลกลางไม่เปลี่ยน) */
  const clearMock = useCallback(() => showMock(EMPTY), [showMock]);

  const setPlans = useCallback((action: SetStateAction<Plan[]>) => update("plans", action), [update]);
  const setPos = useCallback((action: SetStateAction<PurchaseOrder[]>) => update("pos", action), [update]);
  const setJobs = useCallback((action: SetStateAction<VehicleJob[]>) => update("jobs", action), [update]);
  return { ...data, loaded, setPlans, setPos, setJobs, addMockSet, clearMock };
}

/** กลับเป็นข้อมูลตั้งต้น (รวมเคสทดสอบครบทุกสถานะ) แล้วโหลดหน้าใหม่ — ใช้จากหน้าสารบัญเคส / ปุ่ม Mock
 *  ใช้ DB กลางอยู่ = รีเซ็ตให้ทุกคน (ตั้งธงไว้ ให้หน้าที่โหลดใหม่เขียนข้อมูลตั้งต้นทับ) · ไม่ใช้ = ล้างเฉพาะเบราว์เซอร์นี้ */
export function resetPrototypeData(hash = "#/cases") {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(MOCK_KEY);
    if (db()) localStorage.setItem(RESET_FLAG, "1");
  } catch { /* storage unavailable */ }
  window.location.hash = hash;
  window.location.reload();
}
