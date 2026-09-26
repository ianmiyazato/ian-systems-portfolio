export type Band = 'Auto-approve' | 'Review' | 'Decline';
export type Application = { id: string; name: string; amount: number; score: number; product: string; age: string; band: Band; flag?: string };

export const REVIEW_BAND = [560, 620] as const;
export const POLICY_MAX_REVIEW = 4000;

export const bandFor = (score: number): Band => (score >= REVIEW_BAND[1] ? 'Auto-approve' : score >= REVIEW_BAND[0] ? 'Review' : 'Decline');

export const applications: Application[] = [
  { id: 'AP-77118', name: 'Bruno S.', amount: 6000, score: 588, product: 'Crédito + Loja', age: '12 min', band: 'Review', flag: 'Address mismatch' },
  { id: 'AP-77121', name: 'Tainá R.', amount: 4000, score: 712, product: 'Crédito', age: '4 min', band: 'Auto-approve' },
  { id: 'AP-77097', name: 'Helena C.', amount: 9000, score: 603, product: 'Crédito + Loja', age: '31 min', band: 'Review', flag: 'Thin file' },
  { id: 'AP-77104', name: 'Diego M.', amount: 2500, score: 655, product: 'Loja', age: '18 min', band: 'Auto-approve' },
  { id: 'AP-77090', name: 'Otávio L.', amount: 1500, score: 541, product: 'Loja', age: '44 min', band: 'Decline', flag: '3 inquiries · 30d' },
  { id: 'AP-77088', name: 'Camila F.', amount: 3200, score: 689, product: 'Crédito', age: '52 min', band: 'Auto-approve' },
  { id: 'AP-77085', name: 'Pedro A.', amount: 5000, score: 574, product: 'Crédito', age: '1 h', band: 'Review', flag: 'Income unverified' }
];

export const BASE_SCORE = 600;
export type Factor = { label: string; detail: string; points: number };

/** Contribution factors for AP-77118. Base + contributions = the model score. */
export const factors: Factor[] = [
  { label: 'Payment history', detail: 'Maré Pay Loja · 14 months on time', points: 41 },
  { label: 'Income stability', detail: '3 payslips · same employer 4 years', points: 22 },
  { label: 'Tenure', detail: 'Customer since 2019', points: 8 },
  { label: 'Recent inquiries', detail: '3 bureau inquiries in 30 days', points: -14 },
  { label: 'Address mismatch', detail: 'Bill in Campinas, application in São Paulo', points: -31 },
  { label: 'Utilization', detail: '82% of existing limits used', points: -38 }
];

export const scoreOf = (items: Factor[]) => items.reduce((total, item) => total + item.points, BASE_SCORE);

/** Score histogram (bins of 20 from 440 to 800) for the last 30 days of applications. */
export const histogram = [6, 11, 19, 28, 41, 57, 72, 88, 97, 104, 96, 83, 66, 48, 33, 21, 12, 7].map((count, index) => ({ from: 440 + index * 20, count }));

export const brl = (value: number) => `R$ ${value.toLocaleString('pt-BR')}`;
