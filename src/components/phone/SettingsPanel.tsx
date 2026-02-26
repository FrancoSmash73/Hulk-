"use client";

import React, { useState, useEffect } from "react";
import type { SIPConfig } from "@/lib/useSIP";
import type { ViciDialConfig } from "@/lib/useViciDial";

// Label style helper for consistent high-contrast labels
const labelStyle = { color: "#94a3b8" } as const;

interface SettingsPanelProps {
  sipConfig: SIPConfig;
  viciConfig: ViciDialConfig;
  onSIPConfigChange: (config: SIPConfig) => void;
  onViciConfigChange: (config: ViciDialConfig) => void;
  onSave: () => void;
  isRegistered: boolean;
  isViciConnected: boolean;
}

const STORAGE_KEY = "hulkphone_config";

export default function SettingsPanel({
  sipConfig,
  viciConfig,
  onSIPConfigChange,
  onViciConfigChange,
  onSave,
  isRegistered,
  isViciConnected,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<"sip" | "vicidial">("sip");
  const [localSIP, setLocalSIP] = useState<SIPConfig>(sipConfig);
  const [localVici, setLocalVici] = useState<ViciDialConfig>(viciConfig);
  const [showPasswords, setShowPasswords] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load saved config from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          sip?: SIPConfig;
          vici?: ViciDialConfig;
        };
        if (parsed.sip) {
          setLocalSIP(parsed.sip);
          onSIPConfigChange(parsed.sip);
        }
        if (parsed.vici) {
          setLocalVici(parsed.vici);
          onViciConfigChange(parsed.vici);
        }
      }
    } catch {
      // Ignore parse errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    onSIPConfigChange(localSIP);
    onViciConfigChange(localVici);
    // Save to localStorage (passwords stored locally only)
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sip: localSIP, vici: localVici })
      );
    } catch {
      // Ignore storage errors
    }
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass =
    "hulk-input w-full rounded-lg px-3 py-2 text-sm font-mono";

  return (
    <div className="flex flex-col gap-4">
      {/* Tab Selector */}
      <div
        className="flex rounded-xl overflow-hidden"
        style={{ border: "1px solid #1f2937" }}
      >
        {(["sip", "vicidial"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 text-xs font-bold tracking-widest uppercase transition-all"
            style={{
              background:
                activeTab === tab
                  ? tab === "sip"
                    ? "linear-gradient(135deg, #00cc33, #007722)"
                    : "linear-gradient(135deg, #7b2d8b, #4a0e5c)"
                  : "rgba(0,0,0,0.4)",
              color:
                activeTab === tab
                  ? tab === "sip"
                    ? "#000"
                    : "#fff"
                  : "#6b7280",
            }}
          >
            {tab === "sip" ? "⚡ SIP / WebRTC" : "🎯 ViciDial AGC"}
          </button>
        ))}
      </div>

      {/* SIP Settings */}
      {activeTab === "sip" && (
        <div className="flex flex-col gap-3">
          <div
            className="text-xs font-bold tracking-widest"
            style={{ color: "var(--hulk-green)" }}
          >
            SIP SERVER
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
                Server / Host
              </label>
              <input
                type="text"
                value={localSIP.server}
                onChange={(e) =>
                  setLocalSIP({ ...localSIP, server: e.target.value })
                }
                placeholder="sip.yourserver.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
                WS Port
              </label>
              <input
                type="text"
                value={localSIP.port}
                onChange={(e) =>
                  setLocalSIP({ ...localSIP, port: e.target.value })
                }
                placeholder="8089"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
                SIP Username
              </label>
              <input
                type="text"
                value={localSIP.username}
                onChange={(e) =>
                  setLocalSIP({ ...localSIP, username: e.target.value })
                }
                placeholder="1000"
                className={inputClass}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
                Extension
              </label>
              <input
                type="text"
                value={localSIP.extension}
                onChange={(e) =>
                  setLocalSIP({ ...localSIP, extension: e.target.value })
                }
                placeholder="1000"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
              SIP Password
            </label>
            <input
              type={showPasswords ? "text" : "password"}
              value={localSIP.password}
              onChange={(e) =>
                setLocalSIP({ ...localSIP, password: e.target.value })
              }
              placeholder="••••••••"
              className={inputClass}
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
              SIP Realm / Domain (optional)
            </label>
            <input
              type="text"
              value={localSIP.realm}
              onChange={(e) =>
                setLocalSIP({ ...localSIP, realm: e.target.value })
              }
              placeholder="Leave blank to use server"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
              STUN Server (optional)
            </label>
            <input
              type="text"
              value={localSIP.stunServer}
              onChange={(e) =>
                setLocalSIP({ ...localSIP, stunServer: e.target.value })
              }
              placeholder="stun:stun.l.google.com:19302"
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className="relative w-10 h-5 rounded-full transition-all"
                style={{
                  background: localSIP.useWSS
                    ? "var(--hulk-green-dark)"
                    : "#374151",
                }}
                onClick={() =>
                  setLocalSIP({ ...localSIP, useWSS: !localSIP.useWSS })
                }
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{
                    background: localSIP.useWSS ? "#000" : "#6b7280",
                    left: localSIP.useWSS ? "calc(100% - 18px)" : "2px",
                  }}
                />
              </div>
              <span className="text-xs" style={{ color: "#9ca3af" }}>
                Use WSS (Secure WebSocket)
              </span>
            </label>
          </div>

          {/* Connection Status */}
          <div
            className="rounded-lg px-3 py-2 flex items-center gap-2"
            style={{
              background: isRegistered
                ? "rgba(0,204,51,0.1)"
                : "rgba(0,0,0,0.3)",
              border: `1px solid ${isRegistered ? "var(--hulk-green-dark)" : "#1f2937"}`,
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: isRegistered
                  ? "var(--hulk-green)"
                  : "var(--hulk-muted)",
              }}
            />
            <span
              className="text-xs font-bold"
              style={{
                color: isRegistered ? "var(--hulk-green)" : "#6b7280",
              }}
            >
              {isRegistered ? "SIP REGISTERED" : "NOT REGISTERED"}
            </span>
          </div>
        </div>
      )}

      {/* ViciDial Settings */}
      {activeTab === "vicidial" && (
        <div className="flex flex-col gap-3">
          <div
            className="text-xs font-bold tracking-widest"
            style={{ color: "var(--hulk-purple-light)" }}
          >
            VICIDIAL AGC SERVER
          </div>

          <div>
            <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
              Server URL
            </label>
            <input
              type="url"
              value={localVici.serverUrl}
              onChange={(e) =>
                setLocalVici({ ...localVici, serverUrl: e.target.value })
              }
              placeholder="https://your-server/agc/vicidial.php"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
                Agent Username
              </label>
              <input
                type="text"
                value={localVici.agentUser}
                onChange={(e) =>
                  setLocalVici({ ...localVici, agentUser: e.target.value })
                }
                placeholder="agent1"
                className={inputClass}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
                Agent Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={localVici.agentPass}
                onChange={(e) =>
                  setLocalVici({ ...localVici, agentPass: e.target.value })
                }
                placeholder="••••••••"
                className={inputClass}
                autoComplete="current-password"
              />
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
              Campaign
            </label>
            <input
              type="text"
              value={localVici.campaign}
              onChange={(e) =>
                setLocalVici({ ...localVici, campaign: e.target.value })
              }
              placeholder="CAMPAIGN_ID"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
                Phone Login
              </label>
              <input
                type="text"
                value={localVici.phoneLogin}
                onChange={(e) =>
                  setLocalVici({ ...localVici, phoneLogin: e.target.value })
                }
                placeholder="8600"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
                Phone Pass
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={localVici.phonePass}
                onChange={(e) =>
                  setLocalVici({ ...localVici, phonePass: e.target.value })
                }
                placeholder="••••••••"
                className={inputClass}
                autoComplete="current-password"
              />
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block font-bold" style={{ color: "#94a3b8" }}>
              Phone Extension
            </label>
            <input
              type="text"
              value={localVici.phone}
              onChange={(e) =>
                setLocalVici({ ...localVici, phone: e.target.value })
              }
              placeholder="8600"
              className={inputClass}
            />
          </div>

          {/* ViciDial Connection Status */}
          <div
            className="rounded-lg px-3 py-2 flex items-center gap-2"
            style={{
              background: isViciConnected
                ? "rgba(123,45,139,0.15)"
                : "rgba(0,0,0,0.3)",
              border: `1px solid ${isViciConnected ? "var(--hulk-purple)" : "#1f2937"}`,
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: isViciConnected
                  ? "var(--hulk-purple-light)"
                  : "var(--hulk-muted)",
              }}
            />
            <span
              className="text-xs font-bold"
              style={{
                color: isViciConnected
                  ? "var(--hulk-purple-light)"
                  : "#6b7280",
              }}
            >
              {isViciConnected ? "VICIDIAL CONNECTED" : "NOT CONNECTED"}
            </span>
          </div>
        </div>
      )}

      {/* Show/Hide Passwords */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showPasswords}
          onChange={(e) => setShowPasswords(e.target.checked)}
          className="w-3 h-3"
          style={{ accentColor: "var(--hulk-green)" }}
        />
        <span className="text-xs" style={{ color: "#94a3b8" }}>
          Show passwords
        </span>
      </label>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="btn-hulk rounded-xl py-3 font-bold text-sm tracking-widest"
        style={
          saved
            ? {
                background: "linear-gradient(135deg, #00ff41, #00cc33)",
                animation: "none",
              }
            : {}
        }
      >
        {saved ? "✓ SAVED!" : "💾 SAVE CONFIG"}
      </button>

      {/* Security Notice */}
      <div
        className="rounded-lg p-3 text-xs"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid #1f2937",
          color: "#4b5563",
        }}
      >
        🔒 Credentials stored locally in your browser only. Never transmitted to
        third parties.
      </div>
    </div>
  );
}
