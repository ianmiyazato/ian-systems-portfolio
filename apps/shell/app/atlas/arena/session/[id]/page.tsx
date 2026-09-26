import type { Metadata } from 'next';
import { ArenaSession } from '@/components/atlas/arena';
export const metadata: Metadata = { title: 'Atlas · Arena session', description: 'A live system design practice session.' };
export function generateStaticParams() { return [{ id: '14' }]; }
export default function Page() { return <ArenaSession />; }
