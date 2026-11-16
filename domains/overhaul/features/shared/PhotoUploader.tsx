"use client";
/** อัปโหลดรูปภาพ — ไลบรารี `File upload` Type=Gallery (`_File upload base` + `_Image queue row` / `_Image upload item base` State=Completed|Error)
 *  FigJam Section 12/14 (refinement 12 พ.ย. 2569): "Upload รูปภาพ Format ใช้แบบที่เคยทำในงานซ่อม ไม่มี Limit จำนวนรูป limit 10 mb/file
 *  แสดงข้อความนับ file "จำนวน" + n + "ไฟล์"" — ใช้ทั้งขั้น 2 (ตรวจรับรถ) และขั้น 4 (ตรวจสภาพ)
 *  งานซ่อม (ระบบเดิม) รับ PNG, JPG, GIF หรือ WebP · ต้นแบบไม่จำลองแถบความคืบหน้าระหว่างอัปโหลด (State=In progress) */
import { cachePhoto, readPhoto } from "../../prototype/photo-cache";
import { useEffect, useRef, useState } from "react";
import { Button } from "@ui/Button";
import { Icon } from "@ui/Icon";
import type { Photo } from "../po/types";

export const PHOTO_MAX_MB = 10;
const PHOTO_ACCEPT = /\.(png|jpe?g|gif|webp)$/i;

/** แปลงไฟล์ที่เลือก → รูปที่รับได้ + ข้อความผิดพลาด (ชนิดไฟล์/ขนาดเกิน) */
export function takePhotos(list: File[]): { ok: Photo[]; error: string } {
  const bad = list.filter((f) => !PHOTO_ACCEPT.test(f.name) || f.size > PHOTO_MAX_MB * 1024 * 1024);
  const ok = list
    .filter((f) => !bad.includes(f))
    .map((f) => ({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)), url: undefined }));
  return { ok, error: bad.length ? `${bad.map((f) => f.name).join(", ")}: รองรับเฉพาะ PNG, JPG, GIF หรือ WebP ขนาดไม่เกิน ${PHOTO_MAX_MB} MB ต่อไฟล์` : "" };
}

export function PhotoUploader({
  label, optional, photos, onChange, disabled, readOnly, onBusyChange,
}: {
  label: string;
  optional?: boolean;
  photos: Photo[];
  onChange?: (p: Photo[]) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  /** ดูอย่างเดียว: ไม่มีกล่องอัปโหลด ไม่มีปุ่มลบ */
  readOnly?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const pending = useRef(false);
  useEffect(() => { onBusyChange?.(uploading); }, [uploading, onBusyChange]);
  const add = async (list: File[]) => {
    if (readOnly || disabled || pending.current) return;
    const r = takePhotos(list);
    setError(r.error);
    const fresh = r.ok.filter((p, i, all) => !photos.some((x) => x.name === p.name) && all.findIndex((x) => x.name === p.name) === i);
    if (!fresh.length) return;
    pending.current = true; setUploading(true);
    try {
      const next: Photo[] = [];
      for (const p of fresh) next.push({ ...p, assetId: await cachePhoto(list.find((f) => f.name === p.name && PHOTO_ACCEPT.test(f.name) && f.size <= PHOTO_MAX_MB * 1024 * 1024)!) });
      onChange?.([...photos, ...next]);
    } catch { setError("เพิ่มรูปไม่สำเร็จ กรุณาลองอีกครั้ง"); }
    finally { pending.current = false; setUploading(false); }
  };
  const editable = !readOnly && !disabled && !uploading;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-md font-semibold text-gray-600">
          {label} {optional && <span className="font-normal text-gray-400">(ถ้ามี)</span>}
        </span>
        <span className="text-sm text-gray-600">จำนวน {photos.length} ไฟล์</span>
      </div>
      {!readOnly && (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => ref.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (editable) setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            if (editable) void add([...e.dataTransfer.files]);
          }}
          className={`flex w-full flex-col items-center gap-3 rounded-lg border p-4 text-center disabled:cursor-not-allowed disabled:bg-gray-50 ${over ? "border-brand-800 bg-brand-25" : error ? "border-error-300 bg-white" : "border-gray-300 bg-white"}`}
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-gray-100"><Icon name="cloud_upload" size={24} className="text-gray-500" /></span>
          <span className="text-sm">
            <span className={disabled ? "font-semibold text-gray-400" : "font-semibold text-brand-900"}>คลิกเพื่อเลือกไฟล์</span> <span className="text-gray-600">หรือลากไฟล์มาวางบริเวณนี้</span>
          </span>
          <span className="text-xs text-gray-600">PNG, JPG, GIF หรือ WebP ขนาดไม่เกิน {PHOTO_MAX_MB} MB ต่อไฟล์</span>
        </button>
      )}
      <input
        ref={ref}
        type="file"
        multiple
        disabled={!editable}
        accept=".png,.jpg,.jpeg,.gif,.webp"
        className="hidden"
        aria-label={label}
        onChange={(e) => {
          void add([...(e.target.files || [])]);
          e.target.value = "";
        }}
      />
      {uploading && <span className="text-sm text-gray-600">กำลังเพิ่มรูปภาพ</span>}
      {error && <span role="alert" className="text-sm text-error-600">{error}</span>}
      {readOnly && photos.length === 0 && <span className="text-md text-gray-600">ไม่มีรูปภาพ</span>}
      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label={`${label} ${photos.length} ไฟล์`}>
          {photos.map((p) => (
            <li key={p.name} className="relative flex h-31 flex-col overflow-hidden rounded-lg bg-gray-200" title={p.name}>
              <PhotoPreview photo={p} />
              {editable && (
                <span className="absolute top-2 right-2">
                  <Button variant="secondary" size="sm" iconOnly="delete" className="rounded-full!" aria-label={`ลบรูป ${p.name}`} onClick={() => onChange?.(photos.filter((x) => x.name !== p.name))} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PhotoPreview({ photo }: { photo: Photo }) {
  const [url, setUrl] = useState(photo.assetId ? undefined : photo.url);
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    if (!photo.assetId) { setUrl(photo.url); return; }
    void readPhoto(photo.assetId).then((blob) => {
      if (!active || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => { if (active) setUrl(undefined); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [photo.assetId, photo.url]);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- local prototype image cache
    <img src={url} alt={photo.name} className="size-full object-cover" />
  ) : <span className="flex flex-1 flex-col items-center justify-center gap-1 px-2 text-gray-500"><Icon name="imagesmode" size={24} /><span className="w-full truncate text-center text-xs text-gray-600">{photo.name}</span></span>;
}
