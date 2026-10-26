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
} from 'recharts';
import type { LeadTimeItem } from '../types/api';

interface LeadTimeChartProps {
  data: LeadTimeItem[];
}

export const LeadTimeChart: React.FC<LeadTimeChartProps> = ({ data }) => {
  return (
    <div className="bg-surface rounded-lg p-5 border border-border shadow-card">
      <div className="mb-4 pb-3 border-b border-border">
        <h3 className="font-serif text-base font-bold text-text-primary">
          Lead-Time Decay: Error vs Forecast Horizon
        </h3>
        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
          Evaluates how forecast accuracy changes as the time between publication and physical delivery expands.
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D7" vertical={false} />
            <XAxis
              dataKey="lead_time_band"
              stroke="#69675F"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#E5E0D7' }}
              label={{
                value: 'Forecast Lead Time Horizon',
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
            <Tooltip
              formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} MW`, name]}
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
            <Bar dataKey="mae_mw" name="MAE (MW)" fill="#D95635" radius={[2, 2, 0, 0]} />
            <Bar dataKey="rmse_mw" name="RMSE (MW)" fill="#A96E13" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-text-tertiary mt-2 pt-2 border-t border-surface-subtle">
        Takeaway: Nearer-term delivery hours (12–18h lead time) typically exhibit tighter errors than distant hours (30–36h).
      </p>
    </div>
  );
};
