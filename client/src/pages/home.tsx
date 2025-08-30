import { Navbar } from '@/components/navbar';
import { HeroSection } from '@/components/hero-section';
import { HowItWorks } from '@/components/how-it-works';
import { FeaturesSection } from '@/components/features-section';
import { SupportSection } from '@/components/support-section';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <SupportSection />
      <Footer />
    </div>
  );
}
