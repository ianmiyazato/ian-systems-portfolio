export function Sparkline({ values, tone = 'accent' }: { values: number[]; tone?: 'accent' | 'risk' | 'success' }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${28 - ((value - min) / (max - min || 1)) * 24 - 2}`).join(' ');
  return (
    <svg class={`ph-spark ${tone}`} viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

type PriceChartProps = { price: number[]; sell: number[]; forecast: number[]; proposed: number };

/** Price (step) vs sell-through (line); dashed segments are the agent's forecast after today. */
export function PriceChart({ price, sell, forecast, proposed }: PriceChartProps) {
  const width = 640;
  const height = 220;
  const total = sell.length + forecast.length - 1;
  const x = (index: number) => 40 + (index / total) * (width - 60);
  const ySell = (value: number) => height - 30 - (value / 70) * (height - 60);
  const yPrice = (value: number) => height - 30 - ((value - 180) / 100) * (height - 60);
  const sellPath = sell.map((value, index) => `${index ? 'L' : 'M'}${x(index)},${ySell(value)}`).join(' ');
  const forecastPath = [sell.at(-1)!, ...forecast].map((value, index) => `${index ? 'L' : 'M'}${x(sell.length - 1 + index)},${ySell(value)}`).join(' ');
  const pricePath = price.map((value, index) => `${index ? 'H' + x(index) + ' V' + yPrice(value) : 'M' + x(0) + ',' + yPrice(value)}`).join(' ');
  const today = x(sell.length - 1);
  const proposedPath = `M${today},${yPrice(proposed)} H${x(total)}`;
  return (
    <svg class="ph-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Price versus sell-through over 12 weeks with the agent's 5-week forecast">
      {[0, 1, 2, 3].map((row) => <line key={row} class="grid" x1="40" x2={width - 20} y1={30 + row * 53} y2={30 + row * 53} />)}
      <text x="0" y="34" class="axis">R$ 280</text>
      <text x="0" y={height - 26} class="axis">R$ 180</text>
      <path class="price draw" d={pricePath} />
      <path class="proposed draw" d={proposedPath} />
      <path class="sell draw" d={sellPath} />
      <path class="forecast draw" d={forecastPath} />
      <line class="today" x1={today} x2={today} y1="18" y2={height - 24} />
      <text class="today-label" x={today + 6} y="26">today</text>
      <circle class="dot" cx={today} cy={ySell(sell.at(-1)!)} r="4" />
    </svg>
  );
}
