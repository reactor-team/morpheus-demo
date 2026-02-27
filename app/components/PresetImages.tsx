"use client";

import { useState, useCallback } from "react";
import { coverFit } from "../lib/image";

const CAPTURE_W = 640;
const CAPTURE_H = 360;

export interface Preset {
  src: string;
  label: string;
}

/**
 * Add preset images here. Each entry should point to a file in /public/presets/.
 * Example:
 *   { src: "/presets/face1.jpg", label: "Face 1" },
 */
export const PRESETS: Preset[] = [
  { src: "/presets/light.png", label: "Light Yagami" },
  { src: "/presets/joel.png", label: "Joel Miller" },
];

interface PresetImagesProps {
  onSelect: (imageBase64: string, presetSrc: string) => void;
  disabled: boolean;
  selectedSrc: string | null;
}

export function PresetImages({
  onSelect,
  disabled,
  selectedSrc,
}: PresetImagesProps) {
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

  const handleClick = useCallback(
    async (preset: Preset, idx: number) => {
      if (disabled || loadingIdx !== null) return;

      setLoadingIdx(idx);
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = preset.src;
        });

        const canvas = document.createElement("canvas");
        canvas.width = CAPTURE_W;
        canvas.height = CAPTURE_H;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");

        const { x, y, w, h } = coverFit(
          img.width,
          img.height,
          CAPTURE_W,
          CAPTURE_H,
        );

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, x, y, w, h, 0, 0, CAPTURE_W, CAPTURE_H);

        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        onSelect(base64, preset.src);
      } catch (error) {
        console.error("[Morpheus] Failed to load preset image:", error);
      } finally {
        setLoadingIdx(null);
      }
    },
    [disabled, loadingIdx, onSelect],
  );

  if (PRESETS.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-mono uppercase text-[#bdbdbd] tracking-widest">
        Presets
      </span>
      <div className="flex items-center justify-center gap-3 flex-wrap">
      {PRESETS.map((preset, idx) => {
        const isSelected = selectedSrc === preset.src;
        const isLoading = loadingIdx === idx;

        return (
          <button
            key={preset.src}
            onClick={() => handleClick(preset, idx)}
            disabled={disabled || loadingIdx !== null}
            className={`relative w-20 h-20 rounded overflow-hidden border-2 transition-all duration-200 ${
              isSelected
                ? "border-[#c7c099] ring-2 ring-[#c7c099]/40"
                : "border-white/10 hover:border-white/30"
            } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            title={preset.label}
          >
            <img
              src={preset.src}
              alt={preset.label}
              className="w-full h-full object-cover"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#c7c099] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
        );
      })}
      </div>
    </div>
  );
}
