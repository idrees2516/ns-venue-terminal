'use client';

/**
 * FillsBlotter — this session's own-account executions as a full blotter:
 * engine timestamp, instrument, side, qty @ price, role (maker/taker) and the
 * exact fee/rebate in ticks, with integer-exact session aggregates (gross
 * premium, fees, rebates, net). Session-local by design — the venue's
 * authoritative account state is always one REST refresh away.
 */
import { useMemo } from 'react';
import { useTerminal } from '@/providers/TerminalProvider';
import { useStoreSection } from '@/lib/store';
import { fmtClock, fmtInt, fmtMoney, fmtTicks, mulInt } from '@/lib/format';
import { Panel } from '@/components/Panel';
import { EmptyHint } from '@/components/EmptyHint';
import { symbolLabel } from '@/components/chain/symbolLabel';

export function FillsBlotter() {
  const { store } = useTerminal();
  useStoreSection(store, 'fills');
  useStoreSection(store, 'chain');

  const rows = store.fills;

  const agg = useMemo(() => {
    let gross = 0; // signed premium in ticks (buy pays, sell receives)
    let fees = 0;
    let rebates = 0;
    let qty = 0;
    for (const f of rows) {
      const premium = mulInt(f.price, f.qty);
      if (premium !== null) gross += f.side === 'sell' ? premium : -premium;
      fees += f.fee;
      rebates += f.rebate;
      qty += f.qty;
    }
    return { gross, fees, rebates, qty, net: gross - fees + rebates };
  }, [rows]);

  return (
    <Panel
      title="Session blotter"
      right={<span className="font-mono text-[10px] text-txt-dim tabular-nums">{rows.length} fills</span>}
      className="min-h-[420px]"
      bodyClassName="overflow-x-auto"
    >
      {rows.length === 0 ? (
        <EmptyHint text="No fills this session yet — orders you submit fill here in real time" />
      ) : (
        <table className="w-full font-mono text-[11.5px] tabular-nums">
          <thead>
            <tr className="sticky top-0 z-10 bg-panel font-sans text-[9px] font-bold tracking-[0.14em] text-txt-dim uppercase">
              <th className="px-3 py-2 text-left font-bold">time</th>
              <th className="px-3 py-2 text-left font-bold">instrument</th>
              <th className="px-3 py-2 text-center font-bold">side</th>
              <th className="px-3 py-2 text-right font-bold">qty @ price</th>
              <th className="px-3 py-2 text-center font-bold">role</th>
              <th className="px-3 py-2 text-right font-bold">premium</th>
              <th className="px-3 py-2 text-right font-bold">fee</th>
              <th className="px-3 py-2 text-right font-bold">rebate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const premium = mulInt(f.price, f.qty);
              const signed = premium !== null ? (f.side === 'sell' ? premium : -premium) : null;
              return (
                <tr key={`${f.order}-${f.ms}-${i}`} className="h-[32px] border-b border-edge/25 hover:bg-white/[0.03]">
                  <td className="px-3 whitespace-nowrap text-txt-dim">{fmtClock(f.ms)}</td>
                  <td className="px-3 whitespace-nowrap font-semibold text-txt">
                    {symbolLabel(store.symbols.get(f.symbol))}
                  </td>
                  <td
                    className={`px-3 text-center font-bold uppercase ${
                      f.side === 'buy' ? 'text-up-bright' : f.side === 'sell' ? 'text-down-bright' : 'text-txt-dim'
                    }`}
                  >
                    {f.side ?? '—'}
                  </td>
                  <td className="px-3 whitespace-nowrap text-right">
                    {fmtInt(f.qty)} <span className="text-txt-dim">@</span> {fmtTicks(f.price)}
                  </td>
                  <td className="px-3 text-center">
                    <span
                      className={`rounded-full border px-1.5 py-px text-[9px] font-bold tracking-[0.12em] uppercase ${
                        f.role === 'maker'
                          ? 'border-accent/40 bg-accent/10 text-accent-bright'
                          : 'border-warn/40 bg-warn/10 text-warn-bright'
                      }`}
                    >
                      {f.role}
                    </span>
                  </td>
                  <td
                    className={`px-3 text-right whitespace-nowrap ${
                      signed !== null && signed > 0 ? 'text-up-bright' : 'text-down-bright'
                    }`}
                  >
                    {signed !== null ? fmtMoney(signed) : '—'}
                  </td>
                  <td className="px-3 text-right whitespace-nowrap text-txt-dim">
                    {f.fee > 0 ? `${f.fee}t` : '—'}
                  </td>
                  <td className="px-3 text-right whitespace-nowrap text-txt-dim">
                    {f.rebate > 0 ? `${f.rebate}t` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-edge/60 bg-panel-2/40 font-mono text-[11px] tabular-nums">
              <td colSpan={3} className="px-3 py-2.5 font-sans text-[9px] font-bold tracking-[0.14em] text-txt-dim uppercase">
                session totals · {fmtInt(agg.qty)} contracts
              </td>
              <td className="px-3 py-2.5 text-right font-bold text-txt">{fmtMoney(agg.gross)}</td>
              <td />
              <td
                className={`px-3 py-2.5 text-right font-bold ${
                  agg.net >= 0 ? 'text-up-bright' : 'text-down-bright'
                }`}
              >
                net {fmtMoney(agg.net)}
              </td>
              <td className="px-3 py-2.5 text-right text-txt-dim">{agg.fees}t</td>
              <td className="px-3 py-2.5 text-right text-txt-dim">{agg.rebates}t</td>
            </tr>
          </tfoot>
        </table>
      )}
    </Panel>
  );
}
