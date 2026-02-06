'use client';

import dynamic from 'next/dynamic';

// Dynamically import the wallet providers to avoid SSR issues
const WalletProviders = dynamic(
  () => import('./wallet-providers').then((mod) => mod.WalletProviders),
  { 
    ssr: false,
    loading: () => <div className="min-h-screen bg-gray-950" />
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return <WalletProviders>{children}</WalletProviders>;
}
