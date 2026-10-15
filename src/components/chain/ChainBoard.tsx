'use client';

/**
 * ChainBoard — the full-width Calls & Puts board (the /chain focus page).
 *
 * Classic options-chain anatomy sized for laptop screens: every strike row
 * pairs CALLS (bid ×size · ask ×size · mark · vol) against PUTS (mirrored),
 * with the ATM strike accented and the focused instrument ringed. Expiry tabs
 * carry live countdowns + phase badges; the selection strip below offers
 * one-click jumps into the Order Book and Execute sections for the focused
 * instrument.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, Zap } from 'lucide-react';
import { useTerminal } from '@/providers/TerminalProvider';
import { useServerClock, useStoreSection, type SymbolLive } from '@/lib/store';
import type { Phase } from '@/lib/types';
import { fmtCountdown, fmtHM, fmtInt, fmtTicks } from '@/lib/format';
import { Badge } from '@/components/StatusDot';
import { Panel } from '@/components/Panel';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyHint } from '@/components/EmptyHint';
import { UnderlyingBar } from '@/components/chain/UnderlyingBar';
import { symbolLabel } from '@/components/chain/symbolLabel';

interface StrikeRow {
  strike: number;
  call?: SymbolLive;
  put?: SymbolLive;
}

interface ExpiryGroup {
  expiryMs: number;
  phase: Phase;
  rows: StrikeRow[];
  callVol: number;
  putVol: number;
}

const PHASE_TONE: Record<Phase, 'up' | 'warn' | 'neutral'> = {
  continuous: 'up',
  auction: 'warn',
  expired: 'neutral',
};

function phaseOf(syms: SymbolLive[]): Phase {
  const phases = new Set(syms.map((s) => s.phase));
  if (phases.has('auction')) return 'auction';
  if (phases.size === 1 && phases.has('expired')) return 'expired';
  return 'continuous';
}

export function ChainBoard() {
  const { store, sel, ready, setExpiry, selectSymbol } = useTerminal();
  useStoreSection(store, 'chain-rev');
  useStoreSection(store, 'chain');
  const now = useServerClock(store, 1000);

  const groups = useMemo<ExpiryGroup[]>(() => {
    if (sel.underlying === null) return [];
    const byExpiry = new Map<number, SymbolLive[]>();
    for (const s of store.symbols.values()) {
      if (s.underlying !== sel.underlying) continue;
      const arr = byExpiry.get(s.expiry_ms);
      if (arr) arr.push(s);
      else byExpiry.set(s.expiry_ms, [s]);
    }
    const out: ExpiryGroup[] = [];
    for (const [expiryMs, syms] of byExpiry) {
      const byStrike = new Map<number, StrikeRow>();
      let callVol = 0;
      let putVol = 0;
      for (const s of syms) {
        const row = byStrike.get(s.strike) ?? { strike: s.strike };
        if (s.kind === 'call') {
          row.call = s;
          callVol += s.vol;
        } else {
          row.put = s;
          putVol += s.vol;
        }
        byStrike.set(s.strike, row);
      }
      out.push({
        expiryMs,
        phase: phaseOf(syms),
        rows: [...byStrike.values()].sort((a, b) => a.strike - b.strike),
        callVol,
        putVol,
      });
    }
    out.sort((a, b) => {
      const fa = a.expiryMs >= now;
      const fb = b.expiryMs >= now;
      if (fa && fb) return a.expiryMs - b.expiryMs;
      if (!fa && !fb) return b.expiryMs - a.expiryMs;
      return fa ? -1 : 1;
    });
    return out;
  }, [store, sel.underlying, now]);

  const active = groups.find((g) => g.expiryMs === sel.expiryMs) ?? groups[0];
  const mark = sel.underlying !== null ? store.underlyings.get(sel.underlying)?.mark : undefined;

  const atmStrike = useMemo(() => {
    if (active === undefined || mark === undefined) return null;
    let best: number | null = null;
    for (const r of active.rows) {
      if (best === null || Math.abs(r.strike - mark) < Math.abs(best - mark)) best = r.strike;
    }
    return best;
  }, [active, mark]);

  const focused = sel.symbol !== null ? store.symbols.get(sel.symbol) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <UnderlyingBar />

      {/* selection context strip */}
      {focused !== undefined && (
        <div className="glass-panel fade-in flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl px-4 py-2.5">
          <span className="font-mono text-[13px] font-bold tracking-tight text-txt">
            {symbolLabel(focused)}
          </span>
          <span className="font-mono text-[11px] tabular-nums text-txt-dim">
            bid <span className="font-semibold text-up-bright">{focused.bid > 0 ? fmtTicks(focused.bid) : '—'}</span>
            {' · '}ask <span className="font-semibold text-down-bright">{focused.ask > 0 ? fmtTicks(focused.ask) : '—'}</span>
            {' · '}mark <span className="font-semibold text-txt">{fmtTicks(focused.mark)}</span>
            {' · '}vol <span className="font-semibold text-txt">{fmtInt(focused.vol)}</span>
          </span>
          <span className="ml-auto flex items-center gap-2">
            <Link href="/orderbook" className="btn btn-ghost h-7 gap-1.5 text-[9px]">
              <BookOpen size={11} strokeWidth={2} aria-hidden />
              Order Book
            </Link>
            <Link href="/execute" className="btn btn-accent h-7 gap-1.5 text-[9px]">
              <Zap size={11} strokeWidth={2} aria-hidden />
              Execute
            </Link>
          </span>
        </div>
      )}

      <Panel
        title={`Option chain · U${sel.underlying ?? '—'}`}
        right={
          <span className="font-mono text-[10px] text-txt-dim tabular-nums">
            {active
              ? `${active.rows.length} strikes · C vol ${fmtInt(active.callVol)} · P vol ${fmtInt(active.putVol)}`
              : ''}
          </span>
        }
        className="min-h-0 flex-1"
        bodyClassName="flex min-h-0 flex-col"
      >
        {/* expiry tabs */}
        <div
          className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-edge p-1.5"
          role="tablist"
          aria-label="Expiry sessions"
        >
          {groups.map((g) => {
            const cd = fmtCountdown(g.expiryMs - now);
            const isActive = active !== undefined && active.expiryMs === g.expiryMs;
            return (
              <button
                key={g.expiryMs}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setExpiry(g.expiryMs)}
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors ${
                  isActive
                    ? 'border-accent-bright/50 bg-accent/15 shadow-[0_4px_14px_-8px_rgba(46,233,208,0.5)]'
                    : 'border-edge/70 hover:border-edge2 hover:bg-white/[0.03]'
                }`}
              >
                <span className="font-mono text-[12px] font-semibold tabular-nums">
                  {fmtHM(g.expiryMs)}
                </span>
                <span
                  className={`font-mono text-[10px] tabular-nums ${cd.urgent ? 'text-down-bright' : 'text-txt-dim'}`}
                >
                  {cd.text}
                </span>
                <Badge tone={PHASE_TONE[g.phase]}>{g.phase}</Badge>
              </button>
            );
          })}
          {groups.length === 0 && <span className="px-1 text-[10px] text-txt-dim">no expiries</span>}
        </div>

        {/* column header — calls | strike | puts */}
        <div className="sticky top-0 z-10 grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(76px,96px)_minmax(0,1fr)] border-b border-edge bg-panel">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.55fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] px-2 py-1.5 font-sans text-[9px] font-bold tracking-[0.12em] text-txt-dim uppercase">
            <span className="col-span-5 pb-0.5 text-center text-[9px] text-up-bright/80">
              calls — click to focus
            </span>
            <span className="pl-2">bid ×sz</span>
            <span className="text-right">ask ×sz</span>
            <span className="text-right">mark</span>
            <span className="text-right">vol</span>
            <span className="text-right">phase</span>
          </div>
          <div className="flex items-center justify-center py-1.5 font-sans text-[9px] font-bold tracking-[0.12em] text-txt-dim uppercase">
            strike
          </div>
          <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1.2fr)_minmax(0,0.55fr)_minmax(0,1.2fr)] px-2 py-1.5 font-sans text-[9px] font-bold tracking-[0.12em] text-txt-dim uppercase">
            <span className="col-span-5 pb-0.5 text-center text-[9px] text-down-bright/80">
              puts — click to focus
            </span>
            <span>phase</span>
            <span>vol</span>
            <span className="text-right">mark</span>
            <span className="text-right">bid ×sz</span>
            <span className="pr-2 text-right">ask ×sz</span>
          </div>
        </div>

        {/* strike ladder */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {active === undefined ? (
            !ready && store.symbols.size === 0 ? (
              <TableSkeleton rows={12} cols={9} label="loading chain" />
            ) : (
              <EmptyHint text="No listed sessions for this underlying" />
            )
          ) : (
            active.rows.map((r, i) => {
              const selectedCall = r.call !== undefined && r.call.symbol === sel.symbol;
              const selectedPut = r.put !== undefined && r.put.symbol === sel.symbol;
              const atm = r.strike === atmStrike;
              return (
                <div
                  key={r.strike}
                  className={`grid grid-cols-[minmax(0,1fr)_minmax(76px,96px)_minmax(0,1fr)] items-stretch border-b border-edge/25 text-[12px] ${
                    selectedCall || selectedPut
                      ? 'bg-accent/[0.07]'
                      : atm
                        ? 'bg-accent/[0.04]'
                        : i % 2 === 1
                          ? 'bg-white/[0.016]'
                          : ''
                  }`}
                >
                  <QuoteSideXL
                    sym={r.call}
                    selected={selectedCall}
                    mirrored={false}
                    onPick={selectSymbol}
                  />
                  <div
                    className={`flex items-center justify-center border-x border-edge/25 font-mono text-[12.5px] font-bold tabular-nums ${
                      atm ? 'bg-accent/15 text-accent-bright' : 'text-txt'
                    }`}
                    title={atm ? 'at-the-money strike' : undefined}
                  >
                    {fmtTicks(r.strike)}
                  </div>
                  <QuoteSideXL
                    sym={r.put}
                    selected={selectedPut}
                    mirrored={true}
                    onPick={selectSymbol}
                  />
                </div>
              );
            })
          )}
        </div>
      </Panel>
    </div>
  );
}

/** One side of a strike row — five cells, clickable to focus the symbol. */
function QuoteSideXL({
  sym,
  selected,
  mirrored,
  onPick,
}: {
  sym?: SymbolLive;
  selected: boolean;
  mirrored: boolean;
  onPick: (symbol: number) => void;
}) {
  if (sym === undefined) {
    return (
      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.55fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] items-center px-2 font-mono text-[12px] text-txt-dim/25">
        <span className="pl-2">·</span>
        <span className="text-right">·</span>
        <span className="text-right">·</span>
        <span className="text-right">·</span>
        <span className="text-right">·</span>
      </div>
    );
  }
  const label = `${sym.kind} ${fmtTicks(sym.strike)} ${fmtHM(sym.expiry_ms)}`;
  const cells = [
    {
      v: sym.bid > 0 ? `${fmtTicks(sym.bid)} ×${fmtInt(sym.bid_qty)}` : '—',
      cls: 'text-up-bright',
    },
    {
      v: sym.ask > 0 ? `${fmtTicks(sym.ask)} ×${fmtInt(sym.ask_qty)}` : '—',
      cls: 'text-down-bright',
    },
    { v: fmtTicks(sym.mark), cls: 'text-txt font-semibold' },
    { v: fmtInt(sym.vol), cls: 'text-txt-dim' },
    { v: sym.phase === 'continuous' ? '' : sym.phase.slice(0, 4), cls: 'text-warn-bright text-[9px] font-bold uppercase tracking-[0.1em]' },
  ];
  const ordered = mirrored ? [...cells].reverse() : cells;
  return (
    <button
      type="button"
      onClick={() => onPick(sym.symbol)}
      aria-pressed={selected}
      aria-label={`Focus ${label}`}
      title={label}
      className={`grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.55fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] items-center px-2 text-left font-mono text-[12px] tabular-nums transition-colors ${
        selected
          ? 'bg-accent/15 ring-1 ring-accent/50 ring-inset'
          : 'hover:bg-edge/40'
      }`}
    >
      {ordered.map((c, i) => {
        const isLast = i === 4;
        const isFirst = i === 0;
        return (
          <span
            key={i}
            className={`${c.cls} truncate ${isFirst && !mirrored ? 'pl-2' : isLast && mirrored ? 'pr-2' : ''} ${i > 0 ? 'text-right' : ''}`}
          >
            {c.v}
          </span>
        );
      })}
    </button>
  );
}
