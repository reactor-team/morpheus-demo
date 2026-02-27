"use client";

import { useState } from "react";
import { useStats } from "@reactor-team/js-sdk";

function fmt(value: number | undefined, unit: string, transform?: (v: number) => string): string {
  if (value === undefined || value === null) return "--";
  return transform ? `${transform(value)} ${unit}` : `${value} ${unit}`;
}

export function StatsPanel() {
  const stats = useStats();
  const [expanded, setExpanded] = useState(false);

  if (!stats) return null;

  const entries = [
    { label: "RTT", value: fmt(stats.rtt, "ms", (v) => v.toFixed(0)) },
    { label: "FPS", value: fmt(stats.framesPerSecond, "", (v) => v.toFixed(0)) },
    { label: "Candidate", value: stats.candidateType ?? "--" },
    {
      label: "Pkt Loss",
      value: fmt(stats.packetLossRatio, "%", (v) => (v * 100).toFixed(2)),
    },
    { label: "Jitter", value: fmt(stats.jitter, "ms", (v) => (v * 1000).toFixed(1)) },
    {
      label: "Bitrate",
      value: fmt(stats.availableOutgoingBitrate, "Mbps", (v) =>
        (v / 1_000_000).toFixed(1),
      ),
    },
  ];

  return (
    <div className="relative w-full max-w-4xl">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 bg-white/[0.04] text-xs font-mono uppercase text-[#bdbdbd] hover:text-white hover:bg-white/[0.08] transition-all"
      >
        <span
          className={`inline-block transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
        >
          &#9656;
        </span>
        Streaming Stats
      </button>
      {expanded && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded border border-white/10 bg-black/90 backdrop-blur-sm px-4 py-3">
          <div className="grid grid-cols-3 gap-x-6 gap-y-2">
            {entries.map((entry) => (
              <div key={entry.label} className="flex justify-between gap-2">
                <span className="text-xs font-mono uppercase text-[#bdbdbd]">
                  {entry.label}
                </span>
                <span className="text-xs font-mono text-white tabular-nums">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
