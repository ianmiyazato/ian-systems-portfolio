'use client';

import { useEffect, type ReactNode } from 'react';

/** Cross-stack chrome (bar, Decision Lens, ⌘K) wrapped in a themed zone. */
export function Zone({ theme, context, children }: { theme: string; context?: string; children: ReactNode }) {
  useEffect(() => {
    void import('@portfolio/chrome').then(({ defineChrome }) => defineChrome());
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <div className="zone" data-theme={theme}>
      <im-portfolio-bar context={context} />
      {children}
      <footer className="im-footer">All names are fictitious · data is synthetic · AI behavior is simulated in v0.1</footer>
      <im-decision-lens />
      <im-command-palette />
    </div>
  );
}
