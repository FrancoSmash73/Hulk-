# Active Context: Next.js Starter Template

## Current State

**Project Status**: ✅ HulkPhone ViciDial WebPhone — Built & Deployed

A full-featured WebRTC softphone for ViciDial AGC agents with Hulk/anime theme.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] HulkPhone WebRTC softphone with Hulk/anime theme
- [x] SIP/WebRTC integration via JsSIP (open source, MIT)
- [x] ViciDial AGC integration (iframe + inject script)
- [x] Full call controls: answer, hangup, hold, mute, transfer, DTMF
- [x] Agent status panel with pause codes
- [x] Call log with callback
- [x] Settings panel (SIP + ViciDial config, localStorage)
- [x] API proxy route with action whitelist
- [x] Zero backdoors, no telemetry

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Landing page with live demo | ✅ Ready |
| `src/app/layout.tsx` | Root layout (dark/mono) | ✅ Ready |
| `src/app/globals.css` | Hulk/anime theme + animations | ✅ Ready |
| `src/app/embed/page.tsx` | Embed page for iframe use | ✅ Ready |
| `src/app/embed/EmbedPhone.tsx` | postMessage bridge | ✅ Ready |
| `src/app/api/vicidial/route.ts` | ViciDial API proxy | ✅ Ready |
| `src/components/phone/WebPhone.tsx` | Main phone UI | ✅ Ready |
| `src/components/phone/WebPhoneWrapper.tsx` | Dynamic import wrapper | ✅ Ready |
| `src/components/phone/Keypad.tsx` | DTMF keypad | ✅ Ready |
| `src/components/phone/CallControls.tsx` | Call action buttons | ✅ Ready |
| `src/components/phone/AgentStatus.tsx` | Agent status panel | ✅ Ready |
| `src/components/phone/CallLog.tsx` | Call history | ✅ Ready |
| `src/components/phone/SettingsPanel.tsx` | SIP + ViciDial config | ✅ Ready |
| `src/lib/useSIP.ts` | SIP/WebRTC hook (JsSIP) | ✅ Ready |
| `src/lib/useViciDial.ts` | ViciDial AGC API hook | ✅ Ready |
| `public/hulkphone-inject.js` | ViciDial page inject script | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Current Focus

HulkPhone is complete. To use it with ViciDial:
1. Deploy this Next.js app to a server
2. Add `<script src="https://your-server/hulkphone-inject.js"></script>` to ViciDial AGC page
3. Or embed via `<iframe src="https://your-server/embed">`
4. Configure SIP server and ViciDial credentials in the Settings tab

## Quick Start Guide

### To add a new page:

Create a file at `src/app/[route]/page.tsx`:
```tsx
export default function NewPage() {
  return <div>New page content</div>;
}
```

### To add components:

Create `src/components/` directory and add components:
```tsx
// src/components/ui/Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="px-4 py-2 bg-blue-600 text-white rounded">{children}</button>;
}
```

### To add a database:

Follow `.kilocode/recipes/add-database.md`

### To add API routes:

Create `src/app/api/[route]/route.ts`:
```tsx
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}
```

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Pending Improvements

- [ ] Add more recipes (auth, email, etc.)
- [ ] Add example components
- [ ] Add testing setup recipe

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
