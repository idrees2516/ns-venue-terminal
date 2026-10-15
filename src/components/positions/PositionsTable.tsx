'use client';

/**
 * PositionsTable — the Positions section table: every open position with
 * instrument anatomy (kind, strike, expiry), signed qty, live client-side
 * intrinsic per contract (integer math), position value, margin and delta
 * notional — full-width with generous rows.
 */
import { useTerminal } from '@/providers/TerminalProvider';
import { useStoreSection } from '@/lib/store';
import { fmtMoney, fmtQty, fmtTicks, fmtTicksSigned, mulInt } from '@/lib/format';
import { fmtHM } from '@/lib/format';
import { Panel } from '@/components/Panel';
import { EmptyHint } from '@/components/EmptyHint';
import { symbolLabel } from '@/components/chain/symbolLabel';

export function PositionsTable() {
  const { store } = useTerminal();
  useStoreSection(store, 'positions');
  useStoreSection(store, 'chain');
  useStoreSection(store, 'underlying'); // live marks move the intrinsic

  const rows = [...store.positions.values()]
    .map((p) => {
      const sym = store.symbols.get(p.symbol);
      const und = sym !== undefined ? store.underlyings.get(sym.underlying) : undefined;
      let perCt: number | null = null;
      if (sym !== undefined && und !== undefined) {
        perCt =
          sym.kind === 'call'
            ? Math.max(0, und.mark - sym.strike)
            : Math.max(0, sym.strike - und.mark);
      }
      const absValue = perCt !== null ? mulInt(perCt, Math.abs(p.qty)) : null;
      const value = absValue !== null ? (p.qty >= 0 ? absValue : -absValue) : null;
      return { p, sym, und, perCt, value };
    })
    .sort((a, b) => a.p.symbol - b.p.symbol);

  // account-level aggregates (integer ticks)
  let totalValue = 0;
  let totalMargin = 0;
  let hasValue = false;
  for (const r of rows) {
    if (r.value !== null) {
      totalValue += r.value;
      hasValue = true;
    }
    totalMargin += r.p.margin;
  }

  return (
    <Panel
      title="Open positions"
      right={
        <span className="font-mono text-[10px] text-txt-dim tabular-nums">
          {rows.length} {rows.length > 0 && '· value'}{' '}
          {rows.length > 0 && hasValue ? (
            <span className={totalValue >= 0 ? 'text-up-bright' : 'text-down-bright'}>
              {fmtTicksSigned(totalValue)}
            </span>
          ) : (
            ''
          )}
        </span>
      }
      className="min-h-[380px]"
      bodyClassName="overflow-x-auto"
    >
      {rows.length === 0 ? (
        <EmptyHint text="Flat — no open positions" />
      ) : (
        <table className="w-full font-mono text-[11.5px] tabular-nums">
          <thead>
            <tr className="sticky top-0 z-10 bg-panel font-sans text-[9px] font-bold tracking-[0.14em] text-txt-dim uppercase">
              <th className="px-3 py-2 text-left font-bold">instrument</th>
              <th className="px-3 py-2 text-center font-bold">kind</th>
              <th className="px-3 py-2 text-right font-bold">qty</th>
              <th className="px-3 py-2 text-right font-bold">und mark</th>
              <th className="px-3 py-2 text-right font-bold">intrinsic / ct</th>
              <th className="px-3 py-2 text-right font-bold">value</th>
              <th className="px-3 py-2 text-right font-bold">margin</th>
              <th className="px-3 py-2 text-right font-bold">delta notional</th>
              <th className="px-3 py-2 text-right font-bold">expires</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, sym, und, perCt, value }) => (
              <tr key={p.symbol} className="h-[34px] border-b border-edge/25 hover:bg-white/[0.03]">
                <td className="px-3 whitespace-nowrap font-semibold text-txt">
                  {symbolLabel(sym)}
                </td>
                <td className="px-3 text-center">
                  <span
                    className={`rounded-full border px-1.5 py-px text-[9px] font-bold tracking-[0.12em] uppercase ${
                      sym?.kind === 'call'
                        ? 'border-up/40 bg-up/10 text-up-bright'
                        : 'border-down/40 bg-down/10 text-down-bright'
                    }`}
                  >
                    {sym?.kind ?? '—'}
                  </span>
                </td>
                <td
                  className={`px-3 text-right font-bold whitespace-nowrap ${
                    p.qty > 0 ? 'text-up-bright' : p.qty < 0 ? 'text-down-bright' : 'text-txt-dim'
                  }`}
                >
                  {fmtQty(p.qty)}
                </td>
                <td className="px-3 text-right whitespace-nowrap text-txt">
                  {und !== undefined ? fmtTicks(und.mark) : '—'}
                </td>
                <td className="px-3 text-right whitespace-nowrap text-txt-dim">
                  {perCt !== null ? fmtTicks(perCt) : '—'}
                </td>
                <td
                  className={`px-3 text-right font-semibold whitespace-nowrap ${
                    value !== null && value > 0
                      ? 'text-up-bright'
                      : value !== null && value < 0
                        ? 'text-down-bright'
                        : 'text-txt'
                  }`}
                >
                  {value !== null ? fmtTicksSigned(value) : '—'}
                </td>
                <td className="px-3 text-right whitespace-nowrap text-txt">
                  {fmtMoney(p.margin)}
                </td>
                <td className="px-3 text-right whitespace-nowrap text-txt-dim">
                  {fmtTicksSigned(p.delta_notional)}
                </td>
                <td className="px-3 text-right whitespace-nowrap text-txt-dim">
                  {sym !== undefined ? fmtHM(sym.expiry_ms) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-edge/60 bg-panel-2/40 font-mono text-[11px] tabular-nums">
              <td className="px-3 py-2 font-sans text-[9px] font-bold tracking-[0.14em] text-txt-dim uppercase" colSpan={5}>
                totals
              </td>
              <td
                className={`px-3 py-2 text-right font-bold ${
                  hasValue && totalValue >= 0 ? 'text-up-bright' : 'text-down-bright'
                }`}
              >
                {hasValue ? fmtTicksSigned(totalValue) : '—'}
              </td>
              <td className="px-3 py-2 text-right text-txt">{fmtMoney(totalMargin)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      )}
    </Panel>
  );
}
