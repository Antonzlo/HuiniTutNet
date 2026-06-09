const FALLBACK = { top: "#2a3d1a", bottom: "#0a0a0a" };

function rgb(r: number, g: number, b: number) {
  return `rgb(${r}, ${g}, ${b})`;
}

function darken(r: number, g: number, b: number, amount: number) {
  return rgb(
    Math.max(0, Math.round(r * (1 - amount))),
    Math.max(0, Math.round(g * (1 - amount))),
    Math.max(0, Math.round(b * (1 - amount)))
  );
}

export type CoverGradient = { top: string; bottom: string; css: string };

export function gradientCss(top: string, bottom: string): string {
  return `linear-gradient(180deg, ${top} 0%, ${bottom} 55%, #121212 100%)`;
}

export async function extractCoverGradient(imageUrl: string): Promise<CoverGradient> {
  if (typeof window === "undefined") {
    const css = gradientCss(FALLBACK.top, FALLBACK.bottom);
    return { ...FALLBACK, css };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 48;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no ctx");
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 128) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
        if (!n) throw new Error("empty");
        r = Math.round(r / n);
        g = Math.round(g / n);
        b = Math.round(b / n);
        const top = rgb(r, g, b);
        const bottom = darken(r, g, b, 0.45);
        resolve({ top, bottom, css: gradientCss(top, bottom) });
      } catch {
        const css = gradientCss(FALLBACK.top, FALLBACK.bottom);
        resolve({ ...FALLBACK, css });
      }
    };
    img.onerror = () => {
      const css = gradientCss(FALLBACK.top, FALLBACK.bottom);
      resolve({ ...FALLBACK, css });
    };
    img.src = imageUrl;
  });
}
