import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { TimeOfDayItem } from '../types/api';

interface DiurnalErrorChartProps {
  data: TimeOfDayItem[];
}

export const DiurnalErrorChart: React.FC<DiurnalErrorChartProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    hourLabel: `${String(d.hour_of_day).padStart(2, '0')}:00`,
    mae: d.mae_mw,
    bias: d.bias_mw,
    meanActual: d.mean_actual_mw,
    meanForecast: d.mean_forecast_mw,
  }));

  return (
    <div className="bg-surface rounded-lg p-5 border border-border shadow-card">
      <div className="mb-4 pb-3 border-b border-border">
        <h3 className="font-serif text-base font-bold text-text-primary">
          Diurnal Pattern: Accuracy by Hour of Day
        </h3>
        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
          Examines whether forecast errors concentrate during specific times of day (00:00 to 23:00 UTC).
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D7" vertical={false} />
            <XAxis
              dataKey="hourLabel"
              stroke="#69675F"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#E5E0D7' }}
              label={{
                value: 'Delivery Interval Start (UTC)',
                position: 'insideBottom',
                offset: -10,
                fontSize: 10,
                fill: '#69675F',
              }}
            />
            <YAxis
              stroke="#69675F"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#E5E0D7' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <ReferenceLine y={0} stroke="#20201D" />
            <Tooltip
              formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} MW`, name]}
              labelFormatter={(l) => `Interval: ${l} UTC`}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E0D7',
                borderRadius: '8px',
                fontSize: '11px',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
            />
            <Bar dataKey="mae" name="MAE (MW absolute)" fill="#D95635" radius={[2, 2, 0, 0]} />
            <Bar dataKey="bias" name="Bias (MW mean)" fill="#A96E13" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
        Takeaway: Look for morning or evening peak discrepancies where atmospheric wind shifts deviate from forecast models.
      </p>
    </div>
  );
};
