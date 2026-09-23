import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ForecastPoint } from '../data/mock-data'
import { FORECAST_SERIES, CHROME, axisProps } from '../lib/chart-theme'
import ChartTooltip from './ChartTooltip'
import ChartLegend from './ChartLegend'

export default function ForecastChart({ data }: { data: ForecastPoint[] }) {
  const firstProjected = data.find((d) => d.installedT === null)
  const lastLabel = data[data.length - 1]?.weekLabel
  const nowLabel = data.find((d) => d.weekLabel.includes('now'))?.weekLabel

  return (
    <div className="px-3 py-5">
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={CHROME.grid} vertical={false} />
            {firstProjected && lastLabel && (
              <ReferenceArea
                x1={firstProjected.weekLabel}
                x2={lastLabel}
                fill="#0b0b0b"
                fillOpacity={0.035}
                ifOverflow="extendDomain"
              />
            )}
            {nowLabel && (
              <ReferenceLine
                x={nowLabel}
                stroke={CHROME.axis}
                strokeDasharray="4 4"
                label={{ value: 'Forecast →', position: 'insideTopRight', fill: CHROME.muted, fontSize: 11 }}
              />
            )}
            <XAxis dataKey="weekLabel" {...axisProps} />
            <YAxis {...axisProps} width={44} />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="installedT"
              name="Installed (actual)"
              stroke={FORECAST_SERIES.installed}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, fill: CHROME.surface }}
              activeDot={{ r: 6 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="projectedRequiredT"
              name="Projected requirement"
              stroke={FORECAST_SERIES.projected}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 4, strokeWidth: 2, fill: CHROME.surface }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="committedT"
              name="Committed on PO"
              connectNulls={false}
              stroke={FORECAST_SERIES.committed}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, fill: CHROME.surface }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: 'Installed (actual)', color: FORECAST_SERIES.installed, shape: 'line' },
          { label: 'Projected requirement', color: FORECAST_SERIES.projected, shape: 'line', dashed: true },
          { label: 'Committed on PO', color: FORECAST_SERIES.committed, shape: 'line' },
        ]}
      />
    </div>
  )
}
