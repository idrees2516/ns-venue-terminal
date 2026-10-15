'use client';

/**
 * OrdersTable — the Open Orders section: a full-width working-order table
 * with every order attribute surfaced (id, instrument, side, price, leaves /
 * qty, kind, TIF, flags, placed-at) plus per-row cancel and cancel-all.
 * Larger rows and sticky header — readable at laptop widths instead of the
 * old cramped side panel.
 */
import { useState } from 'react';
import { X } from 'lucide-react';
import { useTerminal } from '@/providers/TerminalProvider';
import { useStoreSection } from '@/lib/store';
import { fmtClock, fmtInt, fmtTicks } from '@/lib/format';
import { Panel } from '@/components/Panel';
import { EmptyHint } from '@/components/EmptyHint';
import { symbolLabel } from '@/components/chain/symbolLabel';

export function OrdersTable() {
  const { store, cancelOrder, cancelAll } = useTerminal();
  useStoreSection(store, 'orders');

  const [busy, setBusy] = useState(false);
  const rows = [...store.orders.values()].sort((a, b) => b.ms - a.ms);

  async function onCancelAll(): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      await cancelAll();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      title="Working orders"
      right={
        <>
          <span className="font-mono text-[10px] text-txt-dim tabular-nums">{rows.length}</span>
          <button
            type="button"
            className="btn btn-danger h-6 px-2 text-[9px]"
            disabled={rows.length === 0 || busy}
            onClick={() => void onCancelAll()}
          >
            cancel all
          </button>
        </>
      }
      className="min-h-[420px]"
      bodyClassName="overflow-x-auto"
    >
      {rows.length === 0 ? (
        <EmptyHint text="No working orders — submit one from the Execute section" />
      ) : (
        <table className="w-full font-mono text-[11.5px] tabular-nums">
          <thead>
            <tr className="sticky top-0 z-10 bg-panel font-sans text-[9px] font-bold tracking-[0.14em] text-txt-dim uppercase">
              <th className="px-3 py-2 text-left font-bold">order</th>
              <th className="px-3 py-2 text-left font-bold">instrument</th>
              <th className="px-3 py-2 text-center font-bold">side</th>
              <th className="px-3 py-2 text-right font-bold">price</th>
              <th className="px-3 py-2 text-right font-bold">leaves / qty</th>
              <th className="px-3 py-2 text-center font-bold">kind</th>
              <th className="px-3 py-2 text-center font-bold">tif</th>
              <th className="px-3 py-2 text-center font-bold">flags</th>
              <th className="px-3 py-2 text-left font-bold">placed</th>
              <th className="px-3 py-2 text-right font-bold" aria-label="Cancel" />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.order} className="h-[34px] border-b border-edge/25 hover:bg-white/[0.03]">
                <td className="px-3 whitespace-nowrap text-txt-dim">#{o.order}</td>
                <td className="px-3 whitespace-nowrap font-semibold text-txt">
                  {symbolLabel(store.symbols.get(o.symbol))}
                </td>
                <td
                  className={`px-3 text-center font-bold uppercase ${
                    o.partial ? 'text-txt-dim' : o.side === 'buy' ? 'text-up-bright' : 'text-down-bright'
                  }`}
                >
                  {o.partial ? '—' : o.side}
                </td>
                <td className="px-3 whitespace-nowrap text-right font-semibold text-txt">
                  {o.partial ? '—' : fmtTicks(o.price)}
                </td>
                <td className="px-3 whitespace-nowrap text-right">
                  <span className="font-semibold text-txt">{fmtInt(o.leaves)}</span>
                  <span className="text-txt-dim"> / {fmtInt(o.qty)}</span>
                </td>
                <td className="px-3 text-center text-[10px] font-semibold tracking-wider uppercase text-txt-dim">
                  {o.kind}
                </td>
                <td className="px-3 text-center text-[10px] font-semibold tracking-wider uppercase text-txt-dim">
                  {o.tif}
                </td>
                <td className="px-3 text-center">
                  <span className="flex items-center justify-center gap-1">
                    {o.post_only && <FlagChip tone="accent">PO</FlagChip>}
                    <FlagChip tone="dim">{o.partial ? 'sync' : 'live'}</FlagChip>
                  </span>
                </td>
                <td className="px-3 whitespace-nowrap text-txt-dim">{fmtClock(o.ms)}</td>
                <td className="px-3 text-right">
                  <button
                    type="button"
                    onClick={() => void cancelOrder(o.order, o.symbol)}
                    aria-label={`Cancel order ${o.order}`}
                    title={`Cancel order ${o.order}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-down/40 text-down-bright transition-colors hover:border-down-bright hover:bg-down/20"
                  >
                    <X size={11} strokeWidth={2.2} aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

function FlagChip({ tone, children }: { tone: 'accent' | 'dim'; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full border px-1.5 py-px font-mono text-[8px] font-bold tracking-[0.12em] uppercase ${
        tone === 'accent'
          ? 'border-accent/40 bg-accent/10 text-accent-bright'
          : 'border-edge/70 bg-bg/40 text-txt-dim/70'
      }`}
    >
      {children}
    </span>
  );
}
