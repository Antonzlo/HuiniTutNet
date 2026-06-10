"use client";

import { useEffect, useRef, useState } from "react";
import {
  computeSpectrogram,
  renderSpectrogram,
  FFT_SIZE,
  NUM_BINS,
  type SpectrogramResult,
} from "@/lib/spectrogram";
import s from "./SpectrogramViewer.module.scss";

const CANVAS_H = 600;

// Frequency grid lines (Hz) to draw on Y axis
const FREQ_GRID = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 24000];

function fmtFreq(hz: number): string {
  return hz >= 1000 ? `${hz / 1000}k` : `${hz}`;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const ss = Math.floor(sec % 60);
  return `${m}:${ss.toString().padStart(2, "0")}`;
}


type Props = {
  file: File;
  onClose: () => void;
};

type Stage = "computing" | "done" | "error";

export function SpectrogramViewer({ file, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<Stage>("computing");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SpectrogramResult | null>(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    computeSpectrogram(file, (r) => { if (!cancelled) setProgress(r); })
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStage("done");
      })
      .catch((e) => {
        if (cancelled) return;
        setErrMsg(e instanceof Error ? e.message : "Ошибка анализа");
        setStage("error");
      });
    return () => { cancelled = true; };
  }, [file]);

  useEffect(() => {
    if (stage === "done" && result && canvasRef.current) {
      canvasRef.current.width = result.numFrames;
      canvasRef.current.height = CANVAS_H;
      renderSpectrogram(canvasRef.current, result);
    }
  }, [stage, result]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const sampleRate = result?.sampleRate ?? 44100;
  const nyquist = Math.min(sampleRate / 2, 24000);
  const freqMin = 20;
  const logRatio = Math.log(nyquist / freqMin);

  // Fraction from top (0) to bottom (1) for log-scale freq axis
  const freqToFrac = (hz: number) =>
    Math.log(nyquist / Math.max(hz, freqMin)) / logRatio;

  const visibleGrid = FREQ_GRID.filter((hz) => hz <= nyquist);

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <div>
            <div className={s.headerTitle}>Спектрограмма</div>
            <div className={s.headerSub}>{file.name}</div>
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <div className={s.body}>
          {stage === "computing" && (
            <div className={s.progressWrap}>
              <p className={s.idleText}>
                Анализ покажет реальный частотный диапазон — можно выявить «fake hi-res» FLAC,
                поднятый с CD или lossy-источника.
              </p>
              <div className={s.progressTrack}>
                <div className={s.progressFill} style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <span className={s.progressLabel}>{Math.round(progress * 100)}%</span>
            </div>
          )}

          {stage === "error" && (
            <div className={s.errMsg}>{errMsg || "Не удалось проанализировать файл"}</div>
          )}

          {stage === "done" && result && (
            <>
              <div className={s.spectroRow}>
                {/* Y axis labels */}
                <div className={s.yAxis}>
                  {visibleGrid.map((hz) => (
                    <span
                      key={hz}
                      className={s.freqLabel}
                      style={{ top: `${freqToFrac(hz) * 100}%` }}
                    >
                      {fmtFreq(hz)}
                    </span>
                  ))}
                </div>

                <div className={s.canvasWrap}>
                  <canvas ref={canvasRef} className={s.canvas} />
                </div>
              </div>

              {/* Colour scale legend */}
              <div className={s.legend}>
                <span className={s.legendLabel}>тихо</span>
                <div className={s.legendGrad} />
                <span className={s.legendLabel}>громко</span>
              </div>

              <div className={s.infoRow}>
                <span className={s.techInfo}>
                  {fmtTime(result.durationSec)} · {sampleRate / 1000} кГц · FFT {FFT_SIZE} · {NUM_BINS} bins
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
