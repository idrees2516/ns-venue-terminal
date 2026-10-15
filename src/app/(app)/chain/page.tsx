'use client';

/**
 * /chain — the Calls & Puts focus page.
 *
 * Full-bleed board layout: the whole viewport height belongs to the chain
 * (underlying strip → selection context → expiry tabs → strike ladder), which
 * is exactly what an options chain should feel like on a laptop screen: all
 * strikes visible at once with generous row heights, zero page scroll on
 * desktop. Focusing an instrument here feeds every other section.
 */
import { PanelErrorBoundary } from '@/components/ErrorBoundary';
import { ChainBoard } from '@/components/chain/ChainBoard';

export default function ChainPage() {
  return (
    <div className="h-full min-h-0 p-3 md:p-4">
      <PanelErrorBoundary title="Chain">
        <ChainBoard />
      </PanelErrorBoundary>
    </div>
  );
}
