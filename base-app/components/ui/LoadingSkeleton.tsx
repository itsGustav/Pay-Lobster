import { motion } from "framer-motion";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "circle" | "rect";
}

export function LoadingSkeleton({ className = "", variant = "rect" }: LoadingSkeletonProps) {
  const baseStyles = "bg-neutral-800 animate-pulse";
  
  const variantStyles = {
    text: "h-4 rounded",
    circle: "rounded-full",
    rect: "rounded-xl",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    />
  );
}

export function BalanceCardSkeleton() {
  return (
    <div className="p-6 text-center space-y-3">
      <LoadingSkeleton className="h-4 w-24 mx-auto" variant="text" />
      <LoadingSkeleton className="h-16 w-48 mx-auto" variant="text" />
      <LoadingSkeleton className="h-3 w-16 mx-auto" variant="text" />
    </div>
  );
}

export function ScoreGaugeSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <LoadingSkeleton className="w-40 h-40" variant="circle" />
      <LoadingSkeleton className="h-3 w-24" variant="text" />
    </div>
  );
}

export function ActivityItemSkeleton() {
  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <LoadingSkeleton className="w-8 h-8" variant="circle" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton className="h-3 w-24" variant="text" />
          <LoadingSkeleton className="h-2 w-16" variant="text" />
        </div>
      </div>
      <LoadingSkeleton className="h-4 w-16" variant="text" />
    </div>
  );
}
