import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SupplyChainTimeline from "@/components/SupplyChainTimeline";
import { Search, ShoppingCart, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProduce } from "@/lib/api";

const ConsumerDashboard = () => {
  const [batchId, setBatchId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  
  const { toast } = useToast();

  // Mock data for demo purposes
  const mockTimelineData = {
    "001": [
      {
        id: "1",
        type: "farm" as const,
        name: "Green Valley Farm",
        date: "Sept 10, 2025",
        location: "California, USA",
      },
      {
        id: "2", 
        type: "distributor" as const,
        name: "FreshCorp Distribution",
        date: "Sept 11, 2025",
        price: "$50",
        location: "Los Angeles, CA",
      },
      {
        id: "3",
        type: "retailer" as const,
        name: "SuperMart Store #123",
        date: "Sept 12, 2025", 
        price: "$75",
        location: "San Francisco, CA",
      },
      {
        id: "4",
        type: "consumer" as const,
        name: "You (Consumer)",
        date: "Sept 13, 2025",
        price: "$100",
        location: "Your Purchase",
      },
    ],
    "002": [
      {
        id: "1",
        type: "farm" as const,
        name: "Sunny Acres Farm",
        date: "Sept 12, 2025",
        location: "Texas, USA",
      },
      {
        id: "2",
        type: "distributor" as const,
        name: "AgriLink Distributors",
        date: "Sept 13, 2025",
        price: "$75",
        location: "Dallas, TX",
      },
    ],
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!batchId.trim()) {
      toast({
        title: "Missing Batch ID",
        description: "Please enter a batch ID to track the produce.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSearched(true);

    // Integrate with blockchain backend via API client
    try {
      const idNum = Number(batchId);
      if (!Number.isFinite(idNum) || idNum < 0) {
        throw new Error("Invalid batch ID");
      }
      const result = await getProduce(idNum);
      
      // Transform backend data to timeline format
      const timelineData = [
        {
          id: "1",
          type: "farm" as const,
          name: result.farmer || "Unknown Farm",
          date: result.harvestDate,
          location: "Farm Location",
        },
        ...result.history.map((transfer: any, index: number) => ({
          id: String(index + 2),
          type: index === result.history.length - 1 ? "consumer" as const : "distributor" as const,
          name: transfer.to,
          date: new Date().toLocaleDateString("en-US", { 
            year: "numeric", 
            month: "short", 
            day: "numeric" 
          }),
          price: `$${transfer.price}`,
          location: "Supply Chain",
        }))
      ];
      
      setTimelineData(timelineData);
      toast({
        title: "Batch Found! 🔍",
        description: `Successfully retrieved supply chain history for Batch #${batchId}.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error fetching produce:', error);
      toast({
        title: "Search Failed",
        description: `Failed to query blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setTimelineData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search when linked with QR deep link like /consumer?batchId=0
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("batchId");
    if (id) {
      setBatchId(id);
      // trigger search without user interaction
      handleSearch({ preventDefault: () => {} } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-section">
        <div className="animate-fade-in-up">
          <h1 className="text-display flex items-center gap-3 mb-2">
            🛒 Consumer Dashboard
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Track your produce from farm to table with complete transparency.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Search Form */}
          <Card className="supply-chain-card animate-slide-in-right">
            <CardHeader>
              <CardTitle className="text-section flex items-center gap-2">
                <Search className="h-6 w-6 text-primary" />
                Track Produce
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-content">
                <div className="space-y-2">
                  <Label htmlFor="batchId">Batch ID</Label>
                  <Input
                    id="batchId"
                    name="batchId"
                    placeholder="Enter batch ID (e.g., 001, 002)"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
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
                      <Search className="h-4 w-4 mr-2 animate-spin" />
                      Searching Blockchain...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      View Full History 🔍
                    </>
                  )}
                </Button>
              </form>

              {/* Demo Instructions */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-secondary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Demo Instructions</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try searching for batch IDs: <strong>001</strong> or <strong>002</strong> to see sample supply chain data.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Results */}
          {searched && (
            <div className="animate-fade-in-up">
              <SupplyChainTimeline 
                batchId={batchId}
                entries={timelineData}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsumerDashboard;