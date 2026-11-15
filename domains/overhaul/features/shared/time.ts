/** วันเวลาแบบไทยที่หน้างานรายคันใช้ — dd/mm/yyyy (พ.ศ.) HH:mm */
import { formatThaiDate } from "@ui/DateField";

export const nowStamp = (d = new Date()) => `${formatThaiDate(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
export const todayThai = () => formatThaiDate(new Date());
export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
