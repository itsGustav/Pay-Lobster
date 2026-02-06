"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { CONTRACTS, REPUTATION_ABI, USDC_ABI } from "@/lib/contracts";
import Link from "next/link";
import { Card, ActionButton, ScoreGauge, BottomNav, BalanceCardSkeleton, ScoreGaugeSkeleton, ActivityItemSkeleton, AnimatedNumber } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  // Fetch reputation score
  const { data: reputation, isLoading: isLoadingRep, refetch: refetchRep } = useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: REPUTATION_ABI,
    functionName: "getReputation",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Fetch USDC balance
  const { data: usdcBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const lobsterScore = reputation ? Number(reputation[0]) : 0;
  const balance = usdcBalance ? formatUnits(usdcBalance, 6) : "0";
  const isLoading = isLoadingRep || isLoadingBalance;

  // Pull to refresh functionality
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        const currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;
        if (pullDistance > 100) {
          setIsRefreshing(true);
          refetchRep();
          refetchBalance();
          setTimeout(() => setIsRefreshing(false), 1000);
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [startY, isRefreshing, refetchRep, refetchBalance]);

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <motion.div
          className="text-center max-w-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="text-7xl mb-6"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🦞
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Pay Lobster</h1>
          <p className="text-neutral-400 mb-8">
            Secure payments with trust scores on Base
          </p>
          <ConnectWallet />
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 pb-24">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦞</span>
            <h1 className="text-lg font-bold">Pay Lobster</h1>
          </div>
          <ConnectWallet />
        </div>
      </header>

      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-neutral-800 rounded-full px-4 py-2 text-sm text-neutral-300">
              Refreshing...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="max-w-2xl mx-auto px-6 py-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* USDC Balance - Big and Center */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden">
            {isLoading ? (
              <BalanceCardSkeleton />
            ) : (
              <motion.div
                className="p-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Gradient glow background */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/5 -z-10" />
                
                <div className="text-sm font-medium text-neutral-400 mb-2">USDC Balance</div>
                <div className="text-6xl font-bold font-mono tabular-nums text-neutral-50 mb-1">
                  $<AnimatedNumber value={parseFloat(balance)} decimals={2} />
                </div>
                <div className="text-sm text-neutral-500">on Base</div>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* LOBSTER Score Gauge */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden">
            {isLoading ? (
              <ScoreGaugeSkeleton />
            ) : (
              <div className="p-6">
                <ScoreGauge score={lobsterScore} maxScore={1000} label="LOBSTER Score" size="lg" />
              </div>
            )}
          </Card>
        </motion.div>

        {/* Two Big Action Buttons */}
        <motion.div className="grid grid-cols-2 gap-4" variants={itemVariants}>
          <Link href="/send" className="block">
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 hover:border-orange-600 transition-all cursor-pointer h-full shadow-lg hover:shadow-orange-600/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex flex-col items-center gap-3 relative z-10">
                  <motion.div
                    className="text-4xl"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    💸
                  </motion.div>
                  <div className="font-semibold text-lg">Send</div>
                </div>
              </Card>
            </motion.div>
          </Link>

          <Link href="/escrow" className="block">
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 hover:border-orange-600 transition-all cursor-pointer h-full shadow-lg hover:shadow-orange-600/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex flex-col items-center gap-3 relative z-10">
                  <motion.div
                    className="text-4xl"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    🔒
                  </motion.div>
                  <div className="font-semibold text-lg">Escrow</div>
                </div>
              </Card>
            </motion.div>
          </Link>
        </motion.div>

        {/* Recent Activity - Max 3 Items */}
        <motion.div variants={itemVariants}>
          <h2 className="text-sm font-medium text-neutral-400 mb-3 px-2">Recent Activity</h2>
          <Card className="divide-y divide-neutral-800">
            {isLoading ? (
              <>
                <ActivityItemSkeleton />
                <ActivityItemSkeleton />
                <ActivityItemSkeleton />
              </>
            ) : (
              <>
                <motion.div
                  className="p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">💸</div>
                      <div>
                        <div className="font-medium text-sm">Sent USDC</div>
                        <div className="text-xs text-neutral-500">2 hours ago</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono tabular-nums font-semibold text-red-400">-$50.00</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🔒</div>
                      <div>
                        <div className="font-medium text-sm">Escrow Created</div>
                        <div className="text-xs text-neutral-500">1 day ago</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono tabular-nums font-semibold text-neutral-400">$100.00</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">✅</div>
                      <div>
                        <div className="font-medium text-sm">Received USDC</div>
                        <div className="text-xs text-neutral-500">2 days ago</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono tabular-nums font-semibold text-green-500">+$25.00</div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </Card>
        </motion.div>
      </motion.div>

      <BottomNav />
    </main>
  );
}
