'use client';

/**
 * Login screen — redesigned.
 *
 * Primary path: dormant demo access — one-click role cards that map to the
 * fixed demo identities seeded into the preview venue (lib/dormant.ts).
 * Every dormant sign-in still runs the REAL verification path: a signed
 * `GET /v1/account` against the live engine plus a WebSocket `hello` scope
 * probe, so the terminal always reflects true venue state.
 *
 * Secondary path: manual API credentials (key id + 64-hex secret + venue URL).
 *
 * SECURITY: the secret is typed into a masked password field, handed to the
 * HMAC signer, persisted ONLY in sessionStorage (session.ts) and never logged
 * or rendered in clear text.
 */
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Lock,
  ShieldCheck,
  Timer,
  Zap,
} from 'lucide-react';
import { ApiError, DEFAULT_BASE_URL, VenueClient, WsManager } from '@/lib/api';
import { isHex, normalizeBaseUrl, type SessionRecord } from '@/lib/session';
import { DORMANT_ACCOUNTS, type DormantAccount } from '@/lib/dormant';
import { describeError, SCOPE_DESC } from '@/lib/messages';
import { useSession } from '@/providers/SessionProvider';
import { useToast } from '@/components/Toast';
import { Field } from '@/components/Field';
import { StatusDot } from '@/components/StatusDot';
import type { Scope } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { session, hydrated, login } = useSession();
  const { push } = useToast();

  const [keyId, setKeyId] = useState('');
  const [secret, setSecret] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState(DEFAULT_BASE_URL);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (same tab) — go straight to the terminal.
  useEffect(() => {
    if (hydrated && session) void router.replace('/dashboard');
  }, [hydrated, session, router]);

  // -- shared verification flow (dormant + manual) --------------------------

  async function signInWith(
    kid: string,
    sec: string,
    baseUrl: string,
    onPhase: (p: string) => void,
  ): Promise<SessionRecord> {
    const client = new VenueClient({ keyId: kid, secretHex: sec, baseUrl });
    try {
      await client.syncTime(); // keeps signing timestamps inside the 5s window
    } catch {
      /* clock fallback: the client retries once on StaleTimestamp */
    }
    onPhase('Verifying key');
    const acc = await client.getAccount();
    onPhase('Checking key scope');
    const scope = await resolveScope(client);
    return {
      keyId: kid,
      secretHex: sec,
      baseUrl,
      account: acc.account,
      tier: acc.tier,
      scope,
    };
  }

  async function complete(rec: SessionRecord): Promise<void> {
    login(rec);
    push(
      'success',
      `Signed in — account ${rec.account}`,
      `${SCOPE_DESC[rec.scope]} · ${rec.tier} tier`,
    );
    void router.replace('/dashboard');
  }

  // -- dormant demo access ---------------------------------------------------

  async function enterDormant(d: DormantAccount): Promise<void> {
    if (busy) return;
    setBusy(true);
    setError(null);
    setPhase('Contacting engine');
    try {
      const rec = await signInWith(d.keyId, d.secretHex, DEFAULT_BASE_URL, setPhase);
      await complete(rec);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
      setPhase(null);
    }
  }

  // -- manual API credentials ------------------------------------------------

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (busy) return;

    const kid = keyId.trim().toLowerCase();
    const sec = secret.trim().toLowerCase();
    if (!isHex(kid, 8)) {
      setError('Key id must be exactly 8 lowercase hex characters (e.g. a1b2c3d4)');
      return;
    }
    if (!isHex(sec, 64)) {
      setError('API secret must be exactly 64 lowercase hex characters');
      return;
    }
    const baseUrl = normalizeBaseUrl(baseUrlInput);
    if (baseUrl === null) {
      setError('Venue URL must be a valid http(s) URL (e.g. http://localhost:8080)');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const rec = await signInWith(kid, sec, baseUrl, setPhase);
      await complete(rec);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
      setPhase(null);
    }
  }

  return (
    <main className="relative min-h-dvh text-txt">
      <div className="login-aurora" aria-hidden />

      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_430px] lg:gap-16 lg:py-14">
        {/* ------------------------------------------------ brand showcase */}
        <section className="rise-in hidden lg:flex lg:flex-col" aria-label="Product overview">
          <div className="flex items-center gap-3.5">
            <LogoMark size={44} />
            <div>
              <p className="text-[17px] font-bold leading-none tracking-[0.1em]">
                NS·VENUE
              </p>
              <p className="mt-1.5 text-[9px] font-semibold tracking-[0.34em] text-txt-dim uppercase">
                0DTE Options Terminal
              </p>
            </div>
          </div>

          <h1 className="mt-11 max-w-xl text-[2.55rem] font-bold leading-[1.07] tracking-tight text-txt">
            Zero-DTE options,
            <br />
            engineered to the{' '}
            <span className="bg-gradient-to-r from-accent-bright to-up-bright bg-clip-text text-transparent">
              nanosecond.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-[13px] leading-relaxed text-txt-dim">
            A complete 0DTE trading venue — nanosecond matching core, hourly
            expiring sessions, integer-exact settlement and defense-in-depth
            risk controls — wrapped in a terminal built for professional flow.
          </p>

          <ul className="mt-10 flex max-w-md flex-col gap-4">
            <Feature
              icon={<Zap size={15} strokeWidth={2} />}
              title="Nanosecond matching core"
              desc="Price-time priority CLOB with FOK, post-only, reduce-only and STP — 20M+ ops/s class, zero allocations on the hot path."
            />
            <Feature
              icon={<Timer size={15} strokeWidth={2} />}
              title="Hourly 0DTE sessions"
              desc="Automated pre-open → continuous → expiry lifecycle, cash-settled at intrinsic value with pin-risk protection."
            />
            <Feature
              icon={<Lock size={15} strokeWidth={2} />}
              title="Integer-exact safety"
              desc="Every cash movement conservation-checked — no floats, no drift, deterministic replayable journal."
            />
          </ul>

          <div className="mt-auto flex items-end gap-10 pt-12 font-mono">
            <Fact value="3" label="hourly sessions" />
            <Fact value="±3%" label="strike ladder" />
            <Fact value="100t" label="per $1 · exact" />
          </div>
        </section>

        {/* ---------------------------------------------------- sign-in card */}
        <section
          className="rise-in glass-panel top-highlight w-full rounded-2xl p-6 sm:p-7"
          style={{ animationDelay: '90ms' }}
          aria-label="Sign in"
        >
          {/* compact brand on mobile */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <LogoMark size={32} />
            <div>
              <p className="text-[13px] font-bold leading-none tracking-[0.1em]">NS·VENUE</p>
              <p className="mt-1 text-[8px] font-semibold tracking-[0.3em] text-txt-dim uppercase">
                0DTE Options Terminal
              </p>
            </div>
          </div>

          <header>
            <h2 className="text-[19px] font-bold tracking-tight text-txt">Welcome back</h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-txt-dim">
              Sign in to the terminal — dormant demo access is one click away.
            </p>
          </header>

          {/* dormant demo access */}
          <div className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <span className="panel-title">Dormant demo access</span>
              <span className="font-mono text-[8.5px] font-semibold tracking-[0.14em] text-txt-dim uppercase">
                demo funds · not real money
              </span>
            </div>

            <div className="mt-3 grid gap-2.5">
              {DORMANT_ACCOUNTS.map((d, i) => (
                <DormantCard
                  key={d.id}
                  d={d}
                  index={i}
                  pending={busy ? phase : null}
                  disabled={busy}
                  onEnter={() => void enterDormant(d)}
                />
              ))}
            </div>
          </div>

          {/* divider */}
          <div className="my-6 flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-edge/80" />
            <span className="text-[8.5px] font-semibold tracking-[0.22em] text-txt-dim uppercase">
              or use api credentials
            </span>
            <span className="h-px flex-1 bg-edge/80" />
          </div>

          {/* manual API credentials */}
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
            <Field label="Key id">
              <input
                className="field"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                placeholder="a1b2c3d4"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={8}
                disabled={busy}
                aria-label="API key id"
              />
            </Field>

            <Field
              label="API secret"
              hint="64 hex characters — masked, stored only in this tab"
            >
              <input
                className="field"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="64 hex characters"
                autoComplete="off"
                spellCheck={false}
                maxLength={64}
                disabled={busy}
                aria-label="API secret"
              />
            </Field>

            <Field label="Venue URL" hint="empty = same origin (routed through the preview gateway)">
              <input
                className="field"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="empty = same-origin gateway · or http://localhost:8080"
                autoCapitalize="off"
                spellCheck={false}
                disabled={busy}
                aria-label="Venue base URL"
              />
            </Field>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-[11px] leading-snug text-down-bright"
              >
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn btn-accent h-10 mt-1 text-[11px]">
              {busy ? (
                <span className="flex items-center gap-2">
                  <StatusDot state="warn" />
                  {(phase ?? 'Signing in').toLowerCase()}…
                </span>
              ) : (
                'Sign in with API key'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[9.5px] leading-relaxed text-txt-dim">
            Credentials live only in this tab&apos;s sessionStorage — never logged,
            never rendered. Admin keys unlock the venue console; trade keys open
            the order terminal.
          </p>
        </section>
      </div>
    </main>
  );
}

// -- dormant role card --------------------------------------------------------

function DormantCard({
  d,
  index,
  pending,
  disabled,
  onEnter,
}: {
  d: DormantAccount;
  index: number;
  pending: string | null;
  disabled: boolean;
  onEnter: () => void;
}) {
  const isPending = pending !== null;
  const admin = d.scope === 'admin';
  return (
    <button
      type="button"
      onClick={onEnter}
      disabled={disabled}
      style={{ animationDelay: `${140 + index * 70}ms` }}
      className={`rise-in group relative flex w-full items-center gap-3.5 overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-200 ${
        isPending
          ? 'sheen border-accent-bright/50 bg-accent/[0.09]'
          : 'border-edge2/60 bg-panel-2/60 hover:-translate-y-px hover:border-accent-bright/45 hover:bg-accent/[0.07] hover:shadow-[0_10px_30px_-14px_rgba(46,233,208,0.4)]'
      } ${disabled && !isPending ? 'opacity-45' : ''}`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${
          admin
            ? 'border-warn/35 bg-warn/10 text-warn-bright'
            : 'border-accent/35 bg-accent/10 text-accent-bright'
        }`}
        aria-hidden
      >
        {admin ? <ShieldCheck size={19} strokeWidth={1.8} /> : <Activity size={19} strokeWidth={1.8} />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13px] font-bold tracking-wide text-txt">{d.title}</span>
          <span className="rounded-full border border-edge2/70 bg-bg/40 px-1.5 py-px font-mono text-[8.5px] font-bold tracking-[0.12em] text-txt-dim uppercase">
            {d.tier}
          </span>
        </span>

        {isPending ? (
          <span className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-accent-bright">
            <StatusDot state="warn" />
            {(pending ?? 'signing in').toLowerCase()}…
          </span>
        ) : (
          <>
            <span className="mt-0.5 block text-[10.5px] leading-snug text-txt-dim line-clamp-2">
              {d.subtitle}
            </span>
            <span className="mt-1.5 flex items-center gap-1.5 font-mono text-[9px] tracking-wide text-txt-dim">
              <span>acct {d.account}</span>
              <span className="text-edge2">·</span>
              <span className={admin ? 'text-warn-bright/80' : 'text-up-bright/80'}>
                {d.funds}
              </span>
              <span className="text-edge2">·</span>
              <span className="uppercase">{d.scope}</span>
            </span>
          </>
        )}
      </span>

      <ArrowRight
        size={15}
        strokeWidth={2}
        className="shrink-0 text-txt-dim transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent-bright"
        aria-hidden
      />
    </button>
  );
}

// -- brand + feature primitives -------------------------------------------------

function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      role="img"
      aria-label="NS Venue logo"
    >
      <defs>
        <linearGradient id="ns-mark" x1="5" y1="3" x2="31" y2="33" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2ee9d0" />
          <stop offset="1" stopColor="#0c8f85" />
        </linearGradient>
      </defs>
      <path
        d="M18 2.5 31.5 10.25v15.5L18 33.5 4.5 25.75v-15.5L18 2.5Z"
        stroke="url(#ns-mark)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M15.4 11h6.1l-4.3 6.3h5L13.6 27l2.3-7.1h-4.6l4.1-8.9Z" fill="url(#ns-mark)" />
    </svg>
  );
}

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3.5">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent-bright"
        aria-hidden
      >
        {icon}
      </span>
      <div>
        <p className="text-[13px] font-semibold leading-tight text-txt">{title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-txt-dim">{desc}</p>
      </div>
    </li>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[15px] font-bold leading-none text-txt">{value}</span>
      <span className="text-[8.5px] font-semibold tracking-[0.2em] text-txt-dim uppercase">
        {label}
      </span>
    </div>
  );
}

// -- scope resolution ------------------------------------------------------------

/** One-shot WS probe: the `hello` frame carries the key's true scope. */
function probeWsScope(client: VenueClient): Promise<Scope | null> {
  return new Promise((resolve) => {
    let settled = false;
    let ws: WsManager | null = null;
    const finish = (s: Scope | null): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws?.close();
      } catch {
        /* already closing */
      }
      resolve(s);
    };
    const timer = setTimeout(() => finish(null), 3500);
    try {
      ws = new WsManager(
        client.creds,
        {
          onStatus: () => undefined,
          onMessage: (m) => {
            if (m.t === 'hello') finish(m.scope);
          },
        },
        () => client.venueNow(),
      );
      ws.connect();
    } catch {
      finish(null);
    }
  });
}

/**
 * REST fallback when the socket probe fails: only `/admin/audit` distinguishes
 * admin keys (200) from non-admin (403 ScopeDenied). Non-admin defaults to
 * 'trade'; the live hello frame corrects it within seconds on /dashboard.
 */
async function resolveScope(client: VenueClient): Promise<Scope> {
  const wsScope = await probeWsScope(client);
  if (wsScope !== null) return wsScope;
  try {
    await client.getAudit();
    return 'admin';
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) throw e; // bad key — surface at login
    return 'trade';
  }
}
