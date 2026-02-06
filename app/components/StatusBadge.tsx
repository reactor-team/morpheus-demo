"use client";

import type { ReactorStatus } from "@reactor-team/js-sdk";

const labels: Record<ReactorStatus, string> = {
  disconnected: "Disconnected",
  connecting: "Connecting...",
  waiting: "Waiting...",
  ready: "Connected",
};

export function StatusBadge({ status }: { status: ReactorStatus }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded transition-all duration-300 ${
        status === "disconnected"
          ? "bg-white/10 text-[#bdbdbd]"
          : status === "ready"
            ? "bg-[#c7c099] text-black"
            : "bg-[#555240] text-white"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          status === "disconnected"
            ? "bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.6)]"
            : status === "ready"
              ? "bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.8)]"
              : "bg-[#fdf5c6] animate-pulse"
        }`}
      />
      <span className="text-xs font-mono uppercase">{labels[status]}</span>
    </div>
  );
}
