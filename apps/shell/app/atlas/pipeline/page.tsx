import type { Metadata } from 'next';
import { Pipeline } from '@/components/atlas/pipeline';
export const metadata: Metadata = { title: 'Atlas · Pipeline', description: 'Your job pipeline, connected to practice.' };
export default function Page() { return <Pipeline />; }
