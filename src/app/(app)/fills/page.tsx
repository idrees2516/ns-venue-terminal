'use client';

/**
 * /fills — the execution blotter section: every fill this account has
 * executed this session with exact fees/rebates and integer aggregates.
 */
import { PanelErrorBoundary } from '@/components/ErrorBoundary';
import { PageHeader, PageScroll } from '@/components/shell/PageHeader';
import { FillsBlotter } from '@/components/fills/FillsBlotter';

export default function FillsPage() {
  return (
    <PageScroll>
      <PageHeader
        eyebrow="Execution"
        title="Fills"
        lede="Your executed trades as the venue reports them — maker rebates, taker fees and signed premium, all in exact integer ticks."
      />
      <PanelErrorBoundary title="Fills">
        <FillsBlotter />
      </PanelErrorBoundary>
    </PageScroll>
  );
}
