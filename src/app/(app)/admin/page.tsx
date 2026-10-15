'use client';

/**
 * /admin — the venue console section (admin-scope keys only). Reuses the
 * terminal wiring from the (app) layout, so the cards get the signed
 * VenueClient and live underlying marks. Funding, session listing, market
 * operations and key minting each live in their own panel.
 */
import { RequireAdmin } from '@/components/RequireSession';
import { PanelErrorBoundary } from '@/components/ErrorBoundary';
import { PageHeader, PageScroll } from '@/components/shell/PageHeader';
import { FundingCard } from '@/components/admin/FundingCard';
import { SessionsCard } from '@/components/admin/SessionsCard';
import { MarketOpsCard } from '@/components/admin/MarketOpsCard';
import { KeysCard } from '@/components/admin/KeysCard';

export default function AdminPage() {
  return (
    <RequireAdmin>
      <PageScroll>
        <PageHeader
          eyebrow="Administration"
          title="Admin console"
          lede="Venue operations — account funding, 0DTE session listing, oracle marks and halts, API key minting. Every action is HMAC-signed, scope-checked and journaled."
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <PanelErrorBoundary title="Funding">
            <FundingCard />
          </PanelErrorBoundary>
          <PanelErrorBoundary title="Sessions">
            <SessionsCard />
          </PanelErrorBoundary>
          <PanelErrorBoundary title="Market ops">
            <MarketOpsCard />
          </PanelErrorBoundary>
          <PanelErrorBoundary title="Keys">
            <KeysCard />
          </PanelErrorBoundary>
        </div>
      </PageScroll>
    </RequireAdmin>
  );
}
