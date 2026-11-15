import "../globals.css";
import Link from "next/link";
export const metadata = { title: "VMS+ Workspace", description: "Requirements, flows, prototypes and review cases" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
 return <html lang="th"><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Material+Symbols+Outlined&display=swap" /></head><body className="bg-gray-50 text-gray-900"><header className="border-b border-gray-200 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5"><Link href="/" className="text-xl font-semibold text-brand-900 no-underline">VMS+ Workspace</Link><nav aria-label="เมนูหลัก" className="flex gap-6 text-sm"><Link href="/">งานและเคสรีวิว</Link><Link href="/guide/">วิธีใช้งาน / กติกากลาง</Link></nav></div></header>{children}</body></html>;
}
