import searchSvg from "@/assets/fpI/Search.svg?raw";
import bellSvg from "@/assets/fpI/Bell.svg?raw";
import chevronSvg from "@/assets/fpI/Arrow_drop_down.svg?raw";
import homeSvg from "@/assets/fpI/Home.svg?raw";
import musicSvg from "@/assets/fpI/Music.svg?raw";
import librarySvg from "@/assets/fpI/Materials.svg?raw";
import downloadSvg from "@/assets/fpI/Download.svg?raw";
import settingsSvg from "@/assets/fpI/Setting_alt_line.svg?raw";
import ticketSvg from "@/assets/fpI/Ticket_fill.svg?raw";
import userSvg from "@/assets/fpI/User_fill.svg?raw";
import signOutSvg from "@/assets/fpI/Sign_out_squre_fill.svg?raw";
import shopSvg from "@/assets/fpI/Shop_light.svg?raw";
import prevNextSvg from "@/assets/fpI/Stop_and_play_fill.svg?raw";
import playSvg from "@/assets/fpI/Play_fill.svg?raw";
import pauseSvg from "@/assets/fpI/Stop_fill.svg?raw";
import shuffleSvg from "@/assets/fpI/Sort_random.svg?raw";
import repeatSvg from "@/assets/fpI/circle_right_alt.svg?raw";
import volumeSvg from "@/assets/fpI/sound_min_fill.svg?raw";
import heartFillSvg from "@/assets/fpI/Favorite_fill.svg?raw";
import heartOutlineSvg from "@/assets/fpI/Favorite_light.svg?raw";
import playlistSvg from "@/assets/fpI/Status_list.svg?raw";
import moreSvg from "@/assets/fpI/Meatballs_menu.svg?raw";
import textSvg from "@/assets/fpI/Text.svg?raw";
import fullscreenSvg from "@/assets/fpI/Full_light.svg?raw";
import { AssetIcon, type IconTone } from "@/components/Icon/AssetIcon";
import { HiuniMascot } from "@/components/Brand/HiuniMascot";

interface IconProps {
  size?: number;
  className?: string;
  tone?: IconTone;
}

function Icon({
  src,
  size = 24,
  className,
  tone = "primary",
  flipX,
  flipY,
}: IconProps & { src: string; flipX?: boolean; flipY?: boolean }) {
  return (
    <AssetIcon src={src} size={size} tone={tone} className={className} flipX={flipX} flipY={flipY} aria-hidden />
  );
}

export function HiuniLogo({ size = 45, className }: IconProps) {
  const mascotSize = Math.round(size * 0.95);
  const fontSize = size * 0.36;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.14,
        lineHeight: 1,
      }}
    >
      <HiuniMascot size={mascotSize} />
      <span
        style={{
          fontFamily: "var(--font-nunito), Nunito, sans-serif",
          fontWeight: 800,
          fontSize,
          color: "#fff",
          letterSpacing: "-0.03em",
        }}
      >
        Hiuni<span style={{ color: "#96FF55" }}>Tut</span>
      </span>
    </span>
  );
}

export function SearchIcon(props: IconProps) {
  return <Icon src={searchSvg} tone="muted" {...props} />;
}

export function BellIcon({ size = 20, ...props }: IconProps) {
  return <Icon src={bellSvg} size={size} tone="muted" {...props} />;
}

export function ChevronDownIcon(props: IconProps) {
  return <Icon src={chevronSvg} {...props} />;
}

export function HomeIcon(props: IconProps) {
  return <Icon src={homeSvg} {...props} />;
}

export function MusicIcon(props: IconProps) {
  return <Icon src={musicSvg} tone="muted" {...props} />;
}

export function LibraryIcon(props: IconProps) {
  return <Icon src={librarySvg} tone="muted" {...props} />;
}

export function DownloadIcon(props: IconProps) {
  return <Icon src={downloadSvg} tone="green" {...props} />;
}

export function SettingsIcon(props: IconProps) {
  return <Icon src={settingsSvg} tone="muted" {...props} />;
}

export function InviteIcon(props: IconProps) {
  return <Icon src={ticketSvg} tone="muted" {...props} />;
}

export function UserIcon(props: IconProps) {
  return <Icon src={userSvg} tone="muted" {...props} />;
}

export function LogoutIcon(props: IconProps) {
  return <Icon src={signOutSvg} tone="muted" {...props} />;
}

export function AdsIcon(props: IconProps) {
  return <Icon src={shopSvg} tone="muted" {...props} />;
}

export function PrevIcon(props: IconProps) {
  return <Icon src={prevNextSvg} flipX {...props} />;
}

export function NextIcon(props: IconProps) {
  return <Icon src={prevNextSvg} {...props} />;
}

export function PlayIcon(props: IconProps) {
  return <Icon src={playSvg} tone="dark" size={props.size ?? 24} {...props} />;
}

export function PauseIcon(props: IconProps) {
  return <Icon src={pauseSvg} tone="dark" size={props.size ?? 24} {...props} />;
}

export function ShuffleIcon(props: IconProps) {
  return <Icon src={shuffleSvg} {...props} />;
}

export function RepeatIcon(props: IconProps) {
  return <Icon src={repeatSvg} flipY {...props} />;
}

export function VolumeIcon(props: IconProps) {
  return <Icon src={volumeSvg} {...props} />;
}

export function HeartIcon(props: IconProps & { filled?: boolean }) {
  const { filled, tone, ...rest } = props;
  return (
    <Icon
      src={filled ? heartFillSvg : heartOutlineSvg}
      tone={filled ? "accent" : tone ?? "muted"}
      {...rest}
    />
  );
}

export function PlaylistIcon(props: IconProps) {
  return <Icon src={playlistSvg} {...props} />;
}

export function MoreIcon(props: IconProps) {
  return <Icon src={moreSvg} {...props} />;
}

export function LyricsIcon(props: IconProps) {
  return <Icon src={textSvg} {...props} />;
}

export function FullscreenIcon(props: IconProps) {
  return <Icon src={fullscreenSvg} {...props} />;
}

export function DislikeIcon(props: IconProps) {
  const { size = 16, className, tone = "muted" } = props;
  const color = tone === "primary" ? "#ffffff" : "#a0a0a0";
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M8 12.8S4.8 10.4 4.8 7.2 6.2 4.8 8 4.8c.9 0 1.6.5 2 1.1.4-.6 1.1-1.1 2-1.1 1.8 0 3.2 1.3 3.2 3.4S11.2 12.8 8 12.8Z"
        stroke={color}
        strokeWidth="1.1"
      />
      <path d="M3.2 3.2 12.8 12.8" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
