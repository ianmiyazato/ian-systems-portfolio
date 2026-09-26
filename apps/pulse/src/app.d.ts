declare global {
  namespace svelteHTML {
    interface IntrinsicElements {
      'im-portfolio-bar': { context?: string };
      'im-decision-lens': Record<string, unknown>;
      'im-command-palette': Record<string, unknown>;
    }
  }
}
export {};
