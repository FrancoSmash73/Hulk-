"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useSIP } from "@/lib/useSIP";
import type { SIPConfig } from "@/lib/useSIP";
import type { ViciDialConfig } from "@/lib/useViciDial";
import Keypad from "./Keypad";
import CallControls from "./CallControls";
import AgentStatusPanel from "./AgentStatus";
import CallLog from "./CallLog";
import SettingsPanel from "./SettingsPanel";

type Tab = "phone" | "keypad" | "log" | "settings";

interface WebPhoneProps {
  /** Initial SIP config to use (e.g., from ViciDial URL params) */
  initialSIPConfig?: Partial<SIPConfig>;
}

const DEFAULT_SIP_CONFIG: SIPConfig = {
  server: "",
  port: "8089",
  username: "",
  password: "",
  extension: "",
  realm: "",
  useWSS: true,
  wsPath: "/ws",
  stunServer: "stun:stun.l.google.com:19302",
};

const DEFAULT_VICI_CONFIG: ViciDialConfig = {
  serverUrl: "",
  agentUser: "",
  agentPass: "",
  campaign: "",
  phone: "",
  phoneLogin: "",
  phonePass: "",
};

export default function WebPhone({ initialSIPConfig }: WebPhoneProps) {
  const [activeTab, setActiveTab] = useState<Tab>("phone");
  const [dialNumber, setDialNumber] = useState("");
  const [sipConfig, setSIPConfig] = useState<SIPConfig>(() => {
    // Merge initial config with defaults
    if (initialSIPConfig) {
      return { ...DEFAULT_SIP_CONFIG, ...initialSIPConfig };
    }
    return DEFAULT_SIP_CONFIG;
  });
  const [viciConfig, setViciConfig] = useState<ViciDialConfig>(DEFAULT_VICI_CONFIG);
  const [isMinimized, setIsMinimized] = useState(false);
  const [powerOn, setPowerOn] = useState(false);

  const sip = useSIP();
  const hasAutoRegistered = React.useRef(false);

  // Auto-register when initialSIPConfig is provided (run once on mount)
  useEffect(() => {
    // Skip if already registered or no initial config
    if (hasAutoRegistered.current) return;
    if (!initialSIPConfig?.server || !initialSIPConfig?.username) return;
    
    hasAutoRegistered.current = true;
    
    // Small delay to ensure SIP hook is ready
    const timer = setTimeout(() => {
      sip.register(sipConfig);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [initialSIPConfig, sip, sipConfig]);

  // Power-on animation
  useEffect(() => {
    const timer = setTimeout(() => setPowerOn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRegister = useCallback(() => {
    if (sipConfig.server && sipConfig.username) {
      sip.register(sipConfig);
    }
  }, [sip, sipConfig]);

  const handleDial = useCallback(() => {
    const number = dialNumber.trim();
    if (number && sip.isRegistered) {
      sip.makeCall(number);
      setDialNumber("");
    }
  }, [dialNumber, sip]);

  const handleKeypadDigit = useCallback(
    (digit: string) => {
      if (
        sip.callState === "connected" ||
        sip.callState === "on_hold"
      ) {
        sip.sendDTMF(digit);
      } else {
        setDialNumber((prev) => prev + digit);
      }
    },
    [sip]
  );

  const handleCallBack = useCallback(
    (number: string) => {
      setDialNumber(number);
      setActiveTab("phone");
    },
    []
  );

  const isInCall =
    sip.callState === "connected" ||
    sip.callState === "on_hold" ||
    sip.callState === "calling" ||
    sip.callState === "ringing";

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "phone", label: "PHONE", icon: "📞" },
    { id: "keypad", label: "PAD", icon: "🔢" },
    { id: "log", label: "LOG", icon: "📋" },
    { id: "settings", label: "CFG", icon: "⚙️" },
  ];

  return (
    <div
      className={`flex flex-col energy-bg crt-overlay flicker ${powerOn ? "power-on" : "opacity-0"}`}
      style={{
        width: "340px",
        minHeight: isMinimized ? "auto" : "600px",
        maxHeight: "90vh",
        borderRadius: "24px",
        overflow: "hidden",
        border: "1px solid #2d3f55",
        boxShadow:
          "0 0 40px rgba(0,255,65,0.15), 0 0 80px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.5)",
        fontFamily: "'Courier New', monospace",
        position: "relative",
        color: "#f0f6ff",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{
          background:
            "linear-gradient(135deg, #0a0a0f 0%, #0d1a0d 50%, #0a0a0f 100%)",
          borderBottom: "1px solid #1f2937",
          position: "relative",
        }}
      >
        {/* Anime-style top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, var(--hulk-green), var(--hulk-purple-light), var(--hulk-green), transparent)",
          }}
        />

        {/* Logo / Title */}
        <div className="flex items-center gap-2">
          <div
            className="text-2xl"
            style={{
              filter: "drop-shadow(0 0 8px var(--hulk-green))",
              animation: "hulk-pulse 3s infinite",
            }}
          >
            ☎
          </div>
          <div>
            <div
              className="text-sm font-black tracking-widest text-glow-green"
              style={{ color: "var(--hulk-green)", lineHeight: 1 }}
            >
              HULK PHONE
            </div>
            <div
              className="text-[9px] tracking-widest font-bold"
              style={{ color: "#6b8aaa" }}
            >
              VICIDIAL WEBPHONE
            </div>
          </div>
        </div>

        {/* Status + Controls */}
        <div className="flex items-center gap-2">
          {/* SIP Status Indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid #1f2937",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background:
                  sip.callState === "registered" ||
                  sip.callState === "connected" ||
                  sip.callState === "on_hold"
                    ? "var(--hulk-green)"
                    : sip.callState === "registering"
                    ? "#ffaa00"
                    : sip.callState === "error"
                    ? "var(--hulk-rage)"
                    : "#374151",
                boxShadow:
                  sip.isRegistered
                    ? "0 0 4px var(--hulk-green)"
                    : "none",
                animation: sip.callState === "registering"
                  ? "ring-pulse 0.5s infinite"
                  : sip.isRegistered
                  ? "hulk-pulse 3s infinite"
                  : "none",
              }}
            />
            <span
              className="text-[9px] font-bold tracking-wider"
              style={{
                color: sip.isRegistered ? "var(--hulk-green)" : "#6b8aaa",
              }}
            >
              SIP
            </span>
          </div>

          {/* Minimize */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-xs px-2 py-1 rounded transition-all"
            style={{ color: "#6b7280" }}
          >
            {isMinimized ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Agent Status Bar */}
          <div className="px-3 pt-3 flex-shrink-0">
            <AgentStatusPanel
              agentStatus={sip.agentStatus}
              isRegistered={sip.isRegistered}
              onPause={sip.setAgentStatus.bind(null, "paused")}
              onResume={() => sip.setAgentStatus("ready")}
              onSetStatus={sip.setAgentStatus}
              currentCall={sip.currentCall}
              incomingCallInfo={sip.incomingCallInfo}
            />
          </div>

          {/* Error Message */}
          {sip.errorMessage && (
            <div
              className="mx-3 mt-2 rounded-lg px-3 py-2 text-xs flex items-center gap-2 flex-shrink-0"
              style={{
                background: "rgba(255,69,0,0.1)",
                border: "1px solid var(--hulk-rage)",
                color: "#fca5a5",
              }}
            >
              <span>⚠️</span>
              <span className="flex-1">{sip.errorMessage}</span>
              <button
                onClick={() => {}}
                style={{ color: "var(--hulk-rage)" }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div
            className="flex mx-3 mt-3 rounded-xl overflow-hidden flex-shrink-0"
            style={{ border: "1px solid #2d3f55" }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-2 flex flex-col items-center gap-0.5 transition-all text-xs font-bold"
                style={{
                  background:
                    activeTab === tab.id
                      ? "rgba(0,255,65,0.12)"
                      : "rgba(0,0,0,0.3)",
                  color:
                    activeTab === tab.id
                      ? "var(--hulk-green)"
                      : "#8aa0bb",
                  borderBottom:
                    activeTab === tab.id
                      ? "2px solid var(--hulk-green)"
                      : "2px solid transparent",
                  textShadow:
                    activeTab === tab.id
                      ? "0 0 6px var(--hulk-green)"
                      : "none",
                }}
              >
                <span>{tab.icon}</span>
                <span className="text-[9px] tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {/* Phone Tab */}
            {activeTab === "phone" && (
              <div className="flex flex-col gap-3">
                {/* Dial Input */}
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={dialNumber}
                    onChange={(e) => setDialNumber(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDial()}
                    placeholder={
                      sip.isRegistered
                        ? "Enter number to dial..."
                        : "Configure SIP first..."
                    }
                    className="hulk-input flex-1 rounded-xl px-4 py-3 text-lg font-mono"
                    disabled={!sip.isRegistered || isInCall}
                  />
                  {dialNumber && (
                    <button
                      onClick={() => setDialNumber("")}
                      className="rounded-xl px-3 text-sm"
                      style={{
                        background: "rgba(255,69,0,0.1)",
                        border: "1px solid #4a0e5c",
                        color: "var(--hulk-rage)",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dial Button */}
                {!isInCall && sip.isRegistered && (
                  <button
                    onClick={handleDial}
                    disabled={!dialNumber.trim()}
                    className="btn-hulk rounded-xl py-4 text-base font-black tracking-widest flex items-center justify-center gap-2"
                    style={{
                      opacity: dialNumber.trim() ? 1 : 0.4,
                      cursor: dialNumber.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    <span>📞</span>
                    <span>SMASH DIAL</span>
                  </button>
                )}

                {/* Register Button (when not registered) */}
                {!sip.isRegistered &&
                  sip.callState !== "registering" && (
                    <button
                      onClick={handleRegister}
                      disabled={!sipConfig.server || !sipConfig.username}
                      className="btn-purple rounded-xl py-3 text-sm font-bold tracking-widest"
                      style={{
                        opacity:
                          sipConfig.server && sipConfig.username ? 1 : 0.4,
                      }}
                    >
                      ⚡ REGISTER SIP
                    </button>
                  )}

                {sip.callState === "registering" && (
                  <div
                    className="rounded-xl py-3 text-sm font-bold tracking-widest text-center"
                    style={{
                      background: "rgba(255,170,0,0.1)",
                      border: "1px solid #ffaa00",
                      color: "#ffaa00",
                      animation: "ring-pulse 0.8s infinite",
                    }}
                  >
                    ⚡ REGISTERING...
                  </div>
                )}

                {/* Call Controls */}
                {(isInCall || sip.callState === "ringing") && (
                  <CallControls
                    callState={sip.callState}
                    isMuted={sip.isMuted}
                    isOnHold={sip.isOnHold}
                    onAnswer={sip.answerCall}
                    onHangup={sip.hangupCall}
                    onHold={sip.holdCall}
                    onResume={sip.resumeCall}
                    onMute={sip.muteCall}
                    onUnmute={sip.unmuteCall}
                    onTransfer={sip.transferCall}
                    volume={sip.volume}
                    micVolume={sip.micVolume}
                    onVolumeChange={sip.setVolume}
                    onMicVolumeChange={sip.setMicVolume}
                  />
                )}

                {/* Volume Controls (when registered but not in call) */}
                {sip.isRegistered && !isInCall && (
                  <div
                    className="rounded-xl p-3 flex flex-col gap-3"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid #1f2937",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm" style={{ color: "#6b7280" }}>
                        🔊
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sip.volume}
                        onChange={(e) =>
                          sip.setVolume(Number(e.target.value))
                        }
                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, var(--hulk-green) ${sip.volume}%, #1f2937 ${sip.volume}%)`,
                        }}
                      />
                      <span
                        className="text-xs font-mono w-8 text-right"
                        style={{ color: "var(--hulk-green)" }}
                      >
                        {sip.volume}
                      </span>
                    </div>
                  </div>
                )}

                {/* Unregister */}
                {sip.isRegistered && !isInCall && (
                  <button
                    onClick={sip.unregister}
                    className="rounded-xl py-2 text-xs font-bold tracking-widest transition-all"
                    style={{
                      background: "rgba(255,69,0,0.05)",
                      border: "1px solid #2d1a1a",
                      color: "#6b7280",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "var(--hulk-rage)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--hulk-rage)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#6b7280";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "#2d1a1a";
                    }}
                  >
                    UNREGISTER
                  </button>
                )}
              </div>
            )}

            {/* Keypad Tab */}
            {activeTab === "keypad" && (
              <Keypad
                onDigit={handleKeypadDigit}
                dtmfBuffer={
                  isInCall ? sip.dtmfBuffer : dialNumber
                }
                onClear={() => {
                  if (isInCall) sip.clearDTMF();
                  else setDialNumber("");
                }}
                onBackspace={() => {
                  if (!isInCall) {
                    setDialNumber((prev) => prev.slice(0, -1));
                  }
                }}
                disabled={false}
              />
            )}

            {/* Call Log Tab */}
            {activeTab === "log" && (
              <CallLog
                entries={sip.callLog}
                onCallBack={handleCallBack}
              />
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <SettingsPanel
                sipConfig={sipConfig}
                viciConfig={viciConfig}
                onSIPConfigChange={setSIPConfig}
                onViciConfigChange={setViciConfig}
                onSave={handleRegister}
                isRegistered={sip.isRegistered}
                isViciConnected={false}
              />
            )}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2 flex items-center justify-between flex-shrink-0"
            style={{
              borderTop: "1px solid #2d3f55",
              background: "rgba(0,0,0,0.5)",
            }}
          >
            <div className="text-[9px] tracking-widest font-bold" style={{ color: "#4a6080" }}>
              HULKPHONE v1.0
            </div>
            <div className="flex items-center gap-2">
              {sip.callState === "connected" && (
                <div
                  className="text-[9px] font-bold tracking-widest"
                  style={{ color: "#ffcc00", textShadow: "0 0 6px #ffaa00" }}
                >
                  ● LIVE
                </div>
              )}
              <div
                className="text-[9px] tracking-widest font-bold"
                style={{ color: "#4a6080" }}
              >
                VICIDIAL AGC
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
