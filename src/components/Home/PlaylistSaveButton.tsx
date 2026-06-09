"use client";

import { HeartIcon } from "@/components/icons";
import { useSavedPlaylists, type PlaylistKind } from "@/context/SavedPlaylistsContext";

type Props = {
  kind: PlaylistKind;
  itemKey: string;
  title: string;
  subtitle?: string;
  coverUrl?: string | null;
  className?: string;
  activeClassName?: string;
};

export function PlaylistSaveButton({
  kind,
  itemKey,
  title,
  subtitle,
  coverUrl,
  className,
  activeClassName,
}: Props) {
  const { isSaved, toggle } = useSavedPlaylists();
  const saved = isSaved(kind, itemKey);

  return (
    <button
      type="button"
      className={`${className ?? ""} ${saved ? activeClassName ?? "" : ""}`.trim()}
      onClick={() => void toggle({ kind, itemKey, title, subtitle, coverUrl })}
      aria-label={saved ? "Убрать из медиатеки" : "Сохранить в медиатеку"}
      aria-pressed={saved}
    >
      <HeartIcon filled={saved} size={22} />
    </button>
  );
}
