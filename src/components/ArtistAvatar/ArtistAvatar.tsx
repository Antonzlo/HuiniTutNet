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
  const src = artistImageUrl({ avatarUrl, imageUrl });
  const initial = name[0]?.toUpperCase() ?? "?";

  if (src) {
    return (
      <div className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaUrl(src)} alt="" className={imgClassName} />
      </div>
    );
  }

  return <div className={className}>{initial}</div>;
}
