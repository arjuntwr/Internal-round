import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

type UserRole = 'farmer' | 'distributor' | 'consumer';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<UserRole>('farmer');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || '/';

  // Show success message if redirected from registration
  useEffect(() => {
    if (location.state?.registered) {
      toast({
        title: 'Registration Successful!',
        description: 'Your account has been created. Please log in.',
        variant: 'default',
      });
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, '');
    }
  }, [location.state, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Backend determines role; tab is just for UX context
      await login(email, password);
      // Redirect to the intended page or home
      navigate(from, { replace: true });
    } catch (err) {
      // Error is handled by the auth context
      console.error('Login error:', err);
    }
  };

  const handleAdminLogin = async () => {
    try {
      // Demo admin seeded in backend (override via env: ADMIN_EMAIL / ADMIN_PASSWORD)
      await login('admin@example.com', 'admin123');
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error('Admin quick login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md supply-chain-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your {activeTab} account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as UserRole)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="farmer">Farmer</TabsTrigger>
              <TabsTrigger value="distributor">Distributor</TabsTrigger>
              <TabsTrigger value="consumer">Consumer</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-500">{error}</div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="button" variant="outline" onClick={handleAdminLogin} disabled={isLoading} className="w-full">
            Login as Admin (demo)
          </Button>
          <div className="text-sm text-center">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              state={{ role: activeTab }}
              className="text-primary hover:underline font-medium"
            >
              Sign up as {activeTab}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
