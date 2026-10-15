'use client';

/**
 * /dashboard — the overview section.
 *
 * Composed, capped-width layout for laptop screens: a row of live stat cards
 * (mark, session countdown, working orders, positions, available funds,
 * focused volume), then a widget grid — session-at-a-glance mini chain,
 * focused tape, account summary — with quick links into the focus sections.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  BookOpen,
  Briefcase,
  ListOrdered,
  Table2,
  Wallet,
  Zap,
} from 'lucide-react';
import { useTerminal } from '@/providers/TerminalProvider';
import { useServerClock, useStoreSection, type SymbolLive } from '@/lib/store';
import { fmtCountdown, fmtClockMs, fmtHM, fmtInt, fmtMoney, fmtTicks, fmtTicksSigned } from '@/lib/format';
import { Badge } from '@/components/StatusDot';
import { symbolLabel } from '@/components/chain/symbolLabel';
import { PanelErrorBoundary } from '@/components/ErrorBoundary';
import { PageHeader, PageScroll } from '@/components/shell/PageHeader';

export default function DashboardPage() {
  return (
    <PageScroll>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        lede="The whole venue at a glance — underlying marks, the next 0DTE expiry, your working orders and funds, and the focused instrument's live tape."
        right={
          <>
            <Link href="/orderbook" className="btn btn-ghost h-8 gap-1.5 text-[9.5px]">
              <BookOpen size={11} strokeWidth={2} aria-hidden />
              Order Book
            </Link>
            <Link href="/chain" className="btn btn-ghost h-8 gap-1.5 text-[9.5px]">
              <Table2 size={11} strokeWidth={2} aria-hidden />
              Calls &amp; Puts
            </Link>
            <Link href="/execute" className="btn btn-accent h-8 gap-1.5 text-[9.5px]">
              <Zap size={11} strokeWidth={2} aria-hidden />
              Execute
            </Link>
          </>
        }
      />
      <div className="flex flex-col gap-4">
        <PanelErrorBoundary title="Stats">
          <StatRow />
        </PanelErrorBoundary>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <PanelErrorBoundary title="Chain glance">
              <ChainGlance />
            </PanelErrorBoundary>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <PanelErrorBoundary title="Tape">
              <TapeGlance />
            </PanelErrorBoundary>
            <PanelErrorBoundary title="Account">
              <AccountGlance />
            </PanelErrorBoundary>
          </div>
        </div>
      </div>
    </PageScroll>
  );
}

function StatRow() {
  const { store, sel } = useTerminal();
  useStoreSection(store, 'underlying');
  useStoreSection(store, 'chain');
  useStoreSection(store, 'orders');
  useStoreSection(store, 'positions');
  useStoreSection(store, 'balances');
  useStoreSection(store, 'clock');
  const now = useServerClock(store, 1000);

  const u = sel.underlying !== null ? store.underlyings.get(sel.underlying) : undefined;
  const delta = u ? u.mark - u.ref : 0;
  const orders = store.orders.size;
  const positions = store.positions.size;
  const balances = [...store.balances.values()];
  const available = balances.reduce((acc, b) => acc + b.available, 0);

  // next expiry across the underlying's sessions
  const nextExpiry = useMemo(() => {
    let best: number | null = null;
    for (const s of store.symbols.values()) {
      if (sel.underlying !== null && s.underlying !== sel.underlying) continue;
      if (s.expiry_ms < now) continue;
      if (best === null || s.expiry_ms < best) best = s.expiry_ms;
    }
    return best;
  }, [store, sel.underlying, now]);
  const cd = nextExpiry !== null ? fmtCountdown(nextExpiry - now) : null;
  const focused = sel.symbol !== null ? store.symbols.get(sel.symbol) : undefined;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <StatCard
        icon={<Activity size={13} strokeWidth={2} aria-hidden />}
        label={u ? `U${u.underlying} mark` : 'underlying'}
        value={u ? fmtTicks(u.mark) : '—'}
        sub={
          u ? (
            <span className={delta >= 0 ? 'text-up-bright' : 'text-down-bright'}>
              {delta >= 0 ? '▲' : '▼'} {fmtTicksSigned(delta)}
            </span>
          ) : undefined
        }
      />
      <StatCard
        icon={<Zap size={13} strokeWidth={2} aria-hidden />}
        label="next expiry"
        value={cd ? cd.text : '—'}
        sub={cd ? <span>session {nextExpiry !== null ? fmtHM(nextExpiry) : ''}</span> : undefined}
        tone={cd?.urgent ? 'warn' : undefined}
      />
      <StatCard
        icon={<ListOrdered size={13} strokeWidth={2} aria-hidden />}
        label="working orders"
        value={fmtInt(orders)}
        sub={<Link href="/orders" className="text-accent-bright hover:underline">manage →</Link>}
      />
      <StatCard
        icon={<Briefcase size={13} strokeWidth={2} aria-hidden />}
        label="positions"
        value={fmtInt(positions)}
        sub={<Link href="/positions" className="text-accent-bright hover:underline">portfolio →</Link>}
      />
      <StatCard
        icon={<Wallet size={13} strokeWidth={2} aria-hidden />}
        label="available"
        value={fmtMoney(available)}
        sub={balances.length > 0 ? <span>{balances.length} underlying{balances.length > 1 ? 's' : ''}</span> : undefined}
      />
      <StatCard
        icon={<BookOpen size={13} strokeWidth={2} aria-hidden />}
        label="focused volume"
        value={focused ? fmtInt(focused.vol) : '—'}
        sub={
          focused ? (
            <span className="font-mono">{fmtTicks(focused.strike)} {focused.kind}</span>
          ) : (
            <Link href="/chain" className="text-accent-bright hover:underline">pick instrument →</Link>
          )
        }
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: React.ReactNode;
  tone?: 'warn';
}) {
  return (
    <div className="glass-panel top-highlight rise-in rounded-xl p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-sans text-[8.5px] font-bold tracking-[0.18em] text-txt-dim uppercase">
          {label}
        </p>
        <span className="text-txt-dim/60" aria-hidden>
          {icon}
        </span>
      </div>
      <p
        className={`mt-2.5 font-mono text-[19px] font-bold leading-none tracking-tight tabular-nums ${
          tone === 'warn' ? 'text-warn-bright' : 'text-txt'
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-2 font-mono text-[10px] tabular-nums text-txt-dim">{sub}</p>}
    </div>
  );
}

/** ATM ± 3 strike mini-chain for the selected expiry session. */
function ChainGlance() {
  const { store, sel, setExpiry, selectSymbol } = useTerminal();
  useStoreSection(store, 'chain');
  useStoreSection(store, 'chain-rev');
  useStoreSection(store, 'underlying');

  const rows = useMemo(() => {
    if (sel.underlying === null) return [] as { strike: number; call?: SymbolLive; put?: SymbolLive }[];
    const syms = [...store.symbols.values()].filter(
      (s) => s.underlying === sel.underlying && (sel.expiryMs === null || s.expiry_ms === sel.expiryMs),
    );
    if (syms.length === 0) return [];
    const expiries = new Set(syms.map((s) => s.expiry_ms));
    const byStrike = new Map<number, { strike: number; call?: SymbolLive; put?: SymbolLive }>();
    for (const s of syms) {
      const row = byStrike.get(s.strike) ?? { strike: s.strike };
      if (s.kind === 'call') row.call = s;
      else row.put = s;
      byStrike.set(s.strike, row);
    }
    const mark = store.underlyings.get(sel.underlying)?.mark ?? 0;
    const all = [...byStrike.values()].sort((a, b) => a.strike - b.strike);
    let atmIdx = 0;
    for (let i = 0; i < all.length; i++) {
      if (Math.abs(all[i]!.strike - mark) < Math.abs(all[atmIdx]!.strike - mark)) atmIdx = i;
    }
    const out = all.slice(Math.max(0, atmIdx - 3), atmIdx + 4);
    // expiry tabs when more than one session exists
    void expiries;
    return out;
  }, [store, sel.underlying, sel.expiryMs]);

  const mark = sel.underlying !== null ? store.underlyings.get(sel.underlying)?.mark : undefined;
  const atm = useMemo(() => {
    if (mark === undefined) return null;
    let best: number | null = null;
    for (const r of rows) {
      if (best === null || Math.abs(r.strike - mark) < Math.abs(best - mark)) best = r.strike;
    }
    return best;
  }, [rows, mark]);

  const expiryTabs = useMemo(() => {
    if (sel.underlying === null) return [] as number[];
    const set = new Set<number>();
    for (const s of store.symbols.values()) {
      if (s.underlying === sel.underlying) set.add(s.expiry_ms);
    }
    return [...set].sort((a, b) => a - b);
  }, [store, sel.underlying]);

  return (
    <div className="glass-panel rounded-xl p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="panel-title">Session at a glance · ATM ladder</h3>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Expiry quick switch">
          {expiryTabs.slice(0, 4).map((ms) => (
            <button
              key={ms}
              type="button"
              role="tab"
              aria-selected={ms === sel.expiryMs}
              onClick={() => setExpiry(ms)}
              className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums transition-colors ${
                ms === sel.expiryMs
                  ? 'border-accent-bright/50 bg-accent/15 text-accent-bright'
                  : 'border-edge/70 text-txt-dim hover:border-edge2 hover:text-txt'
              }`}
            >
              {fmtHM(ms)}
            </button>
          ))}
        </div>
      </header>

      <table className="mt-3 w-full font-mono text-[11.5px] tabular-nums">
        <thead>
          <tr className="font-sans text-[8.5px] font-bold tracking-[0.16em] text-txt-dim uppercase">
            <th className="pb-1.5 text-left font-bold">call bid / ask</th>
            <th className="pb-1.5 text-right font-bold">call vol</th>
            <th className="pb-1.5 text-center font-bold">strike</th>
            <th className="pb-1.5 text-left font-bold">put vol</th>
            <th className="pb-1.5 text-right font-bold">put bid / ask</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 text-center font-sans text-[11px] text-txt-dim">
                No sessions listed yet — waiting on the venue feed.
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const focusedCall = r.call?.symbol === sel.symbol;
              const focusedPut = r.put?.symbol === sel.symbol;
              return (
                <tr key={r.strike} className="h-[30px] border-b border-edge/25 hover:bg-white/[0.03]">
                  <td className="w-[26%]">
                    {r.call ? (
                      <button
                        type="button"
                        onClick={() => selectSymbol(r.call!.symbol)}
                        className={`w-full text-left ${focusedCall ? 'text-accent-bright' : 'text-up-bright hover:underline'}`}
                      >
                        {r.call.bid > 0 ? fmtTicks(r.call.bid) : '—'} /{' '}
                        {r.call.ask > 0 ? fmtTicks(r.call.ask) : '—'}
                      </button>
                    ) : (
                      <span className="text-txt-dim/30">—</span>
                    )}
                  </td>
                  <td className="w-[14%] text-right text-txt-dim">
                    {r.call ? fmtInt(r.call.vol) : '—'}
                  </td>
                  <td
                    className={`w-[20%] text-center font-bold ${
                      r.strike === atm ? 'bg-accent/10 text-accent-bright' : 'text-txt'
                    }`}
                  >
                    {fmtTicks(r.strike)}
                  </td>
                  <td className="w-[14%] text-left text-txt-dim">
                    {r.put ? fmtInt(r.put.vol) : '—'}
                  </td>
                  <td className="w-[26%] text-right">
                    {r.put ? (
                      <button
                        type="button"
                        onClick={() => selectSymbol(r.put!.symbol)}
                        className={`w-full text-right ${focusedPut ? 'text-accent-bright' : 'text-down-bright hover:underline'}`}
                      >
                        {r.put.bid > 0 ? fmtTicks(r.put.bid) : '—'} /{' '}
                        {r.put.ask > 0 ? fmtTicks(r.put.ask) : '—'}
                      </button>
                    ) : (
                      <span className="text-txt-dim/30">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <p className="mt-2 font-mono text-[9px] text-txt-dim/60">
        click any quote to focus it across the terminal
      </p>
    </div>
  );
}

function TapeGlance() {
  const { store, sel } = useTerminal();
  useStoreSection(store, 'tape');
  useStoreSection(store, 'chain');

  const sym = sel.symbol !== null ? store.symbols.get(sel.symbol) : undefined;
  const trades = sel.symbol !== null ? (store.tape.get(sel.symbol) ?? []).slice(0, 9) : [];

  return (
    <div className="glass-panel rounded-xl p-4">
      <header className="flex items-center justify-between gap-2">
        <h3 className="panel-title">Focused tape</h3>
        <span className="font-mono text-[9.5px] text-txt-dim">{symbolLabel(sym)}</span>
      </header>
      {trades.length === 0 ? (
        <p className="mt-4 text-[11px] leading-relaxed text-txt-dim">
          No prints yet for the focused instrument{sym ? '' : ' — pick one from the chain glance'}.
        </p>
      ) : (
        <div className="mt-2.5 font-mono text-[11px] tabular-nums">
          {trades.map((t, i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_minmax(64px,84px)_minmax(36px,54px)] items-center border-b border-edge/20 py-1 last:border-0"
            >
              <span className="text-txt-dim">{fmtClockMs(t.ms)}</span>
              <span
                className={`text-right font-bold ${
                  t.aggressor === 'buy' ? 'text-up-bright' : t.aggressor === 'sell' ? 'text-down-bright' : 'text-warn-bright'
                }`}
              >
                {fmtTicks(t.price)}
              </span>
              <span className="text-right text-txt-dim">{fmtInt(t.qty)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountGlance() {
  const { store } = useTerminal();
  useStoreSection(store, 'balances');
  useStoreSection(store, 'account');

  const balances = [...store.balances.values()].sort((a, b) => a.underlying - b.underlying);

  return (
    <div className="glass-panel rounded-xl p-4">
      <header className="flex items-center justify-between gap-2">
        <h3 className="panel-title">Account</h3>
        {store.account && (
          <Badge tone="up">
            acct {store.account.account} · {store.account.tier}
          </Badge>
        )}
      </header>
      {balances.length === 0 ? (
        <p className="mt-4 text-[11px] text-txt-dim">Balances load with the first account refresh.</p>
      ) : (
        <dl className="mt-3 flex flex-col gap-2 font-mono text-[11px] tabular-nums">
          {balances.map((b) => (
            <div key={b.underlying} className="flex items-baseline justify-between gap-3 border-b border-edge/25 pb-2 last:border-0">
              <dt className="font-sans text-[9px] font-bold tracking-[0.16em] text-txt-dim uppercase">
                U{b.underlying} available
              </dt>
              <dd className="font-semibold text-accent-bright">{fmtMoney(b.available)}</dd>
            </div>
          ))}
        </dl>
      )}
      <Link href="/positions" className="btn btn-ghost mt-3 h-7 w-full text-[9px]">
        full portfolio
      </Link>
    </div>
  );
}
