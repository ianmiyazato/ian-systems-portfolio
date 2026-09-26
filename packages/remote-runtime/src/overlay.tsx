import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { pushLayer } from '@portfolio/overlays';

type Kind = 'modal' | 'sheet' | 'drawer' | 'sub' | 'sub-drawer';

type LayerProps = {
  kind: Kind;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ComponentChildren;
  footer?: ComponentChildren;
  width?: number;
  anchor?: string;
  className?: string;
  /** Level 2 layers get the lighter scrim so the parent stays readable. */
  level?: 1 | 2;
};

const classFor: Record<Kind, string> = { modal: 'ov-modal', sheet: 'ov-sheet', drawer: 'ov-drawer', sub: 'ov-sub', 'sub-drawer': 'ov-sub ov-sub-drawer' };

let counter = 0;

/** One overlay layer: scrim + dialog, registered on the shared Esc/focus stack. */
export function Layer({ kind, title, eyebrow, onClose, children, footer, width, anchor, className = '', level = 1 }: LayerProps) {
  const ref = useRef<HTMLElement>(null);
  const id = useRef(`layer-${(counter += 1)}`);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => (ref.current ? pushLayer(ref.current, () => close.current()) : undefined), []);
  return (
    <>
      <div class="ov-scrim" data-level={level} onClick={() => onClose()} />
      <section
        ref={ref}
        class={`${classFor[kind]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id.current}
        data-anchor={anchor}
        style={width ? { '--ov-width': `${width}px`, '--ov-sub-width': `${width}px` } : undefined}
      >
        <header class="ov-head">
          <div>
            {eyebrow && <span class="ov-eyebrow">{eyebrow}</span>}
            <h2 id={id.current} class="ov-title">{title}</h2>
          </div>
          <button type="button" class="ov-close" aria-label={`Close ${title}`} onClick={() => onClose()}>×</button>
        </header>
        <div class="ov-body">{children}</div>
        {footer && <footer class="ov-foot">{footer}</footer>}
      </section>
    </>
  );
}
