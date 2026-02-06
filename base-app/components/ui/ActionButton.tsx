"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { haptics } from "@/lib/haptics";

interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}

export function ActionButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  className = "",
}: ActionButtonProps) {
  const baseStyles = "w-full rounded-xl min-h-[44px] font-semibold transition-all relative overflow-hidden";
  
  const variantStyles =
    variant === "primary"
      ? "bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white shadow-lg shadow-orange-600/20 hover:shadow-orange-600/40"
      : "bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-50";

  const disabledStyles = "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none";

  const handleClick = () => {
    if (!disabled) {
      haptics.light();
      onClick?.();
    }
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${disabledStyles} ${className}`}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.button>
  );
}
