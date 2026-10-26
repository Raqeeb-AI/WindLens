import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
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
          Accuracy Decay by Forecast Lead Time
        </h3>
        <p className="text-xs text-text-secondary mt-0.5">
          MAE and RMSE grouped by hours between publication and physical delivery.
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
              label={{ value: 'Lead Time Horizon', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#69675F' }}
            />
            <YAxis
              stroke="#69675F"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#E5E0D7' }}
            />
            <Tooltip
              formatter={(val: any, name: any) => [`${val} MW`, name]}
              contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E0D7', borderRadius: '8px', fontSize: '11px' }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }} />
            <Bar dataKey="mae_mw" name="MAE (MW)" fill="#D95635" radius={[2, 2, 0, 0]} />
            <Bar dataKey="rmse_mw" name="RMSE (MW)" fill="#7A4B76" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
