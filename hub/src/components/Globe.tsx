'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Dynamic import for react-globe.gl (client-side only)
export default function Globe() {
  const globeEl = useRef<any>(null);
  const [GlobeComponent, setGlobeComponent] = useState<any>(null);

  useEffect(() => {
    // Import react-globe.gl dynamically (only on client)
    import('react-globe.gl').then((module) => {
      setGlobeComponent(() => module.default);
    });
  }, []);

  useEffect(() => {
    if (!globeEl.current) return;

    // Auto-rotate
    const globe = globeEl.current;
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;

    // Set initial view
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 0);
  }, [GlobeComponent]);

  // Generate random arc data for demo
  const [arcsData, setArcsData] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Add new arc every 2-5 seconds
      const newArc = {
        startLat: (Math.random() - 0.5) * 180,
        startLng: (Math.random() - 0.5) * 360,
        endLat: (Math.random() - 0.5) * 180,
        endLng: (Math.random() - 0.5) * 360,
        color: ['#ea580c', '#fb923c'][Math.floor(Math.random() * 2)],
      };
      
      setArcsData((prev) => [...prev, newArc].slice(-10)); // Keep last 10 arcs
    }, Math.random() * 3000 + 2000);

    return () => clearInterval(interval);
  }, []);

  if (!GlobeComponent) {
    return (
      <div className="globe-container flex items-center justify-center">
        <div className="text-foreground/60">Loading visualization...</div>
      </div>
    );
  }

  return (
    <section className="relative py-12 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent rounded-3xl blur-3xl" />
          
          <div className="relative bg-background/50 backdrop-blur-sm border border-primary/10 rounded-3xl overflow-hidden">
            <div className="globe-container">
              <GlobeComponent
                ref={globeEl}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                backgroundColor="rgba(0,0,0,0)"
                arcsData={arcsData}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={2000}
                arcStroke={0.5}
                atmosphereColor="#ea580c"
                atmosphereAltitude={0.15}
                animateIn={true}
              />
            </div>
            
            {/* Overlay info */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-sm">
              <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/20">
                <span className="text-foreground/60">Live Transactions</span>
              </div>
              <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/20">
                <span className="text-primary font-semibold">Base Network</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
