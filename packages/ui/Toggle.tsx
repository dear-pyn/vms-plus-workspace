"use client";
/** Figma (Component) VMS Plus › `Toggle` (Size=sm 48×24 · Track r-full gray-300 / Pressed brand-900 · Handle 18 ขาว) + `Toggle with description` (gap 12 · หัว 14/600 · คำอธิบาย 14 gray-600)
 *  dump 2-19.json · อ้างอิงหน้าจอ OH2 / O.1 "มีการรับประกันงานซ่อม" */
import { useId } from "react";
import { cx } from "./cx";

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative mt-0.5 h-6 w-12 shrink-0 rounded-full transition-colors focus-visible:shadow-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
          checked ? "bg-brand-900 hover:bg-brand-800" : "bg-gray-300 hover:bg-gray-400",
        )}
      >
        <span className={cx("absolute top-0.75 size-4.5 rounded-full bg-white shadow-sm transition-[left]", checked ? "left-6.75" : "left-0.75")} />
      </button>
      <label htmlFor={id} className="flex cursor-pointer flex-col">
        <span className="text-sm font-semibold text-black">{label}</span>
        {description && <span className="text-sm text-gray-600">{description}</span>}
      </label>
    </div>
  );
}
