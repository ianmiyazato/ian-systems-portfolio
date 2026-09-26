export type Health = 'ok' | 'warn' | 'down';
export type Node = { id: string; label: string; sub: string; x: number; y: number; side: 'in' | 'core' | 'out'; health: Health };
export type Edge = { from: string; to: string; rate: string; health: Health };

export const nodes: Node[] = [
  { id: 'site', label: 'site', sub: 'checkout · 412/s', x: 90, y: 70, side: 'in', health: 'ok' },
  { id: 'app', label: 'app', sub: 'checkout · 388/s', x: 90, y: 160, side: 'in', health: 'ok' },
  { id: 'stores', label: 'balcão · 38 stores', sub: 'offline queue · 96/s', x: 90, y: 250, side: 'in', health: 'ok' },
  { id: 'marketplace', label: 'marketplace', sub: 'seller feeds · 61/s', x: 90, y: 340, side: 'in', health: 'ok' },
  { id: 'core', label: 'event bus', sub: 'canonical.order.v4', x: 480, y: 205, side: 'core', health: 'ok' },
  { id: 'fulfillment', label: 'fulfillment', sub: 'lag 41ms', x: 895, y: 45, side: 'out', health: 'ok' },
  { id: 'einvoice', label: 'e-invoice gateway', sub: 'rejections 2.6%', x: 895, y: 125, side: 'out', health: 'warn' },
  { id: 'rotasul', label: 'rota sul express', sub: 'webhook · p95 142ms', x: 895, y: 205, side: 'out', health: 'ok' },
  { id: 'ligeiro', label: 'ligeiro log', sub: 'polling · p95 884ms', x: 895, y: 285, side: 'out', health: 'warn' },
  { id: 'vianorte', label: 'via norte', sub: 'webhook · p95 201ms', x: 895, y: 365, side: 'out', health: 'ok' }
];

export const edges: Edge[] = [
  { from: 'site', to: 'core', rate: '412/s', health: 'ok' },
  { from: 'app', to: 'core', rate: '388/s', health: 'ok' },
  { from: 'stores', to: 'core', rate: '96/s', health: 'ok' },
  { from: 'marketplace', to: 'core', rate: '61/s', health: 'ok' },
  { from: 'core', to: 'fulfillment', rate: '842/s', health: 'ok' },
  { from: 'core', to: 'einvoice', rate: '118/s', health: 'warn' },
  { from: 'core', to: 'rotasul', rate: '204/s', health: 'ok' },
  { from: 'core', to: 'ligeiro', rate: '71/s', health: 'warn' },
  { from: 'core', to: 'vianorte', rate: '88/s', health: 'ok' }
];

export const pathFor = (edge: Edge) => {
  const a = nodes.find((node) => node.id === edge.from)!;
  const b = nodes.find((node) => node.id === edge.to)!;
  const x1 = a.x + (a.side === 'in' ? 80 : 78);
  const x2 = b.x - (b.side === 'out' ? 90 : 78);
  const mid = (x1 + x2) / 2;
  return `M${x1},${a.y} C${mid},${a.y} ${mid},${b.y} ${x2},${b.y}`;
};

export type Partner = { id: string; name: string; protocol: string; p95: string; errors: string; circuit: 'closed' | 'open' | 'half-open'; last: string };
export const partners: Partner[] = [
  { id: 'rota-sul', name: 'rota sul express', protocol: 'webhook', p95: '142ms', errors: '0.2%', circuit: 'closed', last: '16:18:44' },
  { id: 'ligeiro-log', name: 'ligeiro log', protocol: 'polling · 60s', p95: '884ms', errors: '7.9%', circuit: 'half-open', last: '16:18:02' },
  { id: 'via-norte', name: 'via norte', protocol: 'webhook', p95: '201ms', errors: '0.4%', circuit: 'closed', last: '16:18:41' },
  { id: 'correio', name: 'correio nacional', protocol: 'soap · poll 120s', p95: '612ms', errors: '1.1%', circuit: 'closed', last: '16:17:30' },
  { id: 'einvoice', name: 'e-invoice gateway', protocol: 'rest', p95: '330ms', errors: '2.6%', circuit: 'closed', last: '16:18:40' }
];

export type LogLine = { t: string; level: 'info' | 'warn' | 'error'; source: string; text: string };
export const logScript: Array<Omit<LogLine, 't'>> = [
  { level: 'info', source: 'rota-sul', text: 'delivered MR-904090 · webhook 138ms' },
  { level: 'warn', source: 'ligeiro-log', text: 'poll 200 in 912ms · 1 event with unknown status X9 → dlq' },
  { level: 'info', source: 'bus', text: 'canonical.order.v4 · partition 3 lag 41ms' },
  { level: 'info', source: 'via-norte', text: 'label created MR-904115 · 18:30 run' },
  { level: 'error', source: 'einvoice', text: 'NF-e 38422 rejected · code 778 · NCM 6205.30.00' },
  { level: 'info', source: 'ligeiro-log', text: 'half-open probe 2/3 ok · 640ms' },
  { level: 'info', source: 'retry', text: 'MR-904103 attempt 3 scheduled · idempotency key kept' },
  { level: 'warn', source: 'correio', text: 'soap fault 504 · retry in 30s (attempt 1/5)' }
];

export type DlqMessage = { id: string; partner: string; error: string; attempts: number; age: string; dry: 'ok' | 'fail' | 'skip' };
export const dlq: DlqMessage[] = [
  ...Array.from({ length: 15 }, (_, index): DlqMessage => ({ id: `evt_${(8841 + index * 7).toString(36)}`, partner: index % 3 === 0 ? 'ligeiro-log' : index % 3 === 1 ? 'correio' : 'rota-sul', error: index % 3 === 0 ? 'timeout 2000ms' : index % 3 === 1 ? 'soap fault 504' : 'webhook 502', attempts: 3 + (index % 3), age: `${4 + index * 3} min`, dry: 'ok' })),
  { id: 'evt_7x9a', partner: 'ligeiro-log', error: 'unknown status X9', attempts: 5, age: '26 min', dry: 'fail' },
  { id: 'evt_7x9b', partner: 'ligeiro-log', error: 'unknown status X9', attempts: 5, age: '21 min', dry: 'fail' },
  { id: 'evt_8a01', partner: 'rota-sul', error: 'duplicate delivery', attempts: 1, age: '9 min', dry: 'skip' }
];
