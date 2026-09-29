/**
 * docs/CALL-SCRIPT-SYSTEM-DESIGN.md, generated from the same presenter notes the pages show on N.
 * Regenerate with WRITE_CALL_SCRIPT=1 pnpm --filter @portfolio/system-design test.
 */
import { cases, type CaseId } from './cases';
import { deck } from './deck';

const PRODUCTION = 'https://ian-portfolio-shell.vercel.app';
const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function talkSeconds(): number {
  return deck.screens.flatMap((screen) => screen.steps).reduce((sum, step) => sum + step.seconds, 0) + deck.bridge.seconds;
}

export function renderCallScript(): string {
  const lines: string[] = [];
  const total = talkSeconds();
  lines.push('# Call script · system design');
  lines.push('');
  lines.push(`A one-page talk track for a 15–20 minute conversation: ${clock(total)} of talking, which leaves about ${Math.max(0, 20 - Math.ceil(total / 60))} minutes for questions in a 20-minute call. Generated from the presenter notes in \`packages/system-design/data\`; don't edit it by hand (\`WRITE_CALL_SCRIPT=1 pnpm --filter @portfolio/system-design test\`).`);
  lines.push('');
  lines.push(`**Open** ${PRODUCTION}/system-design?present=1 (local: http://127.0.0.1:3000/system-design?present=1).`);
  lines.push('');
  lines.push('**Keys:** → or Space next · ← back · N presenter notes · E engineering layer · P pause motion · F full screen · Esc leave presentation. The mouse brings the controls back.');
  lines.push('');
  lines.push('**Rule for the whole call:** say the plain sentence first; press E only when someone asks how.');
  lines.push('');
  let elapsed = 0;
  for (const screen of deck.screens) {
    lines.push(`## ${screen.board} · ${screen.title}`);
    lines.push('');
    lines.push(`\`${screen.href}\``);
    lines.push('');
    lines.push('| Time | Step | Say |');
    lines.push('|---|---|---|');
    for (const step of screen.steps) {
      lines.push(`| ${clock(elapsed)} | ${step.title} | ${step.presenterNote} |`);
      elapsed += step.seconds;
    }
    lines.push('');
  }
  lines.push(`## Bridge · ${clock(elapsed)}`);
  lines.push('');
  lines.push('Close by connecting the two problems to the company:');
  lines.push('');
  for (const point of deck.bridge.points) lines.push(`- ${point}`);
  elapsed += deck.bridge.seconds;
  lines.push('');
  lines.push(`**End of talk track · ${clock(elapsed)}.** Then questions. If there is time, open the live demo on Problem B step 4 and press Restart a few times: the AI answer time changes, the page never moves.`);
  lines.push('');
  lines.push('All timings and volumes on the pages are illustrative targets, not production measurements.');
  lines.push('');
  return lines.join('\n');
}

export function caseTalkSeconds(id: CaseId): number {
  const item = cases[id];
  return item.screens.flatMap((screen) => screen.steps).reduce((sum, step) => sum + step.seconds, 0) + item.bridge.seconds;
}

/** docs/CALL-SCRIPT-<SYSTEM>.md: the case's talk track, generated from the same presenter notes. */
export function renderCaseScript(id: CaseId): string {
  const item = cases[id];
  const total = caseTalkSeconds(id);
  const start = item.screens[0]!.href;
  const lines: string[] = [];
  lines.push(`# Call script · ${item.name} system design`);
  lines.push('');
  lines.push(`A talk track for a ${Math.ceil(total / 60)}-minute walkthrough of the ${item.name} case: one backend problem and one frontend problem, each ending in a business decision. ${clock(total)} of talking. Generated from the presenter notes in \`packages/system-design/data/cases/${id}.json\` and the story files; don't edit it by hand (\`WRITE_CALL_SCRIPT=1 pnpm --filter @portfolio/system-design test\`).`);
  lines.push('');
  lines.push(`**Open** ${PRODUCTION}${start}?present=1 (local: http://127.0.0.1:3000${start}?present=1).`);
  lines.push('');
  lines.push('**Keys:** → or Space next · ← back · N presenter notes · E engineering layer · P pause motion · F full screen · Esc leave presentation.');
  lines.push('');
  lines.push(`**The full case** (component tables, trade-offs, decision chains): ${item.doc}`);
  lines.push('');
  let elapsed = 0;
  for (const screen of item.screens) {
    lines.push(`## ${screen.board} · ${screen.title}`);
    lines.push('');
    lines.push(`\`${screen.href}\``);
    lines.push('');
    lines.push('| Time | Step | Say |');
    lines.push('|---|---|---|');
    for (const step of screen.steps) {
      lines.push(`| ${clock(elapsed)} | ${step.title} | ${step.presenterNote} |`);
      elapsed += step.seconds;
    }
    lines.push('');
  }
  lines.push(`## Bridge · ${clock(elapsed)}`);
  lines.push('');
  for (const point of item.bridge.points) lines.push(`- ${point}`);
  elapsed += item.bridge.seconds;
  lines.push('');
  lines.push(`**End of talk track · ${clock(elapsed)}.** Triggers, volumes and the inputs of the "is it worth it" math are illustrative, not production measurements.`);
  lines.push('');
  return lines.join('\n');
}
