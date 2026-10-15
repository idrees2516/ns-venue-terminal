'use client';

/**
 * /positions — the portfolio section: positions table (with totals) plus the
 * per-underlying balance cards. Scrollable page with a capped content width
 * so wide laptop screens get a centered, composed layout.
 */
import { PanelErrorBoundary } from '@/components/ErrorBoundary';
import { PageHeader, PageScroll } from '@/components/shell/PageHeader';
import { PositionsTable } from '@/components/positions/PositionsTable';
import { BalancesCards } from '@/components/positions/BalancesCards';

export default function PositionsPage() {
  return (
    <PageScroll>
      <PageHeader
        eyebrow="Portfolio"
        title="Positions & balances"
        lede="Signed 0DTE positions with live intrinsic marked against the underlying, short-margin and delta notional — all integer-exact."
      />
      <div className="flex flex-col gap-4">
        <PanelErrorBoundary title="Positions">
          <PositionsTable />
        </PanelErrorBoundary>
        <PanelErrorBoundary title="Balances">
          <BalancesCards />
        </PanelErrorBoundary>
      </div>
    </PageScroll>
  );
}
