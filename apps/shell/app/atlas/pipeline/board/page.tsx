import type { Metadata } from 'next';
import { Board } from '@/components/atlas/board';
export const metadata: Metadata = { title: 'Atlas · Board', description: 'Kanban pipeline with application drawers and outcome logging.' };
export default function Page() { return <Board />; }
