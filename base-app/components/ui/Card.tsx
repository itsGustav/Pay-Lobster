import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-neutral-900 border border-neutral-800 ${className}`}
    >
      {children}
    </div>
  );
}
