"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RedirectSkeleton } from "@/components/Skeleton";

export default function LegacyReleaseRedirect() {
  const { key } = useParams<{ slug: string; key: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!key) return;
    const segment = decodeURIComponent(key);
    router.replace(`/releases/${encodeURIComponent(segment)}`);
  }, [key, router]);

  return <RedirectSkeleton />;
}
