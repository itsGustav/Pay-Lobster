"use client";

import { motion } from "framer-motion";
import { CountUp } from "./AnimatedNumber";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export function ScoreGauge({
  score,
  maxScore = 1000,
  label = "LOBSTER Score",
  size = "lg",
  animate = true,
}: ScoreGaugeProps) {
  const percentage = Math.min((score / maxScore) * 100, 100);

  // Size configurations
  const sizeConfig = {
    sm: { container: "h-24", circle: 48, stroke: 6, text: "text-2xl", label: "text-xs" },
    md: { container: "h-32", circle: 64, stroke: 8, text: "text-3xl", label: "text-sm" },
    lg: { container: "h-40", circle: 80, stroke: 10, text: "text-5xl", label: "text-sm" },
  };

  const config = sizeConfig[size];
  const radius = config.circle;
  const strokeWidth = config.stroke;
  const circumference = Math.PI * radius; // Half circle

  // Color based on score
  const getColor = (score: number) => {
    if (score >= 800) return "#22c55e"; // green-500
    if (score >= 600) return "#3b82f6"; // blue-500
    if (score >= 400) return "#eab308"; // yellow-500
    if (score >= 200) return "#f97316"; // orange-500
    return "#ef4444"; // red-500
  };

  const color = getColor(score);

  // Gradient glow based on score
  const getGlowColor = (score: number) => {
    if (score >= 800) return "from-green-500/20 to-emerald-500/20"; // green glow
    if (score >= 600) return "from-blue-500/20 to-cyan-500/20"; // blue glow
    if (score >= 400) return "from-yellow-500/20 to-amber-500/20"; // yellow glow
    if (score >= 200) return "from-orange-500/20 to-red-500/20"; // orange glow
    return "from-red-500/20 to-rose-500/20"; // red glow
  };

  const glowColor = getGlowColor(score);

  return (
    <div className="flex flex-col items-center gap-4 relative">
      {/* Gradient Glow Background */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${glowColor} rounded-full blur-3xl -z-10`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      {/* Arc Gauge */}
      <div className={`relative ${config.container} flex items-end justify-center`}>
        <svg
          width={radius * 2 + strokeWidth * 2}
          height={radius + strokeWidth * 2}
          className="overflow-visible"
        >
          {/* Glow effect */}
          <defs>
            <filter id={`glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background arc */}
          <path
            d={`M ${strokeWidth} ${radius + strokeWidth} A ${radius} ${radius} 0 0 1 ${
              radius * 2 + strokeWidth
            } ${radius + strokeWidth}`}
            fill="none"
            stroke="#262626"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <motion.path
            d={`M ${strokeWidth} ${radius + strokeWidth} A ${radius} ${radius} 0 0 1 ${
              radius * 2 + strokeWidth
            } ${radius + strokeWidth}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (circumference * percentage) / 100 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
            filter={`url(#glow-${size})`}
          />
        </svg>

        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <motion.div
            className={`${config.text} font-bold font-mono tabular-nums`}
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {animate ? <CountUp end={score} duration={1.5} /> : score}
          </motion.div>
        </div>
      </div>

      {/* Label */}
      <motion.div
        className={`${config.label} font-medium text-neutral-400 tracking-wide uppercase`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        {label}
      </motion.div>
    </div>
  );
}
