import { int, pick, rng } from './random';

export const ptFirstNames = ['Rafael', 'Luiza', 'Caio', 'Marina', 'Bruno', 'Tainá', 'Nina', 'João', 'Lara', 'Rui', 'Beatriz', 'Otávio', 'Helena', 'Diego', 'Camila', 'Thiago', 'Yasmin', 'Pedro', 'Aline', 'Gustavo'] as const;
export const carriers = ['Rota Sul Express', 'Ligeiro Log', 'Via Norte', 'Correio Nacional'] as const;

export const store = { name: 'Shopping Vila Nova', code: '#0412', cutoff: '17:00', cutoffIn: '42 min' } as const;

export type Swatch = 'linen' | 'sand' | 'sea' | 'clay' | 'ink' | 'slate' | 'rose' | 'mist';
export type OrderItem = { sku: string; name: string; size: string; aisle: string; swatch: Swatch; scanned?: boolean };
export type Lane = 'to-pick' | 'picking' | 'ready' | 'handed-over';
export type BalcaoOrder = {
  id: string;
  customer: string;
  type: 'pickup' | 'delivery';
  lane: Lane;
  items: OrderItem[];
  sla: string;
  urgent: boolean;
  total: string;
  payment: string;
  note?: string;
};

export const lanes: Array<{ id: Lane; label: string; total: number }> = [
  { id: 'to-pick', label: 'To pick', total: 18 },
  { id: 'picking', label: 'Picking', total: 14 },
  { id: 'ready', label: 'Ready', total: 15 },
  { id: 'handed-over', label: 'Handed over', total: 12 }
];

export const laneTotals = { open: 59, pickup: 38, delivery: 21, late: 5 } as const;

const item = (sku: string, name: string, size: string, aisle: string, swatch: Swatch, scanned?: boolean): OrderItem => ({ sku, name, size, aisle, swatch, scanned });

export const pickingOrder: BalcaoOrder = {
  id: 'MR-904117', customer: 'Rafael', type: 'pickup', lane: 'picking', sla: '16 min left', urgent: true, total: 'R$ 697,00', payment: 'Paid · Maré Pay Crédito',
  items: [
    item('MR-18401', 'Camisa linho natural', 'M', 'A3 · shelf 2', 'linen', true),
    item('MR-18372', 'Calça costa pedra', '42', 'C1 · shelf 4', 'sand', true),
    item('MR-18455', 'Tênis couro básico', '39', 'F2 · wall', 'ink')
  ]
};

/** The approved Balcão board: the artboard's cards, in lane order. Also seeds Supabase. */
export const balcaoBoard: BalcaoOrder[] = [
  { id: 'MR-904121', customer: 'Nina', type: 'delivery', lane: 'to-pick', sla: 'Cutoff 17:00 · 42 min', urgent: false, total: 'R$ 538,00', payment: 'Paid · Pix', items: [item('MR-18190', 'Tricô sal', 'P', 'B2 · shelf 1', 'sea'), item('MR-17921', 'Bolsa lona', 'U', 'D1 · hook 3', 'clay')] },
  { id: 'MR-904120', customer: 'Otávio', type: 'pickup', lane: 'to-pick', sla: '38 min left', urgent: false, total: 'R$ 289,00', payment: 'Paid · card', items: [item('MR-18372', 'Calça costa pedra', '44', 'C1 · shelf 4', 'sand')] },
  { id: 'MR-904124', customer: 'Helena', type: 'delivery', lane: 'to-pick', sla: 'Cutoff 17:00 · 42 min', urgent: false, total: 'R$ 818,00', payment: 'Paid · Maré Pay Loja', items: [item('MR-18511', 'Vestido maré', 'M', 'A1 · rail 2', 'slate'), item('MR-18401', 'Camisa linho natural', 'G', 'A3 · shelf 2', 'linen'), item('MR-18190', 'Tricô sal', 'M', 'B2 · shelf 1', 'sea')] },
  { ...pickingOrder },
  { id: 'MR-904115', customer: 'Luiza', type: 'delivery', lane: 'picking', sla: 'Cutoff 17:00 · 3 of 4 scanned', urgent: false, total: 'R$ 1.046,00', payment: 'Paid · card', items: [item('MR-18401', 'Camisa linho natural', 'P', 'A3', 'linen', true), item('MR-18511', 'Vestido maré', 'P', 'A1', 'slate', true), item('MR-18190', 'Tricô sal', 'P', 'B2', 'sea', true), item('MR-17921', 'Bolsa lona', 'U', 'D1', 'clay')] },
  { id: 'MR-904112', customer: 'Rafael M.', type: 'pickup', lane: 'ready', sla: 'Waiting · 8 min', urgent: false, total: 'R$ 448,00', payment: 'Paid · Maré Pay Crédito', items: [item('MR-18401', 'Camisa linho natural', 'M', 'Locker 04', 'linen'), item('MR-18190', 'Tricô sal', 'M', 'Locker 04', 'sea')] },
  { id: 'MR-904103', customer: 'Caio', type: 'pickup', lane: 'ready', sla: 'Waiting 2 h 10 min · no-show risk', urgent: true, total: 'R$ 199,00', payment: 'Paid · Pix', items: [item('MR-18190', 'Tricô sal', 'G', 'Locker 11', 'sea')], note: 'no-show' },
  { id: 'MR-904096', customer: 'Marina', type: 'pickup', lane: 'handed-over', sla: 'Handed over 16:11 · code verified', urgent: false, total: 'R$ 578,00', payment: 'Paid · card', items: [item('MR-18372', 'Calça costa pedra', '40', '—', 'sand'), item('MR-18455', 'Tênis couro básico', '37', '—', 'ink')] },
  { id: 'MR-904090', customer: 'Diego', type: 'delivery', lane: 'handed-over', sla: 'Collected by Rota Sul 15:40', urgent: false, total: 'R$ 129,00', payment: 'Paid · Pix', items: [item('MR-17921', 'Bolsa lona', 'U', '—', 'clay')] }
];

const catalog: Array<Omit<OrderItem, 'size' | 'aisle'>> = [
  { sku: 'MR-18401', name: 'Camisa linho natural', swatch: 'linen' },
  { sku: 'MR-18372', name: 'Calça costa pedra', swatch: 'sand' },
  { sku: 'MR-18190', name: 'Tricô sal', swatch: 'sea' },
  { sku: 'MR-17921', name: 'Bolsa lona', swatch: 'clay' },
  { sku: 'MR-18455', name: 'Tênis couro básico', swatch: 'ink' },
  { sku: 'MR-18511', name: 'Vestido maré', swatch: 'slate' }
];

/** The n-th synthetic order the demo driver announces over Realtime. Deterministic per n. */
export function liveOrder(n: number): BalcaoOrder {
  const random = rng(9000 + n);
  const count = int(random, 1, 3);
  const type = random() > 0.4 ? 'pickup' : 'delivery';
  const minutes = int(random, 14, 55);
  return {
    id: `MR-9042${String(n % 100).padStart(2, '0')}`,
    customer: pick(random, ptFirstNames),
    type,
    lane: 'to-pick',
    items: Array.from({ length: count }, () => ({ ...pick(random, catalog), size: pick(random, ['P', 'M', 'G', '38', '40']), aisle: `${pick(random, ['A', 'B', 'C', 'F'])}${int(random, 1, 4)}` })),
    sla: type === 'pickup' ? `${minutes} min left` : `Cutoff 17:00 · ${minutes} min`,
    urgent: minutes < 18,
    total: `R$ ${(count * int(random, 129, 289)).toLocaleString('pt-BR')},00`,
    payment: pick(random, ['Paid · Pix', 'Paid · Maré Pay Loja', 'Paid · card'])
  };
}

/** Kept for seeds and tiles: the board plus deterministic filler orders. */
export function balcaoOrders(): BalcaoOrder[] {
  return balcaoBoard;
}
