/** Commission math for creator attribution: rule rates per item, marketplace at 0%, returns excluded. */
export type Condition = { field: 'collection' | 'channel' | 'seller'; op: 'is' | 'is one of'; values: string[] };
export type Rule = { id: string; name: string; conditions: Condition[]; rate: number; priority: number };
export type LineItem = { name: string; price: number; collection: string; channel: 'Site' | 'App' | 'Marketplace'; seller: string; returned?: boolean };
export type CommissionLine = LineItem & { rate: number; amount: number; rule: string | null };

export const DEFAULT_RATE = 0.06;
export const RETURN_WINDOW_DAYS = 30;

const matches = (item: LineItem, condition: Condition) => {
  const value = condition.field === 'collection' ? item.collection : condition.field === 'channel' ? item.channel : item.seller;
  return condition.values.includes(value);
};

/** Highest-priority matching rule wins; marketplace items from other sellers earn nothing. */
export function commissionFor(items: LineItem[], rules: Rule[]): { lines: CommissionLine[]; total: number } {
  const ordered = [...rules].sort((a, b) => b.priority - a.priority);
  const lines = items.map((item) => {
    if (item.returned) return { ...item, rate: 0, amount: 0, rule: 'returned' };
    if (item.channel === 'Marketplace' && item.seller !== 'Maré') return { ...item, rate: 0, amount: 0, rule: 'marketplace' };
    const rule = ordered.find((candidate) => candidate.conditions.every((condition) => matches(item, condition)));
    const rate = rule?.rate ?? DEFAULT_RATE;
    return { ...item, rate, amount: Math.round(item.price * rate * 100) / 100, rule: rule?.id ?? null };
  });
  return { lines, total: Math.round(lines.reduce((sum, line) => sum + line.amount, 0) * 100) / 100 };
}

export const summerSwim: Rule = {
  id: 'summer-swim',
  name: 'Summer swim',
  priority: 20,
  rate: 0.1,
  conditions: [
    { field: 'collection', op: 'is', values: ['Swim · Summer 27'] },
    { field: 'channel', op: 'is one of', values: ['Site', 'App'] },
    { field: 'seller', op: 'is', values: ['Maré'] }
  ]
};

export const sampleOrder: LineItem[] = [
  { name: 'Maiô recorte', price: 259, collection: 'Swim · Summer 27', channel: 'Site', seller: 'Maré' },
  { name: 'Saída de praia linho', price: 199, collection: 'Swim · Summer 27', channel: 'Site', seller: 'Maré' },
  { name: 'Canga estampada', price: 89, collection: 'Swim · Summer 27', channel: 'Marketplace', seller: 'Casa Ribeira' },
  { name: 'Camisa linho natural', price: 249, collection: 'Linen · Summer 27', channel: 'Site', seller: 'Maré' },
  { name: 'Chinelo tiras', price: 119, collection: 'Swim · Summer 27', channel: 'Site', seller: 'Maré', returned: true }
];
