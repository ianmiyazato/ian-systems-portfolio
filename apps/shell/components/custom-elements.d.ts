import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type ChromeElement = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { context?: string; screen?: string };

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'im-portfolio-bar': ChromeElement;
      'im-decision-lens': ChromeElement;
      'im-command-palette': ChromeElement;
    }
  }
}
