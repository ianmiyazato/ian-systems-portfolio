import { getWorld, type FaultId } from '@portfolio/world';

/**
 * Commands the palette can run (not just navigate to). Chaos commands flip a fault in the shared
 * world, so every zone reacts: Mesh opens the circuit, Counter shows a banner, Pay's scoring slows,
 * Tidewatch opens a problem. Other packages can register more with registerPaletteAction().
 */
export type PaletteAction = { id: string; group: string; title: string; hint: string; keywords: string; run: () => void; active?: () => boolean };

const chaos: Array<[FaultId, string, string]> = [
  ['carrier-outage', 'Chaos: break a carrier (Ligeiro Log)', 'Mesh opens the circuit · Counter re-routes'],
  ['db-pool', 'Chaos: saturate the Orders DB pool', 'checkout p95 → 900 ms · Pay scoring slows'],
  ['topic-lag', 'Chaos: lag a Kafka topic', 'notifications fall 48k messages behind'],
  ['einvoice-fail', 'Chaos: fail e-invoices', 'code 778 rejections park in the DLQ'],
  ['traffic-spike', 'Chaos: spike traffic 3.4×', 'saturation rises across the edge']
];

const registry: PaletteAction[] = [
  ...chaos.map(([fault, title, hint]): PaletteAction => ({
    id: `chaos:${fault}`,
    group: 'Chaos',
    title,
    hint,
    keywords: `chaos fault incident ${fault}`,
    run: () => getWorld().setFault(fault, !getWorld().isFaulted(fault)),
    active: () => getWorld().isFaulted(fault)
  })),
  {
    id: 'chaos:recover',
    group: 'Chaos',
    title: 'Recover: end every incident',
    hint: 'close every fault window; watch the charts recover',
    keywords: 'recover heal chaos fix rollback',
    run: () => chaos.forEach(([fault]) => getWorld().setFault(fault, false))
  },
  { id: 'go:tidewatch', group: 'Chaos', title: 'Open Tidewatch problems', hint: '/observability', keywords: 'tidewatch apm observability problems', run: () => location.assign('/observability') }
];

export function registerPaletteAction(action: PaletteAction) {
  if (!registry.some((item) => item.id === action.id)) registry.push(action);
}

export function paletteActions(query: string): PaletteAction[] {
  const needle = query.trim().toLowerCase();
  return registry.filter((action) => !needle || `${action.title} ${action.keywords} ${action.hint}`.toLowerCase().includes(needle));
}
