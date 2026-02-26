"use client";

import dynamic from "next/dynamic";

// Dynamically import WebPhone to avoid SSR issues with browser APIs
const WebPhone = dynamic(() => import("./WebPhone"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "360px",
        height: "600px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, #0a0a0f, #0d1117)",
        border: "1px solid #1f2937",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          fontSize: "40px",
          filter: "drop-shadow(0 0 10px #00ff41)",
          animation: "hulk-pulse 1s infinite",
        }}
      >
        ☎
      </div>
      <div
        style={{
          color: "#00ff41",
          fontSize: "12px",
          fontFamily: "monospace",
          letterSpacing: "0.2em",
          fontWeight: "bold",
        }}
      >
        LOADING...
      </div>
    </div>
  ),
});

export default function WebPhoneWrapper() {
  return <WebPhone />;
}
