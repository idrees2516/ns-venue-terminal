'use client';

/**
 * SymbolHeader — the focused symbol's identity strip for the Order Book page:
 * instrument label (underlying · expiry · kind · strike), live phase badge
 * with expiry countdown, large BBO (bid × / ask ×) with sizes, mid + spread,
 * and session stats (open / high / low / volume / trades) from the live
 * symbol snapshot.
 */
import { useTerminal } from '@/providers/TerminalProvider';
import { useServerClock, useStoreSection } from '@/lib/store';
import { fmtCountdown, fmtHM, fmtInt, fmtTicks } from '@/lib/format';
import { Badge } from '@/components/StatusDot';
import { symbolLabel } from '@/components/chain/symbolLabel';
import type { Phase } from '@/lib/types';

const PHASE_TONE: Record<Phase, 'up' | 'warn' | 'neutral'> = {
  continuous: 'up',
  auction: 'warn',
  expired: 'neutral',
};

export function SymbolHeader() {
  const { store, sel } = useTerminal();
  useStoreSection(store, 'chain');
  useStoreSection(store, 'depth');
  const now = useServerClock(store, 1000);

  const sym = sel.symbol !== null ? store.symbols.get(sel.symbol) : undefined;
  const frame = sel.symbol !== null ? store.depth.get(sel.symbol) : undefined;

  const bestBid = frame?.bids?.[0]?.[0];
  const bestBidQty = frame?.bids?.[0]?.[1];
  const bestAsk = frame?.asks?.[0]?.[0];
  const bestAskQty = frame?.asks?.[0]?.[1];
  const spread =
    bestBid !== undefined && bestAsk !== undefined && bestAsk >= bestBid ? bestAsk - bestBid : null;
  const mid =
    bestBid !== undefined && bestAsk !== undefined ? Math.floor((bestBid + bestAsk) / 2) : null;

  if (sym === undefined) {
    return (
      <div className="glass-panel flex h-[86px] items-center justify-between gap-6 rounded-xl px-5">
        <div>
          <p className="text-[13px] font-semibold text-txt-dim">No symbol focused</p>
          <p className="mt-0.5 text-[11px] text-txt-dim/70">
            Pick an instrument in Calls &amp; Puts or 0DTE Sessions to light up the book.
          </p>
        </div>
      </div>
    );
  }

  const cd = fmtCountdown(sym.expiry_ms - now);

  return (
    <div className="glass-panel flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl px-5 py-3.5">
      {/* instrument identity */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[15px] font-bold tracking-tight text-txt">
            {symbolLabel(sym)}
          </span>
          <Badge tone={PHASE_TONE[sym.phase]}>{sym.phase}</Badge>
        </div>
        <p className="mt-1 font-mono text-[10px] tabular-nums text-txt-dim">
          U{sym.underlying} · expires {fmtHM(sym.expiry_ms)} local
          {cd.expired ? '' : ` · ${cd.text} left`}
        </p>
      </div>

      {/* big BBO */}
      <div className="flex items-center gap-5 font-mono tabular-nums">
        <div className="text-left">
          <p className="font-sans text-[8px] font-bold tracking-[0.22em] text-txt-dim uppercase">bid</p>
          <p className="text-[22px] font-bold leading-tight text-up-bright">
            {bestBid !== undefined ? fmtTicks(bestBid) : '—'}
          </p>
          <p className="text-[10px] text-txt-dim">
            × {bestBidQty !== undefined ? fmtInt(bestBidQty) : '—'}
          </p>
        </div>
        <span className="h-9 w-px bg-edge/70" aria-hidden />
        <div className="text-left">
          <p className="font-sans text-[8px] font-bold tracking-[0.22em] text-txt-dim uppercase">ask</p>
          <p className="text-[22px] font-bold leading-tight text-down-bright">
            {bestAsk !== undefined ? fmtTicks(bestAsk) : '—'}
          </p>
          <p className="text-[10px] text-txt-dim">
            × {bestAskQty !== undefined ? fmtInt(bestAskQty) : '—'}
          </p>
        </div>
        <span className="h-9 w-px bg-edge/70" aria-hidden />
        <div className="text-left">
          <p className="font-sans text-[8px] font-bold tracking-[0.22em] text-txt-dim uppercase">mid</p>
          <p className="text-[15px] font-semibold leading-tight text-accent-bright">
            {mid !== null ? fmtTicks(mid) : '—'}
          </p>
          <p className="text-[10px] text-txt-dim">
            spread {spread !== null ? `${fmtTicks(spread)} · ${spread}t` : '—'}
          </p>
        </div>
      </div>

      {/* session stats */}
      <div className="ml-auto flex items-center gap-x-6 gap-y-1 font-mono text-[10px] tabular-nums">
        <Stat label="open" value={fmtTicks(sym.open)} />
        <Stat label="high" value={fmtTicks(sym.high)} tone="up" />
        <Stat label="low" value={fmtTicks(sym.low)} tone="down" />
        <Stat label="vol" value={fmtInt(sym.vol)} />
        <Stat label="trades" value={fmtInt(sym.n_trades)} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="text-left">
      <p className="font-sans text-[8px] font-bold tracking-[0.2em] text-txt-dim uppercase">{label}</p>
      <p
        className={`mt-0.5 text-[12px] font-semibold ${
          tone === 'up' ? 'text-up-bright' : tone === 'down' ? 'text-down-bright' : 'text-txt'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
