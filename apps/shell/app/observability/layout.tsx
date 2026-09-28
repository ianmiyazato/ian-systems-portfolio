import type { ReactNode } from 'react';
import '@portfolio/tokens/fonts/tidewatch';
import './tidewatch.css';
import { Zone } from '@/components/chrome';
import { TidewatchNav } from '@/components/tidewatch/nav';
import { TidewatchState } from '@/components/tidewatch/state';

export default function TidewatchLayout({ children }: { children: ReactNode }) {
  return (
    <Zone theme="tidewatch" context="Tidewatch · observability">
      <TidewatchNav />
      <TidewatchState>{children}</TidewatchState>
    </Zone>
  );
}
