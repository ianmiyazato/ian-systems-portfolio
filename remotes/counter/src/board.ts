import { counterBoard, liveOrder, type CounterOrder, type Lane } from '@portfolio/mocks';

export type Board = { orders: CounterOrder[]; fresh: string[]; reminded: string[]; queued: string[]; live: number; toast: string | null; trace: string | null };

export type Action =
  | { type: 'created'; order: CounterOrder }
  | { type: 'move'; id: string; lane: Lane; patch?: Partial<CounterOrder> }
  | { type: 'remind'; id: string }
  | { type: 'toast'; message: string | null; trace?: string }
  | { type: 'apply-plan'; trace?: string };

export const initialBoard = (): Board => ({ orders: counterBoard.map((order) => ({ ...order })), fresh: [], reminded: [], queued: [], live: 0, toast: null, trace: null });

export function reduce(board: Board, action: Action): Board {
  switch (action.type) {
    case 'created':
      if (board.orders.some((order) => order.id === action.order.id)) return board;
      return { ...board, orders: [action.order, ...board.orders], fresh: [action.order.id, ...board.fresh].slice(0, 3), live: board.live + 1, toast: `New ${action.order.type} · ${action.order.id} · ${action.order.customer}`, trace: null };
    case 'move':
      return { ...board, orders: board.orders.map((order) => (order.id === action.id ? { ...order, ...action.patch, lane: action.lane } : order)) };
    case 'remind':
      return { ...board, reminded: [...board.reminded, action.id], toast: `Reminder sent · ${action.id} · WhatsApp · 16:19`, trace: null };
    case 'toast':
      return { ...board, toast: action.message, trace: action.trace ?? null };
    case 'apply-plan':
      return {
        ...board,
        orders: board.orders.map((order) => {
          if (order.id === 'MR-904121') return { ...order, lane: 'picking', sla: 'Luiza picking · cutoff 17:00 kept' };
          if (order.id === 'MR-904124') return { ...order, lane: 'picking', sla: 'Otavio picking · cutoff 17:00 kept' };
          if (order.id === 'MR-904115') return { ...order, sla: 'Via Norte 18:30 · +R$9.20' };
          return order;
        }),
        toast: 'Plan applied · 3 orders re-routed · audit event recorded',
        trace: action.trace ?? null
      };
  }
}

/** Shared, deterministic sequence so every tab announces the same next order. */
export function nextLiveOrder(): CounterOrder {
  let n = 1;
  try {
    n = Number(localStorage.getItem('portfolio-demo-sequence:counter') ?? '0') + 1;
    localStorage.setItem('portfolio-demo-sequence:counter', String(n));
  } catch {
    n = Math.floor(Date.now() / 20000) % 100;
  }
  return liveOrder(n);
}
