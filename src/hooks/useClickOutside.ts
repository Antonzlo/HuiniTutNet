import { useEffect } from "react";

export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, handler, enabled]);
}
