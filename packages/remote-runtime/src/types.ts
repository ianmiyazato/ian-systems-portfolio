export type Environment = 'development' | 'preview' | 'production';

/** Everything a remote receives from the Maré Ops host at mount time. */
export type RemoteContext = {
  name: string;
  /** Route prefix the remote owns, e.g. /mare/ops/counter. */
  basePath: string;
  /** "page" renders full chrome; "tile" renders a compact preview on the host index. */
  mode: 'page' | 'tile';
  environment: Environment;
  locale: 'pt-BR';
  data: { mode: 'local' | 'supabase'; supabaseUrl?: string; supabaseKey?: string };
  hostVersion: string;
};

export type RemoteModule = {
  mount: (element: HTMLElement, context: RemoteContext) => () => void;
};

/** Written by the build into each remote's mf-manifest.json. */
export type RemoteManifest = {
  name: string;
  version: string;
  builtAt: string;
  contract: 'mount(el, ctx) -> unmount';
  entry: string;
  css: string[];
  theme: string;
  runtime: string;
};
