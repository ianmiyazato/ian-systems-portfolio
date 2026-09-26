import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@portfolio/tokens/styles.css';
import '@portfolio/overlays/overlays.css';
import '@portfolio/ai-surface/ai-surface.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Ian Miyazato · Systems portfolio', template: '%s · Ian Miyazato' },
  description: 'Design, UI/UX and architecture across three fictitious platforms: Maré, Atlas and Pulse.',
  metadataBase: new URL(process.env.SHELL_URL ?? 'https://ian-portfolio-shell.vercel.app')
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#EDF0F4' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
