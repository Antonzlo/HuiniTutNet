import { Suspense } from "react";
import { AuthGateSkeleton } from "@/components/Skeleton";

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<AuthGateSkeleton />}>{children}</Suspense>;
}
