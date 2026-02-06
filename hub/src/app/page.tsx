import Header from '@/components/Header';
import MetricsBar from '@/components/MetricsBar';
import Globe from '@/components/Globe';
import BentoCards from '@/components/BentoCards';
import ActivityFeed from '@/components/ActivityFeed';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="container mx-auto relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-8">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
                Agent Finance
                <br />
                <span className="text-primary">Mission Control</span>
              </h1>
              <p className="text-xl sm:text-2xl text-foreground/70 mb-8 text-balance">
                Real-time blockchain activity. Secure payments. Trustless escrow.
                <br />
                All powered by Circle USDC on Base.
              </p>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <MetricsBar />

        {/* Globe Visualization */}
        <Globe />

        {/* Product Cards */}
        <BentoCards />

        {/* Activity Feed */}
        <ActivityFeed />
      </main>

      <Footer />
    </div>
  );
}
