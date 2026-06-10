"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { LibraryFilter, LibrarySort, LibraryView } from "@/lib/library";

export type LibraryMode = "collapsed" | "expanded" | "fullscreen";

type LibraryState = {
  mode: LibraryMode;
  filter: LibraryFilter;
  search: string;
  sort: LibrarySort;
  view: LibraryView;
  showSearch: boolean;
  createOpen: boolean;
  sortOpen: boolean;
  setFilter: (f: LibraryFilter) => void;
  setSearch: (s: string) => void;
  setSort: (s: LibrarySort) => void;
  setView: (v: LibraryView) => void;
  setShowSearch: (v: boolean) => void;
  setCreateOpen: (v: boolean) => void;
  setSortOpen: (v: boolean) => void;
  toggleCollapse: () => void;
  expand: () => void;
  openFullscreen: () => void;
  closeFullscreen: () => void;
  sidebarCollapsed: boolean;
  isFullscreen: boolean;
};

const Ctx = createContext<LibraryState | null>(null);
const STORAGE_KEY = "hiuni-library-mode";

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<LibraryMode>("expanded");
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<LibrarySort>("recent");
  const [view, setView] = useState<LibraryView>("list");
  const [showSearch, setShowSearch] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LibraryMode | null;
    if (saved === "collapsed" || saved === "expanded") setMode(saved);
  }, []);

  useEffect(() => {
    if (mode !== "fullscreen") localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggleCollapse = useCallback(() => {
    setMode((m) => (m === "collapsed" ? "expanded" : "collapsed"));
    setShowSearch(false);
    setCreateOpen(false);
    setSortOpen(false);
  }, []);

  const expand = useCallback(() => {
    setMode((m) => (m === "collapsed" || m === "fullscreen" ? "expanded" : m));
  }, []);

  const openFullscreen = useCallback(() => {
    setMode("fullscreen");
    setCreateOpen(false);
    setSortOpen(false);
  }, []);

  const closeFullscreen = useCallback(() => {
    setMode("expanded");
  }, []);

  const sidebarCollapsed = mode === "collapsed";
  const isFullscreen = mode === "fullscreen";

  return (
    <Ctx.Provider
      value={{
        mode,
        filter,
        search,
        sort,
        view,
        showSearch,
        createOpen,
        sortOpen,
        setFilter,
        setSearch,
        setSort,
        setView,
        setShowSearch,
        setCreateOpen,
        setSortOpen,
        toggleCollapse,
        expand,
        openFullscreen,
        closeFullscreen,
        sidebarCollapsed,
        isFullscreen,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLibrary outside LibraryProvider");
  return ctx;
}
