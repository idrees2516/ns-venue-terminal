'use client';

/**
 * Sidebar — the terminal's primary navigation.
 *
 * Desktop (lg+): fixed rail alongside the content; collapses to an icon rail
 * (state persisted in localStorage). Mobile (<lg): hidden, slides over the
 * content as a glass drawer (AppShell owns the open/close state).
 *
 * Sections group the terminal's functionalities so each one has its own
 * dedicated page: Order Book and Calls & Puts are the trading focus; admin
 * entries render only for admin-scope keys.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BookOpen,
  Briefcase,
  HeartPulse,
  LayoutGrid,
  ListOrdered,
  SlidersHorizontal,
  Table2,
  Timer,
  Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useSession } from '@/providers/SessionProvider';

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** rendered at the end of the row when the rail is expanded */
  hint?: string;
}

const GROUPS: { title: string | null; items: NavItem[] }[] = [
  {
    title: null,
    items: [{ href: '/dashboard', label: 'Dashboard', icon: <LayoutGrid size={15} strokeWidth={1.9} /> }],
  },
  {
    title: 'Trading',
    items: [
      {
        href: '/orderbook',
        label: 'Order Book',
        icon: <BookOpen size={15} strokeWidth={1.9} />,
        hint: 'live depth',
      },
      {
        href: '/chain',
        label: 'Calls & Puts',
        icon: <Table2 size={15} strokeWidth={1.9} />,
        hint: 'chain',
      },
      { href: '/execute', label: 'Execute', icon: <Zap size={15} strokeWidth={1.9} />, hint: 'ticket' },
      { href: '/orders', label: 'Open Orders', icon: <ListOrdered size={15} strokeWidth={1.9} /> },
      { href: '/positions', label: 'Positions', icon: <Briefcase size={15} strokeWidth={1.9} /> },
      { href: '/fills', label: 'Fills', icon: <Activity size={15} strokeWidth={1.9} /> },
    ],
  },
  {
    title: 'Markets',
    items: [
      {
        href: '/sessions',
        label: '0DTE Sessions',
        icon: <Timer size={15} strokeWidth={1.9} />,
        hint: 'expiries',
      },
    ],
  },
];

const ADMIN_ITEMS: NavItem[] = [
  {
    href: '/admin',
    label: 'Admin Console',
    icon: <SlidersHorizontal size={15} strokeWidth={1.9} />,
  },
  { href: '/health', label: 'Venue Health', icon: <HeartPulse size={15} strokeWidth={1.9} /> },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  /** invoked on every navigation click (closes the mobile drawer) */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { session } = useSession();
  const isAdmin = session?.scope === 'admin';

  const groups = isAdmin ? [...GROUPS, { title: 'Admin', items: ADMIN_ITEMS }] : GROUPS;

  return (
    <nav
      aria-label="Primary navigation"
      className={`app-sidebar flex h-full flex-col overflow-hidden border-r border-edge/70 bg-panel/80 backdrop-blur-xl transition-[width] duration-200 ${
        collapsed ? 'w-[58px]' : 'w-[216px]'
      }`}
    >
      {/* brand header */}
      <div className="relative flex h-[52px] shrink-0 items-center gap-2.5 border-b border-edge/60 px-3">
        <SidebarLogo />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[12px] font-bold leading-none tracking-[0.1em] text-txt">
              NS·VENUE
            </p>
            <p className="mt-1 truncate font-mono text-[7.5px] font-bold tracking-[0.26em] text-txt-dim uppercase">
              0DTE Terminal
            </p>
          </div>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className={`ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-edge/70 text-txt-dim transition-colors hover:border-edge2 hover:text-txt ${
              collapsed ? 'absolute right-[9px] top-[62px] z-20 bg-panel/95' : ''
            }`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path
                d={collapsed ? 'M3.5 1.5 7 5 3.5 8.5' : 'M6.5 1.5 3 5l3.5 3.5'}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* nav groups */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {groups.map((g, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
            {g.title !== null &&
              (collapsed ? (
                <div className="mx-auto my-2 h-px w-5 bg-edge/80" aria-hidden />
              ) : (
                <p className="px-2.5 pb-1.5 font-mono text-[8px] font-bold tracking-[0.3em] text-txt-dim/70 uppercase">
                  {g.title}
                </p>
              ))}
            <ul className="flex flex-col gap-0.5">
              {g.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      onClick={onNavigate}
                      className={`group/nav relative flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 font-sans text-[11.5px] font-semibold transition-colors ${
                        active
                          ? 'bg-accent/[0.14] text-accent-bright'
                          : 'text-txt-dim hover:bg-white/[0.035] hover:text-txt'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r-full bg-accent-bright"
                          aria-hidden
                        />
                      )}
                      <span className="shrink-0" aria-hidden>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {item.hint && (
                            <span className="ml-auto shrink-0 font-mono text-[8px] font-semibold tracking-[0.14em] text-txt-dim/50 uppercase group-hover/nav:text-txt-dim">
                              {item.hint}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* footer — venue identity */}
      <div
        className={`shrink-0 border-t border-edge/60 px-3 py-2.5 font-mono text-[8px] font-semibold tracking-[0.18em] text-txt-dim/60 uppercase ${
          collapsed ? 'text-center' : 'flex items-center justify-between'
        }`}
      >
        {collapsed ? (
          <span title="ns-venue · nanosecond core">ns</span>
        ) : (
          <>
            <span>ns-venue</span>
            <span className="text-txt-dim/40">nanosecond core</span>
          </>
        )}
      </div>
    </nav>
  );
}

function SidebarLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 36 36" fill="none" className="shrink-0" aria-hidden>
      <defs>
        <linearGradient id="ns-mark-side" x1="5" y1="3" x2="31" y2="33" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2ee9d0" />
          <stop offset="1" stopColor="#0c8f85" />
        </linearGradient>
      </defs>
      <path
        d="M18 2.5 31.5 10.25v15.5L18 33.5 4.5 25.75v-15.5L18 2.5Z"
        stroke="url(#ns-mark-side)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M15.4 11h6.1l-4.3 6.3h5L13.6 27l2.3-7.1h-4.6l4.1-8.9Z" fill="url(#ns-mark-side)" />
    </svg>
  );
}
