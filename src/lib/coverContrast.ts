export type MtLogoVariant = "light" | "dark";

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace("#", "").trim();
  if (raw.length === 3) {
    return {
      r: parseInt(raw[0]! + raw[0], 16),
      g: parseInt(raw[1]! + raw[1], 16),
      b: parseInt(raw[2]! + raw[2], 16),
    };
  }
  if (raw.length >= 6) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }
  return { r: 40, g: 40, b: 40 };
}

function linearize(channel: number) {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function colorLuminance(hex: string): number {
  const { r, g, b } = parseHexColor(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function isLightBackground(hex: string): boolean {
  return colorLuminance(hex) > 0.45;
}

export function pickMtLogoVariant(bgHex: string): MtLogoVariant {
  return isLightBackground(bgHex) ? "dark" : "light";
}

export function pickOnCoverTextColor(bgHex: string): string {
  return isLightBackground(bgHex) ? "rgba(0, 0, 0, 0.88)" : "#ffffff";
}

export function pickOnCoverMutedTextColor(bgHex: string): string {
  return isLightBackground(bgHex) ? "rgba(0, 0, 0, 0.62)" : "rgba(255, 255, 255, 0.78)";
}

export function pickAvatarBorderColor(bgHex: string): string {
  return isLightBackground(bgHex) ? "rgba(0, 0, 0, 0.18)" : "rgba(255, 255, 255, 0.35)";
}
