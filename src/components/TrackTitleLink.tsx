import Link from "next/link";
import type { Track } from "@/lib/types";
import { trackReleaseUrl } from "@/lib/release";

type Props = {
  track: Track;
  catalog?: Track[];
  contextReleaseSlug?: string;
  className?: string;
  onNavigate?: () => void;
};

export function TrackTitleLink({
  track,
  catalog,
  contextReleaseSlug,
  className,
  onNavigate,
}: Props) {
  return (
    <Link
      href={trackReleaseUrl(track, catalog, contextReleaseSlug)}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        onNavigate?.();
      }}
    >
      {track.title}
    </Link>
  );
}
