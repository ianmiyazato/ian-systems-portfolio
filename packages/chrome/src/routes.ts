/**
 * The parity registry: every approved artboard, its route, and the screen id that names
 * its decisions file (decisions/<id>.json). Tests, screenshots, ⌘K and the lens all read this.
 */
export type Zone = 'shell' | 'mare-ops' | 'mare-shop' | 'pulse';
export type AreaId = 'overview' | 'mare' | 'balcao' | 'product-hub' | 'pay' | 'circle' | 'mesh' | 'consumer' | 'atlas' | 'pulse';

export type ScreenRoute = {
  id: string;
  area: AreaId;
  label: string;
  href: string;
  zone: Zone;
  /** Extra screens (not approved artboards) still get decisions but are not counted for parity. */
  parity?: false;
};

export type Area = { id: AreaId; label: string; theme: string; states: string[] };

const common = ['empty', 'loading', 'error', 'offline', 'locked'];

export const areas: Area[] = [
  { id: 'overview', label: 'Overview', theme: 'portfolio', states: [] },
  { id: 'mare', label: 'Maré', theme: 'portfolio', states: [] },
  { id: 'balcao', label: 'Balcão', theme: 'balcao', states: [...common, 'reminder-sent', 'picked'] },
  { id: 'product-hub', label: 'Product Hub', theme: 'product-hub', states: [...common, 'rejected'] },
  { id: 'pay', label: 'Pay', theme: 'pay', states: [...common, 'approved', 'declined', 'drift'] },
  { id: 'circle', label: 'Circle', theme: 'circle', states: [...common, 'contract-pending', 'payout-failed'] },
  { id: 'mesh', label: 'Mesh', theme: 'mesh', states: [...common, 'calm', 'down', 'replayed'] },
  { id: 'consumer', label: 'Consumer', theme: 'consumer', states: common },
  { id: 'atlas', label: 'Atlas', theme: 'atlas', states: [...common, 'limit', 'generating', 'checkout-failed'] },
  { id: 'pulse', label: 'Pulse', theme: 'pulse', states: common }
];

export const screens: ScreenRoute[] = [
  { id: 'home', area: 'overview', label: 'Portfolio home', href: '/', zone: 'shell' },
  { id: 'mare-languages', area: 'mare', label: 'Five design languages', href: '/work/mare/languages', zone: 'shell' },
  { id: 'system-design-mare', area: 'mare', label: 'Maré system design', href: '/system-design/mare', zone: 'shell' },

  { id: 'balcao-lanes', area: 'balcao', label: 'Order lanes', href: '/mare/ops/balcao', zone: 'mare-ops' },
  { id: 'balcao-picking', area: 'balcao', label: 'Picking mode', href: '/mare/ops/balcao/pick/MR-904117', zone: 'mare-ops' },
  { id: 'balcao-handover', area: 'balcao', label: 'Handover + third party', href: '/mare/ops/balcao?modal=handover&order=MR-904112&sub=third-party', zone: 'mare-ops' },
  { id: 'balcao-cutoff-plan', area: 'balcao', label: 'Cutoff plan + why', href: '/mare/ops/balcao?modal=cutoff-plan&sub=why', zone: 'mare-ops' },

  { id: 'product-hub-catalog', area: 'product-hub', label: 'Catalog workspace', href: '/mare/ops/product-hub', zone: 'mare-ops' },
  { id: 'product-hub-detail', area: 'product-hub', label: 'Product detail · pricing', href: '/mare/ops/product-hub/products/510233?tab=pricing', zone: 'mare-ops' },
  { id: 'product-hub-agent-run', area: 'product-hub', label: 'Agent run + edit', href: '/mare/ops/product-hub/products/510233?modal=agent-run&sub=edit', zone: 'mare-ops' },
  { id: 'product-hub-onboarding', area: 'product-hub', label: 'Seller onboarding', href: '/mare/ops/product-hub/marketplace/onboarding/linho-co?step=mapping', zone: 'mare-ops' },

  { id: 'pay-applications', area: 'pay', label: 'Applications', href: '/mare/ops/pay', zone: 'mare-ops' },
  { id: 'pay-application-detail', area: 'pay', label: 'Application detail', href: '/mare/ops/pay/applications/AP-77118', zone: 'mare-ops' },
  { id: 'pay-decision', area: 'pay', label: 'Decision + override', href: '/mare/ops/pay/applications/AP-77118?modal=decision&sub=override', zone: 'mare-ops' },
  { id: 'pay-customer-app', area: 'pay', label: 'Pay customer app', href: '/mare/apps/pay', zone: 'mare-shop' },

  { id: 'circle-program', area: 'circle', label: 'Program dashboard', href: '/mare/ops/circle', zone: 'mare-ops' },
  { id: 'circle-rule-builder', area: 'circle', label: 'Rule builder', href: '/mare/ops/circle/rules/summer-swim', zone: 'mare-ops' },
  { id: 'circle-leak', area: 'circle', label: 'Leak + rotate', href: '/mare/ops/circle?modal=leak&code=MARI15&sub=rotate', zone: 'mare-ops' },
  { id: 'circle-creator-app', area: 'circle', label: 'Creator app', href: '/mare/apps/circle', zone: 'mare-shop' },

  { id: 'mesh-topology', area: 'mesh', label: 'Topology', href: '/mare/ops/mesh', zone: 'mare-ops' },
  { id: 'mesh-partner', area: 'mesh', label: 'Partner adapter', href: '/mare/ops/mesh/partners/ligeiro-log', zone: 'mare-ops' },
  { id: 'mesh-dlq-replay', area: 'mesh', label: 'DLQ replay + transform', href: '/mare/ops/mesh/dlq?modal=replay&sub=transform', zone: 'mare-ops' },
  { id: 'mesh-invoice-chain', area: 'mesh', label: 'Invoice chain', href: '/mare/ops/mesh/invoices/MR-904117', zone: 'mare-ops' },

  { id: 'consumer-app', area: 'consumer', label: 'Shopping app · 3 phones', href: '/mare/apps/shop', zone: 'mare-shop' },
  { id: 'consumer-site', area: 'consumer', label: 'Maré site', href: '/mare/shop', zone: 'mare-shop' },

  { id: 'atlas-onboarding', area: 'atlas', label: 'Onboarding', href: '/atlas/welcome?step=2', zone: 'shell' },
  { id: 'atlas-pipeline', area: 'atlas', label: 'Pipeline', href: '/atlas/pipeline', zone: 'shell' },
  { id: 'atlas-board', area: 'atlas', label: 'Board + drawer + log outcome', href: '/atlas/pipeline/board?drawer=parallax-pay&sub=log-outcome', zone: 'shell' },
  { id: 'atlas-company', area: 'atlas', label: 'Company', href: '/atlas/companies/parallax-pay', zone: 'shell' },
  { id: 'atlas-arena-setup', area: 'atlas', label: 'Library + session setup', href: '/atlas/arena?modal=setup&prompt=payments-ledger', zone: 'shell' },
  { id: 'atlas-arena-session', area: 'atlas', label: 'Arena session', href: '/atlas/arena/session/14', zone: 'shell' },
  { id: 'atlas-feedback', area: 'atlas', label: 'Feedback', href: '/atlas/arena/sessions/14', zone: 'shell' },
  { id: 'atlas-transcript', area: 'atlas', label: 'Transcript drawer', href: '/atlas/arena/sessions/14?drawer=transcript&t=31:30', zone: 'shell' },
  { id: 'atlas-academy', area: 'atlas', label: 'Academy', href: '/atlas/academy/designing-for-10x', zone: 'shell' },
  { id: 'atlas-paywall', area: 'atlas', label: 'Paywall + checkout', href: '/atlas/academy/designing-for-10x?modal=paywall&sub=checkout', zone: 'shell' },
  { id: 'system-design-atlas', area: 'atlas', label: 'Atlas system design', href: '/system-design/atlas', zone: 'shell' },

  { id: 'pulse-intelligence', area: 'pulse', label: 'Intelligence', href: '/pulse', zone: 'pulse' },
  { id: 'pulse-distribution', area: 'pulse', label: 'Distribution', href: '/pulse/distribution', zone: 'pulse' },
  { id: 'pulse-harness', area: 'pulse', label: 'AI harness', href: '/pulse/harness', zone: 'pulse' },
  { id: 'system-design-pulse', area: 'pulse', label: 'Pulse system design', href: '/system-design/pulse', zone: 'shell' },

  { id: 'work-index', area: 'overview', label: 'Work index', href: '/work', zone: 'shell', parity: false },
  { id: 'work-mare', area: 'mare', label: 'Maré case study', href: '/work/mare', zone: 'shell', parity: false },
  { id: 'work-atlas', area: 'atlas', label: 'Atlas case study', href: '/work/atlas', zone: 'shell', parity: false },
  { id: 'work-pulse', area: 'pulse', label: 'Pulse case study', href: '/work/pulse', zone: 'shell', parity: false },
  { id: 'mare-ops-index', area: 'mare', label: 'Maré Ops remote index', href: '/mare/ops/', zone: 'mare-ops', parity: false }
];

export const parityScreens = screens.filter((screen) => screen.parity !== false);

export function areaOf(id: AreaId): Area {
  return areas.find((area) => area.id === id) ?? areas[0]!;
}

const overlayKeys = ['modal', 'drawer', 'sub'];

/** Resolve the screen for a location: same path, then the most specific overlay match. */
export function resolveScreen(pathname: string, search = ''): ScreenRoute | undefined {
  const path = normalise(pathname);
  const params = new URLSearchParams(search);
  const candidates = screens
    .map((screen) => {
      const url = new URL(screen.href, 'https://portfolio.invalid');
      if (!pathMatches(normalise(url.pathname), path)) return null;
      const required = overlayKeys.filter((key) => url.searchParams.has(key));
      const satisfied = required.every((key) => params.get(key) === url.searchParams.get(key));
      const exact = normalise(url.pathname) === path;
      return { screen, score: (satisfied ? required.length * 10 : -required.length) + (exact ? 5 : 0) };
    })
    .filter((candidate): candidate is { screen: ScreenRoute; score: number } => candidate !== null)
    .sort((a, b) => b.score - a.score);
  return candidates[0]?.screen;
}

function normalise(path: string) {
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** Segments after these collections are ids or slugs, so any value resolves to the artboard. */
const collections = new Set(['pick', 'products', 'onboarding', 'applications', 'rules', 'partners', 'invoices', 'companies', 'session', 'sessions', 'academy']);

function pathMatches(pattern: string, path: string) {
  if (pattern === path) return true;
  const a = pattern.split('/');
  const b = path.split('/');
  if (a.length !== b.length) return false;
  return a.every((segment, index) => segment === b[index] || collections.has(a[index - 1] ?? ''));
}
