"use client";

import React, { useEffect, useCallback } from "react";
import WebPhone from "@/components/phone/WebPhone";

/**
 * EmbedPhone - Client component that handles postMessage communication
 * with the parent ViciDial AGC page.
 *
 * Listens for messages from the parent frame to:
 * - Auto-dial numbers when ViciDial dials a lead
 * - Receive agent status updates
 * - Send call events back to the parent
 *
 * Security: Only accepts messages from trusted origins (configured via env).
 */
export default function EmbedPhone() {
  const handleMessage = useCallback((event: MessageEvent) => {
    // Security: Validate origin
    // In production, set NEXT_PUBLIC_VICIDIAL_ORIGIN env var
    const trustedOrigin = process.env.NEXT_PUBLIC_VICIDIAL_ORIGIN;
    if (trustedOrigin && event.origin !== trustedOrigin) {
      return;
    }

    const data = event.data as {
      type?: string;
      payload?: Record<string, string>;
    };

    if (!data || typeof data !== "object") return;

    switch (data.type) {
      case "VICIDIAL_DIAL":
        // ViciDial is dialing a lead - auto-populate the number
        if (data.payload?.phone) {
          window.dispatchEvent(
            new CustomEvent("hulkphone:autodial", {
              detail: { number: data.payload.phone },
            })
          );
        }
        break;

      case "VICIDIAL_HANGUP":
        // ViciDial hung up
        window.dispatchEvent(new CustomEvent("hulkphone:hangup"));
        break;

      case "VICIDIAL_STATUS":
        // Agent status update from ViciDial
        if (data.payload?.status) {
          window.dispatchEvent(
            new CustomEvent("hulkphone:status", {
              detail: { status: data.payload.status },
            })
          );
        }
        break;

      default:
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);

    // Notify parent that HulkPhone is ready
    if (window.parent !== window) {
      window.parent.postMessage({ type: "HULKPHONE_READY" }, "*");
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleMessage]);

  return <WebPhone />;
}
