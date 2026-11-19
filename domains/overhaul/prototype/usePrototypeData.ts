"use client";
/** คลังข้อมูลต้นแบบ — ทุกหน้าใช้ snapshot ชุดเดียว (plans · pos · jobs)
 *  19 พ.ย. 2569: เก็บใน Supabase (ตาราง prototype_snapshot · 1 แถวต่อชุดข้อมูล) เมื่อตั้งค่า NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *    ⇒ ทุกเครื่องเห็นข้อมูลชุดเดียวกันและอัปเดตตามกันทันที (realtime) · ไม่ได้ตั้งค่า หรือต่อไม่ได้ ⇒ ใช้ localStorage ของเบราว์เซอร์เหมือนเดิม
 *  กันเขียนทับ: บันทึกได้เฉพาะเมื่อ version ใน DB ยังเท่าที่อ่านไว้ · ถ้ามีคนบันทึกก่อน ดึงของล่าสุดแล้วทำการแก้ของเราซ้ำบนนั้น
 *  ⚠ ข้อมูลจำลองเท่านั้น — ใครมีลิงก์ต้นแบบก็อ่านได้ ห้ามใส่ชื่อ/เบอร์/ข้อมูลคนจริง (PDPA) */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type SetStateAction } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "../features/plan/types";
import type { PurchaseOrder, VehicleJob } from "../features/po/types";

type Data = { plans: Plan[]; pos: PurchaseOrder[]; jobs: VehicleJob[] };
type Row = { version: number; data: Data };

const KEY = "vms-plus:overhaul-prototype:v1";
const RESET_FLAG = "vms-plus:overhaul-prototype:reset";
const TABLE = "prototype_snapshot";
const DATASET = "overhaul-main";
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
function takeResetFlag(): boolean {
  try { const v = localStorage.getItem(RESET_FLAG) === "1"; localStorage.removeItem(RESET_FLAG); return v; } catch { return false; }
}

export function usePrototypeData(seed: Data) {
  const [data, setData] = useState<Data>(seed);
  const current = useRef(data);
  const version = useRef(0);
  const ready = useRef<Promise<boolean>>(Promise.resolve(false));
  const queue = useRef<Promise<void>>(Promise.resolve());

  const show = useCallback((d: Data) => { current.current = d; setData(d); writeLocal(d); }, []);

  useEffect(() => {
    const sb = db();
    const syncLocal = () => { current.current = readLocal(current.current); setData(current.current); };
    const receive = (e: StorageEvent) => { if (e.key === KEY && mode !== "remote") syncLocal(); };
    window.addEventListener("storage", receive);
    const onFocus = () => { if (mode !== "remote") syncLocal(); };
    window.addEventListener("focus", onFocus);
    const reset = takeResetFlag();
    if (!sb) {
      syncLocal();
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
        apply(row);
        setMode("remote");
        return true;
      } catch (e) {
        console.warn("[prototype] ต่อฐานข้อมูลกลางไม่ได้ ใช้ข้อมูลในเบราว์เซอร์นี้แทน", e);
        setMode("local");
        if (alive) syncLocal();
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
    const beforeReady = mode === "connecting";
    if (mode !== "remote") {
      // Read latest before writing so an update to plans cannot erase another tab's reply.
      show(compute(mode === "local" ? readLocal(current.current) : current.current));
    } else {
      show(compute(current.current));
    }
    const sb = db();
    if (!sb) return;
    queue.current = queue.current.then(async () => {
      if (!(await ready.current)) return;
      // แก้ก่อนโหลดจาก DB เสร็จ → ทำการแก้ซ้ำบนข้อมูลจาก DB (ข้อมูลในจอถูกแทนด้วยของ DB แล้ว)
      let payload = beforeReady ? compute(current.current) : current.current;
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
        payload = compute(row.data);
        show(payload);
      }
    }).catch((e) => console.warn("[prototype] บันทึกไม่สำเร็จ", e));
  }, [show]);

  const setPlans = useCallback((action: SetStateAction<Plan[]>) => update("plans", action), [update]);
  const setPos = useCallback((action: SetStateAction<PurchaseOrder[]>) => update("pos", action), [update]);
  const setJobs = useCallback((action: SetStateAction<VehicleJob[]>) => update("jobs", action), [update]);
  return { ...data, setPlans, setPos, setJobs };
}

/** กลับเป็นข้อมูลตั้งต้น (รวมเคสทดสอบครบทุกสถานะ) แล้วโหลดหน้าใหม่ — ใช้จากหน้าสารบัญเคส / ปุ่ม Mock
 *  ใช้ DB กลางอยู่ = รีเซ็ตให้ทุกคน (ตั้งธงไว้ ให้หน้าที่โหลดใหม่เขียนข้อมูลตั้งต้นทับ) · ไม่ใช้ = ล้างเฉพาะเบราว์เซอร์นี้ */
export function resetPrototypeData(hash = "#/cases") {
  try {
    localStorage.removeItem(KEY);
    if (db()) localStorage.setItem(RESET_FLAG, "1");
  } catch { /* storage unavailable */ }
  window.location.hash = hash;
  window.location.reload();
}
