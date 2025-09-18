import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { priceVisibilityApi } from '@/lib/api';

export const usePriceRequestNotifications = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const loadNotifications = async () => {
    if (!user || user.role !== 'farmer') {
      setPendingCount(0);
      return;
    }

    try {
      setIsLoading(true);
      const response = await priceVisibilityApi.getPriceRequests();
      const pending = response.requests.filter(req => req.status === 'pending');
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Failed to load price request notifications:', error);
      setPendingCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  return {
    pendingCount,
    isLoading,
    refresh: loadNotifications
  };
};
