import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const MONTHLY = [
  { month: 'Jan', cost: 6.2 },
  { month: 'Feb', cost: 6.8 },
  { month: 'Mar', cost: 7.1 },
  { month: 'Apr', cost: 7.4 },
  { month: 'May', cost: 8.1 },
  { month: 'Jun', cost: 8.4 },
];

const BREAKDOWN = [
  { name: 'Concrete', value: 28 },
  { name: 'Steel', value: 34 },
  { name: 'Masonry', value: 22 },
  { name: 'Finishes', value: 16 },
];

export default function CostDashboard() {
  return (
    <section id="cost" className="relative px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">Cost Intelligence</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Predictive cost dashboard
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            Live LKR rates, inflation trends, and AI-assisted forecasting for every BOQ revision.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-panel rounded-3xl p-6 lg:col-span-1"
          >
            <p className="text-sm font-medium text-slate-500">Total estimated cost</p>
            <p className="mt-2 text-4xl font-extrabold gradient-text">LKR 8.4M</p>
            <p className="mt-2 text-sm text-emerald-600 font-medium">↑ 4.2% vs last revision</p>
            <div className="mt-6 space-y-3">
              {BREAKDOWN.map((b) => (
                <div key={b.name}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{b.name}</span>
                    <span className="font-semibold text-slate-900">{b.value}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${b.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="browser-chrome rounded-3xl p-6 lg:col-span-2"
          >
            <p className="mb-4 text-sm font-semibold text-slate-700">Project cost trend (LKR millions)</p>
            <div className="h-64 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} domain={[5, 9]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    fill="url(#costGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="browser-chrome rounded-3xl p-6 lg:col-span-3"
          >
            <p className="mb-4 text-sm font-semibold text-slate-700">Trade breakdown</p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BREAKDOWN} barSize={36}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
