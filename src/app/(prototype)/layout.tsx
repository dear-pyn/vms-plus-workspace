import "../globals.css";

export const metadata = { title: "ต้นแบบ VMS Plus", description: "Prototype ที่ใช้ component จาก packages/ui" };

/** layout ของต้นแบบ — ไม่มีแถบหัวของ workspace เพื่อให้หน้าตาเหมือนระบบจริง */
export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
      </head>
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  );
}
