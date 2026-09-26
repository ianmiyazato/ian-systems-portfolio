import { balcaoBoard, liveOrder, type BalcaoOrder, type Lane } from '@portfolio/mocks';

export type Board = { orders: BalcaoOrder[]; fresh: string[]; reminded: string[]; queued: string[]; live: number; toast: string | null };

export type Action =
  | { type: 'created'; order: BalcaoOrder }
  | { type: 'move'; id: string; lane: Lane; patch?: Partial<BalcaoOrder> }
  | { type: 'remind'; id: string }
  | { type: 'toast'; message: string | null }
  | { type: 'apply-plan' };

export const initialBoard = (): Board => ({ orders: balcaoBoard.map((order) => ({ ...order })), fresh: [], reminded: [], queued: [], live: 0, toast: null });

export function reduce(board: Board, action: Action): Board {
  switch (action.type) {
    case 'created':
      if (board.orders.some((order) => order.id === action.order.id)) return board;
      return { ...board, orders: [action.order, ...board.orders], fresh: [action.order.id, ...board.fresh].slice(0, 3), live: board.live + 1, toast: `New ${action.order.type} · ${action.order.id} · ${action.order.customer}` };
    case 'move':
      return { ...board, orders: board.orders.map((order) => (order.id === action.id ? { ...order, ...action.patch, lane: action.lane } : order)) };
    case 'remind':
      return { ...board, reminded: [...board.reminded, action.id], toast: `Reminder sent · ${action.id} · WhatsApp · 16:19` };
    case 'toast':
      return { ...board, toast: action.message };
    case 'apply-plan':
      return {
        ...board,
        orders: board.orders.map((order) => {
          if (order.id === 'MR-904121') return { ...order, lane: 'picking', sla: 'Luiza picking · cutoff 17:00 kept' };
          if (order.id === 'MR-904124') return { ...order, lane: 'picking', sla: 'Otávio picking · cutoff 17:00 kept' };
          if (order.id === 'MR-904115') return { ...order, sla: 'Via Norte 18:30 · +R$ 9,20' };
          return order;
        }),
        toast: 'Plan applied · 3 orders re-routed · audit event recorded'
      };
  }
}

/** Shared, deterministic sequence so every tab announces the same next order. */
export function nextLiveOrder(): BalcaoOrder {
  let n = 1;
  try {
    n = Number(localStorage.getItem('portfolio-demo-sequence:balcao') ?? '0') + 1;
    localStorage.setItem('portfolio-demo-sequence:balcao', String(n));
  } catch {
    n = Math.floor(Date.now() / 20000) % 100;
  }
  return liveOrder(n);
}
