import type { Metadata } from "next";
import Link from "next/link";
import WebPhoneWrapper from "@/components/phone/WebPhoneWrapper";

export const metadata: Metadata = {
  title: "HulkPhone - ViciDial WebPhone",
  description:
    "Hulk-themed WebRTC softphone for ViciDial AGC. Anime-style UI with SIP/WebRTC integration.",
};

export default function Home() {
  return (
    <main
      className="min-h-screen energy-bg"
      style={{ color: "var(--hulk-text)" }}
    >
      {/* Anime-style background grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,255,65,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,65,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        className="relative z-10 flex flex-col lg:flex-row min-h-screen"
        style={{ gap: "0" }}
      >
        {/* Left Panel - Info */}
        <div
          className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16"
          style={{ maxWidth: "600px" }}
        >
          {/* Logo */}
          <div className="mb-8">
            <div
              className="text-6xl mb-4"
              style={{
                filter: "drop-shadow(0 0 20px var(--hulk-green))",
                animation: "hulk-pulse 3s infinite",
              }}
            >
              ☎
            </div>
            <h1
              className="text-5xl font-black tracking-widest mb-2 text-glow-green"
              style={{ color: "var(--hulk-green)", lineHeight: 1 }}
            >
              HULK
              <br />
              PHONE
            </h1>
            <div
              className="text-sm tracking-widest font-bold"
              style={{ color: "var(--hulk-purple-light)" }}
            >
              VICIDIAL WEBPHONE ⚡ ANIME EDITION
            </div>
          </div>

          {/* Description */}
          <p
            className="text-base mb-8 leading-relaxed"
            style={{ color: "#c0cfe0", maxWidth: "400px" }}
          >
            A clean, open-source WebRTC softphone built for ViciDial AGC agents.
            Hulk-smash your calls with style — no backdoors, no tracking, no
            nonsense.
          </p>

          {/* Feature List */}
          <div className="flex flex-col gap-3 mb-10">
            {[
              {
                icon: "⚡",
                title: "WebRTC / SIP",
                desc: "Full SIP over WebSocket with JsSIP",
                color: "var(--hulk-green)",
              },
              {
                icon: "🎯",
                title: "ViciDial AGC",
                desc: "Integrates with vicidial.php agent page",
                color: "var(--hulk-purple-light)",
              },
              {
                icon: "🔒",
                title: "Zero Backdoors",
                desc: "Open source, auditable, no telemetry",
                color: "#00aaff",
              },
              {
                icon: "🎨",
                title: "Anime / Hulk Theme",
                desc: "CRT effects, glow animations, rage mode",
                color: "#ffaa00",
              },
              {
                icon: "📞",
                title: "Full Call Controls",
                desc: "Hold, mute, transfer, DTMF, call log",
                color: "var(--hulk-green)",
              },
              {
                icon: "🔌",
                title: "Easy Integration",
                desc: "iframe embed or inject script",
                color: "var(--hulk-purple-light)",
              },
            ].map(({ icon, title, desc, color }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid #1f2937",
                }}
              >
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <div
                    className="text-sm font-bold"
                    style={{ color }}
                  >
                    {title}
                  </div>
                  <div className="text-xs" style={{ color: "#8aa0bb" }}>
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Integration Code */}
          <div
            className="rounded-xl p-4 mb-6"
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "1px solid #1f2937",
            }}
          >
            <div
              className="text-xs font-bold tracking-widest mb-3"
              style={{ color: "var(--hulk-green)" }}
            >
              INTEGRATION — ADD TO VICIDIAL AGC PAGE
            </div>
            <pre
              className="text-xs overflow-x-auto"
              style={{ color: "#9ca3af", fontFamily: "monospace" }}
            >
              {`<!-- Option 1: Inject Script -->
<script src="https://your-server/hulkphone-inject.js"></script>

<!-- Option 2: iframe Embed -->
<iframe
  src="https://your-server/embed"
  width="370"
  height="660"
  allow="microphone"
></iframe>`}
            </pre>
          </div>

          {/* Links */}
          <div className="flex gap-3">
            <Link
              href="/embed"
              className="btn-hulk rounded-xl px-6 py-3 text-sm font-bold tracking-widest inline-flex items-center gap-2"
            >
              <span>⚡</span>
              <span>LAUNCH PHONE</span>
            </Link>
            <a
              href="https://github.com/your-repo/hulkphone"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-purple rounded-xl px-6 py-3 text-sm font-bold tracking-widest inline-flex items-center gap-2"
            >
              <span>📦</span>
              <span>SOURCE CODE</span>
            </a>
          </div>
        </div>

        {/* Right Panel - Live Demo */}
        <div
          className="flex items-start justify-center px-8 py-12 lg:py-16"
          style={{
            borderLeft: "1px solid #1f2937",
            background: "rgba(0,0,0,0.3)",
            minWidth: "400px",
          }}
        >
          <div className="sticky top-8">
            <div
              className="text-xs font-bold tracking-widest mb-4 text-center"
              style={{ color: "#374151" }}
            >
              LIVE DEMO
            </div>
            <WebPhoneWrapper />
          </div>
        </div>
      </div>
    </main>
  );
}
