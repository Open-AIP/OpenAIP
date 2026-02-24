"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MOTION_TOKENS, VIEWPORT_ONCE } from "../../components/motion/motion-primitives";

type ParsedSeries = {
  key: string;
  label: string;
  points: number[];
  color: string;
};

type VoiceMattersTrendsChartProps = {
  months: string[];
  series: ParsedSeries[];
  yTicks: number[];
  chartMax: number;
};

function mapChartY(value: number, topPad: number, plotHeight: number, chartMax: number): number {
  const safeValue = Math.max(0, Math.min(chartMax, value));
  return topPad + ((chartMax - safeValue) / chartMax) * plotHeight;
}

function resolvePointX(index: number, count: number, leftPad: number, plotWidth: number): number {
  return count === 1 ? leftPad + plotWidth / 2 : leftPad + (index / (count - 1)) * plotWidth;
}

function buildPathD(
  values: number[],
  leftPad: number,
  plotWidth: number,
  topPad: number,
  plotHeight: number,
  chartMax: number
): string {
  if (!values.length) {
    return "";
  }

  return values
    .map((value, index) => {
      const x = resolvePointX(index, values.length, leftPad, plotWidth);
      const y = mapChartY(value, topPad, plotHeight, chartMax);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default function VoiceMattersTrendsChart({
  months,
  series,
  yTicks,
  chartMax,
}: VoiceMattersTrendsChartProps) {
  const reducedMotion = useReducedMotion();
  const chartWidth = 660;
  const chartHeight = 350;
  const leftPad = 52;
  const rightPad = 26;
  const topPad = 22;
  const bottomPad = 86;
  const plotWidth = chartWidth - leftPad - rightPad;
  const plotHeight = chartHeight - topPad - bottomPad;
  const xAxisY = topPad + plotHeight;
  const lineDuration = reducedMotion ? 0.2 : 0.82;
  const pointDuration = reducedMotion ? 0.16 : 0.22;
  const legendDuration = reducedMotion ? 0.2 : 0.45;

  return (
    <motion.svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="h-[320px] w-full"
      role="img"
      aria-label="Feedback trends chart"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={VIEWPORT_ONCE}
      transition={{
        duration: reducedMotion ? 0.2 : MOTION_TOKENS.enterDuration,
        ease: MOTION_TOKENS.enterEase,
      }}
    >
      {yTicks.map((tick) => {
        const y = mapChartY(tick, topPad, plotHeight, chartMax);
        return (
          <g key={tick}>
            <line x1={leftPad} y1={y} x2={chartWidth - rightPad} y2={y} stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
            <text x={leftPad - 10} y={y + 4} textAnchor="end" fontSize="12" fill="rgba(255,255,255,0.75)">
              {tick}
            </text>
          </g>
        );
      })}

      <line x1={leftPad} y1={xAxisY} x2={chartWidth - rightPad} y2={xAxisY} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />

      {months.map((month, index) => {
        const x = resolvePointX(index, months.length, leftPad, plotWidth);
        return (
          <text key={`${month}-${index}`} x={x} y={xAxisY + 18} textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.74)">
            {month}
          </text>
        );
      })}

      {series.map((item, seriesIndex) => {
        const pathD = buildPathD(item.points, leftPad, plotWidth, topPad, plotHeight, chartMax);
        const lineDelay = reducedMotion ? 0 : seriesIndex * MOTION_TOKENS.stagger;
        const legendDelay = reducedMotion ? 0 : lineDelay + lineDuration * 0.72;

        return (
          <g key={item.key}>
            <motion.path
              d={pathD}
              fill="none"
              stroke={item.color}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0.9 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: lineDuration, delay: lineDelay, ease: MOTION_TOKENS.enterEase }}
            />

            {item.points.map((point, pointIndex) => {
              const x = resolvePointX(pointIndex, item.points.length, leftPad, plotWidth);
              const y = mapChartY(point, topPad, plotHeight, chartMax);
              const pointDelay = reducedMotion ? 0 : lineDelay + 0.16 + pointIndex * 0.03;

              return (
                <motion.circle
                  key={`${item.key}-${pointIndex}`}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#0b2f3a"
                  stroke={item.color}
                  strokeWidth="1.4"
                  initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={VIEWPORT_ONCE}
                  transition={{ duration: pointDuration, delay: pointDelay, ease: MOTION_TOKENS.enterEase }}
                />
              );
            })}

            <motion.g
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: legendDuration, delay: legendDelay, ease: MOTION_TOKENS.enterEase }}
              transform={`translate(${chartWidth / 2}, ${chartHeight - 24})`}
            >
              <g transform={`translate(${seriesIndex === 0 ? -56 : 18}, 0)`}>
                <line x1="0" y1="0" x2="12" y2="0" stroke={item.color} strokeWidth="2.25" />
                <circle cx="6" cy="0" r="2.6" fill="#0b2f3a" stroke={item.color} strokeWidth="1.2" />
                <text x="18" y="4" fontSize="12" fill="rgba(255,255,255,0.8)">
                  {item.label}
                </text>
              </g>
            </motion.g>
          </g>
        );
      })}
    </motion.svg>
  );
}
