"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type CallState =
  | "idle"
  | "registering"
  | "registered"
  | "ringing"
  | "calling"
  | "connected"
  | "on_hold"
  | "error"
  | "unregistered";

export type AgentStatus =
  | "ready"
  | "paused"
  | "incall"
  | "wrapup"
  | "offline";

export interface SIPConfig {
  server: string;
  port: string;
  username: string;
  password: string;
  extension: string;
  realm: string;
  useWSS: boolean;
  wsPath: string; // WebSocket path (e.g., "/ws", "/sip", or "/")
  stunServer: string;
}

export interface CallInfo {
  number: string;
  name?: string;
  direction: "inbound" | "outbound";
  startTime?: Date;
  duration?: number;
  callId?: string;
}

export interface CallLogEntry {
  id: string;
  number: string;
  name?: string;
  direction: "inbound" | "outbound";
  duration: number;
  timestamp: Date;
  disposition?: string;
}

export interface SIPState {
  callState: CallState;
  agentStatus: AgentStatus;
  currentCall: CallInfo | null;
  callLog: CallLogEntry[];
  isMuted: boolean;
  isOnHold: boolean;
  volume: number;
  micVolume: number;
  dtmfBuffer: string;
  errorMessage: string | null;
  isRegistered: boolean;
  incomingCallInfo: CallInfo | null;
}

export interface SIPActions {
  register: (config: SIPConfig) => void;
  unregister: () => void;
  makeCall: (number: string) => void;
  answerCall: () => void;
  hangupCall: () => void;
  holdCall: () => void;
  resumeCall: () => void;
  muteCall: () => void;
  unmuteCall: () => void;
  sendDTMF: (digit: string) => void;
  transferCall: (number: string) => void;
  setVolume: (vol: number) => void;
  setMicVolume: (vol: number) => void;
  setAgentStatus: (status: AgentStatus) => void;
  clearDTMF: () => void;
}

// Safe JsSIP loader - only loads in browser, no external tracking
function loadJsSIP(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser"));
      return;
    }
    // Check if already loaded
    if ((window as unknown as Record<string, unknown>)["JsSIP"]) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    // Use a CDN-hosted version of JsSIP (open source, MIT license)
    script.src = "https://cdn.jsdelivr.net/npm/jssip@3.10.0/dist/jssip.min.js";
    script.integrity =
      "sha256-placeholder"; // In production, add actual SRI hash
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load JsSIP"));
    document.head.appendChild(script);
  });
}

export function useSIP(): SIPState & SIPActions {
  const [state, setState] = useState<SIPState>({
    callState: "idle",
    agentStatus: "offline",
    currentCall: null,
    callLog: [],
    isMuted: false,
    isOnHold: false,
    volume: 80,
    micVolume: 80,
    dtmfBuffer: "",
    errorMessage: null,
    isRegistered: false,
    incomingCallInfo: null,
  });

  const uaRef = useRef<unknown>(null);
  const sessionRef = useRef<unknown>(null);
  const configRef = useRef<SIPConfig | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartRef = useRef<Date | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize remote audio element
  useEffect(() => {
    if (typeof window !== "undefined") {
      remoteAudioRef.current = new Audio();
      remoteAudioRef.current.autoplay = true;
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, []);

  const updateState = useCallback((updates: Partial<SIPState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const startCallTimer = useCallback(() => {
    callStartRef.current = new Date();
    callTimerRef.current = setInterval(() => {
      if (callStartRef.current) {
        const duration = Math.floor(
          (Date.now() - callStartRef.current.getTime()) / 1000
        );
        setState((prev) => ({
          ...prev,
          currentCall: prev.currentCall
            ? { ...prev.currentCall, duration }
            : null,
        }));
      }
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, []);

  const addToCallLog = useCallback(
    (call: CallInfo, disposition?: string) => {
      const entry: CallLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        number: call.number,
        name: call.name,
        direction: call.direction,
        duration: call.duration || 0,
        timestamp: call.startTime || new Date(),
        disposition,
      };
      setState((prev) => ({
        ...prev,
        callLog: [entry, ...prev.callLog].slice(0, 50), // Keep last 50
      }));
    },
    []
  );

  const register = useCallback(
    async (config: SIPConfig) => {
      configRef.current = config;
      updateState({ callState: "registering", errorMessage: null });

      try {
        await loadJsSIP();
        const JsSIP = (window as unknown as Record<string, unknown>)[
          "JsSIP"
        ] as Record<string, unknown>;

        if (!JsSIP) {
          throw new Error("JsSIP not available");
        }

        // Disable JsSIP debug logging for security
        const debug = JsSIP["debug"] as { disable: (ns: string) => void };
        if (debug && typeof debug.disable === "function") {
          debug.disable("JsSIP:*");
        }

        const wsProtocol = config.useWSS ? "wss" : "ws";
        const wsPath = config.wsPath || "/ws";
        const wsUri = `${wsProtocol}://${config.server}:${config.port}${wsPath}`;

        const socket = new (
          JsSIP["WebSocketInterface"] as new (uri: string) => unknown
        )(wsUri);

        const uaConfig = {
          sockets: [socket],
          uri: `sip:${config.username}@${config.realm || config.server}`,
          password: config.password,
          display_name: config.extension || config.username,
          register: true,
          register_expires: 300,
          session_timers: false,
          use_preloaded_route: false,
          pcConfig: {
            iceServers: config.stunServer
              ? [{ urls: `stun:${config.stunServer}` }]
              : [],
          },
        };

        const UA = JsSIP["UA"] as new (config: unknown) => {
          on: (event: string, handler: (...args: unknown[]) => void) => void;
          start: () => void;
          stop: () => void;
          call: (
            target: string,
            options: unknown
          ) => unknown;
          isRegistered: () => boolean;
        };

        const ua = new UA(uaConfig);
        uaRef.current = ua;

        ua.on("registered", () => {
          updateState({
            callState: "registered",
            isRegistered: true,
            agentStatus: "ready",
            errorMessage: null,
          });
        });

        ua.on("unregistered", () => {
          updateState({
            callState: "unregistered",
            isRegistered: false,
            agentStatus: "offline",
          });
        });

        ua.on("registrationFailed", (data: unknown) => {
          const d = data as { cause?: string; response?: { status_code?: number } };
          updateState({
            callState: "error",
            isRegistered: false,
            errorMessage: `Registration failed: ${d?.cause || "Unknown error"} (${d?.response?.status_code || "?"})`,
          });
        });

        // Transport event handlers for WebSocket debugging
        ua.on("transport:connecting", () => {
          updateState({ callState: "registering", errorMessage: "Connecting to SIP server..." });
        });

        ua.on("transport:connected", () => {
          updateState({ errorMessage: "Transport connected, registering..." });
        });

        ua.on("transport:disconnected", (data: unknown) => {
          const d = data as { message?: string };
          updateState({ 
            callState: "error", 
            errorMessage: `Disconnected: ${d?.message || "Connection lost"}`,
            isRegistered: false,
            agentStatus: "offline"
          });
        });

        ua.on("transport:error", (data: unknown) => {
          const d = data as { message?: string };
          updateState({ 
            callState: "error", 
            errorMessage: `Transport error: ${d?.message || "Unknown error"}` 
          });
        });

        ua.on("newRTCSession", (data: unknown) => {
          const d = data as {
            session: {
              direction: string;
              remote_identity: { uri: { user: string }; display_name?: string };
              on: (event: string, handler: (...args: unknown[]) => void) => void;
              answer: (options: unknown) => void;
              terminate: () => void;
              hold: () => void;
              unhold: () => void;
              mute: (options?: unknown) => void;
              unmute: (options?: unknown) => void;
              sendDTMF: (tone: string) => void;
              connection: RTCPeerConnection;
            };
          };
          const session = d.session;
          sessionRef.current = session;

          const remoteNumber =
            session.remote_identity?.uri?.user || "Unknown";
          const remoteName =
            session.remote_identity?.display_name || undefined;

          const callInfo: CallInfo = {
            number: remoteNumber,
            name: remoteName,
            direction:
              session.direction === "incoming" ? "inbound" : "outbound",
            startTime: new Date(),
          };

          if (session.direction === "incoming") {
            updateState({
              callState: "ringing",
              incomingCallInfo: callInfo,
              currentCall: callInfo,
              agentStatus: "incall",
            });
          } else {
            updateState({
              callState: "calling",
              currentCall: callInfo,
              agentStatus: "incall",
            });
          }

          session.on("accepted", () => {
            updateState({
              callState: "connected",
              incomingCallInfo: null,
            });
            startCallTimer();
          });

          session.on("confirmed", () => {
            updateState({
              callState: "connected",
              incomingCallInfo: null,
            });
            if (!callStartRef.current) startCallTimer();

            // Attach remote audio stream
            if (session.connection) {
              session.connection.ontrack = (event: RTCTrackEvent) => {
                if (remoteAudioRef.current && event.streams[0]) {
                  remoteAudioRef.current.srcObject = event.streams[0];
                }
              };
            }
          });

          session.on("ended", (endData: unknown) => {
            const ed = endData as { cause?: string };
            stopCallTimer();
            const finalCall = {
              ...callInfo,
              duration: callStartRef.current
                ? Math.floor(
                    (Date.now() - callStartRef.current.getTime()) / 1000
                  )
                : 0,
            };
            addToCallLog(finalCall, ed?.cause);
            callStartRef.current = null;
            sessionRef.current = null;
            updateState({
              callState: "registered",
              currentCall: null,
              incomingCallInfo: null,
              isMuted: false,
              isOnHold: false,
              agentStatus: "wrapup",
            });
          });

          session.on("failed", (failData: unknown) => {
            const fd = failData as { cause?: string };
            stopCallTimer();
            callStartRef.current = null;
            sessionRef.current = null;
            updateState({
              callState: "registered",
              currentCall: null,
              incomingCallInfo: null,
              isMuted: false,
              isOnHold: false,
              agentStatus: "ready",
              errorMessage: `Call failed: ${fd?.cause || "Unknown"}`,
            });
          });
        });

        ua.start();
      } catch (err) {
        const error = err as Error;
        updateState({
          callState: "error",
          errorMessage: error.message || "Failed to initialize SIP",
        });
      }
    },
    [updateState, startCallTimer, stopCallTimer, addToCallLog]
  );

  const unregister = useCallback(() => {
    if (uaRef.current) {
      const ua = uaRef.current as { stop: () => void };
      ua.stop();
      uaRef.current = null;
    }
    updateState({
      callState: "idle",
      isRegistered: false,
      agentStatus: "offline",
      currentCall: null,
    });
  }, [updateState]);

  const makeCall = useCallback(
    (number: string) => {
      if (!uaRef.current || !configRef.current) return;
      const ua = uaRef.current as {
        call: (target: string, options: unknown) => unknown;
      };
      const target = `sip:${number}@${configRef.current.realm || configRef.current.server}`;
      const options = {
        mediaConstraints: { audio: true, video: false },
        rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
        pcConfig: {
          iceServers: configRef.current.stunServer
            ? [{ urls: `stun:${configRef.current.stunServer}` }]
            : [],
        },
      };
      ua.call(target, options);
    },
    []
  );

  const answerCall = useCallback(() => {
    if (!sessionRef.current) return;
    const session = sessionRef.current as {
      answer: (options: unknown) => void;
    };
    session.answer({
      mediaConstraints: { audio: true, video: false },
      rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
    });
  }, []);

  const hangupCall = useCallback(() => {
    if (!sessionRef.current) return;
    const session = sessionRef.current as { terminate: () => void };
    session.terminate();
  }, []);

  const holdCall = useCallback(() => {
    if (!sessionRef.current) return;
    const session = sessionRef.current as { hold: () => void };
    session.hold();
    updateState({ isOnHold: true, callState: "on_hold" });
  }, [updateState]);

  const resumeCall = useCallback(() => {
    if (!sessionRef.current) return;
    const session = sessionRef.current as { unhold: () => void };
    session.unhold();
    updateState({ isOnHold: false, callState: "connected" });
  }, [updateState]);

  const muteCall = useCallback(() => {
    if (!sessionRef.current) return;
    const session = sessionRef.current as {
      mute: (options?: unknown) => void;
    };
    session.mute({ audio: true });
    updateState({ isMuted: true });
  }, [updateState]);

  const unmuteCall = useCallback(() => {
    if (!sessionRef.current) return;
    const session = sessionRef.current as {
      unmute: (options?: unknown) => void;
    };
    session.unmute({ audio: true });
    updateState({ isMuted: false });
  }, [updateState]);

  const sendDTMF = useCallback(
    (digit: string) => {
      if (sessionRef.current) {
        const session = sessionRef.current as {
          sendDTMF: (tone: string) => void;
        };
        session.sendDTMF(digit);
      }
      setState((prev) => ({
        ...prev,
        dtmfBuffer: (prev.dtmfBuffer + digit).slice(-20),
      }));
    },
    []
  );

  const transferCall = useCallback(
    (number: string) => {
      if (!sessionRef.current || !configRef.current) return;
      const session = sessionRef.current as {
        refer: (target: string) => void;
      };
      const target = `sip:${number}@${configRef.current.realm || configRef.current.server}`;
      session.refer(target);
    },
    []
  );

  const setVolume = useCallback(
    (vol: number) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.volume = vol / 100;
      }
      updateState({ volume: vol });
    },
    [updateState]
  );

  const setMicVolume = useCallback(
    (vol: number) => {
      updateState({ micVolume: vol });
    },
    [updateState]
  );

  const setAgentStatus = useCallback(
    (status: AgentStatus) => {
      updateState({ agentStatus: status });
    },
    [updateState]
  );

  const clearDTMF = useCallback(() => {
    updateState({ dtmfBuffer: "" });
  }, [updateState]);

  return {
    ...state,
    register,
    unregister,
    makeCall,
    answerCall,
    hangupCall,
    holdCall,
    resumeCall,
    muteCall,
    unmuteCall,
    sendDTMF,
    transferCall,
    setVolume,
    setMicVolume,
    setAgentStatus,
    clearDTMF,
  };
}
