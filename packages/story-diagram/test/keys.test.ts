import { describe, expect, it } from 'vitest';
import { commandFor, flatten, locate, parseStep } from '../src/keys';

const key = (value: string, extra: Partial<{ shiftKey: boolean; metaKey: boolean; ctrlKey: boolean; altKey: boolean }> = {}) => ({ key: value, shiftKey: false, metaKey: false, ctrlKey: false, altKey: false, ...extra });

describe('keyboard', () => {
  it('maps presenter keys to commands', () => {
    expect(commandFor(key('ArrowRight'))).toBe('next');
    expect(commandFor(key(' '))).toBe('next');
    expect(commandFor(key('ArrowLeft'))).toBe('prev');
    expect(commandFor(key('Home'))).toBe('first');
    expect(commandFor(key('End'))).toBe('last');
    expect(commandFor(key('p'))).toBe('pause');
    expect(commandFor(key('e'))).toBe('layer');
    expect(commandFor(key('f'))).toBe('present');
    expect(commandFor(key('n'))).toBe('notes');
    expect(commandFor(key('Escape'))).toBe('exit');
  });

  it('leaves modified keys to the browser and chrome (⇧P is the performance HUD, ⌘K the palette)', () => {
    expect(commandFor(key('P', { shiftKey: true }))).toBeNull();
    expect(commandFor(key('ArrowRight', { metaKey: true }))).toBeNull();
    expect(commandFor(key('e', { ctrlKey: true }))).toBeNull();
    expect(commandFor(key('d'))).toBeNull();
  });
});

describe('steps across screens', () => {
  const counts = [5, 3, 1];

  it('locates a 1-based page step on its screen', () => {
    expect(locate(counts, 1)).toEqual({ screen: 0, step: 1 });
    expect(locate(counts, 5)).toEqual({ screen: 0, step: 5 });
    expect(locate(counts, 6)).toEqual({ screen: 1, step: 1 });
    expect(locate(counts, 9)).toEqual({ screen: 2, step: 1 });
  });

  it('flattens a screen step back to the page step', () => {
    expect(flatten(counts, 1, 2)).toBe(7);
    expect(flatten(counts, 2, 1)).toBe(9);
  });

  it('reads ?step= from the URL, clamped, with "last" for the final step', () => {
    expect(parseStep('?step=3', 9)).toBe(3);
    expect(parseStep('?step=0', 9)).toBe(1);
    expect(parseStep('?step=99', 9)).toBe(9);
    expect(parseStep('?step=last', 9)).toBe(9);
    expect(parseStep('?present=1', 9)).toBe(1);
    expect(parseStep('?step=abc', 9)).toBe(1);
  });
});
