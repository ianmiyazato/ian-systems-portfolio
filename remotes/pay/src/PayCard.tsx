/** The two Maré Pay cards: Crédito (navy) and Loja (cream). Float + shine, stopped by reduced motion. */
export function PayCard({ kind, holder = 'BRUNO S', last4 = kind === 'credito' ? '4471' : '0912' }: { kind: 'credito' | 'loja'; holder?: string; last4?: string }) {
  return (
    <div class={`py-card ${kind}`}>
      <div class="py-card-top"><b>maré pay</b><span>{kind === 'credito' ? 'Crédito' : 'Loja'}</span></div>
      <span class="py-chip" />
      <div class="py-card-bottom"><span>•••• {last4}</span><small>{holder}</small></div>
      <i class="py-shine" />
    </div>
  );
}
