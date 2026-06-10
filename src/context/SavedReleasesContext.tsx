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
import { decodeSlugParam } from "@/lib/release";
import { useAuth } from "@/context/AuthContext";

type SavedKey = `${string}:${string}`;

type SavedReleasesState = {
  isSaved: (artistSlug: string, releaseKey: string) => boolean;
  isSavedBySlug: (releaseSlug: string) => boolean;
  toggle: (artistSlug: string, releaseKey: string) => Promise<boolean>;
  toggleBySlug: (releaseSlug: string) => Promise<boolean>;
  reload: () => void;
};

const Ctx = createContext<SavedReleasesState | null>(null);

function toKey(artistSlug: string, releaseKey: string): SavedKey {
  return `${artistSlug}:${releaseKey}`;
}

export function SavedReleasesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [keys, setKeys] = useState<Set<SavedKey>>(new Set());
  const [slugKeys, setSlugKeys] = useState<Set<string>>(new Set());

  const reload = useCallback(() => {
    if (!isAuthenticated) {
      setKeys(new Set());
      setSlugKeys(new Set());
      return;
    }
    api<Array<{ artistSlug: string | null; releaseKey: string | null }>>("/api/saved-releases")
      .then((rows) => {
        setKeys(
          new Set(
            rows
              .filter((r) => r.artistSlug && r.releaseKey)
              .map((r) => toKey(r.artistSlug!, r.releaseKey!))
          )
        );
        setSlugKeys(
          new Set(rows.map((r) => r.releaseKey).filter((s): s is string => Boolean(s)))
        );
      })
      .catch(() => {
        setKeys(new Set());
        setSlugKeys(new Set());
      });
  }, [isAuthenticated]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = useCallback(async (artistSlug: string, releaseKey: string) => {
    const key = toKey(artistSlug, releaseKey);
    const encoded = encodeURIComponent(releaseKey);
    const was = keys.has(key);
    setKeys((prev) => {
      const next = new Set(prev);
      if (was) next.delete(key);
      else next.add(key);
      return next;
    });
    try {
      await api(`/api/artists/${artistSlug}/releases/${encoded}/save`, {
        method: was ? "DELETE" : "POST",
      });
      window.dispatchEvent(new CustomEvent("hiuni:saved-releases-changed"));
      reload();
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
  }, [keys, reload]);

  const toggleBySlug = useCallback(async (releaseSlug: string) => {
    const was = slugKeys.has(releaseSlug);
    setSlugKeys((prev) => {
      const next = new Set(prev);
      if (was) next.delete(releaseSlug);
      else next.add(releaseSlug);
      return next;
    });
    try {
      await api(`/api/releases/${encodeURIComponent(decodeSlugParam(releaseSlug))}/save`, {
        method: was ? "DELETE" : "POST",
      });
      window.dispatchEvent(new CustomEvent("hiuni:saved-releases-changed"));
      reload();
      return !was;
    } catch {
      setSlugKeys((prev) => {
        const next = new Set(prev);
        if (was) next.add(releaseSlug);
        else next.delete(releaseSlug);
        return next;
      });
      throw new Error("save failed");
    }
  }, [slugKeys, reload]);

  const value = useMemo(
    () => ({
      isSaved: (artistSlug: string, releaseKey: string) => keys.has(toKey(artistSlug, releaseKey)),
      isSavedBySlug: (releaseSlug: string) => slugKeys.has(releaseSlug),
      toggle,
      toggleBySlug,
      reload,
    }),
    [keys, slugKeys, toggle, toggleBySlug, reload]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSavedReleases() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSavedReleases outside SavedReleasesProvider");
  return ctx;
}
