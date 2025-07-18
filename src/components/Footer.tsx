import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Github, Twitter, Linkedin, Mail, FileAudio } from "lucide-react";
const Footer = () => {
  return <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary rounded-lg">
                <FileAudio className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold">Dictator</span>
            </div>
            <p className="text-background/80 leading-relaxed mb-6 max-w-md">
              Transform any document into engaging audio content with our smart Text-to-Speech technology. 
              Perfect for students, professionals, and lifelong learners.
            </p>
            <div className="flex gap-4">
              
              <Button variant="ghost" size="sm" className="text-background/80 hover:text-background hover:bg-background/10">
                <Linkedin size={20} />
              </Button>
              <Button variant="ghost" size="sm" className="text-background/80 hover:text-background hover:bg-background/10">
                <Github size={20} />
              </Button>
              <Button variant="ghost" size="sm" className="text-background/80 hover:text-background hover:bg-background/10">
                <Mail size={20} />
              </Button>
            </div>
          </div>

          {/* Product Links */}
          <div className="text-right mr-8">
            <h4 className="font-semibold text-background mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-background/80 hover:text-background transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-background/80 hover:text-background transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#demo" className="text-background/80 hover:text-background transition-colors">
                  Demo
                </a>
              </li>
              <li>
                <a href="#api" className="text-background/80 hover:text-background transition-colors">
                  API
                </a>
              </li>
              <li>
                <a href="#integrations" className="text-background/80 hover:text-background transition-colors">
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-background mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                
              </li>
              
              <li>
                
              </li>
              <li>
                <a href="#contact" className="text-background/80 hover:text-background transition-colors">
                  Contact
                </a>
              </li>
              <li>
                
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-background/20 mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-6 text-sm text-background/80">
            <a href="#privacy" className="hover:text-background transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-background transition-colors">
              Terms of Service
            </a>
            <a href="#cookies" className="hover:text-background transition-colors">
              Cookie Policy
            </a>
            <a href="#security" className="hover:text-background transition-colors">
              Security
            </a>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-background/80">
            <span>© 2024 Dictator. All rights reserved.</span>
            <span>•</span>
            
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;