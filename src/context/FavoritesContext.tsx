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
import type { Track } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

type FavoritesState = {
  isFavorite: (trackId: string) => boolean;
  toggle: (trackId: string) => Promise<boolean>;
  reload: () => void;
};

const Ctx = createContext<FavoritesState | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  const reload = useCallback(() => {
    if (!isAuthenticated) {
      setIds(new Set());
      return;
    }
    api<Track[]>("/api/favorites")
      .then((tracks) => setIds(new Set(tracks.map((t) => t.id))))
      .catch(() => setIds(new Set()));
  }, [isAuthenticated]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = useCallback(async (trackId: string) => {
    const was = ids.has(trackId);
    const method = was ? "DELETE" : "POST";
    const next = new Set(ids);
    if (was) next.delete(trackId);
    else next.add(trackId);
    const nextCount = next.size;
    setIds(next);
    try {
      await api(`/api/tracks/${trackId}/favorite`, { method });
      window.dispatchEvent(new CustomEvent("hiuni:favorites-changed", { detail: { count: nextCount } }));
      return !was;
    } catch {
      setIds((prev) => {
        const next = new Set(prev);
        if (was) next.add(trackId);
        else next.delete(trackId);
        return next;
      });
      throw new Error("favorite failed");
    }
  }, [ids]);

  const value = useMemo(
    () => ({
      isFavorite: (trackId: string) => ids.has(trackId),
      toggle,
      reload,
    }),
    [ids, toggle, reload]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFavorites() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFavorites outside FavoritesProvider");
  return ctx;
}
