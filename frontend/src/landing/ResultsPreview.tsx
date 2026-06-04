import { motion } from 'framer-motion';

const EXTRACTION_ITEMS = [
  { layer: 'A-WALL', type: 'Masonry wall', qty: '412.6 m²', confidence: 96 },
  { layer: 'S-SLAB', type: 'RC slab', qty: '32.5 m³', confidence: 94 },
  { layer: 'S-COL', type: 'Structural column', qty: '18 nr', confidence: 91 },
  { layer: 'A-DOOR', type: 'Door opening', qty: '24 nr', confidence: 89 },
  { layer: 'A-WIND', type: 'Window opening', qty: '36 nr', confidence: 88 },
  { layer: 'L-HATCH', type: 'Plot boundary', qty: '2,195 m²', confidence: 97 },
];

const BOQ_ROWS = [
  { code: '03.01', item: 'Concrete in foundations', unit: 'm³', qty: '12.4', rate: '18,500', amount: '229,400' },
  { code: '04.02', item: 'Brickwork in walls', unit: 'm²', qty: '168.0', rate: '4,200', amount: '705,600' },
  { code: '05.10', item: 'High-yield steel', unit: 'kg', qty: '4,250', rate: '285', amount: '1,211,250' },
  { code: '07.03', item: 'Plaster two coat', unit: 'm²', qty: '336.0', rate: '890', amount: '299,040' },
  { code: '09.01', item: 'Ceramic floor tile', unit: 'm²', qty: '142.0', rate: '3,450', amount: '489,900' },
];

export default function ResultsPreview() {
  return (
    <section id="results" className="relative px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">AI Extraction</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Intelligent quantity results
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="glass-panel rounded-3xl p-6 sm:p-8"
          >
            <h3 className="text-lg font-bold text-slate-900">Layer classification</h3>
            <p className="mt-1 text-sm text-slate-500">Auto-detected from your DWG</p>
            <ul className="mt-6 space-y-3">
              {EXTRACTION_ITEMS.map((row, i) => (
                <motion.li
                  key={row.layer}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/60 px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-mono font-medium text-violet-600">{row.layer}</p>
                    <p className="text-sm font-semibold text-slate-800">{row.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{row.qty}</p>
                    <p className="text-xs text-emerald-600">{row.confidence}% match</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="browser-chrome overflow-hidden rounded-3xl"
          >
            <div className="border-b border-slate-200/80 bg-white/90 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">BOQ Preview — Rev A</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold">Qty</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {BOQ_ROWS.map((row, i) => (
                    <motion.tr
                      key={row.code}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="border-b border-slate-50 hover:bg-violet-50/30"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-violet-600">{row.code}</td>
                      <td className="px-4 py-3 text-slate-800">{row.item}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.qty} {row.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {row.amount}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-sm">
              <span className="text-slate-500">5 line items shown</span>
              <span className="font-bold text-slate-900">Subtotal LKR 2,935,190</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
