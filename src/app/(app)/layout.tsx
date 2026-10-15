'use client';

/**
 * (app) route group layout — every terminal section shares one live wiring:
 * RequireSession → TerminalProvider → AppShell (sidebar + topbar). Because the
 * provider sits ABOVE the routed page, navigating between sections keeps the
 * WebSocket, subscriptions, selection and ticket draft warm — no reconnects.
 */
import type { ReactNode } from 'react';
import { RequireSession } from '@/components/RequireSession';
import { TerminalProvider } from '@/providers/TerminalProvider';
import { AppShell } from '@/components/shell/AppShell';

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSession>
      <TerminalProvider>
        <AppShell>{children}</AppShell>
      </TerminalProvider>
    </RequireSession>
  );
}
