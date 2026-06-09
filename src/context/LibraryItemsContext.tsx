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
import { mapLibraryDto, type LibraryItem, type LibraryItemType } from "@/lib/library";
import { useAuth } from "@/context/AuthContext";

type LibraryApiRow = {
  id: string;
  type: LibraryItemType;
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string | null;
  addedAt: string;
  pinned?: boolean;
};

function favSubtitle(count: number) {
  return `Плейлист • ${count} ${count === 1 ? "трек" : count < 5 ? "трека" : "треков"}`;
}

type LibraryItemsState = {
  items: LibraryItem[];
  loading: boolean;
  reload: (opts?: { silent?: boolean }) => void;
};

const Ctx = createContext<LibraryItemsState | null>(null);

export function LibraryItemsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    (opts?: { silent?: boolean }) => {
      if (!isAuthenticated) {
        setItems([]);
        setLoading(false);
        return;
      }
      if (!opts?.silent) setLoading(true);
      api<LibraryApiRow[]>("/api/library")
        .then((rows) => setItems(mapLibraryDto(rows)))
        .catch(() => {
          if (!opts?.silent) setItems([]);
        })
        .finally(() => setLoading(false));
    },
    [isAuthenticated]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const onFav = (e: Event) => {
      const count = (e as CustomEvent<{ count: number }>).detail?.count;
      if (typeof count !== "number") return;
      setItems((prev) =>
        prev.map((item) =>
          item.id === "favorites" ? { ...item, subtitle: favSubtitle(count) } : item
        )
      );
    };
    const onSaved = () => reload({ silent: true });
    const onPlaylists = () => reload({ silent: true });
    window.addEventListener("hiuni:favorites-changed", onFav);
    window.addEventListener("hiuni:saved-releases-changed", onSaved);
    window.addEventListener("hiuni:saved-playlists-changed", onPlaylists);
    return () => {
      window.removeEventListener("hiuni:favorites-changed", onFav);
      window.removeEventListener("hiuni:saved-releases-changed", onSaved);
      window.removeEventListener("hiuni:saved-playlists-changed", onPlaylists);
    };
  }, [reload]);

  const value = useMemo(() => ({ items, loading, reload }), [items, loading, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLibraryItems() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLibraryItems outside LibraryItemsProvider");
  return ctx;
}
