'use client';

/**
 * /orderbook — THE depth page.
 *
 * Full-bleed terminal layout engineered for laptop screens: instrument
 * header strip on top (big BBO, mid/spread, session stats), then the depth
 * ladder as the dominant column with time & sales beside it. The grid ratio
 * widens from 1:1 (compact) to 7:5 (xl) so 1280-1920px screens get a large
 * readable book instead of cramped columns. Clicking any price loads it into
 * the shared order ticket (Execute section).
 */
import { PanelErrorBoundary } from '@/components/ErrorBoundary';
import { SymbolHeader } from '@/components/orderbook/SymbolHeader';
import { DepthLadderXL } from '@/components/orderbook/DepthLadderXL';
import { TapeXL } from '@/components/orderbook/TapeXL';

export default function OrderBookPage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 md:p-4">
      <PanelErrorBoundary title="Instrument">
        <SymbolHeader />
      </PanelErrorBoundary>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden xl:grid-cols-[7fr_5fr]">
        <div className="h-[520px] min-h-0 lg:h-auto">
          <PanelErrorBoundary title="Depth">
            <DepthLadderXL />
          </PanelErrorBoundary>
        </div>
        <div className="h-[420px] min-h-0 lg:h-auto">
          <PanelErrorBoundary title="Tape">
            <TapeXL />
          </PanelErrorBoundary>
        </div>
      </div>
    </div>
  );
}
