'use client';

/**
 * /health — the venue health section (admin-scope keys only): per-shard
 * engine metrics, gateway throughput, conservation badges and the live
 * state hash — the venue's own heartbeat.
 */
import { RequireAdmin } from '@/components/RequireSession';
import { PanelErrorBoundary } from '@/components/ErrorBoundary';
import { PageHeader, PageScroll } from '@/components/shell/PageHeader';
import { VenueHealthCard } from '@/components/admin/VenueHealthCard';

export default function HealthPage() {
  return (
    <RequireAdmin>
      <PageScroll>
        <PageHeader
          eyebrow="Administration"
          title="Venue health"
          lede="Live engine telemetry — per-shard order/trade counters, TPS, queue depth, journal bytes, deterministic state hash and exact cash conservation."
        />
        <div className="flex min-h-[calc(100dvh-240px)] flex-col">
          <PanelErrorBoundary title="Venue health">
            <VenueHealthCard />
          </PanelErrorBoundary>
        </div>
      </PageScroll>
    </RequireAdmin>
  );
}
