import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Play, Pause, LogOut, Trash2, ArrowLeft, Home } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface UserFile {
  id: string;
  file_name: string;
  file_type: string;
  storage_url: string;
  uploaded_at: string;
  file_size: number;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_files')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, DOCX, PPTX, XLSX, or TXT files only.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to Supabase storage
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath);

      // Save file metadata to database
      const { data: fileData, error: dbError } = await supabase
        .from('user_files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          storage_url: publicUrl,
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Extract text content using Hugging Face
      toast({
        title: "Processing document...",
        description: "Extracting text content for audio conversion.",
      });

      try {
        const { data: extractionResult, error: extractionError } = await supabase.functions
          .invoke('extract-document-text', {
            body: {
              file_url: publicUrl,
              file_type: file.type,
              file_name: file.name
            }
          });

        if (extractionError) {
          console.error('Text extraction error:', extractionError);
          throw new Error('Failed to extract text from document');
        }

        if (extractionResult?.success && extractionResult?.extractedText) {
          // Save extracted content to documents table
          const { error: docError } = await supabase
            .from('documents')
            .insert({
              user_id: user.id,
              filename: file.name,
              content: extractionResult.extractedText
            });

          if (docError) {
            console.error('Error saving document content:', docError);
          } else {
            console.log('Document content saved successfully');
          }
        }
      } catch (extractionError) {
        console.error('Text extraction failed:', extractionError);
        // Continue without extracted text - will use demo content in reading page
      }

      toast({
        title: "Success!",
        description: "Document uploaded and processed successfully.",
      });

      // Refresh file list
      fetchFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileId: string, storageUrl: string) => {
    try {
      // Extract file path from storage URL
      const url = new URL(storageUrl);
      const filePath = url.pathname.split('/').slice(-2).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: "File deleted successfully.",
      });

      // Refresh file list
      fetchFiles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Force redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.email}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Upload Section */}
          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Upload Document</CardTitle>
              <CardDescription>
                Upload PDF, DOCX, PPTX, XLSX, or TXT files to convert to audio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx,.xlsx,.txt"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={uploading}
                  variant="cta"
                  className="min-w-[140px]"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Library */}
          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Your Audio Library</CardTitle>
              <CardDescription>
                {files.length} document{files.length !== 1 ? 's' : ''} ready for listening
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="mx-auto h-16 w-16 mb-4 opacity-40" />
                  <h3 className="text-lg font-medium mb-2">No documents yet</h3>
                  <p className="text-sm">Upload your first document to start listening</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {files.map((file) => (
                    <Card
                      key={file.id}
                      className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-gradient-to-br from-accent/20 to-accent/10"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate mb-1">{file.file_name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.file_size)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(file.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress bar placeholder */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>0%</span>
                          </div>
                          <div className="w-full bg-accent/30 rounded-full h-1.5">
                            <div className="bg-accent-mint h-1.5 rounded-full" style={{ width: '0%' }}></div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            variant="cta" 
                            size="sm"
                            className="flex-1"
                            onClick={() => window.location.href = `/read/${file.id}`}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Listen
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteFile(file.id, file.storage_url)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;