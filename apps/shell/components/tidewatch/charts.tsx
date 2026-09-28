'use client';

import { useState } from 'react';
import { clock } from '@portfolio/world';

export type Series = { id: string; label: string; color: string; values: number[] };

type LineProps = { title: string; unit: string; times: number[]; series: Series[]; marker?: { at: number; label: string }; height?: number; anchor?: string };

const W = 640;
const PAD = { top: 16, right: 70, bottom: 26, left: 48 };

/**
 * One-axis line chart: 2px lines, recessive grid, a legend plus direct labels at the line ends,
 * a crosshair tooltip on hover/focus, an optional deploy marker, and a table view.
 */
export function LineChart({ title, unit, times, series, marker, height = 220, anchor }: LineProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  if (!times.length) return <figure className="tw-chart" data-anchor={anchor}><figcaption><strong>{title}</strong></figcaption><div className="skeleton" style={{ height }} aria-hidden="true" /></figure>;
  const max = Math.max(1, ...series.flatMap((item) => item.values)) * 1.1;
  const x = (index: number) => PAD.left + (index / Math.max(1, times.length - 1)) * (W - PAD.left - PAD.right);
  const y = (value: number) => PAD.top + (1 - value / max) * (height - PAD.top - PAD.bottom);
  const ticks = [0, max / 2, max].map((value) => Math.round(value / 10) * 10);
  const markerIndex = marker ? times.findIndex((t) => t >= marker.at) : -1;
  const pick = (clientX: number, rect: DOMRect) => {
    const ratio = (clientX - rect.left) / rect.width;
    const index = Math.round(((ratio * W - PAD.left) / (W - PAD.left - PAD.right)) * (times.length - 1));
    setHover(Math.max(0, Math.min(times.length - 1, index)));
  };
  return (
    <figure className="tw-chart" data-anchor={anchor}>
      <figcaption>
        <strong>{title}</strong>
        <ul className="tw-legend">{series.map((item) => <li key={item.id}><i style={{ background: item.color }} aria-hidden="true" />{item.label}</li>)}</ul>
        <button type="button" className="tw-link-btn" aria-pressed={table} onClick={() => setTable(!table)}>{table ? 'Chart' : 'Table'}</button>
      </figcaption>
      {table ? (
        <div className="tw-table-wrap"><table className="tw-table compact"><thead><tr><th>Time</th>{series.map((item) => <th key={item.id} className="num">{item.label}</th>)}</tr></thead>
          <tbody>{times.map((t, index) => <tr key={t}><td className="mono">{clock(t)}</td>{series.map((item) => <td key={item.id} className="num mono">{Math.round(item.values[index]!)}{unit}</td>)}</tr>).reverse()}</tbody></table></div>
      ) : (
        <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`${title}: ${series.map((item) => `${item.label} now ${Math.round(item.values.at(-1)!)}${unit}`).join(', ')}`}
          tabIndex={0} onMouseMove={(event) => pick(event.clientX, event.currentTarget.getBoundingClientRect())} onMouseLeave={() => setHover(null)}
          onKeyDown={(event) => { if (event.key === 'ArrowLeft') setHover(Math.max(0, (hover ?? times.length - 1) - 1)); if (event.key === 'ArrowRight') setHover(Math.min(times.length - 1, (hover ?? 0) + 1)); }}>
          {ticks.map((tick) => <g key={tick}><line className="tw-gridline" x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} /><text className="tw-axis" x={PAD.left - 8} y={y(tick) + 4} textAnchor="end">{tick}{unit}</text></g>)}
          {[0, Math.floor(times.length / 2), times.length - 1].map((index) => <text key={index} className="tw-axis" x={x(index)} y={height - 6} textAnchor="middle">{clock(times[index]!)}</text>)}
          {markerIndex >= 0 && <g className="tw-marker"><line x1={x(markerIndex)} x2={x(markerIndex)} y1={PAD.top} y2={height - PAD.bottom} /><text x={x(markerIndex) + 6} y={PAD.top + 10}>{marker!.label}</text></g>}
          {series.map((item) => <path key={item.id} className="tw-line" style={{ stroke: item.color }} d={item.values.map((value, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ')} />)}
          {series.map((item) => <text key={`${item.id}-label`} className="tw-direct" x={W - PAD.right + 6} y={y(item.values.at(-1)!) + 4}>{item.label} {Math.round(item.values.at(-1)!)}{unit}</text>)}
          {hover !== null && (
            <g className="tw-crosshair" pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={height - PAD.bottom} />
              {series.map((item) => <circle key={item.id} cx={x(hover)} cy={y(item.values[hover]!)} r="4" style={{ fill: item.color }} />)}
              <g transform={`translate(${Math.min(W - 160, x(hover) + 10)} ${PAD.top})`}>
                <rect width="150" height={22 + series.length * 16} rx="6" />
                <text x="10" y="16" className="tw-tip-title">{clock(times[hover]!)}</text>
                {series.map((item, index) => <text key={item.id} x="10" y={34 + index * 16}>{item.label} {Math.round(item.values[hover]!)}{unit}</text>)}
              </g>
            </g>
          )}
        </svg>
      )}
    </figure>
  );
}

/** Single-series bars (throughput), 2px gaps, rounded data ends, hover tooltip per bar. */
export function Bars({ title, times, values, unit, marker, anchor }: { title: string; times: number[]; values: number[]; unit: string; marker?: { at: number; label: string }; anchor?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const height = 140;
  if (!values.length) return <figure className="tw-chart" data-anchor={anchor}><figcaption><strong>{title}</strong></figcaption><div className="skeleton" style={{ height }} aria-hidden="true" /></figure>;
  const max = Math.max(1, ...values) * 1.1;
  const slot = (W - PAD.left - PAD.right) / values.length;
  const markerIndex = marker ? times.findIndex((t) => t >= marker.at) : -1;
  return (
    <figure className="tw-chart" data-anchor={anchor}>
      <figcaption><strong>{title}</strong><span className="tw-muted">now {Math.round(values.at(-1)!).toLocaleString('en-US')}{unit}</span></figcaption>
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`${title}, now ${Math.round(values.at(-1)!)}${unit}`} onMouseLeave={() => setHover(null)}>
        <line className="tw-gridline" x1={PAD.left} x2={W - PAD.right} y1={height - PAD.bottom} y2={height - PAD.bottom} />
        {values.map((value, index) => {
          const h = (value / max) * (height - PAD.top - PAD.bottom);
          return <rect key={times[index]} className={`tw-bar ${hover === index ? 'on' : ''}`} x={PAD.left + index * slot + 1} y={height - PAD.bottom - h} width={Math.max(1, slot - 2)} height={h} rx="2" onMouseEnter={() => setHover(index)} />;
        })}
        {markerIndex >= 0 && <g className="tw-marker"><line x1={PAD.left + markerIndex * slot} x2={PAD.left + markerIndex * slot} y1={PAD.top} y2={height - PAD.bottom} /></g>}
        {[0, values.length - 1].map((index) => <text key={index} className="tw-axis" x={PAD.left + index * slot + slot / 2} y={height - 6} textAnchor="middle">{clock(times[index]!)}</text>)}
        {hover !== null && <g pointerEvents="none" className="tw-crosshair" transform={`translate(${Math.min(W - 150, PAD.left + hover * slot + 10)} ${PAD.top})`}><rect width="140" height="38" rx="6" /><text x="10" y="16" className="tw-tip-title">{clock(times[hover]!)}</text><text x="10" y="31">{Math.round(values[hover]!).toLocaleString('en-US')}{unit}</text></g>}
      </svg>
    </figure>
  );
}

/** Saturation meters: status color + an explicit label, never color alone. */
export function Meters({ items, anchor }: { items: Array<{ label: string; value: number; detail: string }>; anchor?: string }) {
  return (
    <ul className="tw-meters" data-anchor={anchor}>
      {items.map((item) => {
        const status = item.value >= 90 ? 'critical' : item.value >= 70 ? 'warning' : 'good';
        return (
          <li key={item.label} className={status}>
            <div><b>{item.label}</b><span>{item.value}% · {status}</span></div>
            <i style={{ '--v': item.value / 100 } as React.CSSProperties} aria-hidden="true" />
            <small>{item.detail}</small>
          </li>
        );
      })}
    </ul>
  );
}
