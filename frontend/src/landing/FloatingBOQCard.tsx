import { motion } from 'framer-motion';

export interface FloatingBOQCardProps {
  title: string;
  value: string;
  unit?: string;
  index?: number;
  className?: string;
  accent?: 'purple' | 'blue' | 'slate';
}

const accentRing: Record<NonNullable<FloatingBOQCardProps['accent']>, string> = {
  purple: 'from-violet-500/20 to-purple-400/10',
  blue: 'from-blue-500/20 to-cyan-400/10',
  slate: 'from-slate-400/15 to-slate-300/5',
};

export default function FloatingBOQCard({
  title,
  value,
  unit,
  index = 0,
  className = '',
  accent = 'purple',
}: FloatingBOQCardProps) {
  return (
    <motion.div
      className={`glass-panel pointer-events-auto rounded-2xl px-4 py-3 sm:px-5 sm:py-4 ${className}`}
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.35 + index * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 4.2 + index * 0.4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.35,
        }}
      >
        <div className={`mb-2 h-1 w-8 rounded-full bg-gradient-to-r ${accentRing[accent]}`} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[11px]">
          {title}
        </p>
        <p className="mt-1 font-semibold text-slate-900 sm:text-lg">
          <span className="gradient-text text-xl sm:text-2xl">{value}</span>
          {unit ? (
            <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>
          ) : null}
        </p>
      </motion.div>
    </motion.div>
  );
}
