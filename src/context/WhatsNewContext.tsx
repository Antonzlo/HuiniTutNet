"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type WhatsNewState = {
  unreadCount: number;
  hasUnread: boolean;
  refresh: () => void;
  markSeen: () => Promise<void>;
};

const Ctx = createContext<WhatsNewState | null>(null);

export function WhatsNewProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    api<{ unreadCount: number }>("/api/whats-new/status")
      .then((r) => setUnreadCount(r.unreadCount))
      .catch(() => setUnreadCount(0));
  }, [isAuthenticated]);

  const markSeen = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await api("/api/whats-new/seen", { method: "POST" });
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const onFocus = () => refresh();
    const onTracks = () => refresh();
    const iv = setInterval(refresh, 90_000);
    window.addEventListener("focus", onFocus);
    window.addEventListener("hiuni:tracks-updated", onTracks);
    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("hiuni:tracks-updated", onTracks);
    };
  }, [isAuthenticated, refresh]);

  const value = useMemo(
    () => ({
      unreadCount,
      hasUnread: unreadCount > 0,
      refresh,
      markSeen,
    }),
    [unreadCount, refresh, markSeen]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWhatsNew() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWhatsNew outside WhatsNewProvider");
  return ctx;
}
