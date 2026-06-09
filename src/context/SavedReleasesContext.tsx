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

type SavedKey = `${string}:${string}`;

type SavedReleasesState = {
  isSaved: (artistSlug: string, releaseKey: string) => boolean;
  toggle: (artistSlug: string, releaseKey: string) => Promise<boolean>;
  reload: () => void;
};

const Ctx = createContext<SavedReleasesState | null>(null);

function toKey(artistSlug: string, releaseKey: string): SavedKey {
  return `${artistSlug}:${releaseKey}`;
}

export function SavedReleasesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [keys, setKeys] = useState<Set<SavedKey>>(new Set());

  const reload = useCallback(() => {
    if (!isAuthenticated) {
      setKeys(new Set());
      return;
    }
    api<Array<{ artistSlug: string; releaseKey: string }>>("/api/saved-releases")
      .then((rows) => setKeys(new Set(rows.map((r) => toKey(r.artistSlug, r.releaseKey)))))
      .catch(() => setKeys(new Set()));
  }, [isAuthenticated]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = useCallback(async (artistSlug: string, releaseKey: string) => {
    const key = toKey(artistSlug, releaseKey);
    const encoded = encodeURIComponent(releaseKey);
    const was = keys.has(key);
    const method = was ? "DELETE" : "POST";
    setKeys((prev) => {
      const next = new Set(prev);
      if (was) next.delete(key);
      else next.add(key);
      return next;
    });
    try {
      await api(`/api/artists/${artistSlug}/releases/${encoded}/save`, { method });
      window.dispatchEvent(new CustomEvent("hiuni:saved-releases-changed"));
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
  }, [keys]);

  const value = useMemo(
    () => ({
      isSaved: (artistSlug: string, releaseKey: string) => keys.has(toKey(artistSlug, releaseKey)),
      toggle,
      reload,
    }),
    [keys, toggle, reload]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSavedReleases() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSavedReleases outside SavedReleasesProvider");
  return ctx;
}
