import type { Metadata } from 'next';
import { Welcome } from '@/components/atlas/welcome';
export const metadata: Metadata = { title: 'Atlas · Welcome', description: 'Build your practice plan in four steps.' };
export default function Page() { return <Welcome />; }
