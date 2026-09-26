// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { layerDepth, pushLayer, readParams, setParams } from './index';

const dialog = (label: string) => {
  const element = document.createElement('section');
  element.innerHTML = `<button>${label}</button>`;
  document.body.append(element);
  return element;
};

afterEach(() => { document.body.innerHTML = ''; });

describe('overlay stack', () => {
  it('Esc closes only the top-most layer', () => {
    const closeParent = vi.fn();
    const closeChild = vi.fn();
    const releaseParent = pushLayer(dialog('parent'), closeParent);
    const releaseChild = pushLayer(dialog('child'), closeChild);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closeChild).toHaveBeenCalledOnce();
    expect(closeParent).not.toHaveBeenCalled();
    releaseChild();
    releaseParent();
    expect(layerDepth()).toBe(0);
  });

  it('returns focus to the trigger on release', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const release = pushLayer(dialog('layer'), () => undefined);
    release();
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps nested state in the URL', () => {
    setParams({ modal: 'decision', sub: 'override' });
    expect(readParams().get('sub')).toBe('override');
    setParams({ sub: null });
    expect(readParams().has('sub')).toBe(false);
    expect(readParams().get('modal')).toBe('decision');
  });
});
