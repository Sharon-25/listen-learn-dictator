import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GraduationCap, 
  Clock, 
  Brain, 
  Eye, 
  Headphones,
  BookOpen,
  Users,
  Lightbulb
} from "lucide-react";

const audiences = [
  {
    icon: GraduationCap,
    title: "Students in Rush Mode",
    description: "Last-minute exam prep? Cramming for finals? Listen to textbooks while commuting or exercising.",
    quote: "I can now 'read' 3 chapters during my morning jog. Game changer for exam season!",
    author: "Sarah M., College Student",
    color: "bg-primary/10 text-primary",
    bgGradient: "bg-gradient-to-br from-primary/5 to-primary/10"
  },
  {
    icon: Brain,
    title: "ADHD & Neurodivergent Learners",
    description: "Audio learning can improve focus and reduce reading fatigue. Customizable speeds and breaks help maintain attention.",
    quote: "Finally found a way to get through academic papers without my mind wandering. The highlighting feature keeps me engaged.",
    author: "Marcus R., PhD Student",
    color: "bg-accent-mint/10 text-accent-mint",
    bgGradient: "bg-gradient-to-br from-accent-mint/5 to-accent-mint/10"
  },
  {
    icon: Eye,
    title: "Visual Fatigue Sufferers",
    description: "Give your eyes a break from screens. Perfect for those with dyslexia, eye strain, or reading disabilities.",
    quote: "My eyes used to hurt after reading for 30 minutes. Now I can 'read' for hours comfortably.",
    author: "Jennifer L., Researcher",
    color: "bg-accent-yellow/10 text-accent-yellow",
    bgGradient: "bg-gradient-to-br from-accent-yellow/5 to-accent-yellow/10"
  },
  {
    icon: Headphones,
    title: "Auditory Learners",
    description: "Some brains are wired to learn better through listening. Transform any text into your preferred learning format.",
    quote: "I retain information so much better when I hear it. Dictator turned my weakness into my strength.",
    author: "David K., Software Engineer",
    color: "bg-primary/10 text-primary",
    bgGradient: "bg-gradient-to-br from-primary/5 to-primary/10"
  },
  {
    icon: Clock,
    title: "Busy Professionals",
    description: "Multitask efficiently. Listen to reports while cooking, driving, or working out. Maximize your learning time.",
    quote: "I stay updated with industry reports during my commute. It's like having a personal assistant reading to me.",
    author: "Lisa Chen, Marketing Director",
    color: "bg-accent-mint/10 text-accent-mint",
    bgGradient: "bg-gradient-to-br from-accent-mint/5 to-accent-mint/10"
  },
  {
    icon: BookOpen,
    title: "Language Learners",
    description: "Improve pronunciation and listening skills. Hear proper pronunciation while following along with text.",
    quote: "Learning English pronunciation became so much easier when I could hear and see the words simultaneously.",
    author: "Carlos M., ESL Student",
    color: "bg-accent-yellow/10 text-accent-yellow",
    bgGradient: "bg-gradient-to-br from-accent-yellow/5 to-accent-yellow/10"
  }
];

const benefits = [
  {
    icon: Users,
    title: "Inclusive Learning",
    description: "Breaking down barriers for all learning styles and abilities"
  },
  {
    icon: Lightbulb,
    title: "Efficiency Boost",
    description: "Learn faster by engaging multiple senses simultaneously"
  },
  {
    icon: Brain,
    title: "Cognitive Relief",
    description: "Reduce mental fatigue while maintaining information retention"
  }
];

const TargetAudienceSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-in-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Who Benefits from{" "}
            <span className="bg-gradient-to-r from-primary to-accent-mint bg-clip-text text-transparent">
              Dictator
            </span>
            ?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From students cramming for exams to professionals staying updated, 
            Dictator transforms how people consume written content.
          </p>
        </div>

        {/* Audience Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {audiences.map((audience, index) => (
            <Card 
              key={audience.title}
              className={`group hover:shadow-card transition-all duration-300 hover:scale-[1.02] border-0 ${audience.bgGradient} animate-slide-in-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="text-center pb-4">
                <div className={`inline-flex p-3 rounded-full ${audience.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <audience.icon size={32} />
                </div>
                <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {audience.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {audience.description}
                </p>
                
                {/* Testimonial */}
                <div className="bg-white/50 rounded-lg p-4 border-l-4 border-primary/20">
                  <p className="text-sm italic text-foreground/80 mb-2">
                    "{audience.quote}"
                  </p>
                  <p className="text-xs font-medium text-primary">
                    — {audience.author}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Summary */}
        <div className="bg-gradient-card rounded-3xl p-8 lg:p-12 shadow-card animate-slide-in-up">
          <h3 className="text-3xl font-bold text-center text-foreground mb-8">
            The Science Behind Audio Learning
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {benefits.map((benefit, index) => (
              <div 
                key={benefit.title}
                className="text-center group animate-slide-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon size={28} />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  {benefit.title}
                </h4>
                <p className="text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Research shows that combining visual and auditory learning can improve retention by up to 
              <span className="font-bold text-primary"> 65%</span>. 
              Dictator leverages this dual-coding theory to help you learn more effectively, 
              regardless of your primary learning style or cognitive differences.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TargetAudienceSection;