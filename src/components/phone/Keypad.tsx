"use client";

import React, { useCallback } from "react";

interface KeypadProps {
  onDigit: (digit: string) => void;
  dtmfBuffer: string;
  onClear: () => void;
  onBackspace: () => void;
  disabled?: boolean;
}

const KEYS = [
  { digit: "1", sub: "" },
  { digit: "2", sub: "ABC" },
  { digit: "3", sub: "DEF" },
  { digit: "4", sub: "GHI" },
  { digit: "5", sub: "JKL" },
  { digit: "6", sub: "MNO" },
  { digit: "7", sub: "PQRS" },
  { digit: "8", sub: "TUV" },
  { digit: "9", sub: "WXYZ" },
  { digit: "*", sub: "" },
  { digit: "0", sub: "+" },
  { digit: "#", sub: "" },
];

export default function Keypad({
  onDigit,
  dtmfBuffer,
  onClear,
  onBackspace,
  disabled = false,
}: KeypadProps) {
  const handleKey = useCallback(
    (digit: string) => {
      if (!disabled) {
        onDigit(digit);
        // Play DTMF tone feedback (visual only - audio handled by SIP stack)
      }
    },
    [disabled, onDigit]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* DTMF Display */}
      <div
        className="hulk-input rounded-lg px-4 py-3 text-center font-mono text-xl tracking-widest min-h-[52px] flex items-center justify-between"
        style={{
          background: "rgba(0,0,0,0.7)",
          border: "1px solid #1f2937",
          color: "var(--hulk-green)",
        }}
      >
        <span className="flex-1 text-center overflow-hidden text-ellipsis">
          {dtmfBuffer || (
            <span style={{ color: "#374151" }}>Enter digits...</span>
          )}
        </span>
        <div className="flex gap-1 ml-2">
          {dtmfBuffer && (
            <>
              <button
                onClick={onBackspace}
                className="text-xs px-2 py-1 rounded transition-all"
                style={{
                  color: "#6b7280",
                  background: "rgba(255,255,255,0.05)",
                }}
                title="Backspace"
              >
                ⌫
              </button>
              <button
                onClick={onClear}
                className="text-xs px-2 py-1 rounded transition-all"
                style={{
                  color: "var(--hulk-rage)",
                  background: "rgba(255,69,0,0.1)",
                }}
                title="Clear"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* Key Grid */}
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map(({ digit, sub }) => (
          <button
            key={digit}
            onClick={() => handleKey(digit)}
            disabled={disabled}
            className="keypad-btn rounded-xl py-4 flex flex-col items-center justify-center gap-0.5 select-none"
            style={{
              minHeight: "64px",
              opacity: disabled ? 0.4 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <span
              className="text-2xl font-bold leading-none"
              style={{ color: "var(--hulk-green)" }}
            >
              {digit}
            </span>
            {sub && (
              <span
                className="text-[9px] tracking-widest leading-none"
                style={{ color: "#4b5563" }}
              >
                {sub}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
