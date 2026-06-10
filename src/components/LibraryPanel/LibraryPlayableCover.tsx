"use client";

import { ShelfPlayOverlay } from "@/components/ShelfPlayOverlay/ShelfPlayOverlay";
import overlay from "@/components/ShelfPlayOverlay/ShelfPlayOverlay.module.scss";
import { useLibraryItemPlay } from "@/hooks/useLibraryItemPlay";
import type { LibraryItem } from "@/lib/library";
import { LibraryCover } from "./LibraryCover";
import s from "./LibraryPanel.module.scss";

type Props = {
  item: LibraryItem;
  active?: boolean;
  size?: number;
  className?: string;
  wrapClassName?: string;
};

export function LibraryPlayableCover({
  item,
  active,
  size,
  className,
  wrapClassName,
}: Props) {
  const { play, contextId } = useLibraryItemPlay(item);

  return (
    <div
      className={`${s.coverWrap} ${overlay.coverWrap} ${item.round ? overlay.coverWrapRound : ""} ${wrapClassName ?? ""}`}
    >
      <LibraryCover item={item} size={size} className={className} />
      <ShelfPlayOverlay
        onPlay={play}
        contextId={contextId}
        round={item.round}
        forceVisible={active}
        aria-label={`Играть ${item.title}`}
      />
    </div>
  );
}
