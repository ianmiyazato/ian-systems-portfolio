import type { ComponentChildren } from 'preact';
import { Tween, useTween } from '@portfolio/remote-runtime';
import { brl, int, pick, rng, seedOf } from '@portfolio/mocks';

export { brl };

/** Customers are shown masked in ops views: "Bruno S." → "B•••• S." */
export const maskName = (name: string) => name.split(' ').map((part, index) => (index === 0 ? `${part[0]}••••` : part)).join(' ');

export type Kpi = { label: string; value: number; format?: (value: number) => string; note?: ComponentChildren; tone?: 'warn' | 'risk' | 'ok' };

/** Pay's KPI row: light Sora numerals that sweep up to their value. */
export function Kpis({ items, anchor }: { items: Kpi[]; anchor?: string }) {
  return (
    <div class="py-kpis" data-anchor={anchor}>
      {items.map((item) => (
        <div key={item.label} class={item.tone ? `tone-${item.tone}` : ''}>
          <span>{item.label}</span>
          <strong><Tween value={item.value} format={item.format} /></strong>
          {item.note && <small>{item.note}</small>}
        </div>
      ))}
    </div>
  );
}

/** A ring gauge; the arc sweeps to its value (instant under reduced motion). */
export function Ring({ value, max = 1, label, display, tone = 'gold', size = 112 }: { value: number; max?: number; label: string; display: string; tone?: 'gold' | 'ok' | 'warn' | 'risk'; size?: number }) {
  const shown = useTween(Math.min(value / max, 1), 1200);
  const r = 44;
  const circumference = 2 * Math.PI * r;
  return (
    <figure class={`py-ring tone-${tone}`} style={{ width: `${size}px` }}>
      <svg viewBox="0 0 100 100" role="img" aria-label={`${label}: ${display}`}>
        <circle class="track" cx="50" cy="50" r={r} />
        <circle class="fill" cx="50" cy="50" r={r} style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - shown) }} />
      </svg>
      <strong>{display}</strong>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export type Account = {
  id: string;
  name: string;
  products: Array<'Credit' | 'Store'>;
  limit: number;
  used: number;
  status: 'Current' | '30+ past due' | 'Frozen';
  since: string;
  score: number;
  last4: string;
};

const names = ['Bruno Silva', 'Taina Rocha', 'Helena Costa', 'Diego Moura', 'Otavio Lima', 'Camila Freitas', 'Pedro Alves', 'Luiza Prado', 'Caio Nunes', 'Marina Dias', 'Rafael Mendes', 'Beatriz Ramos', 'Thiago Reis', 'Yasmin Kato', 'Gustavo Pinto', 'Aline Sousa', 'Nina Castro', 'Rui Farias', 'Lara Viana', 'Joao Teles'];

/** Twenty seeded accounts; AC-50412 is frozen on purpose (the designed variation). */
export const accounts: Account[] = names.map((name, index) => {
  const random = rng(seedOf(`account:${name}`));
  const limit = pick(random, [1500, 2500, 4000, 6000, 8000, 12000]);
  const utilization = index === 0 ? 0.82 : random() * 0.95;
  const status = index === 6 ? 'Frozen' : index % 7 === 3 ? '30+ past due' : 'Current';
  return {
    id: `AC-${50400 + index * 3 + (index === 6 ? 2 : 0)}`,
    name: index === 0 ? 'Bruno S.' : `${name.split(' ')[0]} ${name.split(' ')[1]![0]}.`,
    products: index % 3 === 0 ? ['Credit', 'Store'] : index % 3 === 1 ? ['Store'] : ['Credit'],
    limit,
    used: Math.round(limit * utilization),
    status,
    since: String(2016 + int(random, 0, 9)),
    score: int(random, 520, 780),
    last4: String(int(random, 1000, 9999))
  };
});

export const accountById = (id: string | null) => accounts.find((account) => account.id === id);

/** Map a live auth event onto one of the table's accounts (stable per auth id). */
export const accountForAuth = (authId: string) => accounts[seedOf(authId) % accounts.length]!;
