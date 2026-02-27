"use client";

import React, { useEffect, useCallback } from "react";
import WebPhone from "@/components/phone/WebPhone";
import type { SIPConfig } from "@/lib/useSIP";

/**
 * EmbedPhone - Client component that handles postMessage communication
 * with the parent ViciDial AGC page.
 *
 * Listens for messages from the parent frame to:
 * - Auto-dial numbers when ViciDial dials a lead
 * - Receive agent status updates
 * - Send call events back to the parent
 *
 * Also parses ViciDial URL parameters to auto-configure SIP:
 * - phone_login: SIP username/extension
 * - phone_pass: SIP password
 * - server_ip: SIP server hostname
 * - port: SIP port (default 8089)
 * - protocol: "wss" or "ws" (default wss)
 * - extension: alias for phone_login
 *
 * URL params can be base64 encoded (ViciDial standard) or plain text.
 *
 * Security: Only accepts messages from trusted origins (configured via env).
 */
export default function EmbedPhone() {
  // Parse ViciDial URL parameters on initial render
  // Using useState with initializer function to avoid lint issues
  const [initialSIPConfig, setInitialSIPConfig] = React.useState<Partial<SIPConfig> | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    
    const params = new URLSearchParams(window.location.search);
    
    // Check for ViciDial params (can be base64 encoded or plain)
    const phoneLogin = params.get("phone_login") || params.get("extension");
    const phonePass = params.get("phone_pass") || params.get("pass");
    const serverIp = params.get("server_ip") || params.get("server");
    const port = params.get("port");
    const protocol = params.get("protocol") || "wss";
    const realm = params.get("realm");
    
    // Base64 decode function
    const decodeParam = (value: string | null): string => {
      if (!value) return "";
      try {
        // Try base64 decode first
        const decoded = atob(value);
        // Check if it looks like valid decoded text (not binary)
        if (/^[\x20-\x7E]+$/.test(decoded)) {
          return decoded;
        }
        return value;
      } catch {
        // Not base64, return as-is
        return value;
      }
    };
    
    const decodedPhoneLogin = decodeParam(phoneLogin);
    const decodedPhonePass = decodeParam(phonePass);
    const decodedServerIp = decodeParam(serverIp);
    const decodedRealm = decodeParam(realm);
    
    // Only return config if we have the minimum required params
    if (decodedPhoneLogin && decodedPhonePass && decodedServerIp) {
      const useWSS = protocol.toLowerCase() === "wss";
      
      console.log("[HulkPhone] Auto-configured from URL params:", {
        server: decodedServerIp,
        port: port || "8089",
        username: decodedPhoneLogin,
        useWSS,
      });
      
      return {
        server: decodedServerIp,
        port: port || "8089",
        username: decodedPhoneLogin,
        password: decodedPhonePass,
        extension: decodedPhoneLogin,
        realm: decodedRealm || decodedServerIp,
        useWSS,
        wsPath: useWSS ? "/ws" : "/ws",
      };
    }
    
    return undefined;
  });

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

  // Set up postMessage listener
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

  return <WebPhone initialSIPConfig={initialSIPConfig} />;
}
