'use client';

/**
 * /orders — the working-orders section: full-width table of every live order
 * with per-row cancel and cancel-all, fed by the shared store (REST snapshot
 * + ack/fill/canceled WS events).
 */
import { PanelErrorBoundary } from '@/components/ErrorBoundary';
import { PageHeader, PageScroll } from '@/components/shell/PageHeader';
import { OrdersTable } from '@/components/orders/OrdersTable';

export default function OrdersPage() {
  return (
    <PageScroll>
      <PageHeader
        eyebrow="Execution"
        title="Open orders"
        lede="Every working order on the book for this account — price-time priority, live leaves counts, per-order and bulk cancel."
      />
      <PanelErrorBoundary title="Open orders">
        <OrdersTable />
      </PanelErrorBoundary>
    </PageScroll>
  );
}
