/** Monthly interest on renegotiated debt (Maré Pay agreement policy); a single payment has none. */
export const AGREEMENT_RATE = 0.0199;

export type AgreementQuote = { principal: number; discount: number; installments: number; installment: number; total: number; savings: number };

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Price an agreement: the discount applies to the debt first, then the rest is financed with a
 * fixed monthly installment (PMT). Rounding lands on the last cent so installments × n = total.
 */
export function agreementQuote(debt: number, discountPct: number, installments: number, rate = AGREEMENT_RATE): AgreementQuote {
  const discount = round2(debt * (discountPct / 100));
  const principal = round2(debt - discount);
  const installment = installments === 1 ? principal : round2((principal * rate) / (1 - (1 + rate) ** -installments));
  const total = round2(installment * installments);
  return { principal, discount, installments, installment, total, savings: round2(debt - total) };
}
