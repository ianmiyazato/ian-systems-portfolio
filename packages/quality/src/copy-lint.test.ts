import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lintCopy } from './copy-lint';

const root = resolve(__dirname, '../../..');
const dirs = ['apps/shell/app', 'apps/shell/components', 'apps/shell/lib', 'apps/mare-ops/src', 'apps/mare-shop/src', 'apps/pulse/src', 'remotes', 'packages/mocks/src', 'packages/world/src', 'packages/remote-runtime/src', 'packages/chrome/src', 'packages/routes/src', 'packages/ai-sim/src', 'decisions'];

describe('copy lint (US English)', () => {
  it('finds no Portuguese words or stray diacritics in UI copy and mock data', () => {
    const findings = lintCopy(root, dirs).map((finding) => `${finding.file}:${finding.line} ${finding.problem}: ${finding.text}`);
    expect(findings).toEqual([]);
  });

  it('catches what it should', () => {
    expect(lintCopy(resolve(__dirname, 'fixtures'), ['.']).map((finding) => finding.text).sort()).toEqual(['Calça', 'Calça', 'camisa', 'juros']);
  });
});
