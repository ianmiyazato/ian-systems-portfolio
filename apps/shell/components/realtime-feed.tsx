'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseBrowserClient, isSupabaseDataMode } from '@/lib/supabase-browser';

type FeedKind = 'orders' | 'mesh' | 'pulse';
type DemoEvent = { id: string; title: string; detail: string };

const feeds: Record<FeedKind, { topic: string; label: string; events: DemoEvent[] }> = {
  orders: {
    topic: 'balcao-order-lanes',
    label: 'Balcão order lanes',
    events: [
      { id: 'MR-904121', title: 'New pickup · MR-904121', detail: 'Nina · 2 items · 18 min left' },
      { id: 'MR-904124', title: 'New delivery · MR-904124', detail: 'Rui · 1 item · cutoff 17:30' },
      { id: 'MR-904129', title: 'New pickup · MR-904129', detail: 'Lara · 3 items · 22 min left' }
    ]
  },
  mesh: {
    topic: 'mesh-log-stream',
    label: 'Mesh log stream',
    events: [
      { id: 'mesh-001', title: 'Probe accepted', detail: 'Ligeiro Log · circuit half-open · attempt 2' },
      { id: 'mesh-002', title: 'Replay completed', detail: '15 events · idempotency keys retained' },
      { id: 'mesh-003', title: 'Contract warning', detail: 'unknown status X9 · transform proposed' }
    ]
  },
  pulse: {
    topic: 'pulse-posting-feed',
    label: 'Pulse posting feed',
    events: [
      { id: 'pulse-001', title: 'Seoul post scheduled', detail: 'AERA · chorus lift · confidence 0.91' },
      { id: 'pulse-002', title: 'Tokyo post published', detail: 'NAMI · bridge replay · confidence 0.86' },
      { id: 'pulse-003', title: 'LA draft ready', detail: 'Lumen · hook share · confidence 0.82' }
    ]
  }
};

function nextEvent(kind: FeedKind) {
  const storageKey = `portfolio-demo-sequence:${kind}`;
  const current = Number(window.localStorage.getItem(storageKey) ?? '0');
  const events = feeds[kind].events;
  const event = events[current % events.length] ?? events[0]!;
  window.localStorage.setItem(storageKey, String(current + 1));
  return event;
}

export function RealtimeFeed({ kind }: { kind: FeedKind }) {
  const feed = feeds[kind];
  const enabled = useMemo(() => isSupabaseDataMode(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [status, setStatus] = useState<'local' | 'connecting' | 'live' | 'error'>(enabled ? 'connecting' : 'local');
  const [latest, setLatest] = useState<DemoEvent | null>(null);

  const emit = useCallback(async () => {
    const channel = channelRef.current;
    if (!channel || status !== 'live') return;
    await channel.send({ type: 'broadcast', event: 'demo-event', payload: nextEvent(kind) });
  }, [kind, status]);

  useEffect(() => {
    if (!enabled) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    const channel = client
      .channel(feed.topic, { config: { broadcast: { self: true } } })
      .on('broadcast', { event: 'demo-event' }, ({ payload }) => setLatest(payload as DemoEvent))
      .subscribe((nextStatus) => {
        if (nextStatus === 'SUBSCRIBED') setStatus('live');
        else if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT') setStatus('error');
      });
    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      void client.removeChannel(channel);
    };
  }, [enabled, feed.topic]);

  useEffect(() => {
    if (status !== 'live') return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const leaderKey = `portfolio-demo-leader:${kind}`;
      const now = Date.now();
      const previous = Number(window.localStorage.getItem(leaderKey) ?? '0');
      if (now - previous < 14_000) return;
      window.localStorage.setItem(leaderKey, String(now));
      void emit();
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [emit, kind, status]);

  return (
    <section className="realtime-feed" data-realtime-status={status} aria-live="polite">
      <div>
        <span className={`realtime-dot ${status}`} />
        <div><strong>{feed.label}</strong><small>{status === 'live' ? 'Supabase Broadcast · live' : status === 'local' ? 'Local deterministic fallback' : status}</small></div>
      </div>
      {latest && <p><strong>{latest.title}</strong><span>{latest.detail}</span></p>}
      {enabled && <button className="secondary" onClick={() => void emit()} disabled={status !== 'live'}>Emit demo event</button>}
    </section>
  );
}
