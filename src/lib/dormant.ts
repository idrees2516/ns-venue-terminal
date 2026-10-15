/**
 * Dormant demo credentials — PREVIEW ONLY.
 *
 * The sandbox preview venue is seeded by `scripts/launch_venue.sh` with a
 * fixed set of demo identities (demo funds, nothing real). This module maps
 * friendly dormant sign-in names to those seeded API keys so the UI can be
 * explored with one click instead of typing 64-hex-character secrets.
 *
 * Every sign-in still goes through the REAL verification path — a signed
 * `GET /v1/account` against the live engine — so what you see in the
 * terminal is the true venue state, never mocked data.
 *
 * ⚠️ Production deployments must remove this module and issue real keys
 * (minted per-account via the admin console).
 */

export interface DormantAccount {
  id: string;
  role: string;
  title: string;
  subtitle: string;
  keyId: string;
  secretHex: string;
  account: number;
  tier: string;
  scope: 'trade' | 'admin';
  funds: string;
}

export const DORMANT_ACCOUNTS: readonly DormantAccount[] = [
  {
    id: 'demo-trader',
    role: 'trader',
    title: 'Demo Trader',
    subtitle: 'Order terminal · live 0DTE chain, depth & tape',
    keyId: '00000002',
    secretHex: '89dded361dccb08789ea013e4e5a66ffa3d4c79b065c2015f183c30b3304c9d2',
    account: 2,
    tier: 'gold',
    scope: 'trade',
    funds: '$100,000 demo funds',
  },
  {
    id: 'demo-admin',
    role: 'admin',
    title: 'Demo Admin',
    subtitle: 'Venue console · funding, keys, sessions & health',
    keyId: '00000001',
    secretHex: '0595bcd4cd090eb16b7bbc9984e23f8f1db7d8223ae65113ea41ba1ac3b6ea6c',
    account: 1,
    tier: 'prime',
    scope: 'admin',
    funds: '$1,000,000 demo funds',
  },
] as const;
