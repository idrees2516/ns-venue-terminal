'use client';

/**
 * BalancesCards — per-underlying account balances as glass stat cards:
 * cash / hold / margin required / margin reserved / available + lifetime
 * fees & rebates. Available funds carry the accent treatment.
 */
import { useTerminal } from '@/providers/TerminalProvider';
import { useStoreSection } from '@/lib/store';
import { fmtMoney } from '@/lib/format';

export function BalancesCards() {
  const { store } = useTerminal();
  useStoreSection(store, 'balances');

  const balances = [...store.balances.values()].sort((a, b) => a.underlying - b.underlying);

  if (balances.length === 0) {
    return (
      <div className="glass-panel rounded-xl px-5 py-6 text-center text-[11px] text-txt-dim">
        No balances loaded yet — the account refreshes every few seconds.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {balances.map((b) => (
        <section
          key={b.underlying}
          className="glass-panel top-highlight rounded-xl p-4"
          aria-label={`Balances for underlying ${b.underlying}`}
        >
          <header className="flex items-center justify-between">
            <h3 className="panel-title">U{b.underlying} account</h3>
            <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-txt-dim/60 uppercase">
              live
            </span>
          </header>
          <p className="mt-3 font-mono text-[24px] font-bold leading-none tracking-tight text-accent-bright tabular-nums">
            {fmtMoney(b.available)}
          </p>
          <p className="mt-1 font-sans text-[9px] font-bold tracking-[0.2em] text-txt-dim uppercase">
            available to trade
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[11px] tabular-nums">
            <Row label="cash" value={fmtMoney(b.cash)} />
            <Row label="hold" value={fmtMoney(b.hold)} />
            <Row label="margin req" value={fmtMoney(b.margin_required)} />
            <Row label="margin rsv" value={fmtMoney(b.margin_reserved)} />
            <Row label="fees paid" value={fmtMoney(b.fees_paid)} tone="down" />
            <Row label="rebates" value={fmtMoney(b.rebates_recv)} tone="up" />
          </dl>
        </section>
      ))}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-edge/30 pb-1">
      <dt className="font-sans text-[9px] font-bold tracking-[0.14em] text-txt-dim uppercase">
        {label}
      </dt>
      <dd
        className={`text-right font-semibold ${
          tone === 'up' ? 'text-up-bright/90' : tone === 'down' ? 'text-down-bright/90' : 'text-txt'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
