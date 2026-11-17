"use client";
/** หน้า "จัดการงาน Overhaul" = Page header + Tabs (แผน Overhaul · ยานพาหนะที่ Overhaul) — จอ OH2 / A.1 · A.5 (refinement sprint 09) */
import type { ReactNode } from "react";
import { Button } from "@ui/Button";
import { PageHeader } from "@ui/PageHeader";
import { Tabs } from "@ui/Tabs";

export type HomeTab = "plans" | "vehicles";

export function OverhaulHome({ tab, onTab, onReport, children }: { tab: HomeTab; onTab: (t: HomeTab) => void; onReport: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-8 p-8 max-md:px-4">
      <PageHeader crumbs={[{ label: "จัดการงาน Overhaul" }]} title="จัดการงาน Overhaul" actions={<><Button variant="secondary" iconLeft="dashboard" onClick={() => { window.location.hash = "/dashboard"; }}>Dashboard</Button><Button variant="secondary" iconLeft="download" onClick={onReport}>รายงาน</Button></>} />
      <Tabs
        value={tab}
        onChange={(id) => onTab(id as HomeTab)}
        items={[
          { id: "plans", label: "แผน Overhaul" },
          { id: "vehicles", label: "ยานพาหนะที่ Overhaul" },
        ]}
      />
      {children}
    </div>
  );
}
