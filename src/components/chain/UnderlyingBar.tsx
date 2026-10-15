'use client';

import { useTerminal } from '@/providers/TerminalProvider';
import { useStoreSection } from '@/lib/store';
import { fmtTicks, fmtTicksSigned } from '@/lib/format';
import { Badge } from '@/components/StatusDot';

/** Underlying ticker strip: mark, day ref, delta, fast-market + halted badges. */
export function UnderlyingBar() {
  const { store, sel, setUnderlying } = useTerminal();
  useStoreSection(store, 'underlying');
  useStoreSection(store, 'chain-rev');

  const underlyings = [...store.underlyings.keys()].sort((a, b) => a - b);
  const u = sel.underlying !== null ? store.underlyings.get(sel.underlying) : undefined;
  const delta = u ? u.mark - u.ref : 0;

  return (
    <div className="glass-panel flex h-11 shrink-0 items-center gap-3 rounded-xl px-3.5 font-mono text-xs tabular-nums">
      {underlyings.length > 1 ? (
        <label className="flex items-center gap-1 font-sans text-[10px] font-semibold tracking-wider text-txt-dim uppercase">
          <span className="sr-only sm:not-sr-only">und</span>
          <select
            className="field h-6 w-16 py-0"
            value={sel.underlying ?? ''}
            onChange={(e) => setUnderlying(Number(e.target.value))}
            aria-label="Select underlying"
          >
            {underlyings.map((id) => (
              <option key={id} value={id}>
                U{id}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <span className="font-sans text-[10px] font-semibold tracking-[0.12em] text-txt-dim uppercase">
          U{sel.underlying ?? '—'}
        </span>
      )}
      {u ? (
        <>
          <span className="text-[15px] font-bold tracking-tight">{fmtTicks(u.mark)}</span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
              delta >= 0 ? 'bg-up/12 text-up-bright' : 'bg-down/12 text-down-bright'
            }`}
          >
            {delta >= 0 ? '▲' : '▼'} {fmtTicksSigned(delta)}
          </span>
          <span className="text-[10px] text-txt-dim" title="day reference price">
            ref {fmtTicks(u.ref)}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            {u.fast && <Badge tone="warn" title="fast-market regime — wider bands">fast</Badge>}
            {u.halted && (
              <Badge tone="down" title="underlying halted">
                halted{u.haltLevel !== undefined ? ` L${u.haltLevel}` : ''}
              </Badge>
            )}
          </span>
        </>
      ) : (
        <span className="text-[11px] text-txt-dim">no underlying data</span>
      )}
    </div>
  );
}
