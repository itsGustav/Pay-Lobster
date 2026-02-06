"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, isAddress } from "viem";
import { CONTRACTS, ESCROW_ABI, USDC_ABI } from "@/lib/contracts";
import Link from "next/link";
import { Card, ActionButton, AmountInput, BottomNav } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { haptics } from "@/lib/haptics";

type Step = "form" | "approve" | "create";

const stepConfig = {
  form: { number: 1, title: "Details", icon: "📝" },
  approve: { number: 2, title: "Approve", icon: "✅" },
  create: { number: 2, title: "Create", icon: "🔒" },
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function EscrowPage() {
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState<Step>("form");
  const [direction, setDirection] = useState(1);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<"1" | "7" | "30" | "90">("7");
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  const { writeContract, data: hash, error, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Celebrate escrow creation
  useEffect(() => {
    if (isSuccess && step === "create" && !hasShownConfetti) {
      haptics.success();
      
      // Fireworks effect
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#ea580c", "#f97316", "#fb923c"],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#ea580c", "#f97316", "#fb923c"],
        });
      }, 250);

      setHasShownConfetti(true);
    }
  }, [isSuccess, step, hasShownConfetti]);

  const handleApprove = async () => {
    if (!amount) return;

    try {
      await writeContract({
        address: CONTRACTS.USDC,
        abi: USDC_ABI,
        functionName: "approve",
        args: [CONTRACTS.ESCROW, parseUnits(amount, 6)],
      });
    } catch (err) {
      console.error("Approve error:", err);
      haptics.error();
    }
  };

  const handleCreateEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount || !description) return;

    try {
      writeContract({
        address: CONTRACTS.ESCROW,
        abi: ESCROW_ABI,
        functionName: "createEscrow",
        args: [
          recipient as `0x${string}`,
          parseUnits(amount, 6),
          CONTRACTS.USDC,
          description,
        ],
      });
    } catch (err) {
      console.error("Create escrow error:", err);
      haptics.error();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "form") {
      setDirection(1);
      setStep("approve");
      haptics.light();
    } else if (step === "approve") {
      handleApprove();
    } else {
      handleCreateEscrow(e);
    }
  };

  const goBack = () => {
    setDirection(-1);
    if (step === "approve" || step === "create") {
      setStep("form");
    }
    haptics.light();
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
          <p className="text-neutral-400">Connect your wallet to create escrow</p>
        </motion.div>
      </main>
    );
  }

  const currentStepNum = step === "form" ? 1 : 2;
  const isSuccessful = isSuccess && (step === "approve" || step === "create");

  // After approval success, move to create step
  useEffect(() => {
    if (isSuccess && step === "approve") {
      setTimeout(() => {
        setDirection(1);
        setStep("create");
        reset();
      }, 1500);
    }
  }, [isSuccess, step, reset]);

  return (
    <main className="min-h-screen bg-neutral-950 pb-24">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <button
            onClick={goBack}
            className="text-neutral-400 hover:text-neutral-50 transition text-sm font-medium"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6">
        {/* Title */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 0.6 }}
          >
            🔒
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create Escrow</h1>
          <p className="text-neutral-400">Secure payment with conditions</p>
        </motion.div>

        {/* Animated Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map((num) => {
            const isActive = currentStepNum >= num;
            const isCurrent = currentStepNum === num;
            
            return (
              <motion.div
                key={num}
                className="flex items-center gap-3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: num * 0.1 }}
              >
                <motion.div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-bold relative ${
                    isActive ? "bg-orange-600 text-white" : "bg-neutral-800 text-neutral-500"
                  }`}
                  animate={{
                    scale: isCurrent ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: isCurrent ? Infinity : 0,
                    repeatType: "reverse",
                  }}
                >
                  {num}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-orange-600"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                {num < 2 && (
                  <motion.div
                    className={`h-1 w-12 rounded-full ${
                      currentStepNum > num ? "bg-orange-600" : "bg-neutral-800"
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Form Content with Slide Animation */}
        <div className="relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {step === "form" && (
              <motion.form
                key="form"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                onSubmit={handleFormSubmit}
                className="space-y-6"
              >
                <Card className="p-4">
                  <label className="block text-sm font-medium text-neutral-400 mb-3">
                    Recipient
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-50 placeholder:text-neutral-600 focus:border-orange-600 focus:outline-none transition"
                  />
                  {recipient && !isAddress(recipient) && (
                    <p className="text-xs text-red-400 mt-2">Invalid address</p>
                  )}
                </Card>

                <AmountInput value={amount} onChange={setAmount} presets={[10, 50, 100, 500]} />

                <Card className="p-4">
                  <label className="block text-sm font-medium text-neutral-400 mb-3">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this escrow for?"
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-50 placeholder:text-neutral-600 focus:border-orange-600 focus:outline-none transition resize-none"
                  />
                </Card>

                <Card className="p-4">
                  <label className="block text-sm font-medium text-neutral-400 mb-3">
                    Duration
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {(["1", "7", "30", "90"] as const).map((days) => (
                      <motion.button
                        key={days}
                        type="button"
                        onClick={() => setDuration(days)}
                        className={`rounded-xl min-h-[44px] font-semibold transition-all ${
                          duration === days
                            ? "bg-orange-600 text-white"
                            : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {days}d
                      </motion.button>
                    ))}
                  </div>
                </Card>

                <ActionButton
                  type="submit"
                  disabled={!recipient || !amount || !description || !isAddress(recipient)}
                  variant="primary"
                >
                  Continue
                </ActionButton>
              </motion.form>
            )}

            {(step === "approve" || step === "create") && (
              <motion.form
                key="approve-create"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                onSubmit={handleFormSubmit}
                className="space-y-6"
              >
                {/* Summary Card */}
                <Card className="p-6 bg-gradient-to-br from-orange-500/5 to-transparent">
                  <h3 className="text-lg font-bold mb-4">Escrow Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Recipient</span>
                      <span className="font-mono text-neutral-50 truncate ml-2 max-w-[200px]">
                        {recipient.slice(0, 6)}...{recipient.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Amount</span>
                      <span className="font-mono font-semibold text-neutral-50">${amount} USDC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Duration</span>
                      <span className="text-neutral-50">{duration} days</span>
                    </div>
                    <div className="pt-3 border-t border-neutral-800">
                      <p className="text-xs text-neutral-400">{description}</p>
                    </div>
                  </div>
                </Card>

                {/* Error State */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Card className="p-4 border-red-900 bg-red-950/20">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">⚠️</span>
                          <div>
                            <div className="font-semibold text-sm text-red-400 mb-1">Transaction Failed</div>
                            <p className="text-xs text-neutral-400">{error.message}</p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success State */}
                <AnimatePresence>
                  {isSuccessful && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Card className="p-6 border-green-900 bg-green-950/20 text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1, rotate: 360 }}
                          transition={{ type: "spring", stiffness: 200, damping: 10 }}
                          className="text-5xl mb-3"
                        >
                          {step === "approve" ? "✅" : "🎉"}
                        </motion.div>
                        <h3 className="text-xl font-bold text-green-400 mb-1">
                          {step === "approve" ? "Approved!" : "Escrow Created!"}
                        </h3>
                        <p className="text-sm text-neutral-400 mb-4">
                          {step === "approve" ? "Moving to next step..." : "Your secure payment is ready"}
                        </p>
                        {hash && (
                          <a
                            href={`https://basescan.org/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-orange-400 hover:text-orange-300 font-medium"
                          >
                            View on BaseScan →
                          </a>
                        )}
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isSuccessful && (
                  <ActionButton
                    type="submit"
                    disabled={isPending || isConfirming}
                    variant="primary"
                  >
                    {step === "approve"
                      ? isPending || isConfirming
                        ? "Approving..."
                        : "Approve USDC"
                      : isPending || isConfirming
                      ? "Creating..."
                      : "Create Escrow"}
                  </ActionButton>
                )}

                {isSuccess && step === "create" && (
                  <Link href="/" className="block">
                    <ActionButton variant="primary">Go Home</ActionButton>
                  </Link>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
