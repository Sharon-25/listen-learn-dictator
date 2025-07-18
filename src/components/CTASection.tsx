import { Button } from "@/components/ui/button";
import { Upload, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
const CTASection = () => {
  return <section className="py-20 bg-gradient-hero relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-24 h-24 bg-accent-mint/20 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-1/4 w-32 h-32 bg-accent-yellow/20 rounded-full animate-float delay-1000"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-white/10 rounded-full animate-float delay-2000"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto animate-slide-in-up">
          {/* Header */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-8">
            <Sparkles className="text-accent-mint" size={20} />
            <span className="text-white font-medium">Join 50,000+ Happy Learners</span>
          </div>

          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Start Listening{" "}
            <span className="bg-gradient-to-r from-accent-mint to-accent-yellow bg-clip-text text-transparent">
              Smarter
            </span>{" "}
            Today
          </h2>

          <p className="text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed">
            Transform your reading experience in seconds. No credit card required.
          </p>

          <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto">
            Upload your first document and discover why thousands of students, professionals, 
            and lifelong learners choose Dictator for their audio learning needs.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/auth">
              <Button size="xl" variant="cta" className="group text-lg">
                <Upload className="mr-2 group-hover:scale-110 transition-transform" />
                Sign Up Free - No Credit Card
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white/80">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-mint mb-2">100%</div>
              <div className="text-sm">Free to Start</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-yellow mb-2">50K+</div>
              <div className="text-sm">Happy Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">15+</div>
              <div className="text-sm">File Formats</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-mint mb-2">24/7</div>
              <div className="text-sm">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave transition */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full h-20 fill-background">
          <path d="M0,64L48,69.3C96,75,192,85,288,90.7C384,96,480,96,576,90.7C672,85,768,75,864,69.3C960,64,1056,64,1152,69.3C1248,75,1344,85,1392,90.7L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
        </svg>
      </div>
    </section>;
};
export default CTASection;