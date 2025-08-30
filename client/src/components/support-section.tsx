import { Button } from '@/components/ui/button';
import {
  Zap,
  TrendingUp,
  Shield,
  Smartphone,
  Globe,
  Users,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function SupportSection() {
  const [currentStat, setCurrentStat] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const stats = [
    { value: '10M+', label: 'Users Worldwide', icon: Users },
    { value: '$100M', label: 'ARR Target', icon: TrendingUp },
    { value: '24/7', label: 'AI Support', icon: Zap },
    { value: '99.9%', label: 'Uptime', icon: Shield },
  ];

  const features = [
    {
      icon: Smartphone,
      title: 'Mobile-First Experience',
      description:
        'Seamless financial management on any device, anywhere in Southeast Asia.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      description:
        'Advanced encryption and AI-powered fraud detection protect your wealth.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: TrendingUp,
      title: 'AI-Powered Insights',
      description:
        'Smart analytics and predictions to optimize your financial future.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Globe,
      title: 'Regional Integration',
      description:
        'Connected to major Indonesian banks: BCA, Mandiri, BNI, BRI.',
      color: 'from-orange-500 to-red-500',
    },
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentStat(prev => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="support"
      className="px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24 theme-transition relative overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-neon-green rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-500 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      <div className="w-full relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2
            className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-neon-green to-white bg-clip-text text-transparent transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            The Future of Finance
          </h2>
          <p
            className={`text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            Permoney is revolutionizing personal finance across Southeast Asia
            with AI-powered insights and seamless banking integration.
          </p>
        </div>

        {/* Animated Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const isActive = currentStat === index;
            return (
              <div
                key={index}
                className={`text-center p-6 rounded-2xl glassmorphism transition-all duration-500 transform ${
                  isActive
                    ? 'scale-110 bg-neon-green/20 shadow-2xl'
                    : 'hover:scale-105'
                }`}
              >
                <Icon
                  className={`w-8 h-8 mx-auto mb-3 transition-all duration-500 ${
                    isActive
                      ? 'text-neon-green scale-125'
                      : 'text-muted-foreground'
                  }`}
                />
                <div
                  className={`text-2xl sm:text-3xl font-bold mb-1 transition-all duration-500 ${
                    isActive ? 'text-neon-green' : 'text-foreground'
                  }`}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`group p-8 rounded-3xl glassmorphism hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2 slide-up`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3 group-hover:text-neon-green transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="mt-6 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${feature.color} transform transition-transform duration-1000 group-hover:translate-x-0 -translate-x-full`}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-4">
            <Button className="bg-neon-green text-black hover:bg-neon-green/90 px-8 py-4 font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-neon-green/25">
              Join the Revolution
            </Button>
            <Button
              variant="outline"
              className="border-neon-green text-neon-green hover:bg-neon-green hover:text-black px-8 py-4 font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105"
            >
              Learn More
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Join 10M+ users building wealth with Indonesia's most advanced
            fintech platform
          </p>
        </div>
      </div>
    </section>
  );
}
