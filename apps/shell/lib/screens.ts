export type Screen = {
  eyebrow: string;
  title: string;
  description: string;
  theme: 'portfolio' | 'balcao' | 'product-hub' | 'pay' | 'circle' | 'mesh' | 'consumer' | 'atlas' | 'pulse';
  tabs: string[];
  kpis: Array<[string, string, string?]>;
  cards: Array<{ title: string; meta: string; status: string; body: string }>;
  modal: { title: string; subTitle: string; action: string };
};

const common = {
  tabs: ['Overview', 'Live work', 'Decisions', 'History'],
  modal: { title: 'Review decision', subTitle: 'Approval evidence', action: 'Approve change' }
};

export const screenFor = (path: string): Screen => {
  if (path.includes('/balcao')) return {
    ...common, theme: 'balcao', eyebrow: 'Shopping Vila Nova · #0412', title: path.includes('picking') ? 'Order OR-9248 · 16 min left' : '59 open orders',
    description: 'Pickup and delivery work organized around the carrier cutoff.', tabs: ['Orders', 'Picking', 'Returns', 'Stock lookup'],
    kpis: [['Pickup', '38'], ['Delivery', '21'], ['Late', '5', 'risk'], ['Queued offline', path.includes('offline') ? '3' : '0']],
    cards: [
      { title: 'To pick', meta: 'OR-9248 · Rafael', status: 'Pickup', body: '2 items · Aisles A3 + C1 · 16 min left' },
      { title: 'Picking', meta: 'OR-7712 · Luiza', status: 'Delivery from store', body: '3 of 4 scanned · cutoff 17:00' },
      { title: 'Ready', meta: 'OR-6619 · Caio', status: 'Pickup', body: 'Code verified · locker 04' },
      { title: 'Handed over', meta: 'OR-5527 · Marina', status: 'Done', body: 'Evidence recorded · 16:11' }
    ],
    modal: { title: 'Hand over to Rafael M.', subTitle: 'Authorize a third party', action: 'Confirm handover' }
  };
  if (path.includes('product-hub')) return {
    ...common, theme: 'product-hub', eyebrow: 'Catalog · Saved view', title: path.includes('/products/') ? 'Linen overshirt · Pricing' : 'Summer · needs action',
    description: 'Dense merchandising decisions with forecast evidence and human guardrails.', tabs: ['Catalog', 'Pricing', 'Availability', 'Marketplace', 'Imports', 'Audit'],
    kpis: [['Needs action', '24'], ['Low margin', '8'], ['Missing offer', '5'], ['Healthy', '1,284']],
    cards: [
      { title: 'Linen overshirt', meta: 'SKU MR-18401 · Lara', status: 'Review price', body: 'R$ 249 · margin 42% · stock 184' },
      { title: 'Coast trousers', meta: 'SKU MR-18372 · Nina', status: 'Healthy', body: 'R$ 289 · margin 48% · stock 97' },
      { title: 'Salt knit', meta: 'SKU MR-18190 · Rui', status: 'Low stock', body: 'R$ 199 · margin 39% · stock 14' },
      { title: 'Canvas tote', meta: 'SKU MR-17921 · Lara', status: 'Missing offer', body: 'R$ 129 · margin 51% · stock 301' }
    ],
    modal: { title: 'Pricing agent run', subTitle: 'Edit proposal', action: 'Approve proposal' }
  };
  if (path.includes('/pay')) return {
    ...common, theme: 'pay', eyebrow: 'Maré Pay · Credit operations', title: path.includes('AP-') ? 'Bruno S. · R$ 6.000 requested' : 'Applications',
    description: 'Review-band credit decisions pair model contributions with policy evidence.', tabs: ['Applications', 'Accounts', 'Disputes', 'Collections', 'Fraud', 'Models', 'Policies'],
    kpis: [['In review', '37'], ['Auto-approved', '68%'], ['Median score', '644'], ['Model', 'ft-risk-v3']],
    cards: [
      { title: 'AP-77118 · Bruno S.', meta: 'Score 588 · manual review', status: 'Review band', body: 'Income stable · address mismatch' },
      { title: 'AP-77104 · Tainá R.', meta: 'Score 712 · R$ 4.000', status: 'Approve', body: 'Thin file · verified income' },
      { title: 'Why the score is 588', meta: '+41 payment history · −62 utilization', status: 'Explainable', body: 'Five contribution factors with cited documents' },
      { title: 'Model drift monitor', meta: 'PSI 0.08 · stable', status: 'Healthy', body: 'No cohort exceeds the warning boundary' }
    ],
    modal: { title: 'Choose credit products', subTitle: 'Policy override', action: 'Continue' }
  };
  if (path.includes('/circle')) return {
    ...common, theme: 'circle', eyebrow: 'Maré Circle · summer drop', title: path.includes('rules') ? 'Rule builder · Swim' : '318 creators sold R$ 2.1M this month',
    description: 'Creator commerce that makes attribution, returns, and payouts legible.', tabs: ['Program', 'Creators', 'Campaigns', 'Rules', 'Payouts'],
    kpis: [['Active creators', '318'], ['Attributed sales', 'R$ 2.1M'], ['Pending returns', 'R$ 184k'], ['Codes at risk', '3']],
    cards: [
      { title: 'Nina Costa', meta: '@ninac · NINA10', status: '+18%', body: 'R$ 84k sales · R$ 8.4k commission' },
      { title: 'João M.', meta: '@joaomar · JOAO12', status: '+9%', body: 'R$ 67k sales · R$ 6.7k commission' },
      { title: 'Coupon leak detected', meta: '3.8× baseline usage', status: 'AI review', body: 'Most new uses have no creator-session evidence' },
      { title: 'Live receipt', meta: 'Swim 10% · Marketplace 0%', status: 'Preview', body: 'Returns settle after the 30-day window' }
    ],
    modal: { title: 'Investigate coupon leak', subTitle: 'Rotate code', action: 'Cap and rotate code' }
  };
  if (path.includes('/mesh')) return {
    ...common, theme: 'mesh', eyebrow: 'integration mesh · live', title: path.includes('invoices') ? 'invoice chain · rejection triage' : path.includes('partners') ? 'ligeiro log · tracking adapter' : 'live topology',
    description: 'Adapters, contracts, circuits, and replay tools expose failure instead of hiding it.', tabs: ['topology', 'partners', 'events', 'dlq', 'invoices', 'contracts'],
    kpis: [['throughput', '1.8k/s'], ['p95', '182ms'], ['dlq', '18'], ['circuits', '1 half-open']],
    cards: [
      { title: 'orders → fulfillment', meta: 'packet stream · 842/s', status: 'healthy', body: 'canonical.order.v4 · lag 41ms' },
      { title: 'ligeiro log', meta: 'tracking adapter · p95 884ms', status: 'degraded', body: 'half-open · probe 2 of 3' },
      { title: 'unknown status X9', meta: 'schema mismatch · 2 events', status: 'dlq', body: 'proposed mapping: delivery_exception' },
      { title: 'log tail', meta: '16:18:44 · retry scheduled', status: 'streaming', body: 'idempotency key retained · attempt 3' }
    ],
    modal: { title: 'DLQ replay dry run', subTitle: 'Transform before replay', action: 'Replay 15' }
  };
  if (path.startsWith('/atlas')) return {
    ...common, theme: 'atlas', eyebrow: 'Atlas · career operating system', title: path.includes('welcome') ? 'Build your practice plan' : path.includes('feedback') ? 'System design feedback · 78' : path.includes('academy') ? 'Academy · reliable systems' : path.includes('arena') ? 'Arena prompt library' : 'Pipeline board',
    description: 'Practice, evidence, and the job pipeline stay connected from first prompt to outcome.', tabs: ['Pipeline', 'Arena', 'Academy', 'Members'],
    kpis: [['Active roles', '12'], ['Interviews', '4'], ['Practice score', '78'], ['Weekly focus', 'Caching']],
    cards: [
      { title: 'Applied', meta: '3 opportunities', status: 'Pipeline', body: 'Two roles updated this week' },
      { title: 'Interview', meta: 'Founding engineer · Onsite', status: 'Prepare', body: 'Matching Arena drill: cache invalidation' },
      { title: 'Arena session', meta: 'Distributed feed · 78/100', status: 'Feedback', body: 'Strong framing · estimate before selecting storage' },
      { title: 'Interview loop intelligence', meta: 'Members hired here', status: 'Pro locked', body: 'Upgrade to compare loop stages and velocity' }
    ],
    modal: { title: 'Session setup', subTitle: 'Log interview outcome', action: 'Start session' }
  };
  if (path.startsWith('/pulse')) return {
    ...common, theme: 'pulse', eyebrow: 'Pulse · LA 09:18 · Seoul 01:18 · Tokyo 01:18', title: path.includes('distribution') ? 'Moment detected → campaign' : path.includes('harness') ? 'AI harness · evaluation gate' : 'Performance intelligence',
    description: 'One evidence trail connects market signals, distribution actions, and model releases.', tabs: ['Intelligence', 'Distribution', 'AI harness', 'Releases'],
    kpis: [['Market signal', '+24%'], ['Moment score', '0.91'], ['Matched pages', '18'], ['Eval gate', 'Pass']],
    cards: [
      { title: 'Seoul · chorus lift', meta: '00:42–00:57 · short-form', status: 'Moment', body: 'Completion + sample data · confidence 0.91' },
      { title: 'Merged talent entity', meta: 'EN / 한국어 / 日本語', status: 'Resolved', body: 'Seven platform identities · one canonical artist' },
      { title: 'RAG trace', meta: 'retrieve → rerank → generate → judge', status: 'Pass', body: 'Faithfulness .94 · citations .98 · relevance .92' },
      { title: 'ft-analyst-v2', meta: '20% canary routing', status: 'Gated', body: 'Base vs fine-tuned comparison across 40 scenarios' }
    ],
    modal: { title: 'Ask Pulse', subTitle: 'Trace evidence', action: 'Run analysis' }
  };
  if (path.startsWith('/mare/shop') || path.startsWith('/mare/apps')) return {
    ...common, theme: 'consumer', eyebrow: 'Maré · summer 27', title: path.includes('/apps') ? 'Your Maré, in motion' : 'Linen, sun and salt.',
    description: 'Editorial shopping with local stock, creator context, and explainable styling.', tabs: ['New in', 'Women', 'Men', 'Stories', 'Stores'],
    kpis: [['Pickup today', '12 stores'], ['Style matches', '24'], ['Bag', '2 items'], ['Maré Pay', '3× no interest']],
    cards: [
      { title: 'Linen overshirt', meta: 'Natural · sizes PP–GG', status: 'Pickup today', body: 'R$ 249 · 3× R$ 83' },
      { title: 'Coast trousers', meta: 'Stone · sizes 34–46', status: '2 left', body: 'R$ 289 · creator pick' },
      { title: 'AI stylist', meta: '“easy layers for a humid weekend”', status: 'Simulated AI', body: 'Semantic matches grounded in fit, fabric, and stock' },
      { title: 'Order on the way', meta: 'Rota Sul Express · 2 stops', status: 'Live', body: 'Courier movement is a synthetic demo' }
    ],
    modal: { title: 'Your bag', subTitle: 'Choose fulfillment', action: 'Continue to checkout' }
  };
  return {
    ...common, theme: 'portfolio', eyebrow: 'Systems portfolio · v0.1', title: 'Work index',
    description: 'Every screen connects a product choice to its frontend, backend, data, and AI consequences.',
    kpis: [['Products', '3'], ['Design languages', '9'], ['Architecture scenarios', '8'], ['Decision annotations', '4+ / screen']],
    cards: [
      { title: 'Maré', meta: 'Retail platform', status: 'Explore', body: 'Five operational systems plus consumer surfaces' },
      { title: 'Atlas', meta: 'Careers platform', status: 'Explore', body: 'Pipeline, Arena, and Academy in one loop' },
      { title: 'Pulse', meta: 'Entertainment concept', status: 'Explore', body: 'Intelligence, distribution, and an AI harness' },
      { title: 'Architecture', meta: 'Animated system design', status: 'Replay', body: 'Failure scenarios reveal the decision boundaries' }
    ]
  };
};

export const routeLinks = [
  ['Maré · Balcão', '/mare/ops/balcao'], ['Maré · Product Hub', '/mare/ops/product-hub'], ['Maré · Pay', '/mare/ops/pay'], ['Maré · Circle', '/mare/ops/circle'], ['Maré · Mesh', '/mare/ops/mesh'], ['Maré shop', '/mare/shop'], ['Maré apps', '/mare/apps'], ['Atlas', '/atlas/pipeline/board'], ['Pulse', '/pulse'], ['System design', '/system-design/mare']
] as const;

