import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gray-800/50',
        className
      )}
    />
  );
}

export function BalanceSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <div className="p-4 md:p-6 flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-24" />
    </div>
  );
}

export function ScoreSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-center justify-center py-8">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
      <Skeleton className="h-4 w-48 mx-auto" />
    </div>
  );
}
