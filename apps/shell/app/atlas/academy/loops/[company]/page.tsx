import type { Metadata } from 'next';
import { LoopSeason } from '@/components/atlas/loop';
export const metadata: Metadata = { title: 'Atlas · Parallax Pay: The Loop', description: 'A company interview loop as a season: every round as an episode, built from member reports.' };
export function generateStaticParams() { return [{ company: 'parallax-pay' }]; }
export default function Page() { return <LoopSeason />; }
