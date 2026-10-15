'use client';

/**
 * PageHeader — consistent hero row for the scrollable section pages: eyebrow,
 * title, lede and an optional right-side slot (contextual chips / actions).
 */
import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  lede,
  right,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  right?: ReactNode;
}) {
  return (
    <header className="rise-in mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-bold tracking-[0.32em] text-accent-bright/80 uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-[22px] font-bold leading-tight tracking-tight text-txt">{title}</h2>
        {lede && <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-txt-dim">{lede}</p>}
      </div>
      {right && <div className="flex min-w-0 flex-wrap items-center gap-2">{right}</div>}
    </header>
  );
}

/** Standard scrollable page container — centered, capped width, page-level scroll. */
export function PageScroll({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1680px] px-4 py-5 md:px-6 lg:px-7">{children}</div>
    </div>
  );
}
