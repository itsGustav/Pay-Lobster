"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { haptics } from "@/lib/haptics";

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
}

function NavItem({ href, icon, label }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={() => haptics.light()}
      className="relative flex flex-col items-center justify-center gap-1 min-w-[60px] py-2 px-3 rounded-xl transition-colors"
    >
      <motion.div
        animate={{
          scale: isActive ? 1.1 : 1,
          color: isActive ? "#ea580c" : "#a3a3a3",
        }}
        transition={{ duration: 0.2 }}
        className="text-2xl"
      >
        {icon}
      </motion.div>
      <motion.span
        animate={{
          color: isActive ? "#ea580c" : "#a3a3a3",
          fontWeight: isActive ? 600 : 500,
        }}
        transition={{ duration: 0.2 }}
        className="text-xs"
      >
        {label}
      </motion.span>
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-600 rounded-full"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-800 safe-area-pb z-50">
      <div className="flex justify-around items-center max-w-2xl mx-auto">
        <NavItem href="/" icon="🏠" label="Home" />
        <NavItem href="/send" icon="💸" label="Send" />
        <NavItem href="/escrow" icon="🔒" label="Escrow" />
        <NavItem href="/trust" icon="🛡️" label="Trust" />
      </div>
    </nav>
  );
}
