import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Volume2, 
  Play, 
  Highlighter, 
  PenTool, 
  BarChart3,
  Zap,
  Upload,
  Settings,
  Bookmark,
  Timer,
  Brain
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Smart TTS Engine",
    description: "Realistic AI voices with adjustable speed, pitch, and tone. Choose from multiple voice personalities.",
    color: "text-accent-mint"
  },
  {
    icon: Upload,
    title: "Multi-Format Upload",
    description: "PDF, Word, PowerPoint, Excel, and more. Drag and drop any document and we'll handle the rest.",
    color: "text-accent-yellow"
  },
  {
    icon: Play,
    title: "Advanced Playback Controls",
    description: "Play, pause, seek, rewind, and set custom playback speeds. Resume exactly where you left off.",
    color: "text-primary"
  },
  {
    icon: Highlighter,
    title: "Karaoke Mode",
    description: "Follow along as text highlights in real-time. Never lose track of where you are in the document.",
    color: "text-accent-mint"
  },
  {
    icon: PenTool,
    title: "Take Notes While Listening",
    description: "Built-in note-taking with timestamps. Your notes sync with the audio for easy reference.",
    color: "text-accent-yellow"
  },
  {
    icon: BarChart3,
    title: "Analytics & Progress Tracker",
    description: "Track your listening time, comprehension, and learning progress with detailed insights.",
    color: "text-primary"
  },
  {
    icon: Bookmark,
    title: "Smart Bookmarks",
    description: "Save important sections and create custom playlists of your favorite content.",
    color: "text-accent-mint"
  },
  {
    icon: Timer,
    title: "Focus Sessions",
    description: "Pomodoro-style listening sessions with breaks to maximize retention and prevent fatigue.",
    color: "text-accent-yellow"
  },
  {
    icon: Brain,
    title: "Learning Optimization",
    description: "AI-powered suggestions for optimal listening speeds based on content complexity.",
    color: "text-primary"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-in-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-primary to-accent-mint bg-clip-text text-transparent">
              Dictator
            </span>
            ?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            More than just text-to-speech. A complete audio learning ecosystem designed 
            for modern learners who want to absorb information efficiently.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className="group hover:shadow-card transition-all duration-300 hover:scale-[1.02] bg-gradient-card border-0 animate-slide-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="text-center pb-4">
                <div className={`inline-flex p-3 rounded-full bg-background/50 ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={32} />
                </div>
                <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Highlight */}
        <div className="bg-gradient-card rounded-3xl p-8 lg:p-12 shadow-card animate-slide-in-up">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold text-foreground mb-4">
                Built for Every Learning Style
              </h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Whether you're a visual learner who needs to see the text, an auditory learner 
                who absorbs through listening, or someone who learns best through interaction, 
                Dictator adapts to your unique learning preferences.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  Visual + Audio
                </span>
                <span className="px-4 py-2 bg-accent-mint/10 text-accent-mint rounded-full text-sm font-medium">
                  Interactive Notes
                </span>
                <span className="px-4 py-2 bg-accent-yellow/10 text-accent-yellow rounded-full text-sm font-medium">
                  Progress Tracking
                </span>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Volume2 className="text-accent-mint" size={24} />
                  <span className="font-medium">Currently Reading</span>
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  "The key to effective learning is finding the method that works best for your brain..."
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Play size={16} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Bookmark size={16} />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">2.1x speed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;