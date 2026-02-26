"use client";

import React, { useState } from "react";
import type { CallState } from "@/lib/useSIP";

interface CallControlsProps {
  callState: CallState;
  isMuted: boolean;
  isOnHold: boolean;
  onAnswer: () => void;
  onHangup: () => void;
  onHold: () => void;
  onResume: () => void;
  onMute: () => void;
  onUnmute: () => void;
  onTransfer: (number: string) => void;
  volume: number;
  micVolume: number;
  onVolumeChange: (vol: number) => void;
  onMicVolumeChange: (vol: number) => void;
}

export default function CallControls({
  callState,
  isMuted,
  isOnHold,
  onAnswer,
  onHangup,
  onHold,
  onResume,
  onMute,
  onUnmute,
  onTransfer,
  volume,
  micVolume,
  onVolumeChange,
  onMicVolumeChange,
}: CallControlsProps) {
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferNumber, setTransferNumber] = useState("");

  const isInCall =
    callState === "connected" ||
    callState === "on_hold" ||
    callState === "calling";
  const isRinging = callState === "ringing";
  const isConnected = callState === "connected";

  const handleTransfer = () => {
    if (transferNumber.trim()) {
      onTransfer(transferNumber.trim());
      setTransferNumber("");
      setShowTransfer(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main Call Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Answer / Hangup */}
        {isRinging ? (
          <>
            <button
              onClick={onAnswer}
              className="btn-hulk rounded-xl py-4 flex flex-col items-center gap-1 font-bold text-sm"
              style={{ animation: "ring-pulse 0.5s infinite" }}
            >
              <span className="text-2xl">📞</span>
              <span>ANSWER</span>
            </button>
            <button
              onClick={onHangup}
              className="btn-rage rounded-xl py-4 flex flex-col items-center gap-1 font-bold text-sm"
            >
              <span className="text-2xl">📵</span>
              <span>REJECT</span>
            </button>
          </>
        ) : isInCall ? (
          <button
            onClick={onHangup}
            className="btn-rage rounded-xl py-4 flex flex-col items-center gap-1 font-bold text-sm col-span-2"
            style={{ animation: "hulk-rage-pulse 2s infinite" }}
          >
            <span className="text-2xl">📵</span>
            <span>SMASH CALL</span>
          </button>
        ) : null}
      </div>

      {/* In-Call Controls */}
      {isConnected && (
        <div className="grid grid-cols-3 gap-2">
          {/* Mute */}
          <button
            onClick={isMuted ? onUnmute : onMute}
            className={`rounded-xl py-3 flex flex-col items-center gap-1 text-xs font-bold transition-all ${
              isMuted ? "btn-rage" : "btn-purple"
            }`}
          >
            <span className="text-xl">{isMuted ? "🔇" : "🎤"}</span>
            <span>{isMuted ? "UNMUTE" : "MUTE"}</span>
          </button>

          {/* Hold */}
          <button
            onClick={isOnHold ? onResume : onHold}
            className={`rounded-xl py-3 flex flex-col items-center gap-1 text-xs font-bold transition-all ${
              isOnHold ? "btn-hulk" : "btn-purple"
            }`}
          >
            <span className="text-xl">{isOnHold ? "▶️" : "⏸️"}</span>
            <span>{isOnHold ? "RESUME" : "HOLD"}</span>
          </button>

          {/* Transfer */}
          <button
            onClick={() => setShowTransfer(!showTransfer)}
            className={`rounded-xl py-3 flex flex-col items-center gap-1 text-xs font-bold transition-all ${
              showTransfer ? "btn-hulk" : "btn-purple"
            }`}
          >
            <span className="text-xl">↗️</span>
            <span>XFER</span>
          </button>
        </div>
      )}

      {/* Transfer Panel */}
      {showTransfer && isConnected && (
        <div
          className="rounded-xl p-3 flex gap-2"
          style={{
            background: "rgba(123,45,139,0.15)",
            border: "1px solid var(--hulk-purple)",
            animation: "fade-in-up 0.2s ease",
          }}
        >
          <input
            type="tel"
            value={transferNumber}
            onChange={(e) => setTransferNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTransfer()}
            placeholder="Transfer to..."
            className="hulk-input flex-1 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={handleTransfer}
            className="btn-purple rounded-lg px-4 py-2 text-sm font-bold"
          >
            GO
          </button>
        </div>
      )}

      {/* Volume Controls */}
      <div
        className="rounded-xl p-3 flex flex-col gap-3"
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid #1f2937",
        }}
      >
        {/* Speaker Volume */}
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: "#6b7280", minWidth: "20px" }}>
            🔊
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--hulk-green) ${volume}%, #1f2937 ${volume}%)`,
              accentColor: "var(--hulk-green)",
            }}
          />
          <span
            className="text-xs font-mono w-8 text-right"
            style={{ color: "var(--hulk-green)" }}
          >
            {volume}
          </span>
        </div>

        {/* Mic Volume */}
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: "#6b7280", minWidth: "20px" }}>
            🎤
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={micVolume}
            onChange={(e) => onMicVolumeChange(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--hulk-purple-light) ${micVolume}%, #1f2937 ${micVolume}%)`,
              accentColor: "var(--hulk-purple-light)",
            }}
          />
          <span
            className="text-xs font-mono w-8 text-right"
            style={{ color: "var(--hulk-purple-light)" }}
          >
            {micVolume}
          </span>
        </div>
      </div>
    </div>
  );
}
