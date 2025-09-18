import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const EmailVerification = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = (location.state as any)?.email || '';

  useEffect(() => {
    if (token) {
      setStatus('loading');
      verifyEmail(token)
        .then(() => {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        })
        .catch((error) => {
          setStatus('error');
          setMessage(error.message || 'Failed to verify email. The link may have expired.');
        });
    }
  }, [token, verifyEmail]);

  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {status === 'success' ? 'Email Verified!' : status === 'error' ? 'Verification Failed' : 'Verifying Email...'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {status === 'success' && (
              <p className="text-green-600">{message}</p>
            )}
            {status === 'error' && (
              <p className="text-red-600">{message}</p>
            )}
            {status === 'loading' && (
              <p>Please wait while we verify your email...</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/login')}>Back to Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p>
            We've sent a verification link to <span className="font-medium">{email || 'your email'}</span>.
          </p>
          <p className="mt-2">Please check your inbox and click the link to verify your email address.</p>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/login')}>Back to Login</Button>
          <Button variant="link" onClick={() => navigate('/resend-verification')}>Resend Verification Email</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmailVerification;
