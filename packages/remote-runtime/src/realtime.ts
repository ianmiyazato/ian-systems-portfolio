import type { RemoteContext } from './types';

export type FeedMessage<T> = { event: string; payload: T };
type Listener<T> = (message: FeedMessage<T>) => void;

export type Feed<T> = {
  status: () => 'local' | 'connecting' | 'live' | 'error';
  send: (event: string, payload: T) => void;
  close: () => void;
};

/**
 * Same UI code in both data modes: Supabase Broadcast when DATA_MODE=supabase,
 * otherwise a BroadcastChannel so two local tabs still see each other's events.
 */
export function openFeed<T>(topic: string, data: RemoteContext['data'], listener: Listener<T>, onStatus?: (status: string) => void): Feed<T> {
  let status: 'local' | 'connecting' | 'live' | 'error' = data.mode === 'supabase' && data.supabaseUrl && data.supabaseKey ? 'connecting' : 'local';
  let closed = false;
  let sendRemote: ((event: string, payload: T) => void) | null = null;
  // Free tier: at most one Supabase message per second per client.
  let lastRemote = 0;
  let closeRemote: (() => void) | null = null;
  const local = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`portfolio:${topic}`) : null;
  const setStatus = (next: typeof status) => {
    status = next;
    onStatus?.(next);
  };

  if (local) local.onmessage = (event: MessageEvent<FeedMessage<T>>) => status === 'local' && listener(event.data);
  onStatus?.(status);

  if (status === 'connecting') {
    void import('@supabase/realtime-js').then(({ RealtimeClient }) => {
      if (closed) return;
      const client = new RealtimeClient(`${data.supabaseUrl!.replace(/^http/, 'ws')}/realtime/v1`, { params: { apikey: data.supabaseKey!, eventsPerSecond: 1 } });
      const channel = client.channel(topic, { config: { broadcast: { self: true } } });
      channel.on('broadcast', { event: '*' }, (message) => listener({ event: message.event, payload: message.payload as T }));
      channel.subscribe((next: string) => {
        if (next === 'SUBSCRIBED') setStatus('live');
        else if (next === 'CHANNEL_ERROR' || next === 'TIMED_OUT') setStatus('error');
      });
      sendRemote = (event, payload) => void channel.send({ type: 'broadcast', event, payload });
      closeRemote = () => {
        void client.removeChannel(channel);
        client.disconnect();
      };
    }).catch(() => setStatus('error'));
  }

  return {
    status: () => status,
    send(event, payload) {
      if (status === 'live' && sendRemote) {
        const now = Date.now();
        if (now - lastRemote < 1000) return;
        lastRemote = now;
        sendRemote(event, payload);
      }
      else {
        // Local mode: deliver to this tab and every other open tab.
        listener({ event, payload });
        local?.postMessage({ event, payload });
      }
    },
    close() {
      closed = true;
      local?.close();
      closeRemote?.();
    }
  };
}

/**
 * Client-side demo driver: only while someone is watching, one tab (the leader) emits
 * a synthetic event every interval. No cron, no database writes.
 */
export function startDemoDriver(topic: string, intervalMs: number, emit: () => void) {
  const key = `portfolio-demo-leader:${topic}`;
  const id = setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    try {
      const previous = Number(localStorage.getItem(key) ?? '0');
      if (Date.now() - previous < intervalMs - 1000) return;
      localStorage.setItem(key, String(Date.now()));
    } catch {
      // Storage can be unavailable (private mode); each tab then drives itself.
    }
    emit();
  }, intervalMs);
  return () => clearInterval(id);
}
