import { useEffect } from 'preact/hooks';

/** Mirrors ScreenAction in @portfolio/chrome: remotes add palette actions without importing chrome. */
export type ScreenAction = { id: string; title: string; hint: string; keywords?: string; run: () => void };
type Host = { __imScreenActions?: ScreenAction[] };
const list = () => ((globalThis as Host).__imScreenActions ??= []);

/** Offer actions in ⌘K while this view is mounted (pass [] to offer none). */
export function useScreenActions(actions: ScreenAction[], deps: unknown[]) {
  useEffect(() => {
    const mine = actions.map((action) => ({ ...action }));
    list().push(...mine);
    return () => {
      const all = list();
      for (const action of mine) {
        const index = all.indexOf(action);
        if (index >= 0) all.splice(index, 1);
      }
    };
  }, deps);
}
