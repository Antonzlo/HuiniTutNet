import Link from "next/link";
import type { Track } from "@/lib/types";
import { trackReleaseUrl } from "@/lib/release";

type Props = {
  track: Track;
  catalog?: Track[];
  className?: string;
  onNavigate?: () => void;
};

export function TrackTitleLink({ track, catalog, className, onNavigate }: Props) {
  return (
    <Link
      href={trackReleaseUrl(track, catalog)}
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
