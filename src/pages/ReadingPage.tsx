import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Square, 
  ArrowLeft, 
  Settings,
  BookOpen,
  Clock,
  Timer,
  Brain,
  StickyNote
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Document {
  id: string;
  filename: string;
  content: string;
}

interface ListeningSession {
  id: string;
  last_position: number;
  total_time: number;
}

interface Note {
  id: string;
  note: string;
  timestamp: number;
  created_at: string;
}

interface Settings {
  speed: number;
  voice_type: string;
  pomodoro_enabled: boolean;
}

const ReadingPage = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [document, setDocument] = useState<Document | null>(null);
  const [session, setSession] = useState<ListeningSession | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useState<Settings>({
    speed: 1.0,
    voice_type: 'default',
    pomodoro_enabled: false
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [visibleLineStart, setVisibleLineStart] = useState(0);
  const [progress, setProgress] = useState(0);
  const [newNote, setNewNote] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes in seconds

  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsRef = useRef<string[]>([]);
  const linesRef = useRef<string[]>([]);

  const LINES_PER_VIEW = 10;

  useEffect(() => {
    if (fileId && user) {
      fetchDocument();
      fetchSession();
      fetchNotes();
      fetchSettings();
    }
  }, [fileId, user]);

  useEffect(() => {
    // Pomodoro timer effect
    let interval: NodeJS.Timeout;
    if (settings.pomodoro_enabled && isPlaying && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            handlePause();
            toast({
              title: "Pomodoro Break!",
              description: "Time for a 5-minute break. Great job!",
            });
            return 25 * 60; // Reset to 25 minutes
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [settings.pomodoro_enabled, isPlaying, pomodoroTime]);

  const fetchDocument = async () => {
    try {
      // First get the file metadata from user_files
      const { data: fileData, error: fileError } = await supabase
        .from('user_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError) throw fileError;
      
      if (fileData) {
        // Check if we have processed content in documents table
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user!.id)
          .eq('filename', fileData.file_name)
          .maybeSingle();

        let content = "";
        
        if (docData && docData.content) {
          // Use processed content if available
          content = docData.content;
        } else {
          // Use placeholder content for now (in a real app, you'd extract text from the file)
          content = `This is the content of ${fileData.file_name}. 

This is a demonstration of the text-to-speech functionality. The system will highlight each word as it speaks, showing you exactly where you are in the document.

You can pause and resume at any time, and the system will remember where you left off. The interface shows only 10 lines at a time to help you focus and reduce visual overwhelm.

This content would normally be extracted from your uploaded PDF, DOCX, PPTX, or other document formats. The text-to-speech engine will read through this content at your preferred speed.

You can take notes at any timestamp, adjust the reading speed, and even enable Pomodoro mode for focused study sessions. The AI will suggest optimal reading speeds based on content complexity.

Each word is precisely synchronized with the audio, creating a seamless reading experience that helps with comprehension and retention.`;
        }

        setDocument({
          id: fileData.id,
          filename: fileData.file_name,
          content: content
        });

        const words = content.split(/\s+/);
        const lines = content.split('\n').filter(line => line.trim());
        
        wordsRef.current = words;
        linesRef.current = lines;
      }
    } catch (error) {
      console.error('Error loading document:', error);
      toast({
        title: "Error", 
        description: "Could not load document. Please try again.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  };

  const fetchSession = async () => {
    try {
      const { data, error } = await supabase
        .from('listening_sessions')
        .select('*')
        .eq('document_id', fileId)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSession(data);
        setCurrentWordIndex(data.last_position || 0);
        setProgress((data.last_position / wordsRef.current.length) * 100);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('document_id', fileId)
        .eq('user_id', user!.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings(data);
      } else {
        // Create default settings
        const { error: insertError } = await supabase
          .from('settings')
          .insert({ user_id: user!.id });
        
        if (insertError) console.error('Error creating settings:', insertError);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSession = async (position: number) => {
    if (!user || !fileId) return;

    try {
      const sessionData = {
        user_id: user.id,
        document_id: fileId,
        last_position: position,
        total_time: (session?.total_time || 0) + 1
      };

      if (session) {
        await supabase
          .from('listening_sessions')
          .update(sessionData)
          .eq('id', session.id);
      } else {
        const { data, error } = await supabase
          .from('listening_sessions')
          .insert(sessionData)
          .select()
          .single();
        
        if (error) throw error;
        setSession(data);
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const handlePlay = () => {
    if (!document) return;

    const content = document.content || wordsRef.current.join(' ');
    const words = wordsRef.current;

    if (isPaused && speechRef.current) {
      speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = settings.speed;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    let wordIndex = currentWordIndex;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        wordIndex++;
        setCurrentWordIndex(wordIndex);
        setProgress((wordIndex / words.length) * 100);
        updateSession(wordIndex);
        
        // Update visible lines
        const wordsPerLine = Math.ceil(words.length / linesRef.current.length);
        const currentLine = Math.floor(wordIndex / wordsPerLine);
        
        if (currentLine >= visibleLineStart + LINES_PER_VIEW) {
          setVisibleLineStart(currentLine - LINES_PER_VIEW + 1);
        }
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      if (wordIndex >= words.length - 1) {
        setCurrentWordIndex(0);
        setProgress(0);
        updateSession(0);
      }
    };

    speechRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (isPlaying) {
      speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    updateSession(currentWordIndex);
  };

  const addNote = async () => {
    if (!newNote.trim() || !user || !fileId) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          document_id: fileId,
          note: newNote,
          timestamp: currentWordIndex
        })
        .select()
        .single();

      if (error) throw error;
      
      setNotes([...notes, data]);
      setNewNote('');
      toast({
        title: "Note added",
        description: "Your note has been saved at the current position.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!user) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      await supabase
        .from('settings')
        .upsert({
          user_id: user.id,
          ...updatedSettings
        });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const getAISuggestion = () => {
    const wordCount = wordsRef.current.length;
    const complexity = wordCount > 1000 ? "high" : wordCount > 500 ? "medium" : "low";
    
    const suggestions = {
      high: "For complex content, try 0.8x speed for better comprehension",
      medium: "Optimal speed: 1.0x for balanced learning",
      low: "You can increase to 1.2x speed for simple content"
    };
    
    return suggestions[complexity];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderVisibleContent = () => {
    if (!document) return null;

    const content = document.content || wordsRef.current.join(' ');
    const words = content.split(/\s+/);
    const lines = content.split('\n').filter(line => line.trim());
    
    const visibleLines = lines.slice(visibleLineStart, visibleLineStart + LINES_PER_VIEW);
    
    return (
      <div className="space-y-4">
        {visibleLines.map((line, lineIndex) => {
          const lineWords = line.split(/\s+/);
          const globalLineStart = visibleLineStart + lineIndex;
          const wordsPerLine = Math.ceil(words.length / lines.length);
          const lineWordStart = globalLineStart * wordsPerLine;
          
          return (
            <p key={lineIndex} className="text-lg leading-relaxed">
              {lineWords.map((word, wordIndex) => {
                const globalWordIndex = lineWordStart + wordIndex;
                const isCurrentWord = globalWordIndex === currentWordIndex;
                const isPastWord = globalWordIndex < currentWordIndex;
                
                return (
                  <span
                    key={wordIndex}
                    className={`transition-all duration-200 ${
                      isCurrentWord
                        ? 'bg-accent-mint text-accent-mint-foreground px-1 rounded shadow-sm'
                        : isPastWord
                        ? 'text-muted-foreground'
                        : ''
                    }`}
                  >
                    {word}{' '}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };

  if (!document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{document.filename}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {wordsRef.current.length} words
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.ceil(wordsRef.current.length / 200)} min read
                </div>
                {settings.pomodoro_enabled && (
                  <div className="flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    {formatTime(pomodoroTime)}
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Reading View
                  </CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Brain className="h-4 w-4" />
                    {getAISuggestion()}
                  </div>
                </div>
                <Progress value={progress} className="w-full" />
              </CardHeader>
              <CardContent>
                <div className="bg-accent/30 rounded-lg p-6 min-h-[400px]">
                  {renderVisibleContent()}
                </div>
                
                {/* Controls */}
                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    variant="cta"
                    size="lg"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    {isPaused ? 'Resume' : 'Play'}
                  </Button>
                  
                  <Button
                    onClick={handlePause}
                    disabled={!isPlaying}
                    variant="outline"
                    size="lg"
                  >
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </Button>
                  
                  <Button
                    onClick={handleStop}
                    disabled={!isPlaying && !isPaused}
                    variant="outline"
                    size="lg"
                  >
                    <Square className="mr-2 h-5 w-5" />
                    Stop
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Settings Panel */}
            {showSettings && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Audio Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="speed">Reading Speed: {settings.speed}x</Label>
                    <Slider
                      id="speed"
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      value={[settings.speed]}
                      onValueChange={(value) => updateSettings({ speed: value[0] })}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="voice">Voice Type</Label>
                    <Select value={settings.voice_type} onValueChange={(value) => updateSettings({ voice_type: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Voice</SelectItem>
                        <SelectItem value="male">Male Voice</SelectItem>
                        <SelectItem value="female">Female Voice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="pomodoro"
                      checked={settings.pomodoro_enabled}
                      onCheckedChange={(checked) => updateSettings({ pomodoro_enabled: checked })}
                    />
                    <Label htmlFor="pomodoro">Enable Pomodoro Mode (25 min sessions)</Label>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Add a note at current position..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button 
                    onClick={addNote} 
                    className="w-full mt-2"
                    disabled={!newNote.trim()}
                  >
                    Add Note
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 bg-accent/50 rounded-lg">
                      <p className="text-sm">{note.note}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Position: {note.timestamp} words
                      </p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No notes yet. Add your first note!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Words read:</span>
                    <span>{currentWordIndex} / {wordsRef.current.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion:</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total time:</span>
                    <span>{Math.round((session?.total_time || 0) / 60)} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingPage;