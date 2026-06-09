import { mediaUrl } from "@/lib/api";
import type { LibraryItem } from "@/lib/library";
import s from "./LibraryPanel.module.scss";

type Props = {
  item: LibraryItem;
  size?: number;
  className?: string;
};

export function LibraryCover({ item, size, className }: Props) {
  const cls = [s.cover, item.round ? s.coverRound : s.coverSquare, item.liked ? s.coverLiked : "", className]
    .filter(Boolean)
    .join(" ");

  const style = size ? { width: size, height: size } : undefined;

  if (item.liked) {
    return (
      <div className={cls} style={style} aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
    );
  }

  if (item.imageUrl) {
    return (
      <div className={cls} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaUrl(item.imageUrl)} alt="" />
      </div>
    );
  }

  return (
    <div className={cls} style={style} aria-hidden>
      {item.title[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
