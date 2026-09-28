import type { ReactNode } from 'react';
import '@portfolio/tokens/fonts/atlas';
import './atlas.css';
import { Zone } from '@/components/chrome';

export default function AtlasLayout({ children }: { children: ReactNode }) {
  // The now-playing bar lives in the layout, so it keeps playing across Atlas pages.
  return <Zone theme="atlas" context="Atlas">{children}<im-now-playing source="atlas" /></Zone>;
}
