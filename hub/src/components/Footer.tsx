'use client';

import { motion } from 'framer-motion';

export default function Footer() {
  const links = [
    { name: 'GitHub', href: 'https://github.com/paylobster', icon: '⚡' },
    { name: 'Docs', href: 'https://github.com/paylobster', icon: '📖' },
    { name: 'X', href: 'https://x.com/paylobster', icon: '𝕏' },
    { name: 'Telegram', href: 'https://t.me/paylobster', icon: '✈️' },
  ];

  return (
    <footer className="border-t border-primary/10 py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="container mx-auto">
        <div className="flex flex-col items-center gap-6">
          {/* Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            {links.map((link) => (
              <motion.a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors min-h-touch px-4"
              >
                <span className="text-lg">{link.icon}</span>
                <span className="font-medium">{link.name}</span>
              </motion.a>
            ))}
          </motion.div>

          {/* Divider */}
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {/* Built on */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3 text-sm text-foreground/60"
          >
            <span>Built on</span>
            <motion.a
              href="https://base.org"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary font-semibold hover:bg-primary/20 transition-colors"
            >
              ⚡ Base
            </motion.a>
            <span>•</span>
            <span>Powered by</span>
            <motion.a
              href="https://circle.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary font-semibold hover:bg-primary/20 transition-colors"
            >
              💰 Circle USDC
            </motion.a>
          </motion.div>

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xs text-foreground/40 text-center"
          >
            © {new Date().getFullYear()} Pay Lobster. Building the future of agent finance.
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
