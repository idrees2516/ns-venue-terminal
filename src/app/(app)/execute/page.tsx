'use client';

/**
 * /execute — order entry section.
 *
 * Two-column desktop layout: the order ticket keeps a fixed comfortable width
 * on the left while the right column carries everything that supports the
 * decision — focused BBO strip, compact top-of-book depth, and the session
 * fill blotter (results of what this account executed). Stacks on mobile.
 */
import { PanelErrorBoundary } from '@/components/ErrorBoundary';
import { OrderTicket } from '@/components/trade/OrderTicket';
import { ExecuteSidePanel } from '@/components/orderbook/ExecuteSidePanel';

export default function ExecutePage() {
  return (
    <div className="h-full min-h-0 overflow-y-auto p-3 md:p-4">
      <div className="mx-auto grid h-full min-h-[640px] w-full max-w-[1500px] grid-cols-1 gap-3 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="min-h-0 xl:h-full">
          <PanelErrorBoundary title="Order ticket">
            <OrderTicket />
          </PanelErrorBoundary>
        </div>
        <div className="min-h-0 xl:h-full">
          <PanelErrorBoundary title="Context">
            <ExecuteSidePanel />
          </PanelErrorBoundary>
        </div>
      </div>
    </div>
  );
}
