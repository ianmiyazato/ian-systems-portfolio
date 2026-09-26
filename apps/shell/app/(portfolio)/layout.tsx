import type { ReactNode } from 'react';
import '@portfolio/tokens/fonts/portfolio';
import { Zone } from '@/components/chrome';

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return <Zone theme="portfolio">{children}</Zone>;
}
