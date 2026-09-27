/**
 * Schema compatibility checker for the event backbone.
 *
 * Readers are tolerant (unknown fields are ignored), so compatibility is about what a reader
 * needs, not about closed content models:
 *   BACKWARD  new schema can read old data  → breaks on: new required field, type change, enum narrowed
 *   FORWARD   old readers can read new data → breaks on: required field removed, type change, enum widened
 *   FULL      both
 * Consumer-driven contracts add the second, sharper check: which declared readers use a
 * field that the change removes or retypes.
 */
export type Mode = 'BACKWARD' | 'FORWARD' | 'FULL';
export type JsonSchema = {
  type?: string;
  const?: unknown;
  enum?: string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  title?: string;
  description?: string;
};

export type Field = { path: string; type: string; required: boolean; enum?: string[] };
export type ChangeKind = 'removed' | 'added' | 'type-changed' | 'now-required' | 'now-optional' | 'enum-narrowed' | 'enum-widened';
export type Change = { path: string; kind: ChangeKind; before?: string; after?: string; breaks: Array<'backward' | 'forward'> };

/** Flatten an event schema's payload into dotted field paths ("eta.earliest", "items[].sku"). */
export function fields(schema: JsonSchema): Map<string, Field> {
  const out = new Map<string, Field>();
  const walk = (node: JsonSchema, prefix: string, parentRequired: boolean) => {
    for (const [name, child] of Object.entries(node.properties ?? {})) {
      const path = prefix ? `${prefix}.${name}` : name;
      const required = parentRequired && (node.required ?? []).includes(name);
      out.set(path, { path, type: child.type ?? (child.const !== undefined ? 'const' : 'any'), required, enum: child.enum });
      if (child.type === 'object') walk(child, path, required);
      if (child.type === 'array' && child.items?.type === 'object') walk(child.items, `${path}[]`, required);
    }
  };
  const payload = schema.properties?.payload;
  if (payload) walk(payload, '', true);
  return out;
}

export function diff(before: JsonSchema, after: JsonSchema): Change[] {
  const a = fields(before);
  const b = fields(after);
  const changes: Change[] = [];
  for (const [path, old] of a) {
    const next = b.get(path);
    if (!next) {
      changes.push({ path, kind: 'removed', before: describe(old), breaks: old.required ? ['forward'] : [] });
      continue;
    }
    if (old.type !== next.type) changes.push({ path, kind: 'type-changed', before: old.type, after: next.type, breaks: ['backward', 'forward'] });
    if (!old.required && next.required) changes.push({ path, kind: 'now-required', breaks: ['backward'] });
    if (old.required && !next.required) changes.push({ path, kind: 'now-optional', breaks: ['forward'] });
    if (old.enum && next.enum) {
      const removed = old.enum.filter((value) => !next.enum!.includes(value));
      const added = next.enum.filter((value) => !old.enum!.includes(value));
      if (removed.length) changes.push({ path, kind: 'enum-narrowed', before: removed.join(', '), breaks: ['backward'] });
      if (added.length) changes.push({ path, kind: 'enum-widened', after: added.join(', '), breaks: ['forward'] });
    }
  }
  // A field inside a newly added object is part of that addition, not a change of its own.
  const addedParent = (path: string) => [...b.keys()].some((other) => other !== path && !a.has(other) && (path.startsWith(`${other}.`) || path.startsWith(`${other}[].`)));
  for (const [path, field] of b) {
    if (!a.has(path) && !addedParent(path)) changes.push({ path, kind: 'added', after: describe(field), breaks: field.required ? ['backward'] : [] });
  }
  // Likewise, a removed object's children are part of the removal.
  return changes.filter((change) => change.kind !== 'removed' || !changes.some((other) => other !== change && other.kind === 'removed' && change.path.startsWith(`${other.path}.`)));
}

const describe = (field: Field) => `${field.type}${field.required ? '' : '?'}${field.enum ? ` (${field.enum.length} values)` : ''}`;

export function compatible(changes: Change[], mode: Mode) {
  const wanted = mode === 'FULL' ? ['backward', 'forward'] : [mode.toLowerCase()];
  return !changes.some((change) => change.breaks.some((kind) => wanted.includes(kind)));
}

export type Consumer = { consumer: string; owner: string; reads: Record<string, string[]> };
export type Impact = { consumer: string; owner: string; reads: string[]; breaks: string[] };

/** Which declared readers of `topic` use a field this change removes or retypes ("*" reads all). */
export function impact(topic: string, changes: Change[], consumers: Consumer[]): Impact[] {
  const lost = new Set(changes.filter((change) => change.kind === 'removed' || change.kind === 'type-changed').map((change) => change.path));
  return consumers
    .filter((consumer) => consumer.reads[topic])
    .map((consumer) => {
      const reads = consumer.reads[topic]!;
      const breaks = reads.includes('*') ? [...lost] : reads.filter((path) => lost.has(path) || [...lost].some((gone) => path.startsWith(`${gone}.`)));
      return { consumer: consumer.consumer, owner: consumer.owner, reads, breaks };
    });
}

export type TopicReport = {
  topic: string;
  mode: Mode;
  format: 'JSON Schema';
  current: string;
  versions: string[];
  proposed?: string;
  description: string;
  proposedDescription?: string;
  transitions: Array<{ from: string; to: string; compatible: boolean; changes: Change[] }>;
  consumers: Impact[];
  status: 'ok' | 'blocked';
};

const versionOrder = (version: string) => Number(version.replace(/^v/, '').replace(/\.proposed$/, ''));

/** Build the registry report the Mesh Contracts view renders and CI checks. */
export function report(schemas: Record<string, Record<string, JsonSchema>>, modes: Record<string, Mode>, consumers: Consumer[]): TopicReport[] {
  return Object.keys(schemas).sort().map((topic) => {
    const byVersion = schemas[topic]!;
    const all = Object.keys(byVersion).sort((a, b) => versionOrder(a) - versionOrder(b));
    const released = all.filter((version) => !version.endsWith('.proposed'));
    const proposed = all.find((version) => version.endsWith('.proposed'));
    const mode = modes[topic] ?? 'BACKWARD';
    const transitions = all.slice(1).map((to, index) => {
      const from = all[index]!;
      const changes = diff(byVersion[from]!, byVersion[to]!);
      return { from, to, compatible: compatible(changes, mode), changes };
    });
    const last = transitions.at(-1);
    const consumersImpact = impact(topic, last?.changes ?? [], consumers);
    const blocked = Boolean(proposed) && (!last?.compatible || consumersImpact.some((item) => item.breaks.length));
    return {
      topic,
      mode,
      format: 'JSON Schema',
      current: released.at(-1)!,
      versions: released,
      proposed,
      description: byVersion[released.at(-1)!]!.description ?? '',
      proposedDescription: proposed ? byVersion[proposed]!.description : undefined,
      transitions,
      consumers: consumersImpact,
      status: blocked ? 'blocked' : 'ok'
    };
  });
}
