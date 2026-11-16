"use client";
/** Browser-only mock repository. All prototype views/tabs share one versioned snapshot. */
import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import type { Plan } from "../features/plan/types";
import type { PurchaseOrder, VehicleJob } from "../features/po/types";
type Data = { plans: Plan[]; pos: PurchaseOrder[]; jobs: VehicleJob[] };
const KEY = "vms-plus:overhaul-prototype:v1";
function read(fallback: Data): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const value = JSON.parse(raw);
    return value.version === 1 && Array.isArray(value.data?.plans) && Array.isArray(value.data?.pos) && Array.isArray(value.data?.jobs) ? value.data : fallback;
  } catch { return fallback; }
}
export function usePrototypeData(seed: Data) {
  const [data, setData] = useState<Data>(seed);
  const current = useRef(data);
  useEffect(() => {
    const sync = () => { current.current = read(current.current); setData(current.current); };
    sync();
    const receive = (e: StorageEvent) => { if (e.key === KEY) sync(); };
    window.addEventListener("storage", receive);
    window.addEventListener("focus", sync);
    return () => { window.removeEventListener("storage", receive); window.removeEventListener("focus", sync); };
  }, []);
  const update = useCallback(<K extends keyof Data>(key: K, action: SetStateAction<Data[K]>) => {
    // Read latest before writing so an update to plans cannot erase another tab's reply.
    const latest = read(current.current);
    const value = typeof action === "function" ? (action as (prev: Data[K]) => Data[K])(latest[key]) : action;
    const next = { ...latest, [key]: value };
    try { localStorage.setItem(KEY, JSON.stringify({ version: 1, data: next })); }
    catch { /* Storage unavailable: retain same-tab mock flow. */ }
    current.current = next;
    setData(next);
  }, []);
  const setPlans = useCallback((action: SetStateAction<Plan[]>) => update("plans", action), [update]);
  const setPos = useCallback((action: SetStateAction<PurchaseOrder[]>) => update("pos", action), [update]);
  const setJobs = useCallback((action: SetStateAction<VehicleJob[]>) => update("jobs", action), [update]);
  return { ...data, setPlans, setPos, setJobs };
}
