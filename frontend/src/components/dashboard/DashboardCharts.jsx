import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';
import { costBreakdownChart, materialBarChart, progressChart } from '../../data/mockData';
import { formatCompactCurrency } from '../../utils/formatters';
import '../../styles/components.css';

const tooltipStyle = {
  background: 'rgba(20,26,44,0.96)',
  color: '#f7f9ff',
  border: '1px solid rgba(165,177,210,0.16)',
  borderRadius: 14,
  boxShadow: '0 18px 44px rgba(0,0,0,0.28)',
};

const axisTick = { fill: '#a7afc3', fontSize: 11 };
const gridStroke = 'rgba(165,177,210,0.1)';

export function CostPieChart() {
  return (
    <div className="chart-container glass-card">
      <h3 className="chart-title">Cost Breakdown</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={costBreakdownChart}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {costBreakdownChart.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCompactCurrency(v)} contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        {costBreakdownChart.map((item) => (
          <span key={item.name} className="legend-item">
            <span className="legend-dot" style={{ background: item.color }} />
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MaterialBarChart() {
  return (
    <div className="chart-container glass-card">
      <h3 className="chart-title">Material Quantities</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={materialBarChart}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="material" tick={axisTick} />
          <YAxis tick={axisTick} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="qty" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7166ee" />
              <stop offset="100%" stopColor="#65d8d0" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProgressLineChart() {
  return (
    <div className="chart-container glass-card chart-container--wide">
      <h3 className="chart-title">Project Progress</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={progressChart}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="month" tick={axisTick} />
          <YAxis tick={axisTick} unit="%" />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line type="monotone" dataKey="planned" stroke="#7166ee" strokeWidth={2.5} dot={{ r: 4 }} name="Planned %" />
          <Line type="monotone" dataKey="actual" stroke="#65d8d0" strokeWidth={2.5} dot={{ r: 4 }} name="Actual %" connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
