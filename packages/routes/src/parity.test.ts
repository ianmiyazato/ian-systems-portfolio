import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderParity } from './parity';

const root = resolve(__dirname, '../../..');
const file = resolve(root, 'docs/agents/parity.md');

describe('parity table', () => {
  it('is generated from the manifest and up to date', () => {
    if (process.env.WRITE_PARITY) writeFileSync(file, renderParity(root));
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, 'utf8')).toBe(renderParity(root));
  });
});
