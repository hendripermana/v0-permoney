import { PermoneyCard } from './permoney-card';
import { DollarSign, BarChart, Shield } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export function HowItWorks() {
  const { elementRef, isVisible } = useScrollAnimation();

  const features = [
    {
      icon: DollarSign,
      title: 'Easy to track finances',
      description:
        'Connect your bank accounts and start tracking all your expenses automatically.',
    },
    {
      icon: BarChart,
      title: 'Control number of transactions',
      description:
        'Get detailed insights into your spending patterns with smart categorization.',
    },
    {
      icon: Shield,
      title: 'All transactions are secured',
      description:
        'Bank-level security ensures your financial data is always protected.',
    },
  ];

  return (
    <section
      id="how-it-works"
      className="px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24 theme-transition"
    >
      <div className="w-full">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
            How it works
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple functional and modern design can help anyone control your
            money.
          </p>
        </div>

        <div ref={elementRef} className="bento-grid">
          {features.map((feature, index) => (
            <PermoneyCard
              key={index}
              chunky
              className={`glassmorphism p-6 sm:p-8 lg:p-10 text-center ${isVisible ? `slide-up stagger-${index + 1}` : ''}`}
            >
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-foreground dark:bg-neon-green rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 hover-bounce transition-all duration-300 hover:shadow-lg">
                <feature.icon
                  className="text-background dark:text-foreground transition-transform duration-200"
                  size={24}
                />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-base sm:text-lg">
                {feature.description}
              </p>
            </PermoneyCard>
          ))}
        </div>
      </div>
    </section>
  );
}
