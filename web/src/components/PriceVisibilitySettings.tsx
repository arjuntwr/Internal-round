import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { priceVisibilityApi, VisibilitySetting } from '@/lib/api';

interface PriceVisibilitySettingsProps {
  batchId?: number;
  onSettingChange?: (batchId: number, visibility: 'public' | 'private') => void;
}

const PriceVisibilitySettings = ({ batchId, onSettingChange }: PriceVisibilitySettingsProps) => {
  const [settings, setSettings] = useState<VisibilitySetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingBatch, setUpdatingBatch] = useState<number | null>(null);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await priceVisibilityApi.getVisibilitySettings();
      setSettings(response.settings);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.error || 'Failed to load visibility settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleVisibilityToggle = async (targetBatchId: number, currentVisibility: 'public' | 'private') => {
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
    const confirmMsg =
      newVisibility === 'private'
        ? `Make Batch #${targetBatchId} pricing PRIVATE? Users will need approval to view prices.`
        : `Make Batch #${targetBatchId} pricing PUBLIC? Prices will be visible to everyone.`;
    const ok = window.confirm(confirmMsg);
    if (!ok) return;
    
    try {
      setUpdatingBatch(targetBatchId);
      await priceVisibilityApi.setProduceVisibility(targetBatchId, newVisibility);
      
      // Update local state
      setSettings(prev => 
        prev.map(setting => 
          setting.batchId === targetBatchId 
            ? { ...setting, priceVisibility: newVisibility }
            : setting
        )
      );

      // If this batch wasn't in settings before, add it
      if (!settings.find(s => s.batchId === targetBatchId)) {
        setSettings(prev => [...prev, { batchId: targetBatchId, priceVisibility: newVisibility }]);
      }

      onSettingChange?.(targetBatchId, newVisibility);

      toast({
        title: 'Settings Updated',
        description: `Batch #${targetBatchId} price visibility set to ${newVisibility}`,
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.error || 'Failed to update visibility setting',
        variant: 'destructive',
      });
    } finally {
      setUpdatingBatch(null);
    }
  };

  const getBatchVisibility = (targetBatchId: number): 'public' | 'private' => {
    const setting = settings.find(s => s.batchId === targetBatchId);
    return setting?.priceVisibility || 'public';
  };

  // If specific batchId is provided, show only that batch's settings
  if (batchId !== undefined) {
    const visibility = getBatchVisibility(batchId);
    const isUpdating = updatingBatch === batchId;

    return (
      <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
        <div className="flex items-center gap-3">
          {visibility === 'public' ? (
            <Eye className="h-5 w-5 text-green-600" />
          ) : (
            <EyeOff className="h-5 w-5 text-orange-600" />
          )}
          <div>
            <Label className="text-sm font-medium">
              Price Visibility for Batch #{batchId}
            </Label>
            <p className="text-xs text-muted-foreground">
              {visibility === 'public' 
                ? 'Prices are visible to everyone' 
                : 'Prices require approval to view'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={visibility === 'public' ? 'default' : 'secondary'} className={visibility === 'public' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200'}>
            {visibility}
          </Badge>
          <Switch
            checked={visibility === 'private'}
            onCheckedChange={() => handleVisibilityToggle(batchId, visibility)}
            disabled={isUpdating}
          />
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </div>
    );
  }

  // Show all settings
  return (
    <Card className="supply-chain-card">
      <CardHeader>
        <CardTitle className="text-section flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Price Visibility Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Control public/private pricing for each batch. Changes apply instantly.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading settings...</span>
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No produce batches found.</p>
            <p className="text-sm">Add some produce to manage price visibility.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Control who can see the prices for your produce batches. When set to private, 
              other users must request permission to view pricing information.
            </div>
            
            {settings.map((setting) => {
              const isUpdating = updatingBatch === setting.batchId;
              
              return (
                <div
                  key={setting.batchId}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    {setting.priceVisibility === 'public' ? (
                      <Eye className="h-5 w-5 text-green-600" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-orange-600" />
                    )}
                    <div>
                      <Label className="text-sm font-medium">
                        Batch #{setting.batchId}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {setting.priceVisibility === 'public' 
                          ? 'Prices are visible to everyone' 
                          : 'Prices require approval to view'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={setting.priceVisibility === 'public' ? 'default' : 'secondary'} className={setting.priceVisibility === 'public' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200'}>
                      {setting.priceVisibility}
                    </Badge>
                    <Switch
                      checked={setting.priceVisibility === 'private'}
                      onCheckedChange={() => handleVisibilityToggle(setting.batchId, setting.priceVisibility)}
                      disabled={isUpdating}
                    />
                    {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </div>
              );
            })}
            
            <Button 
              variant="outline" 
              onClick={loadSettings}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                'Refresh Settings'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceVisibilitySettings;
