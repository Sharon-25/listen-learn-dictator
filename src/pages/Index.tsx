import { useEffect } from 'react';
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import TargetAudienceSection from "@/components/TargetAudienceSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TextToSpeechDemo from "@/components/TextToSpeechDemo";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  useEffect(() => {
    // Add smooth scrolling for anchor links
    const handleAnchorClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetId = target.getAttribute('href')?.substring(1);
        const targetElement = document.getElementById(targetId || '');
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <div className="min-h-screen font-body">
      <HeroSection />
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="audience">
        <TargetAudienceSection />
      </div>
      <div id="how-it-works">
        <HowItWorksSection />
      </div>
      <div id="demo">
        <section className="py-20 bg-accent/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">See It in Action</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Try our interactive demo with real-time text highlighting and smooth audio sync
              </p>
            </div>
            <TextToSpeechDemo />
          </div>
        </section>
      </div>
      <div id="pricing">
        <CTASection />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
