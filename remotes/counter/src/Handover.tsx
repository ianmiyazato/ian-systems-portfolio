import { Layer, closeLayers, openLayer, useParam } from '@portfolio/remote-runtime';
import { useState } from 'preact/hooks';
import type { Action, Board } from './board';

type Props = { orderId: string; board: Board; act: (action: Action) => void };

export function Handover({ orderId, board, act }: Props) {
  const sub = useParam('sub');
  const order = board.orders.find((item) => item.id === orderId) ?? board.orders.find((item) => item.id === 'MR-904112')!;
  const [code, setCode] = useState('482');
  const [idDigits, setIdDigits] = useState('4471');
  const close = () => closeLayers(['modal', 'order', 'sub']);
  const finish = (message: string) => {
    act({ type: 'move', id: order.id, lane: 'handed-over', patch: { sla: `Handed over 16:21 · ${message}` } });
    act({ type: 'toast', message: `Handed over ${order.id} · ${message}` });
    close();
  };
  const matches = idDigits === '4471';

  return (
    <>
      <Layer
        kind="modal"
        title={`Hand over to ${order.customer}`}
        eyebrow={`${order.id} · pickup`}
        onClose={close}
        width={600}
        anchor="ct-handover"
        footer={
          <>
            <button type="button" class="ct-secondary" onClick={() => openLayer({ sub: 'third-party' })} data-anchor="ct-third-party">Someone else is picking up</button>
            <button type="button" class="ct-primary" disabled={code.length < 6} onClick={() => finish('code verified')}>Confirm handover</button>
          </>
        }
      >
        <div class="ct-handover-items">
          {order.items.map((item, index) => (
            <div key={`${item.sku}-${index}`}><span class="swatch" data-swatch={item.swatch} /><span>{item.name}<small>Size {item.size} · {item.aisle}</small></span></div>
          ))}
          <p class="ct-paid"><b>{order.total}</b>{order.payment}</p>
        </div>
        <label class="ct-code-label" for="ct-code">Ask for the 6-digit pickup code</label>
        <div class="ct-code" data-anchor="ct-code">
          <input id="ct-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onInput={(event) => setCode(event.currentTarget.value.replace(/\D/g, '').slice(0, 6))} />
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} class={code[index] ? 'filled' : index === code.length ? 'caret-box' : ''} aria-hidden="true">{code[index] ?? ''}</span>
          ))}
        </div>
        <button type="button" class="ct-camera"><span aria-hidden="true">▣</span>Use camera · scan the QR code in the customer's app</button>
      </Layer>
      {sub === 'third-party' && (
        <Layer
          kind="sub"
          level={2}
          title="Authorize a third party"
          eyebrow="Pickup on behalf of the customer"
          onClose={() => closeLayers(['sub'])}
          anchor="ct-authorize"
          footer={<button type="button" class="ct-primary wide" disabled={!matches} onClick={() => finish('Marina M. authorized in app')}>Confirm and hand over</button>}
        >
          <div class="ct-auth" data-anchor="ct-app-authorization">
            <span class="ct-auth-avatar" aria-hidden="true">MM</span>
            <div>
              <strong>Marina M.</strong>
              <p>Authorized by {order.customer} in the Maré app · 15:52</p>
              <small>ID ending 4471</small>
            </div>
          </div>
          <label class="ct-field">
            Last 4 digits of Marina's ID
            <span>
              <input inputMode="numeric" maxLength={4} value={idDigits} onInput={(event) => setIdDigits(event.currentTarget.value.replace(/\D/g, '').slice(0, 4))} />
              {idDigits.length === 4 && <em class={matches ? 'match' : 'nomatch'}>{matches ? 'Matches' : 'Does not match'}</em>}
            </span>
          </label>
          <p class="ct-note">The ID photo is not stored. Only the match result and your staff badge go to the audit log.</p>
        </Layer>
      )}
    </>
  );
}
