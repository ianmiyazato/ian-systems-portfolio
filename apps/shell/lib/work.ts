export type Shot = { src: string; label: string; href: string };
export type CaseStudy = {
  slug: 'mare' | 'atlas' | 'pulse';
  name: string;
  kind: string;
  pitch: string;
  theme: string;
  problem: string[];
  owned: Array<{ tag: 'Frontend' | 'Backend' | 'Data' | 'AI'; text: string }>;
  metrics: string[];
  shots: Shot[];
};

export const studies: CaseStudy[] = [
  {
    slug: 'mare', name: 'Maré', kind: 'Retail platform · five operational systems + consumer', theme: 'portfolio',
    pitch: 'One fashion retailer, five internal systems with five different users, and a consumer site that has to feel effortless on top.',
    problem: [
      'Store staff, merchandisers, credit analysts, partnership managers and integration engineers were all working in one generic admin, so every screen was optimized for nobody.',
      'Underneath, each channel talked to each carrier, tax gateway and payment partner directly. Every new partner multiplied the failure modes.',
      'The job: give each team a product shaped around its work, and give the platform one canonical event contract to stand on.'
    ],
    owned: [
      { tag: 'Frontend', text: 'Five design languages on one token contract; runtime-federated remotes with bounded failure.' },
      { tag: 'Backend', text: 'Canonical order events, partner adapters with circuit breakers, idempotent replays.' },
      { tag: 'Data', text: 'Store-level availability, commission ledgers that confirm after the return window.' },
      { tag: 'AI', text: 'Cutoff, pricing and triage agents that propose with evidence; people approve.' }
    ],
    metrics: ['API latency 450 → ~200 ms', 'Error rate 1.8% → 0.5–0.7%', 'Catalog reads 3–5× faster', 'Deploys 2 → 8–12 per week'],
    shots: [
      { src: 'counter/counter-lanes.png', label: 'Counter · order lanes', href: '/mare/ops/counter' },
      { src: 'product-hub/product-hub-detail.png', label: 'Product Hub · pricing', href: '/mare/ops/product-hub/products/510233?tab=pricing' },
      { src: 'pay/pay-application-detail.png', label: 'Pay · application', href: '/mare/ops/pay/applications/AP-77118' },
      { src: 'circle/circle-rule-builder.png', label: 'Circle · rule builder', href: '/mare/ops/circle/rules/summer-swim' },
      { src: 'mesh/mesh-topology.png', label: 'Mesh · live topology', href: '/mare/ops/mesh' },
      { src: 'consumer/consumer-site.png', label: 'Maré · site', href: '/mare/shop' }
    ]
  },
  {
    slug: 'atlas', name: 'Atlas', kind: 'Careers platform · Pipeline, Arena, Academy', theme: 'atlas',
    pitch: 'A career operating system where practice, learning and the job pipeline feed each other instead of living in three tabs.',
    problem: [
      'Engineers prepared for interviews in one tool, tracked applications in a spreadsheet and learned in a third place. Nothing connected what they practised to where they were interviewing.',
      'Scores alone made people feel measured rather than helped.',
      'The job: connect an interview outcome to the next practice session, and make paid depth feel earned, not gated.'
    ],
    owned: [
      { tag: 'Frontend', text: 'Kanban pipeline with drawers and nested outcome logging; session and feedback flows.' },
      { tag: 'Backend', text: 'Event-driven plan changes that propagate across zones; entitlement checks at the edge.' },
      { tag: 'Data', text: 'Rubric scores with transcript citations; hiring-velocity aggregates per company.' },
      { tag: 'AI', text: 'Simulated interviewer and grader with cited feedback and a human-readable rubric.' }
    ],
    metrics: ['Feature adoption +30–40%', 'Dashboard load 2.8 s → 1.2 s'],
    shots: [
      { src: 'atlas/atlas-board.png', label: 'Pipeline board', href: '/atlas/pipeline/board?drawer=parallax-pay&sub=log-outcome' },
      { src: 'atlas/atlas-feedback.png', label: 'Arena feedback', href: '/atlas/arena/sessions/14' },
      { src: 'atlas/atlas-academy.png', label: 'Academy lesson', href: '/atlas/academy/designing-for-10x' }
    ]
  },
  {
    slug: 'pulse', name: 'Pulse', kind: 'Entertainment concept · LA, Seoul, Tokyo', theme: 'pulse',
    pitch: 'Performance intelligence, a distribution engine and an AI harness that share one evidence trail across three markets.',
    problem: [
      'Teams in three time zones saw the same artist as seven different accounts in three scripts, so signals were split and moments were missed.',
      'Analysts asked an LLM questions but couldn\'t see which sources shaped the answer, and model upgrades shipped on vibes.',
      'The job: resolve entities, detect moments early, and put every model release through a gate people can inspect.'
    ],
    owned: [
      { tag: 'Frontend', text: 'SvelteKit zone with live clocks, draggable time-zone scheduling and EN/KR/JP.' },
      { tag: 'Backend', text: 'Event-stream aggregation into per-market read models; canary routing for models.' },
      { tag: 'Data', text: 'Entity resolution across platforms and scripts.' },
      { tag: 'AI', text: 'RAG with citations, a judge, an eval gate and fine-tuned vs base comparison.' }
    ],
    metrics: ['Analytics queries 5–10× faster', 'Availability 99.8%'],
    shots: [
      { src: 'pulse/pulse-intelligence.png', label: 'Intelligence', href: '/pulse' },
      { src: 'pulse/pulse-distribution.png', label: 'Distribution', href: '/pulse/distribution' },
      { src: 'pulse/pulse-harness.png', label: 'AI harness', href: '/pulse/harness' }
    ]
  }
];

export const studyBySlug = (slug: string) => studies.find((study) => study.slug === slug);
