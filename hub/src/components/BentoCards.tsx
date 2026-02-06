'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface CardProps {
  icon: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  delay: number;
}

function BentoCard({ icon, title, description, cta, href, delay }: CardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setMousePosition({ x, y });
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.02, y: -8 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      className="relative group cursor-pointer"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/5 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Card */}
      <motion.div
        style={{
          rotateX: isHovered ? mousePosition.y / 5 : 0,
          rotateY: isHovered ? mousePosition.x / 5 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative bg-background border border-primary/20 rounded-3xl p-8 backdrop-blur-sm overflow-hidden h-full min-h-[280px] flex flex-col card-glow"
      >
        {/* Icon */}
        <motion.div
          animate={{ rotate: isHovered ? 360 : 0 }}
          transition={{ duration: 0.6 }}
          className="text-6xl mb-6"
        >
          {icon}
        </motion.div>

        {/* Content */}
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-foreground/60 mb-6 flex-grow">{description}</p>

        {/* CTA */}
        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ x: 5 }}
          className="inline-flex items-center gap-2 text-primary font-semibold group-hover:text-primary-light transition-colors min-h-touch"
        >
          {cta}
          <motion.span
            animate={{ x: isHovered ? [0, 5, 0] : 0 }}
            transition={{ duration: 0.6, repeat: isHovered ? Infinity : 0 }}
          >
            →
          </motion.span>
        </motion.a>

        {/* Shine effect */}
        <motion.div
          animate={{ x: isHovered ? ['-100%', '100%'] : '-100%' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          style={{ transform: 'skewX(-20deg)' }}
        />
      </motion.div>
    </motion.div>
  );
}

export default function BentoCards() {
  const cards = [
    {
      icon: '📱',
      title: 'MOBILE APP',
      description: 'Install the PWA for on-the-go agent management',
      cta: 'Open App',
      href: 'https://base-app-steel.vercel.app',
    },
    {
      icon: '🖥️',
      title: 'WEB DASHBOARD',
      description: 'Full-featured management portal with analytics',
      cta: 'Launch Dashboard',
      href: 'https://web-paylobster.vercel.app',
    },
    {
      icon: '🔧',
      title: 'DEVELOPERS',
      description: 'SDKs, contracts, and comprehensive documentation',
      cta: 'View Docs',
      href: 'https://github.com/paylobster',
    },
    {
      icon: '🖼️',
      title: 'FARCASTER',
      description: 'Check your agent reputation score on Farcaster',
      cta: 'Open Frame',
      href: 'https://frame.paylobster.com',
    },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Access <span className="text-primary">Everything</span>
          </h2>
          <p className="text-foreground/60 text-lg max-w-2xl mx-auto">
            Choose your interface and start managing your agent finance operations
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {cards.map((card, index) => (
            <BentoCard key={card.title} {...card} delay={0.1 * index} />
          ))}
        </div>
      </div>
    </section>
  );
}
