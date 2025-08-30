import { PermoneyCard } from './permoney-card';
import { TrendingUp, Shield, Zap, Target } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export function HeroSection() {
  const { elementRef, isVisible } = useScrollAnimation();

  return (
    <section className="relative px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24 overflow-hidden geometric-bg theme-transition w-full">
      <div className="w-full">
        <div
          ref={elementRef}
          className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full"
        >
          <div
            className={`w-full mx-auto lg:mx-0 text-center lg:text-left ${isVisible ? 'slide-up' : ''}`}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4 sm:mb-6">
              An easy way to control <span className="text-gradient">your</span>{' '}
              <span className="text-gradient">finances</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-12 leading-relaxed">
              Indonesia's most advanced personal finance platform. Track
              expenses, manage budgets, and achieve your financial goals with
              AI-powered insights.
            </p>

            {/* Key Features Grid */}
            <div
              className={`grid grid-cols-2 gap-4 sm:gap-6 ${isVisible ? 'slide-up stagger-2' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-neon-green/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-neon-green" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    Smart Analytics
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    AI-powered insights
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-neon-green/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-neon-green" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    Bank-Level Security
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    256-bit encryption
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-neon-green/20 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-neon-green" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    Real-time Sync
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Instant updates
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-neon-green/20 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-neon-green" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    Goal Tracking
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Achieve targets
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div
              className={`mt-8 sm:mt-12 ${isVisible ? 'slide-up stagger-3' : ''}`}
            >
              <div className="flex items-center justify-center lg:justify-start space-x-6 text-muted-foreground">
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-neon-green">
                    10M+
                  </div>
                  <div className="text-xs sm:text-sm">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-neon-green">
                    $2B+
                  </div>
                  <div className="text-xs sm:text-sm">Managed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-neon-green">
                    99.9%
                  </div>
                  <div className="text-xs sm:text-sm">Uptime</div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative mt-8 lg:mt-0">
            <img
              src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=800"
              alt="Mobile financial app interface"
              className="mx-auto max-w-xs sm:max-w-sm rounded-3xl shadow-2xl hover-lift transition-all duration-500 hover:shadow-3xl"
            />

            <div className="hidden sm:block absolute top-10 -left-4 lg:-left-10">
              <PermoneyCard chunky className="p-3 sm:p-5 w-28 sm:w-36">
                <div className="text-xs font-semibold mb-1 sm:mb-2">
                  Net worth
                </div>
                <div className="text-lg sm:text-xl font-bold text-neon-green">
                  $45,180
                </div>
              </PermoneyCard>
            </div>

            <div className="hidden sm:block absolute bottom-20 -right-4 lg:-right-10">
              <PermoneyCard chunky className="p-3 sm:p-5 w-32 sm:w-40">
                <div className="text-xs font-semibold mb-2 sm:mb-3">
                  Monthly growth
                </div>
                <div className="flex items-center">
                  <div className="w-12 sm:w-18 h-2 sm:h-3 bg-neon-green mr-2 sm:mr-3 rounded-full"></div>
                  <span className="text-base sm:text-lg font-bold">+12%</span>
                </div>
              </PermoneyCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
