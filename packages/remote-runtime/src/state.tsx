import type { ComponentChildren } from 'preact';
import { useParam } from './router';

export type DemoState = 'live' | 'empty' | 'loading' | 'error' | 'offline' | 'locked' | (string & {});

/** ?state=… selects a designed variation; ⌘K sets it. */
export function useDemoState(): DemoState {
  return (useParam('state') ?? 'live') as DemoState;
}

type BannerProps = { tone: 'risk' | 'warn' | 'success' | 'info' | 'ai'; icon?: string; title: string; children?: ComponentChildren; action?: ComponentChildren; anchor?: string };

export function Banner({ tone, icon, title, children, action, anchor }: BannerProps) {
  return (
    <div class={`state-banner tone-${tone}`} role={tone === 'risk' ? 'alert' : 'status'} data-anchor={anchor}>
      {icon && <span class="state-icon" aria-hidden="true">{icon}</span>}
      <div>
        <strong>{title}</strong>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}
