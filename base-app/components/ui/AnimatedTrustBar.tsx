"use client";

import { motion } from "framer-motion";
import { CountUp } from "./AnimatedNumber";

interface AnimatedTrustBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  delay?: number;
}

export function AnimatedTrustBar({ label, value, maxValue, color, delay = 0 }: AnimatedTrustBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex justify-between text-sm mb-2">
        <span className="text-neutral-400">{label}</span>
        <motion.span
          className="font-semibold text-neutral-50 font-mono tabular-nums"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >
          <CountUp end={value} duration={1.5} />
        </motion.span>
      </div>
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, delay: delay + 0.3, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
