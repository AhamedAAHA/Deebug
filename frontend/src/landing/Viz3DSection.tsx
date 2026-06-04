import { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import BOQScene from './BOQScene';
import FloatingBOQCard from './FloatingBOQCard';

export default function Viz3DSection() {
  const ref = useRef<HTMLElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [scrollRotate, setScrollRotate] = useState(0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  useMotionValueEvent(scrollYProgress, 'change', (v) => setScrollRotate((v - 0.5) * 0.4));

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  }, []);

  return (
    <section id="viz" ref={ref} className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">3D Quantities</p>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Interactive quantity visualization
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Site massing, plan overlay, and element-level inspection — orbit, select, and sync
              with your BOQ in real time.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              {['Site 3D extrusion from DWG hatches', 'Cost heatmap by element', 'Build sequence animation'].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-xs text-violet-600">
                      ✓
                    </span>
                    {t}
                  </li>
                ),
              )}
            </ul>
            <Link
              to="/visualization"
              className="mt-8 inline-flex rounded-full bg-gradient-to-r from-violet-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25"
            >
              Open 3D Viewer →
            </Link>
          </motion.div>

          <motion.div
            style={{ y: parallaxY }}
            className="relative"
            onMouseMove={onMouseMove}
            onMouseLeave={() => setMouse({ x: 0, y: 0 })}
          >
            <div className="browser-chrome overflow-hidden rounded-[2rem]">
              <div className="relative aspect-square max-h-[480px] min-h-[300px] w-full">
                <BOQScene mouse={mouse} scrollRotate={scrollRotate} />
                <div className="absolute left-[8%] top-[10%] z-10 max-w-[140px]">
                  <FloatingBOQCard title="Live sync" value="BOQ" unit="linked" index={0} accent="blue" />
                </div>
                <div className="absolute bottom-[12%] right-[6%] z-10 max-w-[150px]">
                  <FloatingBOQCard title="Elements" value="5,000" unit="shown" index={1} accent="purple" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
