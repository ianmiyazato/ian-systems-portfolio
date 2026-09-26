import type { ReactNode } from 'react';
import '@portfolio/tokens/fonts/atlas';
import { Zone } from '@/components/chrome';

export default function AtlasLayout({ children }: { children: ReactNode }) {
  return <Zone theme="atlas" context="Atlas">{children}</Zone>;
}
