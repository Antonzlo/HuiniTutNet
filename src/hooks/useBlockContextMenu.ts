"use client";

import { useEffect } from "react";

export function useBlockContextMenu() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);
}
