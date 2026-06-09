import { Suspense } from "react";

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="muted">Загрузка…</p>}>{children}</Suspense>;
}
