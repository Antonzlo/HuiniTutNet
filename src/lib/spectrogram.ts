export const FFT_SIZE = 4096;
export const NUM_BINS = FFT_SIZE >> 1;
const MAX_FRAMES = 2048;

export type SpectrogramResult = {
  // Row-major: matrix[frame * NUM_BINS + bin] = dB
  matrix: Float32Array;
  numFrames: number;
  sampleRate: number;
  durationSec: number;
};

const HANN = (() => {
  const w = new Float32Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++)
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
  return w;
})();

function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const ang = (-2 * Math.PI) / len;
    const wre = Math.cos(ang);
    const wim = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < half; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + half] * cr - im[i + k + half] * ci;
        const vi = re[i + k + half] * ci + im[i + k + half] * cr;
        re[i + k] = ur + vr;      im[i + k] = ui + vi;
        re[i + k + half] = ur - vr; im[i + k + half] = ui - vi;
        const ncr = cr * wre - ci * wim;
        ci = cr * wim + ci * wre;
        cr = ncr;
      }
    }
  }
}

export async function computeSpectrogram(
  file: File,
  onProgress: (ratio: number) => void,
): Promise<SpectrogramResult> {
  const ab = await file.arrayBuffer();
  const ctx = new AudioContext();
  const audioBuffer = await ctx.decodeAudioData(ab);
  await ctx.close();

  const samples = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // Adaptive hop: cap at MAX_FRAMES columns so large files stay manageable
  const minHop = FFT_SIZE >> 2;
  const naturalFrames = Math.floor((samples.length - FFT_SIZE) / minHop) + 1;
  const hop = naturalFrames > MAX_FRAMES
    ? Math.ceil((samples.length - FFT_SIZE) / MAX_FRAMES)
    : minHop;
  const numFrames = Math.min(MAX_FRAMES, Math.floor((samples.length - FFT_SIZE) / hop) + 1);

  const matrix = new Float32Array(numFrames * NUM_BINS);
  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);
  const CHUNK = 200;

  for (let f = 0; f < numFrames; f++) {
    const offset = f * hop;
    re.fill(0); im.fill(0);
    const end = Math.min(offset + FFT_SIZE, samples.length);
    for (let i = offset; i < end; i++) re[i - offset] = samples[i] * HANN[i - offset];

    fft(re, im);

    const base = f * NUM_BINS;
    for (let b = 0; b < NUM_BINS; b++) {
      const mag = Math.sqrt(re[b] * re[b] + im[b] * im[b]) / FFT_SIZE;
      matrix[base + b] = 20 * Math.log10(Math.max(mag, 1e-10));
    }

    if (f % CHUNK === CHUNK - 1) {
      onProgress((f + 1) / numFrames);
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  }
  onProgress(1);

  return { matrix, numFrames, sampleRate, durationSec: audioBuffer.duration };
}

// Returns the highest frequency (Hz) with sustained energy above the noise floor.
export function detectCutoff(result: SpectrogramResult): number {
  const { matrix, numFrames, sampleRate } = result;

  const mean = new Float32Array(NUM_BINS);
  for (let f = 0; f < numFrames; f++)
    for (let b = 0; b < NUM_BINS; b++) mean[b] += matrix[f * NUM_BINS + b];
  for (let b = 0; b < NUM_BINS; b++) mean[b] /= numFrames;

  // Noise floor = average level of the top 2% of bins (near Nyquist)
  const topStart = Math.floor(NUM_BINS * 0.98);
  let noiseFloor = 0;
  for (let b = topStart; b < NUM_BINS; b++) noiseFloor += mean[b];
  noiseFloor /= NUM_BINS - topStart;

  const threshold = noiseFloor + 20;
  for (let b = NUM_BINS - 1; b > 0; b--) {
    if (mean[b] > threshold) return (b * sampleRate) / FFT_SIZE;
  }
  return 0;
}

// Viridis-like LUT: ABGR in little-endian (matches ImageData Uint32 layout)
function buildColorLut(): Uint32Array {
  const stops: [number, number, number, number][] = [
    [0.00,   0,   0,   0],
    [0.15,  68,   1,  84],
    [0.35,  59,  82, 139],
    [0.50,  33, 145, 140],
    [0.65,  94, 201,  98],
    [0.80, 253, 231,  37],
    [1.00, 255, 255, 255],
  ];
  const lut = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let j = 0;
    while (j < stops.length - 2 && stops[j + 1][0] <= t) j++;
    const [t0, r0, g0, b0] = stops[j];
    const [t1, r1, g1, b1] = stops[j + 1];
    const frac = (t - t0) / (t1 - t0);
    const r = Math.round(r0 + (r1 - r0) * frac);
    const g = Math.round(g0 + (g1 - g0) * frac);
    const b = Math.round(b0 + (b1 - b0) * frac);
    lut[i] = (0xff000000) | (b << 16) | (g << 8) | r;
  }
  return lut;
}

export function renderSpectrogram(
  canvas: HTMLCanvasElement,
  result: SpectrogramResult,
): void {
  const { matrix, numFrames, sampleRate } = result;
  const W = canvas.width;
  const H = canvas.height;
  const ctx2d = canvas.getContext("2d")!;
  const imgData = ctx2d.createImageData(W, H);
  const pixels = new Uint32Array(imgData.data.buffer);
  const lut = buildColorLut();

  const freqMin = 20;
  const freqMax = Math.min(sampleRate / 2, 24000);
  const logRatio = Math.log(freqMax / freqMin);

  // y=0 is top = high frequency (log scale)
  const yToBin = new Uint16Array(H);
  for (let y = 0; y < H; y++) {
    const freq = freqMax * Math.exp(-logRatio * (y / (H - 1)));
    yToBin[y] = Math.max(0, Math.min(NUM_BINS - 1, Math.round((freq * FFT_SIZE) / sampleRate)));
  }

  const DB_MIN = -100;
  const DB_MAX = -10;
  const dbRange = DB_MAX - DB_MIN;

  for (let x = 0; x < W; x++) {
    const f = Math.min(Math.floor((x / W) * numFrames), numFrames - 1);
    const frameBase = f * NUM_BINS;
    for (let y = 0; y < H; y++) {
      const db = matrix[frameBase + yToBin[y]];
      const norm = Math.max(0, Math.min(1, (db - DB_MIN) / dbRange));
      pixels[y * W + x] = lut[Math.floor(norm * 255)];
    }
  }

  ctx2d.putImageData(imgData, 0, 0);
}
