import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    step: '01',
    title: 'Upload DWG / PDF',
    desc: 'Drop site plans, floor layouts, or structural drawings. LibreDWG parses geometry in-browser.',
    icon: '📐',
  },
  {
    step: '02',
    title: 'AI Geometry Scan',
    desc: 'Walls, slabs, hatches, and block inserts are classified into QS-relevant layers automatically.',
    icon: '✨',
  },
  {
    step: '03',
    title: 'BOQ Generation',
    desc: 'Concrete, brickwork, steel, and finishes quantified with traceable source layers.',
    icon: '📋',
  },
  {
    step: '04',
    title: '3D + Cost Sync',
    desc: 'Quantities flow into interactive 3D massing and live LKR cost dashboards.',
    icon: '🏗️',
  },
];

export default function UploadPanel() {
  return (
    <section id="workflow" className="relative px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">Workflow</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            From drawing upload to BOQ in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            A streamlined QS pipeline — no manual tracing, no spreadsheet chaos.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
              className="glass-panel group rounded-3xl p-6 sm:p-7"
            >
              <span className="text-3xl">{item.icon}</span>
              <p className="mt-4 text-xs font-bold text-violet-600">{item.step}</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="browser-chrome mx-auto mt-16 max-w-3xl overflow-hidden rounded-3xl"
        >
          <div className="flex items-center gap-2 border-b border-slate-200/80 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="ml-2 text-xs font-medium text-slate-500">Upload — A-100 Site Layout.dwg</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-white to-slate-50 px-6 py-14 sm:py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/50 text-4xl">
              📁
            </div>
            <p className="font-semibold text-slate-800">Drag & drop your construction drawing</p>
            <p className="text-sm text-slate-500">DWG · PDF · PNG — up to 50 MB</p>
            <Link
              to="/upload"
              className="mt-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open Upload Studio
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
