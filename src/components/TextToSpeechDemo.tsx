import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Square, Volume2 } from 'lucide-react';

const TextToSpeechDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const demoText = "Welcome to Dictator, the revolutionary text-to-speech platform that transforms your documents into engaging audio experiences. Perfect for students, professionals, and anyone who wants to absorb information more efficiently through listening.";
  
  const words = demoText.split(' ');

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (speechSynthesisRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const highlightWords = () => {
    if (currentWordIndex >= 0 && currentWordIndex < words.length) {
      timeoutRef.current = setTimeout(() => {
        setCurrentWordIndex(prev => prev + 1);
        if (currentWordIndex + 1 < words.length) {
          highlightWords();
        } else {
          // End of text
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentWordIndex(-1);
        }
      }, 500); // Adjust timing as needed
    }
  };

  const handlePlay = () => {
    if (isPaused && speechSynthesisRef.current) {
      // Resume from pause
      speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      highlightWords();
    } else {
      // Start from beginning
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(demoText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setCurrentWordIndex(0);
        highlightWords();
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      speechSynthesisRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const handlePause = () => {
    if (isPlaying) {
      speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Volume2 className="h-6 w-6 text-primary" />
          <CardTitle>Interactive Demo</CardTitle>
        </div>
        <CardDescription>
          Experience our text-to-speech technology with real-time word highlighting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Demo Text with Highlighting */}
        <div className="p-6 bg-accent/50 rounded-lg">
          <p className="text-lg leading-relaxed">
            {words.map((word, index) => (
              <span
                key={index}
                className={`${
                  index === currentWordIndex
                    ? 'bg-accent-mint text-accent-mint-foreground px-1 rounded'
                    : index < currentWordIndex && isPlaying
                    ? 'text-muted-foreground'
                    : ''
                }`}
              >
                {word}{' '}
              </span>
            ))}
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handlePlay}
            disabled={isPlaying}
            variant="cta"
            size="lg"
            className="min-w-[120px]"
          >
            <Play className="mr-2 h-5 w-5" />
            {isPaused ? 'Resume' : 'Play'}
          </Button>
          
          <Button
            onClick={handlePause}
            disabled={!isPlaying}
            variant="outline"
            size="lg"
            className="min-w-[120px]"
          >
            <Pause className="mr-2 h-5 w-5" />
            Pause
          </Button>
          
          <Button
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
            variant="outline"
            size="lg"
            className="min-w-[120px]"
          >
            <Square className="mr-2 h-5 w-5" />
            Stop
          </Button>
        </div>

        {/* Status Indicator */}
        <div className="text-center text-sm text-muted-foreground">
          {isPlaying && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-accent-mint rounded-full animate-pulse"></div>
              Playing... ({currentWordIndex + 1} of {words.length} words)
              <span className="ml-4 font-mono">
                {Math.floor((currentWordIndex + 1) / 3)}:{String(((currentWordIndex + 1) % 3) * 20).padStart(2, '0')} / 
                {Math.floor(words.length / 3)}:{String((words.length % 3) * 20).padStart(2, '0')}
              </span>
            </div>
          )}
          {isPaused && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-accent-yellow rounded-full"></div>
              Paused at word {currentWordIndex + 1}
              <span className="ml-4 font-mono">
                {Math.floor((currentWordIndex + 1) / 3)}:{String(((currentWordIndex + 1) % 3) * 20).padStart(2, '0')} / 
                {Math.floor(words.length / 3)}:{String((words.length % 3) * 20).padStart(2, '0')}
              </span>
            </div>
          )}
          {!isPlaying && !isPaused && (
            <div className="text-muted-foreground">
              Click Play to start the demo • Duration: ~{Math.floor(words.length / 3)}:{String((words.length % 3) * 20).padStart(2, '0')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TextToSpeechDemo;