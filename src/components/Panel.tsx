'use client';

import type { ReactNode } from 'react';

/** Shared panel chrome: glass card + titled header row + scrollable body. */
export function Panel({
  title,
  right,
  children,
  className = '',
  bodyClassName = '',
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`glass-panel flex min-h-0 flex-col overflow-hidden rounded-xl ${className}`}>
      <header className="flex h-8 shrink-0 items-center justify-between gap-2 border-b border-edge/70 bg-white/[0.015] px-3">
        <h2 className="panel-title truncate">{title}</h2>
        <div className="flex items-center gap-2">{right}</div>
      </header>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
