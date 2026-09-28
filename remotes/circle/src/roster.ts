import { creatorRoster, int, rng, seedOf, series, type CreatorProfile } from '@portfolio/mocks';

export type Creator = CreatorProfile & {
  /** Coded orders this month (live: rises as the world attributes new orders). */
  sales: number;
  revenue: number;
  conversion: number;
  followers: string;
  contract: 'Signed' | 'Pending';
  spark: number[];
  joined: string;
};

/** Sales are close together at the top on purpose, so live orders visibly reorder the board. */
const baseSales = [84, 81, 79, 66, 58, 55, 41, 39, 30, 22, 17, 9];

export const roster: Creator[] = creatorRoster.map((creator, index) => {
  const random = rng(seedOf(`creator:${creator.code}`));
  const sales = baseSales[index]!;
  return {
    ...creator,
    sales,
    revenue: sales * int(random, 240, 330),
    conversion: Number((1.4 + random() * 3.6).toFixed(1)),
    followers: `${int(random, 12, 480)}k`,
    contract: index === 10 ? 'Pending' : 'Signed',
    spark: series(seedOf(creator.code) % 1000, 14, 20, 4, 0.4),
    joined: `${['Jan', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug'][int(random, 0, 5)]} 2026`
  };
});

/** The creator who just joined: the designed "no sales yet" variation. */
export const newcomer: Creator = { name: 'Lia Prado', handle: '@liaprado', code: 'LIA10', initials: 'LP', level: 'Rising', category: 'Swim', city: 'Recife', hue: 4, sales: 0, revenue: 0, conversion: 0, followers: '38k', contract: 'Signed', spark: Array.from({ length: 14 }, () => 0), joined: 'Sep 25, 2026' };

export const creatorByCode = (code: string | null) => [...roster, newcomer].find((creator) => creator.code === code);

/** About 30% of orders carry a creator code; which one is stable per order id. */
export function codedCreator(orderId: string): Creator | null {
  const hash = seedOf(orderId);
  if (hash % 10 >= 3) return null;
  return roster[Math.floor(hash / 10) % roster.length]!;
}

export const COMMISSION_RATE = 0.1;
