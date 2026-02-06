'use client';

import { useState, useEffect } from 'react';

export interface Activity {
  id: string;
  type: 'payment' | 'registration' | 'release';
  from?: string;
  to?: string;
  amount?: number;
  escrowId?: number;
  timestamp: number;
  txHash?: string;
}

// Demo activity generator
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

export function useActivityFeed(limit: number = 5) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Initialize with some demo activities
    const initial = Array.from({ length: limit }, () => generateDemoActivity());
    setActivities(initial);

    // Add new activity every 5-10 seconds
    const interval = setInterval(() => {
      const newActivity = generateDemoActivity();
      setActivities((prev) => [newActivity, ...prev.slice(0, limit - 1)]);
    }, Math.random() * 5000 + 5000);

    return () => clearInterval(interval);
  }, [limit]);

  return activities;
}
