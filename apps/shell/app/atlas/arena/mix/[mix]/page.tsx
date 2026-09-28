import type { Metadata } from 'next';
import { PracticeMix } from '@/components/atlas/mix';
export const metadata: Metadata = { title: 'Atlas · Interview Mix', description: 'A daily practice mix of drills, lessons and mocks, built from your rubric scores and your next interview.' };
export function generateStaticParams() { return [{ mix: 'today' }]; }
export default function Page() { return <PracticeMix />; }
