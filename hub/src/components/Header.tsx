'use client';

import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/10"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3"
          >
            <div className="text-4xl">🦞</div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                PAY <span className="text-primary">LOBSTER</span>
              </h1>
              <p className="text-xs text-foreground/60">Agent Finance Mission Control</p>
            </div>
          </motion.div>

          {/* Connect Wallet */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (isConnected) {
                disconnect();
              } else {
                connect({ connector: connectors[0] });
              }
            }}
            className="min-h-touch min-w-touch px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-primary/50"
          >
            {isConnected
              ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
              : 'Connect Wallet'}
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
