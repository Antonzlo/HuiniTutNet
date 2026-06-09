import { mediaUrl } from "@/lib/api";
import type { MixCoverData } from "@/lib/home";
import {
  isLightBackground,
  pickMtLogoVariant,
  pickOnCoverTextColor,
} from "@/lib/coverContrast";
import { mtLogoSrc } from "@/lib/mtLogos";
import s from "./home.module.scss";

type Props = {
  cover: MixCoverData;
  className?: string;
};

export function MixCover({ cover, className }: Props) {
  const cls = [s.mixCover, className].filter(Boolean).join(" ");
  const barLogo = pickMtLogoVariant(cover.barColor);
  const barText = pickOnCoverTextColor(cover.barColor);
  const barLight = isLightBackground(cover.barColor);

  return (
    <div className={cls}>
      {cover.bgImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl(cover.bgImageUrl)} alt="" className={s.mixBg} />
      ) : (
        <div className={s.mixBgFallback} />
      )}
      <div className={s.mixOverlay} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mtLogoSrc("light")} alt="" className={s.mixLogo} />
      <div className={s.mixBar} style={{ background: cover.barColor }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mtLogoSrc(barLogo)} alt="" className={s.mixBarLogo} />
        <span
          className={s.mixBarLabel}
          style={{
            color: barText,
            textShadow: barLight ? "none" : "0 1px 4px rgba(0, 0, 0, 0.35)",
          }}
        >
          {cover.label}
        </span>
      </div>
    </div>
  );
}
