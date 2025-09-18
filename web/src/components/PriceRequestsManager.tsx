import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Clock, User, Package, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { priceVisibilityApi, PriceRequest } from '@/lib/api';

const PriceRequestsManager = () => {
  const [requests, setRequests] = useState<PriceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const { toast } = useToast();

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const response = await priceVisibilityApi.getPriceRequests();
      setRequests(response.requests);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.error || 'Failed to load price requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleResponse = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      setRespondingTo(requestId);
      await priceVisibilityApi.respondToPriceRequest(requestId, action);
      
      // Update local state
      setRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { 
                ...request, 
                status: action === 'approve' ? 'approved' : 'denied',
                respondedAt: new Date().toISOString()
              }
            : request
        )
      );

      toast({
        title: `Request ${action === 'approve' ? 'Approved' : 'Denied'}`,
        description: `Price access request has been ${action}d successfully.`,
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.error || `Failed to ${action} request`,
        variant: 'destructive',
      });
    } finally {
      setRespondingTo(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'denied':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusClassName = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'denied':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <Card className="supply-chain-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-section flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Price Access Requests
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800 border-orange-200">
                {pendingRequests.length} pending
              </Badge>
            )}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadRequests}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Approve or deny access to your private pricing. New requests appear at the top.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No price access requests yet.</p>
            <p className="text-sm">When users request to view your produce prices, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Pending Requests ({pendingRequests.length})
                </h3>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-yellow-200 rounded-lg p-4 bg-yellow-50/50 dark:bg-yellow-900/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {request.requesterName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{request.requesterName}</span>
                              <Badge variant="outline" className="text-xs">
                                {request.requesterRole}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {request.requesterEmail}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                Batch #{request.batchId}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(request.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResponse(request.id, 'deny')}
                            disabled={respondingTo === request.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {respondingTo === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Deny
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleResponse(request.id, 'approve')}
                            disabled={respondingTo === request.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {respondingTo === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processed Requests */}
            {processedRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Recent Activity ({processedRequests.length})
                </h3>
                <div className="space-y-3">
                  {processedRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="border border-border rounded-lg p-3 bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {request.requesterName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{request.requesterName}</span>
                              <Badge variant="outline" className="text-xs">
                                {request.requesterRole}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Batch #{request.batchId} • {formatDate(request.respondedAt || request.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <Badge variant={getStatusVariant(request.status)} className={getStatusClassName(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceRequestsManager;
