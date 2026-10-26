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
  ReferenceLine
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
          Diurnal Bias & Error by Hour of Day
        </h3>
        <p className="text-xs text-text-secondary mt-0.5">
          Average error behavior across each delivery hour (00:00 to 23:00 UTC).
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
              label={{ value: 'Delivery Hour (UTC)', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#69675F' }}
            />
            <YAxis
              stroke="#69675F"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#E5E0D7' }}
            />
            <ReferenceLine y={0} stroke="#20201D" />
            <Tooltip
              formatter={(val: any, name: any) => [`${val} MW`, name]}
              labelFormatter={(l) => `Hour: ${l} UTC`}
              contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E0D7', borderRadius: '8px', fontSize: '11px' }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }} />
            <Bar dataKey="mae" name="MAE (MW)" fill="#D95635" radius={[2, 2, 0, 0]} />
            <Bar dataKey="bias" name="Bias (MW)" fill="#267568" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
