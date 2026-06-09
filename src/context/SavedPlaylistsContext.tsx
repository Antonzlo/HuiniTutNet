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

export type PlaylistKind = "mix" | "radio";

type SavedKey = `${PlaylistKind}:${string}`;

type SavedPlaylistsState = {
  isSaved: (kind: PlaylistKind, itemKey: string) => boolean;
  toggle: (opts: {
    kind: PlaylistKind;
    itemKey: string;
    title: string;
    subtitle?: string;
    coverUrl?: string | null;
  }) => Promise<boolean>;
  reload: () => void;
};

const Ctx = createContext<SavedPlaylistsState | null>(null);

function toKey(kind: PlaylistKind, itemKey: string): SavedKey {
  return `${kind}:${itemKey}`;
}

export function SavedPlaylistsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [keys, setKeys] = useState<Set<SavedKey>>(new Set());

  const reload = useCallback(() => {
    if (!isAuthenticated) {
      setKeys(new Set());
      return;
    }
    api<Array<{ kind: string; itemKey: string }>>("/api/saved-playlists")
      .then((rows) => setKeys(new Set(rows.map((r) => toKey(r.kind as PlaylistKind, r.itemKey)))))
      .catch(() => setKeys(new Set()));
  }, [isAuthenticated]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = useCallback(
    async (opts: {
      kind: PlaylistKind;
      itemKey: string;
      title: string;
      subtitle?: string;
      coverUrl?: string | null;
    }) => {
      const key = toKey(opts.kind, opts.itemKey);
      const was = keys.has(key);
      setKeys((prev) => {
        const next = new Set(prev);
        if (was) next.delete(key);
        else next.add(key);
        return next;
      });
      try {
        if (was) {
          await api(
            `/api/saved-playlists?kind=${opts.kind}&itemKey=${encodeURIComponent(opts.itemKey)}`,
            { method: "DELETE" }
          );
        } else {
          await api("/api/saved-playlists", {
            method: "POST",
            body: JSON.stringify({
              kind: opts.kind,
              itemKey: opts.itemKey,
              title: opts.title,
              subtitle: opts.subtitle ?? "",
              coverUrl: opts.coverUrl ?? null,
            }),
          });
        }
        window.dispatchEvent(new CustomEvent("hiuni:saved-playlists-changed"));
        return !was;
      } catch {
        setKeys((prev) => {
          const next = new Set(prev);
          if (was) next.add(key);
          else next.delete(key);
          return next;
        });
        throw new Error("save failed");
      }
    },
    [keys]
  );

  const value = useMemo(
    () => ({
      isSaved: (kind: PlaylistKind, itemKey: string) => keys.has(toKey(kind, itemKey)),
      toggle,
      reload,
    }),
    [keys, toggle, reload]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSavedPlaylists() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSavedPlaylists outside SavedPlaylistsProvider");
  return ctx;
}
