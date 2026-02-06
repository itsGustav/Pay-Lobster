"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { haptics } from "@/lib/haptics";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  presets?: number[];
  className?: string;
}

export function AmountInput({
  value,
  onChange,
  presets = [10, 50, 100, 500],
  className = "",
}: AmountInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handlePresetClick = (amount: number) => {
    onChange(amount.toString());
    haptics.light();
  };

  return (
    <div className={className}>
      {/* Main Amount Input */}
      <motion.div
        className={`rounded-2xl bg-neutral-900 border-2 transition-all p-6 relative overflow-hidden ${
          isFocused ? "border-orange-600 shadow-lg shadow-orange-600/20" : "border-neutral-800"
        }`}
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {isFocused && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
        <label className="block text-sm font-medium text-neutral-400 mb-2 relative z-10">
          Amount
        </label>
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-2xl font-bold text-neutral-400">$</span>
          <input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              haptics.light();
            }}
            onBlur={() => setIsFocused(false)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="flex-1 bg-transparent text-5xl font-bold font-mono tabular-nums text-neutral-50 outline-none placeholder:text-neutral-700"
          />
          <span className="text-xl font-semibold text-neutral-400">USDC</span>
        </div>
      </motion.div>

      {/* Preset Amounts */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        {presets.map((amount, index) => (
          <motion.button
            key={amount}
            type="button"
            onClick={() => handlePresetClick(amount)}
            className={`rounded-xl bg-neutral-900 border border-neutral-800 hover:border-orange-600 hover:bg-neutral-800 active:bg-neutral-700 min-h-[44px] font-semibold transition-all ${
              value === amount.toString() ? "border-orange-600 bg-orange-600/10" : ""
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            ${amount}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
