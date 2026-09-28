export const fx = { rate: 5.42, spread: 0.012, asOf: 'Sep 26 close', min: 4.8, max: 6.2 };

export type Offer = { id: string; company: string; role: string; kind: 'USD contractor' | 'BRL employee'; currency: 'USD' | 'BRL'; monthly: number; decideBy: string; perks: string[]; pipelineId?: string };
export const offers: Offer[] = [
  { id: 'kite', company: 'Kite Robotics', role: 'Senior engineer · remote, paid in USD', kind: 'USD contractor', currency: 'USD', monthly: 10_000, decideBy: 'Oct 3', perks: ['$120k a year', '0.08% equity', 'Home office stipend'], pipelineId: 'kite' },
  { id: 'counter', company: 'Current role · counter-offer', role: 'Staff engineer · São Paulo, paid in BRL', kind: 'BRL employee', currency: 'BRL', monthly: 42_000, decideBy: 'Oct 5', perks: ['13th salary + vacation bonus', 'Employer health plan', 'Meal card'] }
];

export type Step = { label: string; amount: number; note: string };

export function takeHome(offer: Offer, rate: number): Step[] {
  if (offer.currency === 'USD') {
    const gross = offer.monthly * rate;
    const spread = -gross * fx.spread;
    const revenue = gross + spread;
    const taxes = -revenue * 0.06;
    const fees = -(450 + 15 * rate + revenue * 0.0038);
    const health = -1_100;
    const reserve = -(revenue + taxes + fees + health) * 0.11;
    return [
      { label: 'Gross at today’s rate', amount: gross, note: `$${offer.monthly.toLocaleString('en-US')} × ${rate.toFixed(2)}` },
      { label: 'FX spread', amount: spread, note: `${(fx.spread * 100).toFixed(1)}% bank spread` },
      { label: 'Company taxes', amount: taxes, note: 'simplified regime · 6%' },
      { label: 'Accountant and bank fees', amount: fees, note: 'R$450 + wire + 0.38% IOF' },
      { label: 'Health insurance', amount: health, note: 'individual plan' },
      { label: 'Suggested reserve', amount: reserve, note: '11% for vacation, 13th and gaps' }
    ];
  }
  const gross = offer.monthly;
  const social = -951.63;
  const income = -(gross + social) * 0.225;
  const extras = (gross * 2.33) / 12;
  return [
    { label: 'Gross salary', amount: gross, note: 'monthly, before deductions' },
    { label: 'Social security', amount: social, note: 'capped contribution' },
    { label: 'Income tax', amount: income, note: 'progressive · ~22.5% effective' },
    { label: '13th salary and vacation bonus', amount: extras, note: 'spread across 12 months' }
  ];
}

export const netOf = (steps: Step[]) => steps.reduce((sum, step) => sum + step.amount, 0);
export const archiveNote = (company: string) => `Thank you for the time your team gave me. I've accepted another offer, so I'm withdrawing from the ${company} process. I'd be glad to stay in touch.`;
export const OFFER_KEY = 'atlas:accepted-offer';
export const OFFER_CHANNEL = 'atlas-offer';
