/** The two Maré Pay cards: Credit (navy) and Store (cream). Float + shine, stopped by reduced motion. */
export function PayCard({ kind, holder = 'BRUNO S', last4 = kind === 'credit' ? '4471' : '0912' }: { kind: 'credit' | 'store'; holder?: string; last4?: string }) {
  return (
    <div class={`py-card ${kind}`}>
      <div class="py-card-top"><b>maré pay</b><span>{kind === 'credit' ? 'Credit' : 'Store'}</span></div>
      <span class="py-chip" />
      <div class="py-card-bottom"><span>•••• {last4}</span><small>{holder}</small></div>
      <i class="py-shine" />
    </div>
  );
}
