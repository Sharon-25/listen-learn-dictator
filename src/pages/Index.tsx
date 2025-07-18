import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import TargetAudienceSection from "@/components/TargetAudienceSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TextToSpeechDemo from "@/components/TextToSpeechDemo";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen font-body">
      <HeroSection />
      <FeaturesSection />
      <TargetAudienceSection />
      <HowItWorksSection />
      <section className="py-20 bg-accent/30">
        <div className="container mx-auto px-6">
          <TextToSpeechDemo />
        </div>
      </section>
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
