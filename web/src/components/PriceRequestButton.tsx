import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { priceVisibilityApi, PriceRequestStatus } from '@/lib/api';

interface PriceRequestButtonProps {
  batchId: number;
  onRequestSent?: () => void;
  className?: string;
}

const PriceRequestButton = ({ batchId, onRequestSent, className }: PriceRequestButtonProps) => {
  const [status, setStatus] = useState<PriceRequestStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadStatus = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await priceVisibilityApi.getPriceRequestStatus(batchId);
      setStatus(response);
    } catch (error: any) {
      console.error('Failed to load price request status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [batchId, user]);

  const handleRequestAccess = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to request price access.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsRequesting(true);
      const response = await priceVisibilityApi.requestPriceAccess(batchId);
      
      setStatus(prev => prev ? {
        ...prev,
        hasRequest: true,
        requestStatus: 'pending'
      } : null);

      onRequestSent?.();

      toast({
        title: 'Request Sent! 📤',
        description: response.message,
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Request Failed',
        description: error?.error || 'Failed to send price access request',
        variant: 'destructive',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  // Don't show anything if user is not logged in
  if (!user) {
    return null;
  }

  // Don't show for farmers (they can always see their own prices)
  if (user.role === 'farmer') {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  // User can already view prices
  if (status?.canViewPrice) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <Eye className="h-3 w-3 mr-1" />
        Price Visible
      </Badge>
    );
  }

  // User has a pending request
  if (status?.hasRequest && status?.requestStatus === 'pending') {
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
        <Clock className="h-3 w-3 mr-1" />
        Request Pending
      </Badge>
    );
  }

  // User's request was approved
  if (status?.hasRequest && status?.requestStatus === 'approved') {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Access Granted
      </Badge>
    );
  }

  // User's request was denied
  if (status?.hasRequest && status?.requestStatus === 'denied') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Request Denied
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRequestAccess}
          disabled={isRequesting}
          className={className}
        >
          {isRequesting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Requesting...
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Request Again
            </>
          )}
        </Button>
      </div>
    );
  }

  // Default: User can request access
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRequestAccess}
      disabled={isRequesting}
      className={className}
    >
      {isRequesting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Requesting...
        </>
      ) : (
        <>
          <EyeOff className="h-4 w-4 mr-2" />
          Request Price Access
        </>
      )}
    </Button>
  );
};

export default PriceRequestButton;
