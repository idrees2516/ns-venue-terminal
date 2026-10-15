'use client';

/**
 * DepthLadderXL — the Order Book page's centerpiece: a large two-sided ladder
 * for the focused symbol with per-level qty bars AND cumulative-depth bars,
 * a glass spread row pinned between the sides, and click-to-price wiring into
 * the shared order ticket. Levels render taller (h-[30px] on xl) and the
 * ladder consumes the full panel height — the book IS the page.
 */
import { useTerminal } from '@/providers/TerminalProvider';
import { useStoreSection } from '@/lib/store';
import { fmtInt, fmtTicks } from '@/lib/format';
import type { PriceLevel } from '@/lib/types';
import { Panel } from '@/components/Panel';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyHint } from '@/components/EmptyHint';

const LEVELS = 14;

export function DepthLadderXL() {
  const { store, sel, patchTicket } = useTerminal();
  useStoreSection(store, 'depth');

  const frame = sel.symbol !== null ? store.depth.get(sel.symbol) : undefined;

  const asks = (frame?.asks ?? []).slice(0, LEVELS);
  const bids = (frame?.bids ?? []).slice(0, LEVELS);

  let maxQty = 1;
  for (const l of asks) maxQty = Math.max(maxQty, l[1]);
  for (const l of bids) maxQty = Math.max(maxQty, l[1]);

  // cumulative depth (integer contracts from the top of each side)
  const cumAsk: number[] = [];
  let acc = 0;
  for (const l of asks) {
    acc += l[1];
    cumAsk.push(acc);
  }
  const cumBid: number[] = [];
  acc = 0;
  for (const l of bids) {
    acc += l[1];
    cumBid.push(acc);
  }
  const maxCum = Math.max(1, cumAsk[cumAsk.length - 1] ?? 0, cumBid[cumBid.length - 1] ?? 0);

  const bestBid = bids[0]?.[0];
  const bestAsk = asks[0]?.[0];
  const spread =
    bestBid !== undefined && bestAsk !== undefined && bestAsk >= bestBid ? bestAsk - bestBid : null;
  const mid =
    bestBid !== undefined && bestAsk !== undefined ? Math.floor((bestBid + bestAsk) / 2) : null;

  const pick = (price: number): void => {
    patchTicket({ priceStr: fmtTicks(price) });
  };

  return (
    <Panel
      title="Order book"
      right={
        <span className="font-mono text-[10px] text-txt-dim tabular-nums">
          {asks.length + bids.length} levels
        </span>
      }
      className="h-full min-h-0"
      bodyClassName="flex min-h-0 flex-col"
    >
      {/* column header */}
      <div className="grid shrink-0 grid-cols-[minmax(72px,90px)_minmax(56px,80px)_minmax(64px,96px)_minmax(56px,80px)] border-b border-edge/60 px-4 py-1.5 font-sans text-[8.5px] font-bold tracking-[0.16em] text-txt-dim uppercase">
        <span>price</span>
        <span className="text-right">qty</span>
        <span className="text-right">cumulative</span>
        <span className="text-right">total</span>
      </div>

      {sel.symbol === null ? (
        <EmptyHint text="Focus a symbol to open its book" />
      ) : frame === undefined ? (
        <TableSkeleton rows={12} cols={4} label="loading depth" />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto" aria-label="Order book depth">
          {/* asks — worst at top, best adjacent to spread */}
          <div className="flex flex-col justify-end">
            {[...asks].reverse().map((l, i) => (
              <LevelXL
                key={`a${i}-${l[0]}`}
                level={l}
                cum={cumAsk[asks.length - 1 - i] ?? 0}
                maxQty={maxQty}
                maxCum={maxCum}
                tone="ask"
                onPick={pick}
              />
            ))}
          </div>

          {/* pinned spread row */}
          <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-y border-edge/70 bg-panel-2/90 px-4 py-2 font-mono text-[11px] tabular-nums text-txt-dim backdrop-blur-sm">
            <span className="tracking-[0.14em] uppercase">
              spread{' '}
              {spread !== null ? (
                <span className="font-semibold text-txt">
                  {spread}t · {fmtTicks(spread)}
                </span>
              ) : (
                '—'
              )}
            </span>
            <span className="tracking-[0.14em] uppercase">
              mid{' '}
              {mid !== null ? (
                <span className="font-semibold text-accent-bright">{fmtTicks(mid)}</span>
              ) : (
                '—'
              )}
            </span>
          </div>

          {/* bids — best at top */}
          <div className="flex flex-col">
            {bids.map((l, i) => (
              <LevelXL
                key={`b${i}-${l[0]}`}
                level={l}
                cum={cumBid[i] ?? 0}
                maxQty={maxQty}
                maxCum={maxCum}
                tone="bid"
                onPick={pick}
              />
            ))}
          </div>

          {asks.length === 0 && bids.length === 0 && (
            <EmptyHint text="No depth published for this symbol" />
          )}
        </div>
      )}
    </Panel>
  );
}

function LevelXL({
  level,
  cum,
  maxQty,
  maxCum,
  tone,
  onPick,
}: {
  level: PriceLevel;
  cum: number;
  maxQty: number;
  maxCum: number;
  tone: 'ask' | 'bid';
  onPick: (price: number) => void;
}) {
  const qtyPct = Math.min(100, Math.max(3, Math.round((level[1] / maxQty) * 100)));
  const cumPct = Math.min(100, Math.max(0, Math.round((cum / maxCum) * 100)));
  return (
    <button
      type="button"
      onClick={() => onPick(level[0])}
      title="Click to load this price into the order ticket"
      className="group/lvl relative grid h-[27px] grid-cols-[minmax(72px,90px)_minmax(56px,80px)_minmax(64px,96px)_minmax(56px,80px)] items-center px-4 font-mono text-[12px] tabular-nums transition-colors hover:bg-white/[0.035] xl:h-[30px] xl:text-[12.5px]"
    >
      {/* cumulative depth layer (behind, muted) */}
      <span
        className={`absolute inset-y-[2px] right-0 rounded-l-sm ${
          tone === 'ask' ? 'bg-down/[0.07]' : 'bg-up/[0.07]'
        }`}
        style={{ width: `${cumPct}%` }}
        aria-hidden
      />
      {/* per-level qty bar (bright, inner) */}
      <span
        className={`absolute inset-y-[2px] right-0 rounded-l-sm bg-gradient-to-l ${
          tone === 'ask' ? 'from-down/45 to-down/[0.1]' : 'from-up/45 to-up/[0.1]'
        }`}
        style={{ width: `${Math.max(qtyPct, cumPct * 0.35)}%` }}
        aria-hidden
      />
      <span
        className={`relative text-left font-bold ${tone === 'ask' ? 'text-down-bright' : 'text-up-bright'}`}
      >
        {fmtTicks(level[0])}
      </span>
      <span className="relative text-right font-semibold text-txt">{fmtInt(level[1])}</span>
      <span className="relative text-right text-txt-dim">{fmtInt(cum)}</span>
      <span className="relative text-right text-txt-dim/70 group-hover/lvl:text-txt-dim">
        {tone === 'ask' ? 'SELL' : 'BUY'}
      </span>
    </button>
  );
}
