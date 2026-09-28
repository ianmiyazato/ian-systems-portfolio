import { onUrlChange, readParams, setParams } from '@portfolio/overlays';

/** URL search params as reactive state: every Pulse overlay is addressable (?pitch=hana-rae, ?moment=1). */
class Params {
  current = $state(new URLSearchParams());
  start() {
    const sync = () => (this.current = readParams());
    sync();
    return onUrlChange(sync);
  }
  get(key: string) {
    return this.current.get(key);
  }
  open(patch: Record<string, string | null>) {
    setParams(patch);
  }
  close(keys: string[]) {
    setParams(Object.fromEntries(keys.map((key) => [key, null])));
  }
}

export const params = new Params();
