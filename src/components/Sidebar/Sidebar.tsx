"use client";

import { useLibrary } from "@/context/LibraryContext";
import { LibraryPanel } from "@/components/LibraryPanel/LibraryPanel";
import styles from "./Sidebar.module.scss";

export function Sidebar() {
  const { sidebarCollapsed, isFullscreen } = useLibrary();

  return (
    <aside
      className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ""} ${isFullscreen ? styles.fullscreen : ""}`}
    >
      <LibraryPanel />
    </aside>
  );
}
