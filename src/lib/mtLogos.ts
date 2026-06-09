import darkMt from "@/assets/darkmt.svg?raw";
import lightMt from "@/assets/lightmt.svg?raw";
import type { MtLogoVariant } from "./coverContrast";

const SRC: Record<MtLogoVariant, string> = {
  dark: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(darkMt)}`,
  light: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(lightMt)}`,
};

export function mtLogoSrc(variant: MtLogoVariant): string {
  return SRC[variant];
}
