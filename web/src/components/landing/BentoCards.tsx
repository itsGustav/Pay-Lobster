'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

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
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
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
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/30 to-orange-600/5 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Card */}
      <motion.div
        style={{
          rotateX: isHovered ? mousePosition.y / 5 : 0,
          rotateY: isHovered ? mousePosition.x / 5 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative bg-black/50 border border-gray-800 rounded-3xl p-8 backdrop-blur-sm overflow-hidden h-full min-h-[280px] flex flex-col"
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
        <p className="text-gray-400 mb-6 flex-grow">{description}</p>

        {/* CTA */}
        <Link
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-2 text-orange-600 font-semibold group-hover:text-orange-500 transition-colors"
        >
          {cta}
          <motion.span
            animate={{ x: isHovered ? [0, 5, 0] : 0 }}
            transition={{ duration: 0.6, repeat: isHovered ? Infinity : 0 }}
          >
            →
          </motion.span>
        </Link>

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
      href: '/dashboard',
    },
    {
      icon: '🔧',
      title: 'DEVELOPERS',
      description: 'SDKs, contracts, and comprehensive documentation',
      cta: 'View Docs',
      href: '/docs',
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
      {cards.map((card, index) => (
        <BentoCard key={card.title} {...card} delay={0.1 * index} />
      ))}
    </div>
  );
}
