import { PermoneyCard } from './permoney-card';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export function FeaturesSection() {
  const { elementRef, isVisible } = useScrollAnimation();

  return (
    <section
      id="features"
      className="px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24 bg-muted dark:bg-muted/50 theme-transition"
    >
      <div className="w-full">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
            Features
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            These things that we are proud and that help to enjoy the day.
          </p>
        </div>

        <div ref={elementRef} className="bento-grid">
          <PermoneyCard
            chunky
            className={`glassmorphism p-6 sm:p-8 lg:p-10 ${isVisible ? 'slide-up stagger-1' : ''}`}
          >
            <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
              Easy control
            </h3>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-base sm:text-lg">
              Track your daily spending with seamless bank account integration
              and smart categorization for effortless money management.
            </p>
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
              alt="Financial dashboard interface showing expense tracking"
              className="w-full rounded-xl sm:rounded-2xl hover-scale transition-all duration-300"
            />
          </PermoneyCard>

          <PermoneyCard
            variant="green"
            className={`glassmorphism p-6 sm:p-8 lg:p-10 ${isVisible ? 'slide-up stagger-2' : ''}`}
          >
            <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-black">
              Real-time accounting
            </h3>
            <p className="text-black mb-6 sm:mb-8 text-base sm:text-lg">
              Our app automatically registers and classifies every transaction,
              giving you up-to-date financial insights.
            </p>
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
              alt="Real-time financial analytics dashboard"
              className="w-full rounded-xl sm:rounded-2xl hover-scale transition-all duration-300"
            />
          </PermoneyCard>
        </div>
      </div>
    </section>
  );
}
