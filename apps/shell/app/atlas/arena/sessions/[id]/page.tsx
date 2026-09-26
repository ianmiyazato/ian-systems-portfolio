import type { Metadata } from 'next';
import { Feedback } from '@/components/atlas/arena';
export const metadata: Metadata = { title: 'Atlas · Feedback', description: 'Rubric feedback with cited transcript evidence.' };
export function generateStaticParams() { return [{ id: '14' }]; }
export default function Page() { return <Feedback />; }
