/** Pricing guardrails the agent and the human editor both run through. */
export type PriceProposal = { price: number; cost: number; basePrice: number; days: number; channels: string[]; competitorMedian: number };
export type Guardrail = { id: string; label: string; pass: boolean; detail: string };

export const FLOOR_MARGIN = 0.3;
export const MAX_MARKDOWN = 0.2;
export const MAX_DAYS = 30;
export const PARITY_BAND = 0.05;

export const margin = (price: number, cost: number) => (price - cost) / price;
export const markdown = (price: number, basePrice: number) => (basePrice - price) / basePrice;

/** Constant-elasticity demand: units scale with (price / base)^elasticity. */
export function forecastLift(price: number, basePrice: number, elasticity = -1.3) {
  return Math.pow(price / basePrice, elasticity) - 1;
}

export function guardrails(proposal: PriceProposal): Guardrail[] {
  const m = margin(proposal.price, proposal.cost);
  const d = markdown(proposal.price, proposal.basePrice);
  const parity = Math.abs(proposal.price - proposal.competitorMedian) / proposal.competitorMedian;
  const marketplace = proposal.channels.includes('marketplace');
  return [
    { id: 'margin', label: 'Margin ≥ 30%', pass: m >= FLOOR_MARGIN, detail: `${(m * 100).toFixed(1)}%` },
    { id: 'markdown', label: 'Markdown ≤ 20%', pass: d <= MAX_MARKDOWN, detail: `${(Math.max(d, 0) * 100).toFixed(1)}%` },
    { id: 'parity', label: 'Marketplace parity ±5%', pass: !marketplace || parity <= PARITY_BAND, detail: marketplace ? `${(parity * 100).toFixed(1)}% from median` : 'not listed' },
    { id: 'window', label: 'Window ≤ 30 days', pass: proposal.days > 0 && proposal.days <= MAX_DAYS, detail: `${proposal.days} days` }
  ];
}

export const allPass = (items: Guardrail[]) => items.every((item) => item.pass);
