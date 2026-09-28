import type { Metadata } from 'next';
import { Problems } from '@/components/tidewatch/problems';

export const metadata: Metadata = { title: 'Tidewatch · Problems', description: 'Tidewatch, a fictitious APM: open problems, service flow, golden signals and an AI root cause, read from the world simulation.' };

export default function ProblemsPage() {
  return <Problems />;
}
