'use client';

/**
 * AppShell — sidebar + topbar + content frame for every terminal section.
 *
 * Desktop (lg+): permanent sidebar rail (collapsible, persisted) with the
 * content filling the remaining width — the layout the terminal is built
 * around at laptop resolutions. Mobile (<lg): the sidebar becomes an overlay
 * drawer behind a hamburger button.
 *
 * The topbar stays slim and contextual: current section title, live
 * underlying ticker, connection status, engine clock and account chip.
 */
import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { useTerminal } from '@/providers/TerminalProvider';
import { useSession } from '@/providers/SessionProvider';
import { useStoreSection, useServerClock } from '@/lib/store';
import { fmtClock, fmtTicks, fmtTicksSigned } from '@/lib/format';
import { StatusDot, type DotState } from '@/components/StatusDot';
import { Sidebar } from '@/components/shell/Sidebar';
import { OfflineBanner } from '@/components/topbar/OfflineBanner';

const COLLAPSE_KEY = 'ns.sidebar.collapsed';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/orderbook': 'Order Book',
  '/chain': 'Calls & Puts',
  '/execute': 'Execute',
  '/orders': 'Open Orders',
  '/positions': 'Positions',
  '/fills': 'Fills',
  '/sessions': '0DTE Sessions',
  '/admin': 'Admin Console',
  '/health': 'Venue Health',
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // lazy client-only initializer — AppShell never renders on the server (it
  // sits below RequireSession, which boots client-side), so localStorage is
  // always available here and no hydration mismatch can occur
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // any navigation (link click) closes the mobile drawer
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="app-ambience flex h-dvh overflow-hidden text-txt">
      {/* desktop rail */}
      <div className="hidden shrink-0 lg:block" aria-hidden={false}>
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      </div>

      {/* mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={closeDrawer}
            aria-label="Close navigation"
          />
          <div className="absolute inset-y-0 left-0 rise-in shadow-[8px_0_40px_-12px_rgba(0,0,0,0.8)]">
            <Sidebar collapsed={false} onNavigate={closeDrawer} />
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close navigation"
            className="absolute left-[228px] top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-edge2/70 bg-panel/90 text-txt-dim backdrop-blur transition-colors hover:text-txt"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setDrawerOpen(true)} title={PAGE_TITLES[pathname] ?? 'Terminal'} />
        <OfflineBanner />
        <main className="min-h-0 min-w-0 flex-1" aria-label={PAGE_TITLES[pathname] ?? 'Terminal'}>
          {children}
        </main>
      </div>
    </div>
  );
}

function TopBar({ title, onMenu }: { title: string; onMenu: () => void }) {
  const { store, sel } = useTerminal();
  const { session, logout } = useSession();
  const router = useRouter();
  useStoreSection(store, 'conn');
  useStoreSection(store, 'clock');
  useStoreSection(store, 'account');
  useStoreSection(store, 'underlying');
  useServerClock(store, 1000);

  const u = sel.underlying !== null ? store.underlyings.get(sel.underlying) : undefined;
  const delta = u ? u.mark - u.ref : 0;

  const dot: DotState = store.offline
    ? 'down'
    : store.connStatus === 'live'
      ? 'live'
      : store.connStatus === 'connecting' || store.connStatus === 'reconnecting'
        ? 'warn'
        : 'idle';
  const pillTone =
    store.offline || dot === 'down' ? 'pill-down' : dot === 'live' ? 'pill-live' : 'pill-warn';
  const connLabel =
    store.connStatus === 'live'
      ? 'live'
      : store.connStatus === 'connecting'
        ? 'connecting'
        : store.connStatus === 'reconnecting'
          ? 'reconnecting'
          : store.connStatus === 'closed'
            ? 'closed'
            : 'idle';

  if (!session) return null;

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-edge/70 bg-panel/75 px-3 backdrop-blur-xl md:px-4">
      {/* mobile menu */}
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open navigation"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-edge/70 text-txt-dim transition-colors hover:border-edge2 hover:text-txt lg:hidden"
      >
        <Menu size={14} strokeWidth={2} />
      </button>

      {/* section title */}
      <h1 className="shrink-0 text-[13px] font-bold tracking-[0.08em] text-txt">{title}</h1>
      <span className="hidden h-4 w-px bg-edge/80 sm:block" aria-hidden />

      {/* live underlying ticker */}
      {u && (
        <div className="hidden min-w-0 items-center gap-2 font-mono text-[11px] tabular-nums sm:flex">
          <span className="font-sans text-[9px] font-bold tracking-[0.18em] text-txt-dim uppercase">
            U{u.underlying}
          </span>
          <span className="text-[13px] font-bold tracking-tight text-txt">{fmtTicks(u.mark)}</span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
              delta >= 0 ? 'bg-up/12 text-up-bright' : 'bg-down/12 text-down-bright'
            }`}
          >
            {delta >= 0 ? '▲' : '▼'} {fmtTicksSigned(delta)}
          </span>
          {u.halted && (
            <span className="pill pill-down h-5 text-[8px]">halted</span>
          )}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* connection */}
        <span className={`pill ${pillTone}`}>
          <StatusDot state={dot} />
          <span className="hidden md:inline">{store.offline ? 'offline' : connLabel}</span>
        </span>

        {/* engine clock */}
        <span
          className="hidden items-center gap-1.5 rounded-md border border-edge/80 bg-bg/50 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-txt sm:flex"
          title="engine wall clock"
        >
          <span className="text-[8px] font-semibold tracking-[0.18em] text-txt-dim uppercase">eng</span>
          {fmtClock(store.serverNow())}
        </span>

        {/* account */}
        <span
          className="pill hidden md:inline-flex"
          title={`account ${session.account} · ${session.tier} tier · ${session.scope} scope`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              session.scope === 'admin' ? 'bg-warn-bright' : 'bg-accent-bright'
            }`}
            aria-hidden
          />
          <span className="text-txt">acct {session.account}</span>
          <span className="text-txt-dim">·</span>
          <span className="uppercase">{session.tier}</span>
        </span>

        <button
          type="button"
          className="btn btn-ghost h-7 gap-1.5 px-2"
          onClick={() => {
            logout();
            void router.replace('/');
          }}
          aria-label="Log out"
        >
          <LogOut size={12} strokeWidth={2} aria-hidden />
          <span className="hidden lg:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
