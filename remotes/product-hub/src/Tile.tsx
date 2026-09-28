import { products } from './data';
import { Sparkline } from './charts';

export function Tile() {
  return (
    <div class="ph-tile">
      <div class="ph-tile-nav"><b>Product Hub</b><span>Catalog</span><span>Pricing</span><span>Audit</span></div>
      <div class="ph-tile-body">
        <small>HQ merchandising · dense tables</small>
        <strong>Summer · needs action</strong>
        <table>
          <tbody>
            {products.slice(0, 5).map((row) => (
              <tr key={row.id}>
                <td><span class="swatch" data-swatch={row.swatch} />{row.name}</td>
                <td>R${row.price}</td>
                <td><Sparkline values={row.spark} /></td>
                <td><em class={row.status === 'Healthy' ? 'ok' : 'warn'}>{row.status}</em></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
