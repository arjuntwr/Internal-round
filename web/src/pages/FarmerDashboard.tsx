import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProduceCard from "@/components/ProduceCard";
import PriceVisibilitySettings from "@/components/PriceVisibilitySettings";
import PriceRequestsManager from "@/components/PriceRequestsManager";
import { Calendar, Plus, Wheat, Loader2, Wallet, Settings, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePriceRequestNotifications } from "@/hooks/usePriceRequestNotifications";
import { addProduce, listBatches, priceVisibilityApi, VisibilitySetting } from "@/lib/api";
import { connectWallet, switchToLocalhost, requestFaucet } from "@/lib/wallet";
import DashboardBanner from "@/components/DashboardBanner";
import ProfileSummary from "@/components/ProfileSummary";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_MODE } from "@/config/demo";

const FarmerDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    cropName: "",
    quantity: "",
    harvestDate: "",
  });
  const [recentBatches, setRecentBatches] = useState<any[]>([]);
  const [lastQrUrl, setLastQrUrl] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [visibilityMap, setVisibilityMap] = useState<Record<number, 'public' | 'private'>>({});
  
  const { toast } = useToast();
  const { pendingCount } = usePriceRequestNotifications();
  const { user } = useAuth();
  const farmerName = user?.name || "Farmer";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cropName || !formData.quantity || !formData.harvestDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before adding produce.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Integrate with blockchain backend via API client
    try {
      const qty = Number(formData.quantity);
      if (!Number.isFinite(qty) || qty < 0) {
        throw new Error("Quantity must be a positive number");
      }
      const result = await addProduce({
        cropName: formData.cropName,
        quantity: qty,
        harvestDate: formData.harvestDate,
      });

      const newBatch = {
        batchId: String(result.batchId || recentBatches.length + 1).padStart(3, "0"),
        cropName: formData.cropName,
        quantity: formData.quantity,
        harvestDate: formData.harvestDate,
        status: "available" as const,
      };
      
      setRecentBatches(prev => [newBatch, ...prev]);
      setFormData({ cropName: "", quantity: "", harvestDate: "" });
      setLastQrUrl((result as any).qrCodeUrl || null);
      
      toast({
        title: "Success! 🌾",
        description: `Batch #${newBatch.batchId} has been added to the blockchain.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error adding produce:', error);
      toast({
        title: "Error",
        description: `Failed to add produce to blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load real batches
  useEffect(() => {
    (async () => {
      try {
        const res = await listBatches();
        // Load visibility settings in parallel
        try {
          const vs = await priceVisibilityApi.getVisibilitySettings();
          const map: Record<number, 'public' | 'private'> = {};
          (vs.settings || []).forEach((s: VisibilitySetting) => { map[s.batchId] = s.priceVisibility; });
          setVisibilityMap(map);
        } catch {}

        const mapped = (res.items || []).map((b) => ({
          batchId: String(b.batchId).padStart(3, "0"),
          cropName: b.cropName,
          quantity: String(b.quantity) + "kg",
          harvestDate: new Date(b.harvestDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
          status: "available",
        }));
        setRecentBatches(mapped);
      } catch {}
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-section">
        <div className="animate-fade-in-up">
          <DashboardBanner 
            name={farmerName} 
            totalBatches={recentBatches.length} 
            pendingRequests={pendingCount} 
          />
          <ProfileSummary title="Your Profile" />
        </div>

        <Tabs defaultValue="produce" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="produce" className="flex items-center gap-2">
              <Wheat className="h-4 w-4" />
              My Produce
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Price Requests
              {pendingCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Privacy Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="produce" className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:gap-8 xl:grid-cols-2">
          {/* Add Produce Form */}
          <Card className="supply-chain-card animate-slide-in-right">
            <CardHeader>
              <CardTitle className="text-section flex items-center gap-2">
                <Plus className="h-6 w-6 text-primary" />
                Add New Produce Batch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-content">
                <div className="space-y-2">
                  <Label htmlFor="cropName">Crop Name</Label>
                  <Input
                    id="cropName"
                    name="cropName"
                    placeholder="e.g., Wheat, Corn, Rice (choose a clear, human-readable name)"
                    value={formData.cropName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity (kg)</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    placeholder="e.g., 100 (enter numeric quantity in kilograms)"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="harvestDate">Harvest Date</Label>
                  <Input
                    id="harvestDate"
                    name="harvestDate"
                    type="date"
                    value={formData.harvestDate}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding to Blockchain...
                    </>
                  ) : (
                    <>
                      <Wheat className="h-4 w-4 mr-2" />
                      Add Produce to Blockchain 🚀
                    </>
                  )}
                </Button>
              </form>
              {lastQrUrl && (
                <div className="mt-6 p-4 border border-border rounded-lg bg-muted/50 space-y-3">
                  <div className="text-sm font-medium">Batch QR Code</div>
                  <div className="flex items-center gap-4">
                    <img src={lastQrUrl} alt="Batch QR" className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40" />
                    <div className="space-y-2">
                      <a href={lastQrUrl} target="_blank" rel="noreferrer" className="text-primary underline">Open QR</a>
                      <div className="text-xs text-muted-foreground">Share this QR with distributors/consumers to view batch details.</div>
                    </div>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>

          {/* Recent Batches */}
          <Card className="supply-chain-card animate-slide-in-right" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="text-section flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                My Recent Batches
              </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-content">
              {recentBatches.length > 0 ? (
                recentBatches.map((batch) => (
                  <ProduceCard
                    key={batch.batchId}
                    {...batch}
                    status={batch.status as any}
                    showTransferButton={batch.status === "available"}
                    visibility={visibilityMap[parseInt(batch.batchId, 10)] || 'public'}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No produce batches yet. Add your first batch above! 
                </div>
              )}
            </div>
          </CardContent>
        </Card>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <PriceRequestsManager />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <PriceVisibilitySettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FarmerDashboard;