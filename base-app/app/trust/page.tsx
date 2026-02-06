"use client";

import { useState, useEffect } from "react";
import { useReadContract, usePublicClient, useBlockNumber } from "wagmi";
import { CONTRACTS, REPUTATION_ABI, CREDIT_ABI, ESCROW_ABI } from "@/lib/contracts";
import Link from "next/link";
import { isAddress } from "viem";
import { Card, ActionButton, ScoreGauge, BottomNav, SparkleEffect, AnimatedTrustBar } from "@/components/ui";
import { base } from "viem/chains";
import { motion, AnimatePresence } from "framer-motion";
import { haptics } from "@/lib/haptics";

export default function TrustPage() {
  const [agentAddress, setAgentAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState<string | null>(null);
  const [transactionCount, setTransactionCount] = useState(0);

  const publicClient = usePublicClient({ chainId: base.id });
  const { data: currentBlock } = useBlockNumber({ chainId: base.id });

  const { data: reputation, isLoading: isLoadingRep } = useReadContract({
    address: CONTRACTS.REPUTATION,
    abi: REPUTATION_ABI,
    functionName: "getReputation",
    args: searchAddress ? [searchAddress as `0x${string}`] : undefined,
    query: { enabled: !!searchAddress && isAddress(searchAddress) },
  });

  const { data: creditScore, isLoading: isLoadingCredit } = useReadContract({
    address: CONTRACTS.CREDIT,
    abi: CREDIT_ABI,
    functionName: "getCreditScore",
    args: searchAddress ? [searchAddress as `0x${string}`] : undefined,
    query: { enabled: !!searchAddress && isAddress(searchAddress) },
  });

  // Fetch real transaction count from escrow events
  useEffect(() => {
    if (!searchAddress || !publicClient || !currentBlock) {
      setTransactionCount(0);
      return;
    }

    const fetchTransactionCount = async () => {
      try {
        const logs = await publicClient.getLogs({
          address: CONTRACTS.ESCROW,
          event: {
            type: "event",
            name: "EscrowCreated",
            inputs: [
              { indexed: true, name: "escrowId", type: "uint256" },
              { indexed: true, name: "sender", type: "address" },
              { indexed: true, name: "recipient", type: "address" },
              { indexed: false, name: "amount", type: "uint256" },
            ],
          },
          fromBlock: currentBlock - BigInt(100000), // Last 100k blocks
          toBlock: "latest",
        });

        // Count transactions where this address is sender or recipient
        const count = logs.filter(
          (log) =>
            log.args.sender === searchAddress ||
            log.args.recipient === searchAddress
        ).length;

        setTransactionCount(count);
      } catch (error) {
        console.error("Error fetching transaction count:", error);
        setTransactionCount(0);
      }
    };

    fetchTransactionCount();
  }, [searchAddress, publicClient, currentBlock]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (agentAddress && isAddress(agentAddress)) {
      setSearchAddress(agentAddress);
      haptics.light();
    }
  };

  const lobsterScore = reputation ? Number(reputation[0]) : 0;
  const trustVector = reputation ? Number(reputation[1]) : 0;
  const credit = creditScore ? Number(creditScore) : 0;

  const isLoading = isLoadingRep || isLoadingCredit;
  const hasSearched = searchAddress !== null;
  const isHighScore = lobsterScore > 750;

  return (
    <main className="min-h-screen bg-neutral-950 pb-24">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link href="/" className="text-neutral-400 hover:text-neutral-50 transition text-sm font-medium">
            ← Back
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6">
        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.6 }}
          >
            🛡️
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Check Trust</h1>
          <p className="text-neutral-400">Verify address reputation</p>
        </motion.div>

        {/* Search */}
        <motion.form
          onSubmit={handleSearch}
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4">
            <label className="block text-sm font-medium text-neutral-400 mb-3">
              Address
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={agentAddress}
                onChange={(e) => setAgentAddress(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-50 placeholder:text-neutral-600 focus:border-orange-600 focus:outline-none transition"
              />
              <ActionButton
                type="submit"
                disabled={!agentAddress || !isAddress(agentAddress)}
                variant="primary"
                className="w-auto px-6"
              >
                Search
              </ActionButton>
            </div>
            {agentAddress && !isAddress(agentAddress) && (
              <motion.p
                className="text-xs text-red-400 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Invalid address
              </motion.p>
            )}
          </Card>
        </motion.form>

        {/* Loading State */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-5xl mb-4"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🔍
              </motion.div>
              <p className="text-neutral-400">Checking reputation...</p>
            </motion.div>
          )}

          {/* Results */}
          {hasSearched && !isLoading && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Big Score Display with Sparkles for High Scores */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="p-6 relative overflow-hidden">
                  {isHighScore && <SparkleEffect />}
                  <ScoreGauge score={lobsterScore} maxScore={1000} label="Trust Score" size="lg" animate={true} />
                </Card>
              </motion.div>

              {/* Trust Breakdown - Sequential Animation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-bold mb-6">Trust Breakdown</h2>
                  <div className="space-y-6">
                    <AnimatedTrustBar
                      label="LOBSTER Score"
                      value={lobsterScore}
                      maxValue={1000}
                      color="bg-orange-600"
                      delay={0.5}
                    />
                    <AnimatedTrustBar
                      label="Trust Vector"
                      value={trustVector}
                      maxValue={100}
                      color="bg-blue-500"
                      delay={0.7}
                    />
                    <AnimatedTrustBar
                      label="Credit Score"
                      value={credit}
                      maxValue={850}
                      color="bg-green-500"
                      delay={0.9}
                    />
                  </div>
                </Card>
              </motion.div>

              {/* Transaction Count */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
              >
                <Card className="p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <div className="text-sm text-neutral-400 mb-1">Transaction Count</div>
                      <motion.div
                        className="text-3xl font-bold font-mono tabular-nums"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10, delay: 1.3 }}
                      >
                        {transactionCount}
                      </motion.div>
                    </div>
                    <motion.div
                      className="text-4xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                    >
                      📊
                    </motion.div>
                  </div>
                </Card>
              </motion.div>

              {/* Address Display */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
              >
                <Card className="p-4">
                  <div className="text-xs text-neutral-400 mb-2">Address</div>
                  <div className="font-mono text-sm text-orange-400 break-all">{searchAddress}</div>
                </Card>
              </motion.div>

              {/* Recommendations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
              >
                <Card className="p-6 bg-gradient-to-br from-blue-950/20 to-purple-950/20 border-blue-900/30 relative overflow-hidden">
                  <div className="flex items-start gap-3 mb-4 relative z-10">
                    <motion.span
                      className="text-2xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      💡
                    </motion.span>
                    <div>
                      <h3 className="font-bold mb-1">Recommendation</h3>
                      <p className="text-sm text-neutral-400">
                        {lobsterScore >= 800 && "High trust score. Safe for large transactions."}
                        {lobsterScore >= 600 && lobsterScore < 800 && "Good reputation. Suitable for most transactions."}
                        {lobsterScore >= 400 && lobsterScore < 600 && "Moderate trust. Consider using escrow."}
                        {lobsterScore < 400 && "Low trust score. Use escrow for protection."}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Empty State */}
          {!hasSearched && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-12 text-center">
                <motion.div
                  className="text-5xl mb-4"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🔍
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">Search for an Address</h3>
                <p className="text-sm text-neutral-400">
                  Enter an address above to view their trust score and reputation
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </main>
  );
}
