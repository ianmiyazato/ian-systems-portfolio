import type { Metadata } from 'next';
import { Logs } from '@/components/tidewatch/logs';

export const metadata: Metadata = { title: 'Tidewatch · Logs', description: 'Structured JSON logs with a query bar, level facets and a live tail; every line links to its trace.' };

export default function LogsPage() {
  return <Logs />;
}
