'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useActivityFeed, type Activity } from '@/hooks/useActivityFeed';
import { formatAddress, formatUSDC, timeAgo } from '@/lib/utils';

function ActivityItem({ activity }: { activity: Activity }) {
  const getActivityText = () => {
    switch (activity.type) {
      case 'payment':
        return (
          <>
            Agent <span className="text-primary font-mono">{formatAddress(activity.from!)}</span>
            {' '}paid{' '}
            <span className="text-green-400 font-semibold">
              {formatUSDC(BigInt(activity.amount! * 1_000_000))}
            </span>
            {' '}to <span className="text-primary font-mono">{formatAddress(activity.to!)}</span>
          </>
        );
      case 'registration':
        return (
          <>
            Agent <span className="text-primary font-mono">{formatAddress(activity.from!)}</span>
            {' '}registered
          </>
        );
      case 'release':
        return (
          <>
            Escrow <span className="text-primary font-mono">#{activity.escrowId}</span>
            {' '}released
          </>
        );
    }
  };

  const getIcon = () => {
    switch (activity.type) {
      case 'payment':
        return '💸';
      case 'registration':
        return '✨';
      case 'release':
        return '🔓';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3 p-4 bg-background/50 border border-primary/10 rounded-xl hover:border-primary/30 transition-colors group cursor-pointer"
    >
      <div className="text-2xl group-hover:scale-110 transition-transform">
        {getIcon()}
      </div>
      <div className="flex-grow min-w-0">
        <div className="text-sm text-foreground/90 mb-1 break-words">
          {getActivityText()}
        </div>
        <div className="text-xs text-foreground/50">
          {timeAgo(activity.timestamp)}
        </div>
      </div>
      <div className="text-foreground/30 group-hover:text-primary transition-colors">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>
    </motion.div>
  );
}

export default function ActivityFeed() {
  const activities = useActivityFeed(6);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-primary rounded-full"
            />
            <span className="text-sm font-semibold text-primary">LIVE ACTIVITY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Network <span className="text-primary">Pulse</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </AnimatePresence>
        </div>

        {/* View more link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <a
            href="https://basescan.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors text-sm"
          >
            View all transactions on BaseScan
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
