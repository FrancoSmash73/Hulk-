"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ViciDialConfig {
  serverUrl: string; // e.g. https://your-server/agc/vicidial.php
  agentUser: string;
  agentPass: string;
  campaign: string;
  phone: string;
  phoneLogin: string;
  phonePass: string;
}

export interface ViciDialStatus {
  isConnected: boolean;
  agentStatus: string;
  currentLead: LeadInfo | null;
  sessionId: string | null;
  uniqueId: string | null;
  errorMessage: string | null;
  isLoading: boolean;
  pauseCode: string;
  dispositions: Disposition[];
  campaigns: string[];
}

export interface LeadInfo {
  leadId: string;
  firstName: string;
  lastName: string;
  phone: string;
  altPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  comments?: string;
  listId?: string;
}

export interface Disposition {
  status: string;
  statusName: string;
  selectable: boolean;
  humanAnswered: boolean;
  category?: string;
}

export interface ViciDialActions {
  login: (config: ViciDialConfig) => Promise<void>;
  logout: () => Promise<void>;
  pauseAgent: (pauseCode?: string) => Promise<void>;
  resumeAgent: () => Promise<void>;
  dispositionCall: (status: string, callbackTime?: string) => Promise<void>;
  dialNext: () => Promise<void>;
  skipLead: () => Promise<void>;
  sendAgentState: (state: string) => Promise<void>;
  updateLeadInfo: (info: Partial<LeadInfo>) => Promise<void>;
}

// ViciDial AGC API integration
// Uses the standard ViciDial AGC API endpoints
// Reference: ViciDial Admin Manual - Agent API
export function useViciDial(): ViciDialStatus & ViciDialActions {
  const [status, setStatus] = useState<ViciDialStatus>({
    isConnected: false,
    agentStatus: "OFFLINE",
    currentLead: null,
    sessionId: null,
    uniqueId: null,
    errorMessage: null,
    isLoading: false,
    pauseCode: "",
    dispositions: [],
    campaigns: [],
  });

  const configRef = useRef<ViciDialConfig | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  // Use a ref for pollStatus to avoid circular dependency in login's useCallback
  const pollStatusRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const updateStatus = useCallback((updates: Partial<ViciDialStatus>) => {
    if (isMountedRef.current) {
      setStatus((prev) => ({ ...prev, ...updates }));
    }
  }, []);

  // Make API call to ViciDial AGC
  const apiCall = useCallback(
    async (
      params: Record<string, string>,
      config?: ViciDialConfig
    ): Promise<Record<string, string>> => {
      const cfg = config || configRef.current;
      if (!cfg) throw new Error("Not configured");

      const url = new URL(cfg.serverUrl);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

      // Use a CORS proxy or direct call depending on deployment
      // In production, this should be proxied through your Next.js API route
      const response = await fetch(`/api/vicidial?${url.searchParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const text = await response.text();
      // Parse ViciDial response format: "key=value\nkey2=value2"
      const result: Record<string, string> = {};
      text.split("\n").forEach((line) => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          result[key.trim()] = valueParts.join("=").trim();
        }
      });
      return result;
    },
    []
  );

  const login = useCallback(
    async (config: ViciDialConfig) => {
      configRef.current = config;
      updateStatus({ isLoading: true, errorMessage: null });

      try {
        const result = await apiCall(
          {
            agent_user: config.agentUser,
            agent_pass: config.agentPass,
            phone_login: config.phoneLogin,
            phone_pass: config.phonePass,
            campaign: config.campaign,
            phone: config.phone,
            ACTION: "Login",
            request_non_agent_api: "YES",
          },
          config
        );

        if (result["result"] === "SUCCESS" || result["session_id"]) {
          updateStatus({
            isConnected: true,
            sessionId: result["session_id"] || null,
            agentStatus: "READY",
            isLoading: false,
          });

          // Start polling for status updates
          pollIntervalRef.current = setInterval(async () => {
            try {
              await pollStatusRef.current();
            } catch {
              // Silent fail on poll errors
            }
          }, 5000);
        } else {
          throw new Error(result["result"] || "Login failed");
        }
      } catch (err) {
        const error = err as Error;
        updateStatus({
          isLoading: false,
          errorMessage: error.message,
          isConnected: false,
        });
      }
    },
    [apiCall, updateStatus]
  );

  const pollStatus = useCallback(async () => {
    if (!configRef.current || !status.sessionId) return;

    try {
      const result = await apiCall({
        ACTION: "agent_status_check",
        agent_user: configRef.current.agentUser,
        session_id: status.sessionId || "",
      });

      if (result["agent_status"]) {
        updateStatus({ agentStatus: result["agent_status"] });
      }

      if (result["lead_id"] && result["lead_id"] !== "0") {
        updateStatus({
          currentLead: {
            leadId: result["lead_id"],
            firstName: result["first_name"] || "",
            lastName: result["last_name"] || "",
            phone: result["phone_number"] || "",
            altPhone: result["alt_phone"],
            address: result["address1"],
            city: result["city"],
            state: result["state"],
            comments: result["comments"],
            listId: result["list_id"],
          },
        });
      }
    } catch {
      // Silent fail
    }
  }, [apiCall, status.sessionId, updateStatus]);

  // Keep ref in sync so login's interval can call the latest version
  pollStatusRef.current = pollStatus;

  const logout = useCallback(async () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    try {
      if (configRef.current && status.sessionId) {
        await apiCall({
          ACTION: "Logout",
          agent_user: configRef.current.agentUser,
          session_id: status.sessionId,
        });
      }
    } catch {
      // Silent fail on logout
    }

    configRef.current = null;
    updateStatus({
      isConnected: false,
      agentStatus: "OFFLINE",
      currentLead: null,
      sessionId: null,
      uniqueId: null,
    });
  }, [apiCall, status.sessionId, updateStatus]);

  const pauseAgent = useCallback(
    async (pauseCode = "PAUSE") => {
      if (!configRef.current) return;
      try {
        await apiCall({
          ACTION: "PauseAgent",
          agent_user: configRef.current.agentUser,
          session_id: status.sessionId || "",
          pause_code: pauseCode,
        });
        updateStatus({ agentStatus: "PAUSED", pauseCode });
      } catch (err) {
        const error = err as Error;
        updateStatus({ errorMessage: error.message });
      }
    },
    [apiCall, status.sessionId, updateStatus]
  );

  const resumeAgent = useCallback(async () => {
    if (!configRef.current) return;
    try {
      await apiCall({
        ACTION: "ResumeAgent",
        agent_user: configRef.current.agentUser,
        session_id: status.sessionId || "",
      });
      updateStatus({ agentStatus: "READY", pauseCode: "" });
    } catch (err) {
      const error = err as Error;
      updateStatus({ errorMessage: error.message });
    }
  }, [apiCall, status.sessionId, updateStatus]);

  const dispositionCall = useCallback(
    async (dispStatus: string, callbackTime?: string) => {
      if (!configRef.current) return;
      try {
        const params: Record<string, string> = {
          ACTION: "DispositionCall",
          agent_user: configRef.current.agentUser,
          session_id: status.sessionId || "",
          unique_id: status.uniqueId || "",
          status: dispStatus,
        };
        if (callbackTime) {
          params["callback_datetime"] = callbackTime;
        }
        await apiCall(params);
        updateStatus({ currentLead: null, agentStatus: "READY" });
      } catch (err) {
        const error = err as Error;
        updateStatus({ errorMessage: error.message });
      }
    },
    [apiCall, status.sessionId, status.uniqueId, updateStatus]
  );

  const dialNext = useCallback(async () => {
    if (!configRef.current) return;
    try {
      await apiCall({
        ACTION: "DialNext",
        agent_user: configRef.current.agentUser,
        session_id: status.sessionId || "",
      });
    } catch (err) {
      const error = err as Error;
      updateStatus({ errorMessage: error.message });
    }
  }, [apiCall, status.sessionId, updateStatus]);

  const skipLead = useCallback(async () => {
    if (!configRef.current) return;
    try {
      await apiCall({
        ACTION: "SkipLead",
        agent_user: configRef.current.agentUser,
        session_id: status.sessionId || "",
      });
      updateStatus({ currentLead: null });
    } catch (err) {
      const error = err as Error;
      updateStatus({ errorMessage: error.message });
    }
  }, [apiCall, status.sessionId, updateStatus]);

  const sendAgentState = useCallback(
    async (agentState: string) => {
      if (!configRef.current) return;
      try {
        await apiCall({
          ACTION: "SetAgentStatus",
          agent_user: configRef.current.agentUser,
          session_id: status.sessionId || "",
          agent_status: agentState,
        });
        updateStatus({ agentStatus: agentState });
      } catch (err) {
        const error = err as Error;
        updateStatus({ errorMessage: error.message });
      }
    },
    [apiCall, status.sessionId, updateStatus]
  );

  const updateLeadInfo = useCallback(
    async (info: Partial<LeadInfo>) => {
      if (!configRef.current || !status.currentLead) return;
      try {
        const params: Record<string, string> = {
          ACTION: "UpdateLeadInfo",
          agent_user: configRef.current.agentUser,
          session_id: status.sessionId || "",
          lead_id: status.currentLead.leadId,
        };
        if (info.firstName) params["first_name"] = info.firstName;
        if (info.lastName) params["last_name"] = info.lastName;
        if (info.phone) params["phone_number"] = info.phone;
        if (info.address) params["address1"] = info.address;
        if (info.city) params["city"] = info.city;
        if (info.state) params["state"] = info.state;
        if (info.comments) params["comments"] = info.comments;

        await apiCall(params);
        updateStatus({
          currentLead: { ...status.currentLead, ...info },
        });
      } catch (err) {
        const error = err as Error;
        updateStatus({ errorMessage: error.message });
      }
    },
    [apiCall, status.sessionId, status.currentLead, updateStatus]
  );

  return {
    ...status,
    login,
    logout,
    pauseAgent,
    resumeAgent,
    dispositionCall,
    dialNext,
    skipLead,
    sendAgentState,
    updateLeadInfo,
  };
}
