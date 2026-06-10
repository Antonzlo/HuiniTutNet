import { useState } from "react";
import { mediaUrl } from "@/lib/api";
import { artistImageUrl } from "@/lib/artist";

type Props = {
  name: string;
  avatarUrl?: string | null;
  imageUrl?: string | null;
  className?: string;
  imgClassName?: string;
};

export function ArtistAvatar({ name, avatarUrl, imageUrl, className, imgClassName }: Props) {
  const [broken, setBroken] = useState(false);
  const src = artistImageUrl({ avatarUrl, imageUrl });
  const initial = name[0]?.toUpperCase() ?? "?";

  if (src && !broken) {
    return (
      <div className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl(src)}
          alt=""
          className={imgClassName}
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  return <div className={className}>{initial}</div>;
}
