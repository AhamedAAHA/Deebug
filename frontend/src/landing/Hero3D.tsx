import { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import BOQScene from './BOQScene';
import FloatingBOQCard from './FloatingBOQCard';

const logoFallback = (event: React.SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.src = '/daiboq-logo.svg';
};

const BOQ_CARDS = [
  { title: 'Concrete Volume', value: '32.5', unit: 'm³', accent: 'blue' as const, position: 'top-[12%] left-[4%] sm:left-[6%]' },
  { title: 'Brickwork Area', value: '168', unit: 'm²', accent: 'purple' as const, position: 'top-[18%] right-[4%] sm:right-[8%]' },
  { title: 'Steel Quantity', value: '4,250', unit: 'kg', accent: 'slate' as const, position: 'bottom-[28%] left-[2%] sm:left-[5%]' },
  { title: 'Estimated Cost', value: 'LKR 8.4M', unit: '', accent: 'purple' as const, position: 'bottom-[22%] right-[2%] sm:right-[6%]' },
];

export default function Hero3D() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);
  const browserRotate = useTransform(scrollYProgress, [0, 1], [0, 0.12]);
  const scrollRotate = useTransform(scrollYProgress, [0, 1], [0, 0.25]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMouse({ x, y: -y });
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100vh] overflow-hidden px-4 pb-20 pt-24 sm:px-6 lg:px-10 lg:pb-28 lg:pt-28"
    >
      <div className="mesh-bg pointer-events-none absolute inset-0" />

      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img className="h-12 w-auto custom-logo-filter" src="/logo.png" alt="Dee Bug" />
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#workflow" className="transition hover:text-violet-600">Workflow</a>
          <a href="#results" className="transition hover:text-violet-600">AI Results</a>
          <a href="#viz" className="transition hover:text-violet-600">3D View</a>
          <a href="#cost" className="transition hover:text-violet-600">Cost</a>
        </div>
        <Link
          to="/dashboard"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 sm:px-5"
        >
          Launch App
        </Link>
      </nav>

      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 mx-auto mt-12 max-w-7xl lg:mt-16"
      >
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-violet-700 shadow-sm backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              AI Quantity Surveying Copilot
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.7 }}
              className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]"
            >
              AI Quantity Surveying{' '}
              <span className="gradient-text">Copilot</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.7 }}
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0"
            >
              Upload drawings, generate BOQ, estimate cost, and visualize quantities in 3D.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.6 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <Link
                to="/upload"
                className="rounded-full bg-gradient-to-r from-violet-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-500/30 transition hover:brightness-110"
              >
                Start Free Trial →
              </Link>
              <Link
                to="/visualization"
                className="glass-panel rounded-full px-6 py-3 text-sm font-semibold text-slate-700 transition hover:shadow-md"
              >
                Watch 3D Demo
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex flex-wrap justify-center gap-8 lg:justify-start"
            >
              {[
                { v: '98%', l: 'BOQ accuracy' },
                { v: '10×', l: 'Faster takeoff' },
                { v: '3D', l: 'Live quantities' },
              ].map((s) => (
                <div key={s.l}>
                  <p className="text-2xl font-bold text-slate-900">{s.v}</p>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{s.l}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            style={{ rotateX: browserRotate }}
            className="relative mx-auto w-full max-w-2xl perspective-[1200px] lg:max-w-none"
            onMouseMove={onMouseMove}
            onMouseLeave={() => setMouse({ x: 0, y: 0 })}
          >
            <div className="browser-chrome overflow-hidden rounded-[1.75rem] sm:rounded-[2rem]">
              <div className="flex items-center gap-2 border-b border-slate-200/80 bg-white/90 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400/90" />
                <span className="h-3 w-3 rounded-full bg-amber-400/90" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
                <span className="ml-3 flex-1 truncate rounded-lg bg-slate-100/90 px-3 py-1.5 text-xs text-slate-500">
                  daiboq.ai / project / skyline-block-a
                </span>
              </div>
              <div className="relative aspect-[4/3] min-h-[280px] bg-gradient-to-b from-slate-50 to-slate-100 sm:min-h-[360px] lg:min-h-[420px]">
                <BOQSceneWithScroll mouse={mouse} scrollProgress={scrollYProgress} />
                {BOQ_CARDS.map((card, i) => (
                  <div
                    key={card.title}
                    className={`absolute z-10 max-w-[160px] sm:max-w-[190px] ${card.position}`}
                  >
                    <FloatingBOQCard
                      title={card.title}
                      value={card.value}
                      unit={card.unit}
                      index={i}
                      accent={card.accent}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-violet-400/15 via-transparent to-blue-400/15 blur-3xl" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

/** Bridge motion value → BOQScene scroll rotation */
function BOQSceneWithScroll({
  mouse,
  scrollProgress,
}: {
  mouse: { x: number; y: number };
  scrollProgress: ReturnType<typeof useScroll>['scrollYProgress'];
}) {
  const [rotate, setRotate] = useState(0);
  useMotionValueEvent(scrollProgress, 'change', (v) => setRotate(v * 0.25));
  return (
    <div className="absolute inset-0">
      <BOQScene mouse={mouse} scrollRotate={rotate} />
    </div>
  );
}
