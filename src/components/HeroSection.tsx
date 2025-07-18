import { Button } from "@/components/ui/button";
import { FileAudio, Play, Upload } from "lucide-react";
import heroImage from "@/assets/hero-illustration.jpg";
const HeroSection = () => {
  return <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-accent-mint/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-accent-yellow/20 rounded-full animate-float delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-white/10 rounded-full animate-float delay-2000"></div>
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left animate-slide-in-up">
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Let{" "}
              <span className="bg-gradient-to-r from-accent-mint to-accent-yellow bg-clip-text text-transparent">
                Dictator
              </span>{" "}
              Do the Reading
            </h1>
            
            <p className="text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed font-light">
              Upload. Listen. Learn.
            </p>
            
            <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto lg:mx-0">
              Transform any document into spoken audio with smart Text-to-Speech. 
              Perfect for students, auditory learners, and anyone who finds reading mentally tiring.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="xl" variant="cta" className="group">
                <Upload className="mr-2 group-hover:scale-110 transition-transform" />
                Upload Your First File
              </Button>
              
              
            </div>

            {/* Quick stats */}
            <div className="flex justify-center lg:justify-start gap-8 mt-12 text-white/80">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-mint">50K+</div>
                <div className="text-sm">Documents Read</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-yellow">15+</div>
                <div className="text-sm">File Formats</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-sm">Free to Start</div>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative animate-slide-in-up delay-300">
            <div className="relative rounded-2xl overflow-hidden shadow-float">
              <img src={heroImage} alt="Documents transforming into audio waves" className="w-full h-auto" />
              
              {/* Floating audio visualization */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md rounded-lg p-4 mx-[100px]">
                <div className="flex items-center gap-3 mb-3">
                  <FileAudio className="text-accent-mint" size={20} />
                  <span className="text-white font-medium">presentation.pdf</span>
                  <span className="text-white/60 text-sm ml-auto">3:42 / 12:30</span>
                </div>
                
                {/* Audio waveform visualization */}
                <div className="flex items-center gap-1 h-8">
                  {Array.from({
                  length: 40
                }).map((_, i) => <div key={i} className={`bg-accent-mint rounded-full w-1 animate-wave ${i % 4 === 0 ? 'animate-wave-delay-1' : i % 4 === 1 ? 'animate-wave-delay-2' : i % 4 === 2 ? 'animate-wave-delay-3' : ''}`} style={{
                  height: `${Math.random() * 20 + 10}px`,
                  animationDelay: `${i * 0.1}s`
                }}></div>)}
                </div>
              </div>
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
export default HeroSection;