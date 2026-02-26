"use client";

import React, { useState } from "react";
import type { AgentStatus } from "@/lib/useSIP";

interface AgentStatusPanelProps {
  agentStatus: AgentStatus;
  isRegistered: boolean;
  onPause: (code?: string) => void;
  onResume: () => void;
  onSetStatus: (status: AgentStatus) => void;
  currentCall: {
    number: string;
    name?: string;
    direction: "inbound" | "outbound";
    duration?: number;
  } | null;
  incomingCallInfo: {
    number: string;
    name?: string;
  } | null;
}

const PAUSE_CODES = [
  { code: "PAUSE", label: "General Pause", icon: "⏸️" },
  { code: "BREAK", label: "Break", icon: "☕" },
  { code: "LUNCH", label: "Lunch", icon: "🍱" },
  { code: "MEETING", label: "Meeting", icon: "📋" },
  { code: "TRAINING", label: "Training", icon: "📚" },
  { code: "ADMIN", label: "Admin Work", icon: "💼" },
];

function formatDuration(seconds?: number): string {
  if (!seconds) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getStatusColor(status: AgentStatus): string {
  switch (status) {
    case "ready":
      return "var(--hulk-green)";
    case "incall":
      return "#ffaa00";
    case "paused":
      return "var(--hulk-purple-light)";
    case "wrapup":
      return "#00aaff";
    case "offline":
    default:
      return "var(--hulk-muted)";
  }
}

function getStatusLabel(status: AgentStatus): string {
  switch (status) {
    case "ready":
      return "READY";
    case "incall":
      return "IN CALL";
    case "paused":
      return "PAUSED";
    case "wrapup":
      return "WRAP-UP";
    case "offline":
    default:
      return "OFFLINE";
  }
}

export default function AgentStatusPanel({
  agentStatus,
  isRegistered,
  onPause,
  onResume,
  currentCall,
  incomingCallInfo,
}: AgentStatusPanelProps) {
  const [showPauseCodes, setShowPauseCodes] = useState(false);

  const statusColor = getStatusColor(agentStatus);
  const statusLabel = getStatusLabel(agentStatus);

  return (
    <div className="flex flex-col gap-3">
      {/* Status Header */}
      <div
        className="rounded-xl p-4 flex items-center justify-between"
        style={{
          background: "rgba(0,0,0,0.5)",
          border: `1px solid ${statusColor}`,
          boxShadow: `0 0 10px ${statusColor}33`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="status-dot"
            style={{
              background: statusColor,
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              boxShadow: `0 0 6px ${statusColor}`,
              animation:
                agentStatus === "ready"
                  ? "hulk-pulse 2s infinite"
                  : agentStatus === "incall"
                  ? "ring-pulse 0.8s infinite"
                  : "none",
            }}
          />
          <div>
            <div
              className="text-xs font-black tracking-widest"
              style={{
                color: statusColor,
                textShadow: `0 0 6px ${statusColor}88, 0 0 12px ${statusColor}44`,
              }}
            >
              {statusLabel}
            </div>
            {!isRegistered && (
              <div className="text-xs font-bold" style={{ color: "#8aa0bb" }}>
                SIP Unregistered
              </div>
            )}
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex gap-2">
          {agentStatus === "ready" && (
            <button
              onClick={() => setShowPauseCodes(!showPauseCodes)}
              className="btn-purple rounded-lg px-3 py-1.5 text-xs font-bold"
            >
              PAUSE
            </button>
          )}
          {agentStatus === "paused" && (
            <button
              onClick={onResume}
              className="btn-hulk rounded-lg px-3 py-1.5 text-xs font-bold"
            >
              RESUME
            </button>
          )}
          {agentStatus === "wrapup" && (
            <button
              onClick={onResume}
              className="btn-hulk rounded-lg px-3 py-1.5 text-xs font-bold"
              style={{ animation: "hulk-pulse 1s infinite" }}
            >
              READY
            </button>
          )}
        </div>
      </div>

      {/* Pause Code Selector */}
      {showPauseCodes && (
        <div
          className="rounded-xl p-3 grid grid-cols-2 gap-2"
          style={{
            background: "rgba(123,45,139,0.1)",
            border: "1px solid var(--hulk-purple)",
            animation: "fade-in-up 0.2s ease",
          }}
        >
          <div
            className="col-span-2 text-xs font-black tracking-widest mb-1"
            style={{ color: "var(--hulk-purple-light)", textShadow: "0 0 8px var(--hulk-purple-light)" }}
          >
            SELECT PAUSE REASON
          </div>
          {PAUSE_CODES.map(({ code, label, icon }) => (
            <button
              key={code}
              onClick={() => {
                onPause(code);
                setShowPauseCodes(false);
              }}
              className="rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-2 transition-all"
              style={{
                background: "rgba(123,45,139,0.25)",
                border: "1px solid #6a2e8c",
                color: "#e8d0ff",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(150,60,180,0.4)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--hulk-purple-light)";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(123,45,139,0.25)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#6a2e8c";
                (e.currentTarget as HTMLButtonElement).style.color = "#e8d0ff";
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Incoming Call Alert */}
      {incomingCallInfo && (
        <div
          className="rounded-xl p-4 flex flex-col gap-2"
          style={{
            background: "rgba(0,204,51,0.1)",
            border: "2px solid var(--hulk-green)",
            animation: "hulk-pulse 0.5s infinite",
          }}
        >
          <div
            className="text-xs font-black tracking-widest text-glow-green"
          >
            ⚡ INCOMING CALL
          </div>
          <div className="text-lg font-black" style={{ color: "#fff", textShadow: "0 0 10px rgba(255,255,255,0.3)" }}>
            {incomingCallInfo.name || incomingCallInfo.number}
          </div>
          {incomingCallInfo.name && (
            <div className="text-sm font-bold" style={{ color: "#c0d0e0" }}>
              {incomingCallInfo.number}
            </div>
          )}
        </div>
      )}

      {/* Active Call Info */}
      {currentCall && !incomingCallInfo && (
        <div
          className="rounded-xl p-4 flex flex-col gap-2"
          style={{
            background: "rgba(255,170,0,0.08)",
            border: "1px solid #ffaa00",
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className="text-xs font-black tracking-widest"
              style={{ color: "#ffcc00", textShadow: "0 0 6px #ffaa00" }}
            >
              {currentCall.direction === "inbound" ? "📥 INBOUND" : "📤 OUTBOUND"}
            </div>
            <div
              className="text-sm font-mono font-black"
              style={{ color: "#ffcc00", textShadow: "0 0 8px #ffaa00" }}
            >
              {formatDuration(currentCall.duration)}
            </div>
          </div>
          <div className="text-base font-black" style={{ color: "#fff", textShadow: "0 0 8px rgba(255,255,255,0.2)" }}>
            {currentCall.name || currentCall.number}
          </div>
          {currentCall.name && (
            <div className="text-sm font-bold" style={{ color: "#c0d0e0" }}>
              {currentCall.number}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
