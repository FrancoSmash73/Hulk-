"use client";

import React from "react";
import type { CallLogEntry } from "@/lib/useSIP";

interface CallLogProps {
  entries: CallLogEntry[];
  onCallBack: (number: string) => void;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function CallLog({ entries, onCallBack }: CallLogProps) {
  if (entries.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 gap-3"
        style={{ color: "#374151" }}
      >
        <div className="text-4xl opacity-30">📋</div>
        <div className="text-sm font-bold tracking-widest">NO CALL HISTORY</div>
        <div className="text-xs">Calls will appear here</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto max-h-80">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-xl px-3 py-3 flex items-center gap-3 group transition-all"
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid #1f2937",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor =
              entry.direction === "inbound"
                ? "var(--hulk-green)"
                : "var(--hulk-purple-light)";
            (e.currentTarget as HTMLDivElement).style.background =
              "rgba(0,0,0,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "#1f2937";
            (e.currentTarget as HTMLDivElement).style.background =
              "rgba(0,0,0,0.3)";
          }}
        >
          {/* Direction Icon */}
          <div
            className="text-lg flex-shrink-0"
            title={entry.direction === "inbound" ? "Inbound" : "Outbound"}
          >
            {entry.direction === "inbound" ? (
              <span style={{ color: "var(--hulk-green)" }}>📥</span>
            ) : (
              <span style={{ color: "var(--hulk-purple-light)" }}>📤</span>
            )}
          </div>

          {/* Call Info */}
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-bold truncate"
              style={{ color: "#e2e8f0" }}
            >
              {entry.name || entry.number}
            </div>
            {entry.name && (
              <div className="text-xs truncate" style={{ color: "#8aa0bb" }}>
                {entry.number}
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: "#7090a8" }}>
                {formatDate(entry.timestamp)} {formatTime(entry.timestamp)}
              </span>
              {entry.duration > 0 && (
                <>
                  <span style={{ color: "#374151" }}>·</span>
                  <span className="text-xs" style={{ color: "#7090a8" }}>
                    {formatDuration(entry.duration)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Disposition Badge */}
          {entry.disposition && (
            <div
              className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: "rgba(123,45,139,0.2)",
                border: "1px solid #4a0e5c",
                color: "var(--hulk-purple-light)",
              }}
            >
              {entry.disposition}
            </div>
          )}

          {/* Callback Button */}
          <button
            onClick={() => onCallBack(entry.number)}
            className="flex-shrink-0 rounded-lg px-2 py-1.5 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all"
            style={{
              background: "rgba(0,204,51,0.15)",
              border: "1px solid var(--hulk-green-dark)",
              color: "var(--hulk-green)",
            }}
            title="Call back"
          >
            📞
          </button>
        </div>
      ))}
    </div>
  );
}
