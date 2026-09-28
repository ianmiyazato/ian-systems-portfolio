import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain ESM build script without type declarations.
import { renderThemes } from '../scripts/emit-css.mjs';
import { contrast, themeNames, themes } from './index';

const required = ['ground', 'surface', 'surface-2', 'ink', 'muted', 'line', 'accent', 'accent-ink', 'accent-text', 'risk', 'warn', 'success', 'ai', 'ai-ink'] as const;

describe('token contract', () => {
  it.each(themeNames)('%s implements every semantic color', (name) => {
    for (const key of required) expect(themes[name].color, key).toHaveProperty(key);
  });

  it.each(themeNames)('%s keeps text pairs at WCAG AA', (name) => {
    const color = themes[name].color as Record<string, string>;
    const pairs: Array<[string, string, number]> = [
      ['ink', 'ground', 7], ['ink', 'surface', 7], ['muted', 'surface', 4.5], ['muted', 'ground', 4.5], ['muted', 'surface-2', 4.5],
      ['accent-text', 'surface', 4.5], ['accent-ink', 'accent', 4.5], ['ai-ink', 'ai', 4.5],
      ['risk', 'surface', 4.5], ['success', 'surface', 4.5], ['warn', 'surface', 4.5]
    ];
    for (const [foreground, background, minimum] of pairs) {
      expect(contrast(color[foreground]!, color[background]!), `${name}: ${foreground} on ${background}`).toBeGreaterThanOrEqual(minimum);
    }
  });

  it('generated CSS matches themes.json', () => {
    expect(readFileSync(resolve(__dirname, 'themes.css'), 'utf8')).toBe(renderThemes(themes));
  });
});
