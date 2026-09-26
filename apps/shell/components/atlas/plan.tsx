'use client';

import { useEffect, useState } from 'react';

export type Plan = 'Free' | 'Starter' | 'Pro';
const KEY = 'atlas-plan';
const CHANNEL = 'portfolio:atlas-plan';

function read(): Plan {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'Pro' || value === 'Free' ? value : 'Starter';
  } catch {
    return 'Starter';
  }
}

/** Plan state shared by every open tab and zone: localStorage + BroadcastChannel (plan.changed). */
export function usePlan(): [Plan, (plan: Plan) => void] {
  const [plan, setPlan] = useState<Plan>('Starter');
  useEffect(() => {
    setPlan(read());
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
    if (channel) channel.onmessage = (event: MessageEvent<Plan>) => setPlan(event.data);
    const onStorage = (event: StorageEvent) => event.key === KEY && setPlan(read());
    addEventListener('storage', onStorage);
    return () => { channel?.close(); removeEventListener('storage', onStorage); };
  }, []);
  const update = (next: Plan) => {
    setPlan(next);
    try { localStorage.setItem(KEY, next); } catch { /* storage optional */ }
    if (typeof BroadcastChannel !== 'undefined') { const channel = new BroadcastChannel(CHANNEL); channel.postMessage(next); channel.close(); }
  };
  return [plan, update];
}
