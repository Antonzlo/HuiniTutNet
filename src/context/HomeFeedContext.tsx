"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { HomeFeed } from "@/lib/home";
import { clearHomeCache, readHomeCache, writeHomeCache } from "@/lib/homeCache";
import { useAuth } from "@/context/AuthContext";

type HomeFeedState = {
  feed: HomeFeed | null;
  loading: boolean;
  err: string;
  reload: (opts?: { silent?: boolean }) => void;
};

const Ctx = createContext<HomeFeedState | null>(null);

export function HomeFeedProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const feedRef = useRef<HomeFeed | null>(null);
  feedRef.current = feed;

  const reload = useCallback(
    (opts?: { silent?: boolean }) => {
      if (!isAuthenticated || !user) {
        setFeed(null);
        setLoading(false);
        clearHomeCache();
        return;
      }

      const cached = readHomeCache(user.id);
      if (cached && !feedRef.current) {
        setFeed(cached);
        setLoading(false);
      } else if (!opts?.silent && !cached && !feedRef.current) {
        setLoading(true);
      }

      api<HomeFeed>("/api/home")
        .then((data) => {
          setFeed(data);
          writeHomeCache(user.id, data);
          setErr("");
        })
        .catch((e: Error) => {
          if (!feedRef.current && !cached) setErr(e.message);
        })
        .finally(() => setLoading(false));
    },
    [isAuthenticated, user]
  );

  useEffect(() => {
    if (!user?.id) {
      setFeed(null);
      setLoading(false);
      return;
    }
    const cached = readHomeCache(user.id);
    if (cached) {
      setFeed(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    reload({ silent: Boolean(cached) });
  }, [user?.id, reload]);

  useEffect(() => {
    const onInvalidate = () => reload({ silent: true });
    window.addEventListener("hiuni:home-invalidate", onInvalidate);
    window.addEventListener("hiuni:favorites-changed", onInvalidate);
    window.addEventListener("hiuni:saved-releases-changed", onInvalidate);
    window.addEventListener("hiuni:saved-playlists-changed", onInvalidate);
    return () => {
      window.removeEventListener("hiuni:home-invalidate", onInvalidate);
      window.removeEventListener("hiuni:favorites-changed", onInvalidate);
      window.removeEventListener("hiuni:saved-releases-changed", onInvalidate);
      window.removeEventListener("hiuni:saved-playlists-changed", onInvalidate);
    };
  }, [reload]);

  const value = useMemo(() => ({ feed, loading, err, reload }), [feed, loading, err, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHomeFeed() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHomeFeed outside HomeFeedProvider");
  return ctx;
}
