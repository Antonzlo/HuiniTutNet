"use client";

import { useEffect, useState } from "react";
import { extractCoverGradient, gradientCss, type CoverGradient } from "@/lib/cover-colors";

const DEFAULT_CSS = gradientCss("#2a3d1a", "#0a0a0a");

export function useCoverGradient(coverUrl?: string | null) {
  const [gradient, setGradient] = useState<CoverGradient | null>(null);

  useEffect(() => {
    if (!coverUrl) {
      setGradient(null);
      return;
    }
    let cancelled = false;
    void extractCoverGradient(coverUrl).then((g) => {
      if (!cancelled) setGradient(g);
    });
    return () => {
      cancelled = true;
    };
  }, [coverUrl]);

  return {
    heroStyle: { background: gradient?.css ?? DEFAULT_CSS },
    gradient,
  };
}
