'use client';

/**
 * /sessions — the 0DTE session lifecycle section: every listed expiry as a
 * live countdown card plus the highlighted session's full instrument table.
 */
import { PanelErrorBoundary } from '@/components/ErrorBoundary';
import { PageHeader, PageScroll } from '@/components/shell/PageHeader';
import { SessionsView } from '@/components/sessions/SessionsView';

export default function SessionsPage() {
  return (
    <PageScroll>
      <PageHeader
        eyebrow="Markets"
        title="0DTE sessions"
        lede="The hourly lifecycle — pre-open, continuous trading, closing auction, expiry settlement — for every listed session, with call/put volume pressure."
      />
      <PanelErrorBoundary title="Sessions">
        <SessionsView />
      </PanelErrorBoundary>
    </PageScroll>
  );
}
