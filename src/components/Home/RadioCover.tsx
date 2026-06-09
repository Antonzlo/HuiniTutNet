import { mediaUrl } from "@/lib/api";
import type { RadioCoverData } from "@/lib/home";
import {
  pickAvatarBorderColor,
  pickMtLogoVariant,
  pickOnCoverMutedTextColor,
  pickOnCoverTextColor,
} from "@/lib/coverContrast";
import { mtLogoSrc } from "@/lib/mtLogos";
import s from "./home.module.scss";

type Props = {
  cover: RadioCoverData;
  className?: string;
};

export function RadioCover({ cover, className }: Props) {
  const cls = [s.radioCover, className].filter(Boolean).join(" ");
  const logo = pickMtLogoVariant(cover.barColor);
  const titleColor = pickOnCoverTextColor(cover.barColor);
  const badgeColor = pickOnCoverMutedTextColor(cover.barColor);
  const avatarBorder = pickAvatarBorderColor(cover.barColor);

  return (
    <div className={cls} style={{ background: cover.barColor }}>
      <span className={s.radioBadge} style={{ color: badgeColor }}>
        РАДИО
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mtLogoSrc(logo)} alt="" className={s.radioLogo} />
      <div className={s.radioAvatars}>
        {cover.avatarUrls.slice(0, 3).map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url + i}
            src={mediaUrl(url)}
            alt=""
            className={s.radioAvatar}
            style={{ borderColor: avatarBorder }}
          />
        ))}
      </div>
      <div className={s.radioTitle} style={{ color: titleColor }}>
        {cover.artistName}
      </div>
    </div>
  );
}
