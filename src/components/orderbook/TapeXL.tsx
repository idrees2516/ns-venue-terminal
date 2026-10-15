'use client';

/**
 * TapeXL — full-height time & sales for the focused symbol with aggressor
 * coloring, millisecond timestamps and a footer strip of live tape stats
 * (total volume, trade count, tape high/low, buy/sell pressure).
 */
import { useTerminal } from '@/providers/TerminalProvider';
import { useStoreSection } from '@/lib/store';
import { fmtClockMs, fmtInt, fmtTicks } from '@/lib/format';
import type { Aggressor, TapeTrade } from '@/lib/types';
import { Panel } from '@/components/Panel';
import { EmptyHint } from '@/components/EmptyHint';
import { symbolLabel } from '@/components/chain/symbolLabel';

const AGGRESSOR_COLOR: Record<Aggressor, string> = {
  buy: 'text-up-bright',
  sell: 'text-down-bright',
  auction: 'text-warn-bright',
};

export function TapeXL() {
  const { store, sel } = useTerminal();
  useStoreSection(store, 'tape');

  const sym = sel.symbol !== null ? store.symbols.get(sel.symbol) : undefined;
  const trades = sel.symbol !== null ? (store.tape.get(sel.symbol) ?? []) : [];

  let vol = 0;
  let buys = 0;
  let sells = 0;
  let hi: number | null = null;
  let lo: number | null = null;
  for (const t of trades) {
    vol += t.qty;
    if (t.aggressor === 'buy') buys += t.qty;
    if (t.aggressor === 'sell') sells += t.qty;
    if (hi === null || t.price > hi) hi = t.price;
    if (lo === null || t.price < lo) lo = t.price;
  }
  const pressure = buys + sells > 0 ? Math.round((buys / (buys + sells)) * 100) : null;

  return (
    <Panel
      title="Time & sales"
      right={
        <>
          <span className="font-mono text-[10px] text-txt-dim tabular-nums">{trades.length}</span>
          <span className="hidden font-mono text-[10px] text-txt-dim sm:inline">
            {symbolLabel(sym)}
          </span>
        </>
      }
      className="h-full min-h-0"
      bodyClassName="flex min-h-0 flex-col"
    >
      {sel.symbol === null ? (
        <EmptyHint text="Focus a symbol to stream its tape" />
      ) : (
        <>
          <div className="grid shrink-0 grid-cols-[minmax(88px,104px)_minmax(70px,90px)_minmax(48px,64px)_minmax(64px,84px)] border-b border-edge/60 px-4 py-1.5 font-sans text-[8.5px] font-bold tracking-[0.16em] text-txt-dim uppercase">
            <span>time</span>
            <span className="text-right">price</span>
            <span className="text-right">qty</span>
            <span className="text-right">side</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto" aria-label="Recent trades">
            {trades.length === 0 ? (
              <EmptyHint text="No trades yet for this symbol" />
            ) : (
              trades.map((t, i) => <TapeRow key={i} t={t} />)
            )}
          </div>
          {/* tape stats footer */}
          <div className="grid shrink-0 grid-cols-2 items-center gap-x-6 gap-y-1 border-t border-edge/60 bg-panel-2/50 px-4 py-2 font-mono text-[10px] tabular-nums sm:grid-cols-4">
            <TapeStat label="tape vol" value={fmtInt(vol)} />
            <TapeStat label="hi / lo" value={hi !== null && lo !== null ? `${fmtTicks(hi)} / ${fmtTicks(lo)}` : '—'} />
            <TapeStat label="trades" value={fmtInt(trades.length)} />
            <div>
              <p className="font-sans text-[8px] font-bold tracking-[0.2em] text-txt-dim uppercase">
                pressure
              </p>
              {pressure !== null ? (
                <div className="mt-1 flex h-[5px] w-full overflow-hidden rounded-full bg-down/30" title={`${buys} buy vs ${sells} sell`}>
                  <span className="h-full bg-up-bright/80" style={{ width: `${pressure}%` }} />
                </div>
              ) : (
                <p className="text-[10px] text-txt-dim">—</p>
              )}
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}

function TapeRow({ t }: { t: TapeTrade }) {
  return (
    <div className="grid h-[26px] grid-cols-[minmax(88px,104px)_minmax(70px,90px)_minmax(48px,64px)_minmax(64px,84px)] items-center px-4 font-mono text-[11.5px] tabular-nums odd:bg-white/[0.012] hover:bg-white/[0.03] xl:h-[29px]">
      <span className="text-txt-dim">{fmtClockMs(t.ms)}</span>
      <span className={`text-right font-bold ${AGGRESSOR_COLOR[t.aggressor]}`}>{fmtTicks(t.price)}</span>
      <span className="text-right text-txt">{fmtInt(t.qty)}</span>
      <span className={`text-right text-[9px] font-bold tracking-[0.14em] uppercase ${AGGRESSOR_COLOR[t.aggressor]}`}>
        {t.aggressor}
      </span>
    </div>
  );
}

function TapeStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-sans text-[8px] font-bold tracking-[0.2em] text-txt-dim uppercase">{label}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-txt">{value}</p>
    </div>
  );
}
