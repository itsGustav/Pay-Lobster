'use client';

import { motion } from 'framer-motion';
import { useMetrics } from '@/hooks/useMetrics';
import { formatNumber } from '@/lib/utils';

export default function MetricsBar() {
  const { tvl, tvlChange, agentCount, agentsToday, txCount, isLoading } = useMetrics();

  const metrics = [
    {
      label: 'Total Value Locked',
      value: isLoading ? '---' : `$${formatNumber(tvl)}`,
      change: `↑ ${tvlChange}% 24h`,
      positive: true,
    },
    {
      label: 'Active Agents',
      value: isLoading ? '---' : formatNumber(agentCount),
      change: `↑ ${agentsToday} today`,
      positive: true,
    },
    {
      label: 'Transactions',
      value: isLoading ? '---' : formatNumber(txCount),
      change: 'real-time',
      positive: null,
    },
  ];

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <motion.div
                whileHover={{ y: -5 }}
                className="relative bg-background border border-primary/20 rounded-2xl p-6 backdrop-blur-sm"
              >
                <div className="text-foreground/60 text-sm font-medium mb-2">
                  {metric.label}
                </div>
                <div className="text-3xl sm:text-4xl font-bold mb-2 text-balance">
                  {metric.value}
                </div>
                <div
                  className={`text-sm font-medium ${
                    metric.positive === true
                      ? 'text-green-400'
                      : metric.positive === false
                      ? 'text-red-400'
                      : 'text-foreground/60'
                  }`}
                >
                  {metric.change}
                </div>
                
                {/* Pulse indicator for real-time */}
                {metric.positive === null && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-6 right-6 w-3 h-3 bg-primary rounded-full"
                  />
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
