import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, LogIn, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthButton = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/dashboard">
          <Button variant="outline">
            <User className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Button variant="ghost" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Link to="/auth">
      <Button variant="cta">
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Button>
    </Link>
  );
};

export default AuthButton;