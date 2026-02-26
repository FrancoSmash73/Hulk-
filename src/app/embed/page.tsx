import type { Metadata } from "next";
import EmbedPhone from "./EmbedPhone";

export const metadata: Metadata = {
  title: "HulkPhone - ViciDial WebPhone",
  description: "Hulk-themed WebRTC softphone for ViciDial AGC",
};

/**
 * Embed page - designed to be loaded in an iframe within the ViciDial AGC page.
 *
 * Usage in ViciDial AGC page:
 * <iframe src="https://your-hulkphone-server/embed" width="380" height="650" frameborder="0"></iframe>
 *
 * Or as a floating widget via the integration script.
 */
export default function EmbedPage() {
  return (
    <div
      style={{
        background: "transparent",
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "8px",
      }}
    >
      <EmbedPhone />
    </div>
  );
}
