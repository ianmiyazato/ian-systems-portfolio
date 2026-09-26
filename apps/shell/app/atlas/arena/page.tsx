import type { Metadata } from 'next';
import { ArenaLibrary } from '@/components/atlas/arena';
export const metadata: Metadata = { title: 'Atlas · Arena', description: 'Interview practice prompts with last scores.' };
export default function Page() { return <ArenaLibrary />; }
