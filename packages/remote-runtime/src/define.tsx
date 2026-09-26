import type { ComponentType } from 'preact';
import { render } from 'preact';
import type { RemoteContext, RemoteModule } from './types';

/** Wrap a Preact app in the mount(el, ctx) → unmount contract. */
export function defineRemote(options: { name: string; theme: string; App: ComponentType<{ ctx: RemoteContext }> }): RemoteModule {
  const { name, theme, App } = options;
  return {
    mount(element, ctx) {
      const root = document.createElement('div');
      root.className = `remote-root remote-${name}`;
      root.dataset.theme = theme;
      root.dataset.remote = name;
      root.dataset.mode = ctx.mode;
      element.replaceChildren(root);
      render(<App ctx={ctx} />, root);
      return () => {
        render(null, root);
        root.remove();
      };
    }
  };
}
