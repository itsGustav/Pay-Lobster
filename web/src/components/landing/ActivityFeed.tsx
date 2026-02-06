'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Activity {
  id: string;
  type: 'payment' | 'registration' | 'release';
  from?: string;
  to?: string;
  amount?: number;
  escrowId?: number;
  timestamp: number;
}

function generateDemoActivity(): Activity {
  const types: Activity['type'][] = ['payment', 'registration', 'release'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const activity: Activity = {
    id: Math.random().toString(36).substring(7),
    type,
    timestamp: Date.now(),
  };

  switch (type) {
    case 'payment':
      activity.from = `0x${Math.random().toString(16).substring(2, 10)}`;
      activity.to = `0x${Math.random().toString(16).substring(2, 10)}`;
      activity.amount = Math.floor(Math.random() * 10000) + 100;
      break;
    case 'registration':
      activity.from = `0x${Math.random().toString(16).substring(2, 10)}`;
      break;
    case 'release':
      activity.escrowId = Math.floor(Math.random() * 1000) + 1;
      break;
  }

  return activity;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatUSDC(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function ActivityItem({ activity }: { activity: Activity }) {
  const getActivityText = () => {
    switch (activity.type) {
      case 'payment':
        return (
          <>
            Agent <span className="text-orange-600 font-mono">{formatAddress(activity.from!)}</span>
            {' '}paid{' '}
            <span className="text-green-400 font-semibold">
              {formatUSDC(activity.amount!)}
            </span>
            {' '}to <span className="text-orange-600 font-mono">{formatAddress(activity.to!)}</span>
          </>
        );
      case 'registration':
        return (
          <>
            Agent <span className="text-orange-600 font-mono">{formatAddress(activity.from!)}</span>
            {' '}registered
          </>
        );
      case 'release':
        return (
          <>
            Escrow <span className="text-orange-600 font-mono">#{activity.escrowId}</span>
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
      className="flex items-start gap-3 p-4 bg-black/30 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors group cursor-pointer"
    >
      <div className="text-2xl group-hover:scale-110 transition-transform">
        {getIcon()}
      </div>
      <div className="flex-grow min-w-0">
        <div className="text-sm text-gray-200 mb-1 break-words">
          {getActivityText()}
        </div>
        <div className="text-xs text-gray-500">
          {timeAgo(activity.timestamp)}
        </div>
      </div>
      <div className="text-gray-600 group-hover:text-orange-600 transition-colors">
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
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Initialize with some demo activities
    const initial = Array.from({ length: 6 }, () => generateDemoActivity());
    setActivities(initial);

    // Add new activity every 5-10 seconds
    const interval = setInterval(() => {
      const newActivity = generateDemoActivity();
      setActivities((prev) => [newActivity, ...prev.slice(0, 5)]);
    }, Math.random() * 5000 + 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      <AnimatePresence mode="popLayout">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </AnimatePresence>
    </div>
  );
}
