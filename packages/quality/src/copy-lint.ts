import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Copy lint: UI strings and mock data are US English. Proper nouns that keep their accents
 * (the brand, the city, the payment rail and fictitious people) are allowlisted; Hangul and
 * Japanese in Pulse are not Latin diacritics and pass untouched.
 */
export const allowedAccented = new Set(['Maré', 'maré', 'MARÉ', 'São', 'résumé']);

/** Distinctly Portuguese words (no English homographs) that must not appear in UI copy. */
export const portugueseWords = [
  'pedido', 'pedidos', 'loja', 'lojas', 'crédito', 'credito', 'juros', 'linho', 'camisa', 'calça', 'calca', 'vestido', 'bolsa', 'tênis', 'saia', 'entrega', 'retirada',
  'pronto', 'obrigado', 'obrigada', 'você', 'voce', 'agora', 'hoje', 'amanhã', 'cliente', 'clientes', 'vendas', 'estoque', 'preço', 'preco', 'pagamento', 'parcelas', 'parcela',
  'frete', 'troca', 'devolução', 'devolucao', 'cupom', 'tamanho', 'carrinho', 'sacola', 'finalizar', 'novidades', 'praia', 'verão', 'tricô', 'lona', 'olá', 'então',
  'código', 'maiô', 'saída', 'canga', 'chinelo', 'regata', 'sandália', 'lenço', 'chapéu', 'bermuda', 'básico', 'pijama', 'canelada', 'recorte', 'estampada',
  'rua', 'avenida', 'compras', 'minha', 'meu', 'seus', 'suas', 'está', 'não', 'também', 'mais', 'muito', 'aqui', 'receber', 'comprar'
];

/** US spelling: the common British variants that slip into UI copy. */
export const britishSpellings = ['practise', 'colour', 'colours', 'favourite', 'behaviour', 'centre', 'catalogue', 'licence', 'cancelled', 'cancelling', 'optimise', 'optimised', 'organise', 'organised', 'recognise', 'recognised', 'analyse', 'analysed', 'modelled', 'modelling', 'labelled', 'labelling', 'travelled', 'fulfil', 'fulfilment', 'judgement', 'grey', 'prioritise', 'summarise', 'personalised', 'apologise', 'favour', 'favours', 'favoured', 'honour', 'neighbour', 'neighbours', 'flavour', 'realise', 'realised', 'utilise', 'minimise', 'maximise', 'emphasise', 'visualise', 'metre', 'theatre', 'programme', 'enrol', 'defence', 'offence', 'traveller'];
const britishPattern = new RegExp(`\\b(${britishSpellings.join('|')})\\b`, 'gi');

export type Finding = { file: string; line: number; text: string; problem: string };

const scanned = /\.(tsx?|astro|svelte|json)$/;
const skipped = /(node_modules|\/dist\/|\.svelte-kit|\.next|\.astro\/|\.vercel|test\.ts$|spec\.ts$|themes\.json$|contracts-report\.json$|package\.json$|tsconfig|\/schemas\/|\/fonts\/)/;

export function sourceFiles(root: string, dirs: string[]): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (skipped.test(path)) continue;
      if (statSync(path).isDirectory()) walk(path);
      else if (scanned.test(name)) out.push(path);
    }
  };
  for (const dir of dirs) walk(join(root, dir));
  return out;
}

const accented = /[A-Za-zÀ-ÖØ-öø-ÿ]*[À-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ]*/g;
const wordPattern = new RegExp(`(?<![\\p{L}\\-/._@#])(${portugueseWords.join('|')})(?![\\p{L}\\-/._@])`, 'giu');

/** Strip // and block comments and import lines: they are not UI copy. */
function copyOf(line: string) {
  if (/^\s*(\/\/|\*|\/\*|import |export \* from)/.test(line)) return '';
  // Fictitious proper nouns that happen to be Portuguese words (a seller, carriers) are names, not copy.
  return line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '').replace(/data-(anchor|swatch|flip)="[^"]*"/g, '').replace(/Linho & Co|linho-co|Casa Ribeira|Atelier Norte/g, '');
}

export function lintCopy(root: string, dirs: string[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of sourceFiles(root, dirs)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((raw, index) => {
      const line = copyOf(raw);
      if (!line) return;
      for (const word of line.match(accented) ?? []) {
        if (!allowedAccented.has(word)) findings.push({ file: relative(root, file), line: index + 1, text: word, problem: 'diacritic outside the allowlist' });
      }
      for (const match of line.matchAll(wordPattern)) findings.push({ file: relative(root, file), line: index + 1, text: match[1]!, problem: 'Portuguese word' });
      // BRL stays, but formatted en-US: R$1,249.90, never "R$ 1.249,90" or a pt-BR locale.
      for (const match of line.matchAll(/R\$ \d[\d.]*(,\d{2})?|pt-BR/g)) findings.push({ file: relative(root, file), line: index + 1, text: match[0], problem: 'pt-BR formatting' });
      // en-US dates are month first: "Sep 26, 2026", "Sep 22–28".
      for (const match of line.matchAll(/\b\d{1,2}(?:–\d{1,2})? (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/gi)) findings.push({ file: relative(root, file), line: index + 1, text: match[0], problem: 'day-first date' });
      for (const match of line.matchAll(britishPattern)) findings.push({ file: relative(root, file), line: index + 1, text: match[0], problem: 'British spelling' });
    });
  }
  return findings;
}
