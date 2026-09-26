import { int, pick, rng } from './random';

export const ptFirstNames = ['Rafael', 'Luiza', 'Caio', 'Marina', 'Bruno', 'Tainá', 'Nina', 'João', 'Lara', 'Rui', 'Beatriz', 'Otávio', 'Helena', 'Diego', 'Camila', 'Thiago', 'Yasmin', 'Pedro', 'Aline', 'Gustavo'] as const;
export const ptLastInitials = ['S.', 'M.', 'R.', 'C.', 'A.', 'L.', 'B.', 'F.'] as const;
export const carriers = ['Rota Sul Express', 'Ligeiro Log', 'Via Norte', 'Correio Nacional'] as const;

export const store = { name: 'Shopping Vila Nova', code: '#0412', cutoff: '17:00', cutoffIn: '42 min' } as const;

export type Swatch = 'sand' | 'clay' | 'sea' | 'slate' | 'ink' | 'linen';
export type OrderItem = { sku: string; name: string; size: string; aisle: string; swatch: Swatch; scanned?: boolean };
export type BalcaoOrder = {
  id: string;
  customer: string;
  type: 'pickup' | 'delivery';
  lane: 'to-pick' | 'picking' | 'ready' | 'handed-over';
  items: OrderItem[];
  sla: string;
  urgent: boolean;
  total: string;
  payment: string;
};

const catalog: Array<Omit<OrderItem, 'size' | 'aisle'>> = [
  { sku: 'MR-18401', name: 'Camisa linho natural', swatch: 'linen' },
  { sku: 'MR-18372', name: 'Calça costa pedra', swatch: 'sand' },
  { sku: 'MR-18190', name: 'Tricô sal', swatch: 'sea' },
  { sku: 'MR-17921', name: 'Bolsa lona', swatch: 'clay' },
  { sku: 'MR-18455', name: 'Tênis couro básico', swatch: 'ink' },
  { sku: 'MR-18511', name: 'Vestido maré', swatch: 'slate' }
];

export const pickingOrder: BalcaoOrder = {
  id: 'MR-904117', customer: 'Rafael', type: 'pickup', lane: 'picking', sla: '16 min left', urgent: true, total: 'R$ 578,00', payment: 'Paid · Maré Pay Crédito',
  items: [
    { sku: 'MR-18401', name: 'Camisa linho natural', size: 'M', aisle: 'A3 · shelf 2', swatch: 'linen', scanned: true },
    { sku: 'MR-18372', name: 'Calça costa pedra', size: '42', aisle: 'C1 · shelf 4', swatch: 'sand', scanned: true },
    { sku: 'MR-18455', name: 'Tênis couro básico', size: '39', aisle: 'F2 · wall', swatch: 'ink' }
  ]
};

const laneFor = (index: number): BalcaoOrder['lane'] => (['to-pick', 'to-pick', 'picking', 'to-pick', 'ready', 'picking', 'handed-over', 'ready', 'to-pick', 'handed-over'] as const)[index % 10]!;

/** Deterministic Balcão orders; the same generator seeds Supabase. */
export function balcaoOrders(count = 12, seed = 412): BalcaoOrder[] {
  const random = rng(seed);
  const orders: BalcaoOrder[] = [];
  for (let index = 0; index < count; index += 1) {
    const id = `MR-9041${String(20 - index).padStart(2, '0')}`;
    if (id === pickingOrder.id) {
      orders.push(pickingOrder);
      continue;
    }
    const itemCount = int(random, 1, 3);
    const items = Array.from({ length: itemCount }, () => ({ ...pick(random, catalog), size: pick(random, ['P', 'M', 'G', '38', '40', '42']), aisle: `${pick(random, ['A', 'B', 'C', 'F'])}${int(random, 1, 4)}` }));
    const type = random() > 0.36 ? 'pickup' : 'delivery';
    const minutes = int(random, 6, 58);
    orders.push({
      id,
      customer: pick(random, ptFirstNames),
      type,
      lane: laneFor(index),
      items,
      sla: type === 'pickup' ? `${minutes} min left` : `cutoff 17:00 · ${minutes} min`,
      urgent: minutes < 18,
      total: `R$ ${(itemCount * int(random, 129, 289)).toLocaleString('pt-BR')},00`,
      payment: pick(random, ['Paid · Pix', 'Paid · Maré Pay Loja', 'Paid · card'])
    });
  }
  const handover = orders.find((order) => order.id === 'MR-904112');
  if (handover) Object.assign(handover, { customer: 'Rafael M.', lane: 'ready', type: 'pickup', urgent: false, sla: 'Waiting · 8 min' });
  return orders;
}
