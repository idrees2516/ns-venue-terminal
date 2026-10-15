'use client';

/**
 * SessionsView — the 0DTE session lifecycle board: every listed expiry for
 * the selected underlying as a live card (big countdown, phase badge, strike
 * count, call/put volume split) plus a detailed per-strike mini-table for the
 * highlighted session. Selecting a session routes the chain to it.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Table2 } from 'lucide-react';
import { useTerminal } from '@/providers/TerminalProvider';
import { useServerClock, useStoreSection, type SymbolLive } from '@/lib/store';
import type { Phase } from '@/lib/types';
import { fmtCountdown, fmtHM, fmtInt, fmtTicks } from '@/lib/format';
import { Badge } from '@/components/StatusDot';
import { Panel } from '@/components/Panel';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyHint } from '@/components/EmptyHint';
import { UnderlyingBar } from '@/components/chain/UnderlyingBar';

const PHASE_TONE: Record<Phase, 'up' | 'warn' | 'neutral'> = {
  continuous: 'up',
  auction: 'warn',
  expired: 'neutral',
};

interface SessionCard {
  expiryMs: number;
  phase: Phase;
  strikes: number;
  callVol: number;
  putVol: number;
  callOpen: number;
  putOpen: number;
  atm: SymbolLive | undefined;
}

function phaseOf(syms: SymbolLive[]): Phase {
  const phases = new Set(syms.map((s) => s.phase));
  if (phases.has('auction')) return 'auction';
  if (phases.size === 1 && phases.has('expired')) return 'expired';
  return 'continuous';
}

export function SessionsView() {
  const { store, sel, ready, setExpiry, selectSymbol } = useTerminal();
  useStoreSection(store, 'chain-rev');
  useStoreSection(store, 'chain');
  useStoreSection(store, 'underlying');
  const now = useServerClock(store, 1000);

  const cards = useMemo<SessionCard[]>(() => {
    if (sel.underlying === null) return [];
    const byExpiry = new Map<number, SymbolLive[]>();
    for (const s of store.symbols.values()) {
      if (s.underlying !== sel.underlying) continue;
      const arr = byExpiry.get(s.expiry_ms);
      if (arr) arr.push(s);
      else byExpiry.set(s.expiry_ms, [s]);
    }
    const mark = store.underlyings.get(sel.underlying)?.mark ?? 0;
    const out: SessionCard[] = [];
    for (const [expiryMs, syms] of byExpiry) {
      let callVol = 0;
      let putVol = 0;
      let callOpen = 0;
      let putOpen = 0;
      let atm: SymbolLive | undefined;
      for (const s of syms) {
        if (s.kind === 'call') {
          callVol += s.vol;
          callOpen += s.open > 0 ? 1 : 0;
        } else {
          putVol += s.vol;
          putOpen += s.open > 0 ? 1 : 0;
        }
        if (atm === undefined || Math.abs(s.strike - mark) < Math.abs(atm.strike - mark)) atm = s;
      }
      out.push({
        expiryMs,
        phase: phaseOf(syms),
        strikes: syms.length,
        callVol,
        putVol,
        callOpen,
        putOpen,
        atm,
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

  const highlighted = cards.find((c) => c.expiryMs === sel.expiryMs) ?? cards[0];
  const detailSyms = useMemo(() => {
    if (highlighted === undefined || sel.underlying === null) return [] as SymbolLive[];
    return [...store.symbols.values()]
      .filter((s) => s.underlying === sel.underlying && s.expiry_ms === highlighted.expiryMs)
      .sort((a, b) => a.strike - b.strike || (a.kind === 'call' ? -1 : 1));
  }, [store, sel.underlying, highlighted]);

  return (
    <div className="flex flex-col gap-4">
      <UnderlyingBar />

      {/* session cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cards.length === 0 &&
          (!ready && store.symbols.size === 0 ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <TableSkeleton rows={2} cols={3} label="loading sessions" />
            </div>
          ) : (
            <EmptyHint text="No listed sessions for this underlying" />
          ))}
        {cards.map((c) => {
          const cd = fmtCountdown(c.expiryMs - now);
          const active = highlighted !== undefined && highlighted.expiryMs === c.expiryMs;
          const totalVol = c.callVol + c.putVol;
          const callPct = totalVol > 0 ? Math.round((c.callVol / totalVol) * 100) : 50;
          return (
            <button
              key={c.expiryMs}
              type="button"
              onClick={() => setExpiry(c.expiryMs)}
              aria-pressed={active}
              className={`glass-panel top-highlight rise-in flex flex-col gap-3 rounded-xl p-4 text-left transition-all duration-200 ${
                active
                  ? 'ring-1 ring-accent/60'
                  : 'hover:-translate-y-px hover:ring-1 hover:ring-edge2/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[15px] font-bold tabular-nums text-txt">
                    {fmtHM(c.expiryMs)}
                  </span>
                  <Badge tone={PHASE_TONE[c.phase]}>{c.phase}</Badge>
                </div>
                <span
                  className={`font-mono text-[10px] font-semibold tabular-nums ${
                    cd.urgent && !cd.expired ? 'text-down-bright' : 'text-txt-dim'
                  }`}
                >
                  {cd.text}
                </span>
              </div>

              <div>
                <p className="font-sans text-[8px] font-bold tracking-[0.22em] text-txt-dim uppercase">
                  expires in
                </p>
                <p
                  className={`font-mono text-[22px] font-bold leading-tight tracking-tight tabular-nums ${
                    cd.expired ? 'text-txt-dim' : cd.urgent ? 'text-down-bright' : 'text-txt'
                  }`}
                >
                  {cd.expired ? 'settled' : cd.text}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] tabular-nums">
                <div>
                  <p className="font-sans text-[8px] font-bold tracking-[0.18em] text-txt-dim uppercase">
                    strikes
                  </p>
                  <p className="mt-0.5 font-semibold text-txt">{fmtInt(c.strikes)}</p>
                </div>
                <div>
                  <p className="font-sans text-[8px] font-bold tracking-[0.18em] text-txt-dim uppercase">
                    call vol
                  </p>
                  <p className="mt-0.5 font-semibold text-up-bright">{fmtInt(c.callVol)}</p>
                </div>
                <div>
                  <p className="font-sans text-[8px] font-bold tracking-[0.18em] text-txt-dim uppercase">
                    put vol
                  </p>
                  <p className="mt-0.5 font-semibold text-down-bright">{fmtInt(c.putVol)}</p>
                </div>
              </div>

              {/* call/put volume pressure bar */}
              <div>
                <div className="flex h-[5px] w-full overflow-hidden rounded-full bg-down/25" title={`calls ${fmtInt(c.callVol)} · puts ${fmtInt(c.putVol)}`}>
                  <span className="h-full bg-up-bright/70" style={{ width: `${callPct}%` }} />
                </div>
                <p className="mt-1.5 font-mono text-[9px] text-txt-dim">
                  {callPct}% call pressure · atm {c.atm !== undefined ? fmtTicks(c.atm.strike) : '—'}
                </p>
              </div>

              <span className="mt-auto flex items-center gap-1 font-sans text-[9px] font-bold tracking-[0.16em] text-accent-bright uppercase">
                open in chain
                <ChevronRight size={11} strokeWidth={2.2} aria-hidden />
              </span>
            </button>
          );
        })}
      </div>

      {/* highlighted session detail */}
      {highlighted !== undefined && detailSyms.length > 0 && (
        <Panel
          title={`Session ${fmtHM(highlighted.expiryMs)} · instruments`}
          right={
            <Link href="/chain" className="btn btn-ghost h-6 gap-1.5 text-[9px]">
              <Table2 size={11} strokeWidth={2} aria-hidden />
              full chain
            </Link>
          }
          className="min-h-[280px]"
          bodyClassName="overflow-x-auto"
        >
          <table className="w-full font-mono text-[11.5px] tabular-nums">
            <thead>
              <tr className="sticky top-0 z-10 bg-panel font-sans text-[9px] font-bold tracking-[0.14em] text-txt-dim uppercase">
                <th className="px-3 py-2 text-left font-bold">instrument</th>
                <th className="px-3 py-2 text-center font-bold">kind</th>
                <th className="px-3 py-2 text-right font-bold">strike</th>
                <th className="px-3 py-2 text-right font-bold">bid ×sz</th>
                <th className="px-3 py-2 text-right font-bold">ask ×sz</th>
                <th className="px-3 py-2 text-right font-bold">mark</th>
                <th className="px-3 py-2 text-right font-bold">open</th>
                <th className="px-3 py-2 text-right font-bold">vol</th>
                <th className="px-3 py-2 text-center font-bold">phase</th>
              </tr>
            </thead>
            <tbody>
              {detailSyms.map((s) => {
                const focused = s.symbol === sel.symbol;
                return (
                  <tr
                    key={s.symbol}
                    className={`h-[30px] cursor-pointer border-b border-edge/25 hover:bg-white/[0.03] ${
                      focused ? 'bg-accent/[0.08]' : ''
                    }`}
                    onClick={() => selectSymbol(s.symbol)}
                    title="Click to focus this instrument"
                  >
                    <td className="px-3 whitespace-nowrap font-semibold text-txt">
                      {s.kind === 'call' ? 'C' : 'P'} {fmtTicks(s.strike)}
                    </td>
                    <td className="px-3 text-center">
                      <span
                        className={`rounded-full border px-1.5 py-px text-[9px] font-bold tracking-[0.12em] uppercase ${
                          s.kind === 'call'
                            ? 'border-up/40 bg-up/10 text-up-bright'
                            : 'border-down/40 bg-down/10 text-down-bright'
                        }`}
                      >
                        {s.kind}
                      </span>
                    </td>
                    <td className="px-3 text-right text-txt">{fmtTicks(s.strike)}</td>
                    <td className="px-3 text-right whitespace-nowrap text-up-bright">
                      {s.bid > 0 ? `${fmtTicks(s.bid)} ×${fmtInt(s.bid_qty)}` : '—'}
                    </td>
                    <td className="px-3 text-right whitespace-nowrap text-down-bright">
                      {s.ask > 0 ? `${fmtTicks(s.ask)} ×${fmtInt(s.ask_qty)}` : '—'}
                    </td>
                    <td className="px-3 text-right text-txt">{fmtTicks(s.mark)}</td>
                    <td className="px-3 text-right text-txt-dim">{fmtTicks(s.open)}</td>
                    <td className="px-3 text-right text-txt-dim">{fmtInt(s.vol)}</td>
                    <td className="px-3 text-center">
                      <Badge tone={PHASE_TONE[s.phase]}>{s.phase.slice(0, 4)}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
