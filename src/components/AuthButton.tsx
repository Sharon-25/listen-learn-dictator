import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { User, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthButton = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <Link to="/dashboard">
        <Button variant="outline">
          <User className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
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