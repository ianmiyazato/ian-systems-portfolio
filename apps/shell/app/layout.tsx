import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@portfolio/tokens/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Ian Miyazato · Systems portfolio', template: '%s · Ian Miyazato' },
  description: 'Design, UI/UX and architecture across Maré, Atlas and Pulse.',
  metadataBase: new URL('https://deployment-pending.invalid')
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#EDF0F4' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

