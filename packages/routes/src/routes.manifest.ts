/**
 * routes.manifest.ts — the single source of truth for every route, deep link and nav item.
 *
 * Navigation (remote navs + typed view routers), the link crawler, screenshots, axe, the
 * Decision Lens (decisions/<id>.json) and the parity table (docs/agents/parity.md) all read this.
 * Add a screen here first; `pnpm verify:route <href>` then proves it renders its heading.
 */
export type Zone = 'shell' | 'mare-ops' | 'mare-shop' | 'pulse';
export type SystemId = 'overview' | 'mare' | 'counter' | 'product-hub' | 'pay' | 'circle' | 'mesh' | 'observability' | 'consumer' | 'atlas' | 'pulse';

export type System = {
  id: SystemId;
  title: string;
  /** Token theme (packages/tokens/src/themes.json). */
  theme: string;
  /** Package that owns the system's screens. */
  owner: string;
  /** Designed variations reachable with ?state=… (⌘K → Show state). */
  states: string[];
  /** Screen whose variations are screenshotted and audited. */
  home?: string;
};

export type RouteEntry = {
  id: string;
  system: SystemId;
  title: string;
  href: string;
  zone: Zone;
  /** Package that renders the route. */
  owner: string;
  /** Design reference board the screen is checked against. */
  board: string;
  /** Text the page's <h1> must contain once rendered (crawler + verify:route). */
  heading: string;
  /** Release that introduced the screen; 0.1 screens are the original 40 artboards. */
  release: '0.1' | '0.2';
  /** Case studies and indexes get decisions but are not approved artboards. */
  parity?: false;
  /** Also captured at 390 × 844. */
  mobile?: true;
  /** Date the rendered route was compared with its board at 1440 × 900 (v0.1 screens: 2026-09-26). */
  checked?: string;
  /** Designed variations of this route (?state=…), screenshotted and audited like the system's. */
  states?: string[];
};

const common = ['empty', 'loading', 'error', 'offline', 'locked'];

export const systems: System[] = [
  { id: 'overview', title: 'Overview', theme: 'portfolio', owner: '@portfolio/shell', states: [] },
  { id: 'mare', title: 'Maré', theme: 'portfolio', owner: '@portfolio/shell', states: [] },
  { id: 'counter', title: 'Counter', theme: 'counter', owner: '@portfolio/remote-counter', states: [...common, 'reminder-sent', 'picked'], home: 'counter-lanes' },
  { id: 'product-hub', title: 'Product Hub', theme: 'product-hub', owner: '@portfolio/remote-product-hub', states: [...common, 'rejected'], home: 'product-hub-catalog' },
  { id: 'pay', title: 'Pay', theme: 'pay', owner: '@portfolio/remote-pay', states: [...common, 'approved', 'declined', 'drift'], home: 'pay-applications' },
  { id: 'circle', title: 'Circle', theme: 'circle', owner: '@portfolio/remote-circle', states: [...common, 'contract-pending', 'payout-failed'], home: 'circle-program' },
  { id: 'mesh', title: 'Mesh', theme: 'mesh', owner: '@portfolio/remote-mesh', states: [...common, 'calm', 'down', 'replayed'], home: 'mesh-topology' },
  { id: 'observability', title: 'Tidewatch', theme: 'tidewatch', owner: '@portfolio/shell', states: [...common], home: 'observability-problems' },
  { id: 'consumer', title: 'Consumer', theme: 'consumer', owner: '@portfolio/mare-shop', states: common, home: 'consumer-site' },
  { id: 'atlas', title: 'Atlas', theme: 'atlas', owner: '@portfolio/shell', states: [...common, 'limit', 'generating', 'checkout-failed'], home: 'atlas-pipeline' },
  { id: 'pulse', title: 'Pulse', theme: 'pulse', owner: '@portfolio/pulse', states: common, home: 'pulse-intelligence' }
];

const shell = '@portfolio/shell';
const shop = '@portfolio/mare-shop';
const pulse = '@portfolio/pulse';
const remote = (name: string) => `@portfolio/remote-${name}`;

export const routes: RouteEntry[] = [
  { id: 'home', system: 'overview', title: 'Portfolio home', href: '/', zone: 'shell', owner: shell, board: 'OV-home', heading: 'I build the core platform', release: '0.1', mobile: true },
  { id: 'mare-languages', system: 'mare', title: 'Five design languages', href: '/work/mare/languages', zone: 'shell', owner: shell, board: 'OV-languages', heading: 'five design languages', release: '0.1' },
  { id: 'system-design-mare', system: 'mare', title: 'Maré system design', href: '/system-design/mare', zone: 'shell', owner: shell, board: 'SD-mare', heading: 'Decisions under load', release: '0.1' },

  { id: 'system-design-request-path', system: 'mare', title: 'Request path · live', href: '/system-design/mare/request-path', zone: 'shell', owner: shell, board: 'V2-arch', heading: 'Every hop, live', release: '0.2', checked: '2026-09-27' },

  { id: 'counter-lanes', system: 'counter', title: 'Order lanes', href: '/mare/ops/counter', zone: 'mare-ops', owner: remote('counter'), board: 'BA-lanes', heading: 'open orders', release: '0.1', mobile: true },
  { id: 'counter-picking', system: 'counter', title: 'Picking mode', href: '/mare/ops/counter/pick/MR-904117', zone: 'mare-ops', owner: remote('counter'), board: 'BA-picking', heading: 'MR-904117', release: '0.1', mobile: true },
  { id: 'counter-handover', system: 'counter', title: 'Handover + third party', href: '/mare/ops/counter?modal=handover&order=MR-904112&sub=third-party', zone: 'mare-ops', owner: remote('counter'), board: 'BA-handover', heading: 'open orders', release: '0.1' },
  { id: 'counter-cutoff-plan', system: 'counter', title: 'Cutoff plan + why', href: '/mare/ops/counter?modal=cutoff-plan&sub=why', zone: 'mare-ops', owner: remote('counter'), board: 'BA-cutoff', heading: 'open orders', release: '0.1' },
  { id: 'counter-returns', system: 'counter', title: 'Returns', href: '/mare/ops/counter/returns', zone: 'mare-ops', owner: remote('counter'), board: 'BA-returns', heading: 'Returns', release: '0.2', checked: '2026-09-27', states: ['empty', 'error'] },
  { id: 'counter-stock', system: 'counter', title: 'Stock lookup', href: '/mare/ops/counter/stock', zone: 'mare-ops', owner: remote('counter'), board: 'BA-stock', heading: 'Linen midi dress', release: '0.2', checked: '2026-09-27', states: ['empty', 'offline'] },

  { id: 'product-hub-catalog', system: 'product-hub', title: 'Catalog workspace', href: '/mare/ops/product-hub', zone: 'mare-ops', owner: remote('product-hub'), board: 'PH-catalog', heading: 'needs action', release: '0.1' },
  { id: 'product-hub-detail', system: 'product-hub', title: 'Product detail · pricing', href: '/mare/ops/product-hub/products/510233?tab=pricing', zone: 'mare-ops', owner: remote('product-hub'), board: 'PH-detail', heading: 'Natural linen shirt', release: '0.1' },
  { id: 'product-hub-agent-run', system: 'product-hub', title: 'Agent run + edit', href: '/mare/ops/product-hub/products/510233?modal=agent-run&sub=edit', zone: 'mare-ops', owner: remote('product-hub'), board: 'PH-agent-run', heading: 'Natural linen shirt', release: '0.1' },
  { id: 'product-hub-onboarding', system: 'product-hub', title: 'Seller onboarding', href: '/mare/ops/product-hub/marketplace/onboarding/linho-co?step=mapping', zone: 'mare-ops', owner: remote('product-hub'), board: 'PH-onboarding', heading: 'Onboard Linho & Co', release: '0.1' },

  { id: 'product-hub-availability', system: 'product-hub', title: 'Availability', href: '/mare/ops/product-hub/availability', zone: 'mare-ops', owner: remote('product-hub'), board: 'PH-availability', heading: 'Availability', release: '0.2', checked: '2026-09-27', states: ['oversold', 'error'] },
  { id: 'product-hub-imports', system: 'product-hub', title: 'Imports', href: '/mare/ops/product-hub/imports', zone: 'mare-ops', owner: remote('product-hub'), board: 'PH-imports', heading: 'Imports', release: '0.2', checked: '2026-09-27', states: ['failed'] },
  { id: 'product-hub-audit', system: 'product-hub', title: 'AI audit log', href: '/mare/ops/product-hub/audit', zone: 'mare-ops', owner: remote('product-hub'), board: 'PH-audit', heading: 'Audit', release: '0.2', checked: '2026-09-27', states: ['empty'] },

  { id: 'pay-applications', system: 'pay', title: 'Applications', href: '/mare/ops/pay', zone: 'mare-ops', owner: remote('pay'), board: 'PY-applications', heading: 'Applications', release: '0.1' },
  { id: 'pay-application-detail', system: 'pay', title: 'Application detail', href: '/mare/ops/pay/applications/AP-77118', zone: 'mare-ops', owner: remote('pay'), board: 'PY-detail', heading: 'Bruno S.', release: '0.1' },
  { id: 'pay-decision', system: 'pay', title: 'Decision + override', href: '/mare/ops/pay/applications/AP-77118?modal=decision&sub=override', zone: 'mare-ops', owner: remote('pay'), board: 'PY-decision', heading: 'Bruno S.', release: '0.1' },
  { id: 'pay-accounts', system: 'pay', title: 'Accounts', href: '/mare/ops/pay/accounts', zone: 'mare-ops', owner: remote('pay'), board: 'PY-accounts', heading: 'Accounts', release: '0.2', checked: '2026-09-27', states: ['frozen', 'empty', 'error'] },
  { id: 'pay-disputes', system: 'pay', title: 'Disputes', href: '/mare/ops/pay/disputes', zone: 'mare-ops', owner: remote('pay'), board: 'PY-disputes', heading: 'Disputes', release: '0.2', checked: '2026-09-27', states: ['empty', 'error'] },
  { id: 'pay-collections', system: 'pay', title: 'Collections', href: '/mare/ops/pay/collections', zone: 'mare-ops', owner: remote('pay'), board: 'PY-collections', heading: 'Collections', release: '0.2', checked: '2026-09-27', states: ['promise-broken'] },
  { id: 'pay-fraud', system: 'pay', title: 'Fraud', href: '/mare/ops/pay/fraud', zone: 'mare-ops', owner: remote('pay'), board: 'PY-fraud', heading: 'Fraud', release: '0.2', checked: '2026-09-27', states: ['degraded', 'loading'] },
  { id: 'pay-models', system: 'pay', title: 'Models', href: '/mare/ops/pay/models', zone: 'mare-ops', owner: remote('pay'), board: 'PY-models', heading: 'Models', release: '0.2', checked: '2026-09-27', states: ['drift'] },
  { id: 'pay-policies', system: 'pay', title: 'Policies', href: '/mare/ops/pay/policies', zone: 'mare-ops', owner: remote('pay'), board: 'PY-policies', heading: 'Policies', release: '0.2', checked: '2026-09-27', states: ['conflict'] },
  { id: 'pay-customer-app', system: 'pay', title: 'Pay customer app', href: '/mare/apps/pay', zone: 'mare-shop', owner: shop, board: 'PY-app', heading: 'Pay app', release: '0.1', mobile: true },

  { id: 'circle-program', system: 'circle', title: 'Program dashboard', href: '/mare/ops/circle', zone: 'mare-ops', owner: remote('circle'), board: 'CI-program', heading: 'creators sold', release: '0.1' },
  { id: 'circle-rule-builder', system: 'circle', title: 'Rule builder', href: '/mare/ops/circle/rules/summer-swim', zone: 'mare-ops', owner: remote('circle'), board: 'CI-rules', heading: 'Rule builder', release: '0.1' },
  { id: 'circle-leak', system: 'circle', title: 'Leak + rotate', href: '/mare/ops/circle?modal=leak&code=MARI15&sub=rotate', zone: 'mare-ops', owner: remote('circle'), board: 'CI-leak', heading: 'creators sold', release: '0.1' },
  { id: 'circle-creators', system: 'circle', title: 'Creators', href: '/mare/ops/circle/creators', zone: 'mare-ops', owner: remote('circle'), board: 'CI-creators', heading: 'Creators', release: '0.2', checked: '2026-09-27', states: ['new', 'error'] },
  { id: 'circle-campaigns', system: 'circle', title: 'Campaigns', href: '/mare/ops/circle/campaigns', zone: 'mare-ops', owner: remote('circle'), board: 'CI-campaigns', heading: 'Summer swim drop', release: '0.2', checked: '2026-09-27', states: ['scheduled'] },
  { id: 'circle-payouts', system: 'circle', title: 'Payouts', href: '/mare/ops/circle/payouts', zone: 'mare-ops', owner: remote('circle'), board: 'CI-payouts', heading: 'Payouts', release: '0.2', checked: '2026-09-27', states: ['payout-failed'] },
  { id: 'circle-creator-app', system: 'circle', title: 'Creator app', href: '/mare/apps/circle', zone: 'mare-shop', owner: shop, board: 'CI-app', heading: 'Circle creator app', release: '0.1' },

  { id: 'mesh-topology', system: 'mesh', title: 'Topology', href: '/mare/ops/mesh', zone: 'mare-ops', owner: remote('mesh'), board: 'MS-topology', heading: 'live topology', release: '0.1' },
  { id: 'mesh-partner', system: 'mesh', title: 'Partner adapter', href: '/mare/ops/mesh/partners/ligeiro-log', zone: 'mare-ops', owner: remote('mesh'), board: 'MS-partner', heading: 'Ligeiro Log', release: '0.1' },
  { id: 'mesh-dlq-replay', system: 'mesh', title: 'DLQ replay + transform', href: '/mare/ops/mesh/dlq?modal=replay&sub=transform', zone: 'mare-ops', owner: remote('mesh'), board: 'MS-dlq', heading: 'dead-letter queue', release: '0.1' },
  { id: 'mesh-invoice-chain', system: 'mesh', title: 'Invoice chain', href: '/mare/ops/mesh/invoices/MR-904117', zone: 'mare-ops', owner: remote('mesh'), board: 'MS-invoices', heading: 'invoice chain', release: '0.1' },

  { id: 'mesh-events', system: 'mesh', title: 'Event stream', href: '/mare/ops/mesh/events', zone: 'mare-ops', owner: remote('mesh'), board: 'MS-events', heading: 'event stream', release: '0.2', checked: '2026-09-27', states: ['empty'] },
  { id: 'mesh-contracts', system: 'mesh', title: 'Contracts', href: '/mare/ops/mesh/contracts', zone: 'mare-ops', owner: remote('mesh'), board: 'MS-contracts', heading: 'contracts', release: '0.2', checked: '2026-09-27', states: ['error'] },
  { id: 'observability-problems', system: 'observability', title: 'Tidewatch · Problems', href: '/observability', zone: 'shell', owner: shell, board: 'V2-apm', heading: 'Checkout p95 degraded', release: '0.2', checked: '2026-09-27' },
  { id: 'observability-trace', system: 'observability', title: 'Tidewatch · Trace waterfall', href: '/observability/traces/9f3a2c', zone: 'shell', owner: shell, board: 'V2-trace', heading: 'Trace 9f3a2c', release: '0.2', checked: '2026-09-27' },
  { id: 'observability-logs', system: 'observability', title: 'Tidewatch · Logs', href: '/observability/logs', zone: 'shell', owner: shell, board: 'TW-logs', heading: 'Logs', release: '0.2', checked: '2026-09-27' },
  { id: 'observability-slos', system: 'observability', title: 'Tidewatch · SLOs', href: '/observability/slos', zone: 'shell', owner: shell, board: 'TW-slos', heading: 'SLOs', release: '0.2', checked: '2026-09-27' },

  { id: 'consumer-app', system: 'consumer', title: 'Shopping app · 3 phones', href: '/mare/apps/shop', zone: 'mare-shop', owner: shop, board: 'CS-app', heading: 'Shopping app', release: '0.1', mobile: true },
  { id: 'consumer-site', system: 'consumer', title: 'Maré site', href: '/mare/shop', zone: 'mare-shop', owner: shop, board: 'CS-site', heading: 'Linen, sun and salt', release: '0.1', mobile: true },

  { id: 'atlas-onboarding', system: 'atlas', title: 'Onboarding', href: '/atlas/welcome?step=2', zone: 'shell', owner: shell, board: 'AT-onboarding', heading: 'Where do you want to work', release: '0.1' },
  { id: 'atlas-pipeline', system: 'atlas', title: 'Pipeline', href: '/atlas/pipeline', zone: 'shell', owner: shell, board: 'AT-pipeline', heading: 'interviews this week', release: '0.1' },
  { id: 'atlas-board', system: 'atlas', title: 'Board + drawer + log outcome', href: '/atlas/pipeline/board?drawer=parallax-pay&sub=log-outcome', zone: 'shell', owner: shell, board: 'AT-board', heading: 'Applications', release: '0.1', mobile: true },
  { id: 'atlas-company', system: 'atlas', title: 'Company', href: '/atlas/companies/parallax-pay', zone: 'shell', owner: shell, board: 'AT-company', heading: 'Parallax Pay', release: '0.1' },
  { id: 'atlas-arena-setup', system: 'atlas', title: 'Library + session setup', href: '/atlas/arena?modal=setup&prompt=payments-ledger', zone: 'shell', owner: shell, board: 'AT-arena', heading: 'interview you', release: '0.1' },
  { id: 'atlas-arena-session', system: 'atlas', title: 'Arena session', href: '/atlas/arena/session/14', zone: 'shell', owner: shell, board: 'AT-session', heading: 'Design a payments ledger', release: '0.1' },
  { id: 'atlas-feedback', system: 'atlas', title: 'Feedback', href: '/atlas/arena/sessions/14', zone: 'shell', owner: shell, board: 'AT-feedback', heading: 'System design feedback', release: '0.1' },
  { id: 'atlas-transcript', system: 'atlas', title: 'Transcript drawer', href: '/atlas/arena/sessions/14?drawer=transcript&t=31:30', zone: 'shell', owner: shell, board: 'AT-transcript', heading: 'System design feedback', release: '0.1' },
  { id: 'atlas-academy', system: 'atlas', title: 'Academy', href: '/atlas/academy/designing-for-10x', zone: 'shell', owner: shell, board: 'AT-lesson', heading: 'Designing for 10', release: '0.1' },
  { id: 'atlas-paywall', system: 'atlas', title: 'Paywall + checkout', href: '/atlas/academy/designing-for-10x?modal=paywall&sub=checkout', zone: 'shell', owner: shell, board: 'AT-paywall', heading: 'Designing for 10', release: '0.1' },
  { id: 'system-design-atlas', system: 'atlas', title: 'Atlas system design', href: '/system-design/atlas', zone: 'shell', owner: shell, board: 'SD-atlas', heading: 'Decisions under load', release: '0.1' },

  { id: 'pulse-intelligence', system: 'pulse', title: 'Intelligence', href: '/pulse', zone: 'pulse', owner: pulse, board: 'PU-intelligence', heading: 'Performance intelligence', release: '0.1', mobile: true },
  { id: 'pulse-distribution', system: 'pulse', title: 'Distribution', href: '/pulse/distribution', zone: 'pulse', owner: pulse, board: 'PU-distribution', heading: 'Distribution', release: '0.1' },
  { id: 'pulse-harness', system: 'pulse', title: 'AI harness', href: '/pulse/harness', zone: 'pulse', owner: pulse, board: 'PU-harness', heading: 'AI harness', release: '0.1' },
  { id: 'system-design-pulse', system: 'pulse', title: 'Pulse system design', href: '/system-design/pulse', zone: 'shell', owner: shell, board: 'SD-pulse', heading: 'Decisions under load', release: '0.1' },

  { id: 'work-index', system: 'overview', title: 'Work index', href: '/work', zone: 'shell', owner: shell, board: 'OV-work', heading: 'Three platforms', release: '0.1', parity: false },
  { id: 'work-mare', system: 'mare', title: 'Maré case study', href: '/work/mare', zone: 'shell', owner: shell, board: 'OV-case', heading: 'Maré', release: '0.1', parity: false },
  { id: 'work-atlas', system: 'atlas', title: 'Atlas case study', href: '/work/atlas', zone: 'shell', owner: shell, board: 'OV-case', heading: 'Atlas', release: '0.1', parity: false },
  { id: 'work-pulse', system: 'pulse', title: 'Pulse case study', href: '/work/pulse', zone: 'shell', owner: shell, board: 'OV-case', heading: 'Pulse', release: '0.1', parity: false },
  { id: 'mare-ops-index', system: 'mare', title: 'Maré Ops remote index', href: '/mare/ops/', zone: 'mare-ops', owner: '@portfolio/mare-ops', board: 'MO-index', heading: 'five teams', release: '0.1', parity: false }
];

/**
 * Views owned by each Maré Ops remote. A remote's typed router must map every view id to a
 * component (checked by TypeScript), and its nav renders only from this list, so a nav item
 * cannot exist without a screen. `segment` is the first path segment under /mare/ops/<remote>.
 */
/** `parent` names the nav item a non-nav view highlights (an application detail lights up Applications). */
export type ViewDef = { readonly id: string; readonly title: string; readonly segment: string; readonly nav: boolean; readonly navPath?: string; readonly parent?: string };

export const remoteViews = {
  counter: [
    { id: 'orders', title: 'Orders', segment: '', nav: true },
    { id: 'picking', title: 'Picking', segment: 'pick', nav: true, navPath: 'pick/MR-904117' },
    { id: 'returns', title: 'Returns', segment: 'returns', nav: true },
    { id: 'stock', title: 'Stock lookup', segment: 'stock', nav: true }
  ],
  'product-hub': [
    { id: 'catalog', title: 'Catalog', segment: '', nav: true },
    { id: 'product', title: 'Pricing', segment: 'products', nav: true, navPath: 'products/510233?tab=pricing' },
    { id: 'availability', title: 'Availability', segment: 'availability', nav: true },
    { id: 'marketplace', title: 'Marketplace', segment: 'marketplace', nav: true, navPath: 'marketplace/onboarding/linho-co?step=mapping' },
    { id: 'imports', title: 'Imports', segment: 'imports', nav: true },
    { id: 'audit', title: 'Audit', segment: 'audit', nav: true }
  ],
  pay: [
    { id: 'applications', title: 'Applications', segment: '', nav: true },
    { id: 'application', title: 'Application', segment: 'applications', nav: false, parent: 'applications' },
    { id: 'accounts', title: 'Accounts', segment: 'accounts', nav: true },
    { id: 'disputes', title: 'Disputes', segment: 'disputes', nav: true },
    { id: 'collections', title: 'Collections', segment: 'collections', nav: true },
    { id: 'fraud', title: 'Fraud', segment: 'fraud', nav: true },
    { id: 'models', title: 'Models', segment: 'models', nav: true },
    { id: 'policies', title: 'Policies', segment: 'policies', nav: true }
  ],
  circle: [
    { id: 'program', title: 'Program', segment: '', nav: true },
    { id: 'creators', title: 'Creators', segment: 'creators', nav: true },
    { id: 'campaigns', title: 'Campaigns', segment: 'campaigns', nav: true },
    { id: 'rules', title: 'Rules', segment: 'rules', nav: true, navPath: 'rules/summer-swim' },
    { id: 'payouts', title: 'Payouts', segment: 'payouts', nav: true }
  ],
  mesh: [
    { id: 'topology', title: 'topology', segment: '', nav: true },
    { id: 'partners', title: 'partners', segment: 'partners', nav: true, navPath: 'partners/ligeiro-log' },
    { id: 'events', title: 'events', segment: 'events', nav: true },
    { id: 'dlq', title: 'dlq', segment: 'dlq', nav: true },
    { id: 'invoices', title: 'invoices', segment: 'invoices', nav: true, navPath: 'invoices/MR-904117' },
    { id: 'contracts', title: 'contracts', segment: 'contracts', nav: true }
  ]
} as const satisfies Record<string, readonly ViewDef[]>;

export type RemoteName = keyof typeof remoteViews;
export type ViewId<R extends RemoteName> = (typeof remoteViews)[R][number]['id'];
