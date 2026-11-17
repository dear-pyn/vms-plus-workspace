"use client";
/** Workspace catalog entry; the dashboard shares the existing Overhaul mock repository. */
import { useEffect } from "react";
export default function DashboardEntry() {
  useEffect(() => { window.location.replace("../overhaul/#/dashboard"); }, []);
  return <main className="p-8"><a className="text-brand-900" href="../overhaul/#/dashboard">เปิด Dashboard งาน Overhaul</a></main>;
}
