import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Unauthorized = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect based on role if already authenticated
    if (user) {
      const role = user.role;
      if (role === 'admin') navigate('/admin', { replace: true });
      else if (role === 'farmer') navigate('/farmer', { replace: true });
      else if (role === 'distributor') navigate('/distributor', { replace: true });
      else if (role === 'consumer') navigate('/consumer', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // If not authenticated, suggest sign in and keep a fallback UI
  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-bold mb-2">Unauthorized</h1>
        <p className="text-muted-foreground mb-6">You do not have permission to access this page.</p>
        <div className="flex gap-4">
          <Link to="/" className="underline">Go Home</Link>
          <Link to="/login" state={{ from: location.state?.from || '/' }} className="underline">Sign In</Link>
        </div>
      </div>
    );
  }

  // Brief fallback while redirecting for authenticated users
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
      Redirecting...
    </div>
  );
};

export default Unauthorized;
