import type { Metadata } from 'next';
import { Academy } from '@/components/atlas/academy';
export const metadata: Metadata = { title: 'Atlas · Designing for 10×', description: 'Academy lesson with practice grounding and Members plans.' };
export function generateStaticParams() { return [{ lesson: 'designing-for-10x' }]; }
export default function Page() { return <Academy />; }
