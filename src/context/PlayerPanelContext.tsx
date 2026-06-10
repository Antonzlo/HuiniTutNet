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
import { usePlayer } from "@/context/PlayerContext";

export type SidePanel = "now-playing" | "queue";
export type ImmersiveMode = "lyrics";

type Ctx = {
  sidePanel: SidePanel | null;
  immersive: ImmersiveMode | null;
  panelFullscreen: boolean;
  sideOpen: boolean;
  openSidePanel: (panel: SidePanel) => void;
  closeSidePanel: () => void;
  toggleSidePanel: (panel: SidePanel) => void;
  openPanelFullscreen: () => void;
  closePanelFullscreen: () => void;
  togglePanelFullscreen: () => void;
  openImmersive: (mode: ImmersiveMode) => void;
  closeImmersive: () => void;
};

const PlayerPanelCtx = createContext<Ctx | null>(null);

export function PlayerPanelProvider({ children }: { children: ReactNode }) {
  const { currentTrack } = usePlayer();
  const [sidePanel, setSidePanel] = useState<SidePanel | null>(null);
  const [immersive, setImmersive] = useState<ImmersiveMode | null>(null);
  const [panelFullscreen, setPanelFullscreen] = useState(false);

  const closeSidePanel = useCallback(() => {
    setSidePanel(null);
    setPanelFullscreen(false);
  }, []);

  const closeImmersive = useCallback(() => setImmersive(null), []);

  const closePanelFullscreen = useCallback(() => {
    setPanelFullscreen(false);
    setImmersive(null);
  }, []);

  const openSidePanel = useCallback((panel: SidePanel) => {
    setSidePanel(panel);
    setImmersive(null);
    if (panel === "queue") setPanelFullscreen(false);
  }, []);

  const toggleSidePanel = useCallback((panel: SidePanel) => {
    setSidePanel((prev) => {
      if (prev === panel) {
        setPanelFullscreen(false);
        return null;
      }
      if (panel === "queue") setPanelFullscreen(false);
      return panel;
    });
    setImmersive(null);
  }, []);

  const openPanelFullscreen = useCallback(() => {
    setSidePanel("now-playing");
    setPanelFullscreen(true);
  }, []);

  const togglePanelFullscreen = useCallback(() => {
    setPanelFullscreen((v) => {
      const next = !v;
      if (!next) setImmersive(null);
      if (next) setSidePanel("now-playing");
      return next;
    });
  }, []);

  const openImmersive = useCallback((mode: ImmersiveMode) => {
    setImmersive(mode);
  }, []);

  useEffect(() => {
    if (!currentTrack) {
      setSidePanel(null);
      setImmersive(null);
      setPanelFullscreen(false);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (!panelFullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePanelFullscreen();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelFullscreen, closePanelFullscreen]);

  const value = useMemo(
    () => ({
      sidePanel,
      immersive,
      panelFullscreen,
      sideOpen: sidePanel !== null,
      openSidePanel,
      closeSidePanel,
      toggleSidePanel,
      openPanelFullscreen,
      closePanelFullscreen,
      togglePanelFullscreen,
      openImmersive,
      closeImmersive,
    }),
    [
      sidePanel,
      immersive,
      panelFullscreen,
      openSidePanel,
      closeSidePanel,
      toggleSidePanel,
      openPanelFullscreen,
      closePanelFullscreen,
      togglePanelFullscreen,
      openImmersive,
      closeImmersive,
    ]
  );

  return <PlayerPanelCtx.Provider value={value}>{children}</PlayerPanelCtx.Provider>;
}

export function usePlayerPanel() {
  const ctx = useContext(PlayerPanelCtx);
  if (!ctx) throw new Error("usePlayerPanel outside PlayerPanelProvider");
  return ctx;
}
