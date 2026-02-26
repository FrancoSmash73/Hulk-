import { NextRequest, NextResponse } from "next/server";

/**
 * ViciDial AGC API Proxy
 *
 * This proxy route forwards requests to the ViciDial server.
 * It handles CORS and keeps credentials server-side.
 *
 * Security: Credentials are passed through but never logged or stored.
 * All communication is server-to-server.
 */

// Allowed ViciDial API actions (whitelist for security)
const ALLOWED_ACTIONS = new Set([
  "Login",
  "Logout",
  "PauseAgent",
  "ResumeAgent",
  "DispositionCall",
  "DialNext",
  "SkipLead",
  "SetAgentStatus",
  "UpdateLeadInfo",
  "agent_status_check",
  "get_dispositions",
  "get_campaigns",
]);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Extract the target server URL from params
  const targetServer = searchParams.get("server_url");
  const action = searchParams.get("ACTION");

  if (!targetServer) {
    return NextResponse.json(
      { error: "Missing server_url parameter" },
      { status: 400 }
    );
  }

  // Validate action against whitelist
  if (action && !ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json(
      { error: "Action not permitted" },
      { status: 403 }
    );
  }

  // Build the target URL
  const forwardParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== "server_url") {
      forwardParams.set(key, value);
    }
  });

  try {
    const targetUrl = `${targetServer}?${forwardParams.toString()}`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "ViciPhone/1.0",
        Accept: "text/plain,text/html,*/*",
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store, no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: `Proxy error: ${error.message}` },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, string>;
    const targetServer = body["server_url"];
    const action = body["ACTION"];

    if (!targetServer) {
      return NextResponse.json(
        { error: "Missing server_url" },
        { status: 400 }
      );
    }

    if (action && !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: "Action not permitted" },
        { status: 403 }
      );
    }

    const forwardParams = new URLSearchParams();
    Object.entries(body).forEach(([key, value]) => {
      if (key !== "server_url") {
        forwardParams.set(key, value);
      }
    });

    const response = await fetch(`${targetServer}?${forwardParams.toString()}`, {
      method: "GET",
      headers: {
        "User-Agent": "ViciPhone/1.0",
        Accept: "text/plain,*/*",
      },
      signal: AbortSignal.timeout(10000),
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store, no-cache",
      },
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: `Proxy error: ${error.message}` },
      { status: 502 }
    );
  }
}
