'use client';

/**
 * ExecuteSidePanel — the decision support column next to the order ticket:
 * focused instrument BBO with sizes, compact top-of-book (click loads the
 * price into the shared ticket), and this session's own fill blotter so the
 * outcome of every submission is immediately visible.
 */
import { useTerminal } from '@/providers/TerminalProvider';
import { useStoreSection } from '@/lib/store';
import { fmtClock, fmtInt, fmtTicks } from '@/lib/format';
import { symbolLabel } from '@/components/chain/symbolLabel';
import { EmptyHint } from '@/components/EmptyHint';

export function ExecuteSidePanel() {
  const { store, sel, patchTicket } = useTerminal();
  useStoreSection(store, 'depth');
  useStoreSection(store, 'chain');
  useStoreSection(store, 'fills');

  const sym = sel.symbol !== null ? store.symbols.get(sel.symbol) : undefined;
  const frame = sel.symbol !== null ? store.depth.get(sel.symbol) : undefined;
  const asks = (frame?.asks ?? []).slice(0, 5);
  const bids = (frame?.bids ?? []).slice(0, 5);
  const fills = store.fills.slice(0, 14);

  const pick = (price: number): void => {
    patchTicket({ priceStr: fmtTicks(price) });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-3 md:p-4">
      {/* focused instrument */}
      <div className="glass-panel flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl px-4 py-3">
        <span className="font-mono text-[13px] font-bold tracking-tight text-txt">
          {symbolLabel(sym)}
        </span>
        {sym !== undefined ? (
          <div className="flex items-center gap-4 font-mono text-[11px] tabular-nums">
            <span className="text-txt-dim">
              bid <span className="font-bold text-up-bright">{sym.bid > 0 ? fmtTicks(sym.bid) : '—'}</span>{' '}
              ×{fmtInt(sym.bid_qty)}
            </span>
            <span className="text-txt-dim">
              ask <span className="font-bold text-down-bright">{sym.ask > 0 ? fmtTicks(sym.ask) : '—'}</span>{' '}
              ×{fmtInt(sym.ask_qty)}
            </span>
            <span className="text-txt-dim">
              mark <span className="font-bold text-txt">{fmtTicks(sym.mark)}</span>
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-txt-dim">no instrument focused</span>
        )}
      </div>

      {/* compact top of book */}
      <div className="glass-panel rounded-xl">
        <p className="panel-title border-b border-edge/60 px-4 py-2.5">Top of book</p>
        <div className="grid grid-cols-[minmax(70px,1fr)_minmax(54px,72px)] font-mono text-[11.5px] tabular-nums">
          {[...asks].reverse().map((l, i) => (
            <button
              key={`ka${i}-${l[0]}`}
              type="button"
              onClick={() => pick(l[0])}
              className="col-span-2 grid grid-cols-subgrid items-center border-b border-edge/20 px-4 py-1.5 text-left hover:bg-white/[0.035]"
              title="Click to load this price into the ticket"
            >
              <span className="font-bold text-down-bright">{fmtTicks(l[0])}</span>
              <span className="text-right text-txt-dim">{fmtInt(l[1])}</span>
            </button>
          ))}
          <div className="col-span-2 grid grid-cols-subgrid items-center bg-panel-2/70 px-4 py-1.5 font-sans text-[9px] font-bold tracking-[0.18em] text-txt-dim uppercase">
            <span>price</span>
            <span className="text-right">qty</span>
          </div>
          {bids.map((l, i) => (
            <button
              key={`kb${i}-${l[0]}`}
              type="button"
              onClick={() => pick(l[0])}
              className="col-span-2 grid grid-cols-subgrid items-center border-b border-edge/20 px-4 py-1.5 text-left hover:bg-white/[0.035]"
              title="Click to load this price into the ticket"
            >
              <span className="font-bold text-up-bright">{fmtTicks(l[0])}</span>
              <span className="text-right text-txt-dim">{fmtInt(l[1])}</span>
            </button>
          ))}
          {asks.length === 0 && bids.length === 0 && (
            <div className="col-span-2 py-3">
              <EmptyHint text={sel.symbol === null ? 'Focus a symbol first' : 'No depth yet'} />
            </div>
          )}
        </div>
      </div>

      {/* session fills */}
      <div className="glass-panel flex min-h-0 flex-1 flex-col rounded-xl">
        <p className="panel-title border-b border-edge/60 px-4 py-2.5">
          Session fills <span className="ml-1 normal-case tracking-normal text-txt-dim/60">({fills.length})</span>
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {fills.length === 0 ? (
            <EmptyHint text="No fills this session — submit an order from the ticket" />
          ) : (
            <div className="font-mono text-[11.5px] tabular-nums">
              {fills.map((f, i) => (
                <div
                  key={`${f.order}-${f.ms}-${i}`}
                  className="grid grid-cols-[minmax(64px,84px)_minmax(0,1fr)_minmax(40px,54px)_minmax(64px,84px)_minmax(54px,74px)] items-center gap-x-3 border-b border-edge/20 px-4 py-1.5 odd:bg-white/[0.012]"
                >
                  <span className="text-txt-dim">{fmtClock(f.ms)}</span>
                  <span className="truncate text-txt">{symbolLabel(store.symbols.get(f.symbol))}</span>
                  <span
                    className={`text-right font-bold ${f.side === 'buy' ? 'text-up-bright' : f.side === 'sell' ? 'text-down-bright' : 'text-txt-dim'}`}
                  >
                    {f.side ?? '·'}
                  </span>
                  <span className="text-right text-txt">
                    {fmtInt(f.qty)} @ {fmtTicks(f.price)}
                  </span>
                  <span className="text-right text-[10px] text-txt-dim">
                    {f.role}
                    {f.fee > 0 ? ` ·${f.fee}t` : ''}
                    {f.rebate > 0 ? ` +${f.rebate}t` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
