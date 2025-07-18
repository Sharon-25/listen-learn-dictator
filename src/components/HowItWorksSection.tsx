import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Zap, Headphones, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Document",
    description: "Drag and drop any file - PDF, Word, PowerPoint, Excel, or even images with text. Our smart system handles the rest.",
    details: [
      "15+ supported file formats",
      "OCR for scanned documents",
      "Batch upload multiple files",
      "Cloud storage integration"
    ],
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: Zap,
    title: "AI Converts to Audio",
    description: "Our advanced Text-to-Speech engine analyzes your content and converts it to natural-sounding audio in seconds.",
    details: [
      "Natural AI voices",
      "Smart punctuation handling",
      "Content structure recognition",
      "Multiple language support"
    ],
    color: "text-accent-mint",
    bgColor: "bg-accent-mint/10"
  },
  {
    icon: Headphones,
    title: "Listen & Learn",
    description: "Enjoy your content with advanced playback controls, real-time highlighting, and note-taking features.",
    details: [
      "Karaoke-style highlighting",
      "Speed control (0.5x - 3x)",
      "Timestamp bookmarks",
      "Integrated note-taking"
    ],
    color: "text-accent-yellow",
    bgColor: "bg-accent-yellow/10"
  }
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-in-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            How{" "}
            <span className="bg-gradient-to-r from-primary to-accent-mint bg-clip-text text-transparent">
              Dictator
            </span>{" "}
            Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transform any document into an engaging audio experience in just three simple steps. 
            No technical knowledge required.
          </p>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={step.title} className="relative animate-slide-in-up" style={{ animationDelay: `${index * 0.2}s` }}>
              <Card className="h-full group hover:shadow-card transition-all duration-300 hover:scale-[1.02] bg-gradient-card border-0">
                <CardContent className="p-8">
                  {/* Step number and icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`inline-flex p-4 rounded-full ${step.bgColor} ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon size={32} />
                    </div>
                    <div className="text-3xl font-bold text-muted-foreground/30">
                      0{index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Feature list */}
                  <ul className="space-y-2">
                    {step.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle size={16} className={step.color} />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Arrow connector (hidden on mobile and last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 z-10 transform -translate-y-1/2">
                  <div className="bg-accent-mint text-white p-2 rounded-full shadow-lg animate-pulse-glow">
                    <ArrowRight size={20} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Demo Preview */}
        <div className="bg-gradient-card rounded-3xl p-8 lg:p-12 shadow-card animate-slide-in-up">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              See It in Action
            </h3>
            <p className="text-lg text-muted-foreground">
              Experience the magic of Dictator with a live demonstration
            </p>
          </div>

          {/* Demo Interface Mockup */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
              {/* Header */}
              <div className="bg-primary text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                  <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                  <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                </div>
                <span className="font-medium">marketing-strategy.pdf</span>
                <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  3:42 / 15:30
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 bg-gray-50">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Text Panel */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-foreground mb-3">Document Text</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>Digital marketing strategies have evolved significantly...</p>
                      <p className="bg-accent-mint/20 text-accent-mint p-2 rounded">
                        <strong>Currently reading:</strong> The key to success lies in understanding your target audience and creating personalized experiences...
                      </p>
                      <p>Modern consumers expect brands to deliver...</p>
                    </div>
                  </div>

                  {/* Audio Panel */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-foreground mb-3">Audio Controls</h4>
                    
                    {/* Waveform */}
                    <div className="flex items-center gap-1 h-12 mb-4">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className={`bg-primary rounded-full w-1 ${
                            i < 12 ? 'opacity-30' : i < 15 ? 'bg-accent-mint animate-wave' : 'opacity-30'
                          }`}
                          style={{
                            height: `${Math.random() * 30 + 10}px`,
                          }}
                        ></div>
                      ))}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">⏮</Button>
                        <Button size="sm" variant="default">⏸</Button>
                        <Button size="sm" variant="outline">⏭</Button>
                      </div>
                      <span className="text-sm text-muted-foreground">1.5x speed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <Link to="/auth">
              <Button size="lg" variant="hero">
                <Upload className="mr-2" />
                Try It Yourself - Upload Now
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-2">
              Sign up to upload your first document
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;