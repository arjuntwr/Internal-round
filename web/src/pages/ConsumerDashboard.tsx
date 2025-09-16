import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SupplyChainTimeline from "@/components/SupplyChainTimeline";
import { Search, ShoppingCart, AlertCircle, QrCode, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProduce } from "@/lib/api";

const ConsumerDashboard = () => {
  const [batchId, setBatchId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
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

  const handleSearch = async (e: React.FormEvent | null) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    
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
    setNotFound(null);

    // Integrate with blockchain backend via API client
    try {
      const idNum = Number(batchId);
      if (!Number.isFinite(idNum) || idNum < 0) {
        throw new Error("Invalid batch ID");
      }
      const result = await getProduce(idNum);
      if ((result as any)?.error && /not found/i.test((result as any).error)) {
        setTimelineData([]);
        setNotFound(`Batch #${batchId} was not found. It may not be registered yet.`);
        toast({
          title: "Batch Not Found",
          description: `No data for Batch #${batchId}. Ask the farmer to register it first.`,
          variant: "destructive",
        });
        return;
      }
      
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
          price: `₹${transfer.price}`,
          location: "Supply Chain",
        }))
      ];
      
      setTimelineData(timelineData);
      setNotFound(null);
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
      setNotFound(`Could not find Batch #${batchId}. Ensure the ID is correct (e.g., 0, 1, 2).`);
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
      handleSearch(null as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefresh || !batchId) return;
    const interval = setInterval(() => {
      handleSearch(null as any);
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, batchId]);

  // Parse QR URL to extract batchId
  const parseQrUrl = () => {
    try {
      const url = new URL(qrUrl.trim());
      const id = url.searchParams.get("batchId");
      if (id) {
        setBatchId(id);
        handleSearch(null as any);
      }
    } catch {}
  };

  // Scan QR using BarcodeDetector if available
  const scanQr = async () => {
    try {
      // @ts-ignore
      const Supported = (window as any).BarcodeDetector !== undefined;
      if (!Supported) {
        alert("QR scanning not supported in this browser. Paste the QR link instead.");
        return;
      }
      // @ts-ignore
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      // Request camera stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const video = document.createElement("video");
      video.srcObject = stream as any;
      await video.play();
      // Capture a frame after a short delay
      await new Promise(r => setTimeout(r, 800));
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const bitmap = await createImageBitmap(canvas);
      // @ts-ignore
      const codes = await detector.detect(bitmap);
      stream.getTracks().forEach(t => t.stop());
      if (codes && codes[0] && codes[0].rawValue) {
        const value = codes[0].rawValue as string;
        setQrUrl(value);
        try {
          const url = new URL(value);
          const id = url.searchParams.get("batchId");
          if (id) {
            setBatchId(id);
            handleSearch(null as any);
          }
        } catch {
          // If it's just the ID
          if (/^\d+$/.test(value)) {
            setBatchId(value);
            handleSearch(null as any);
          }
        }
      } else {
        alert("No QR code detected. Try again.");
      }
    } catch (e) {
      alert("Failed to access camera or detect QR. Paste the QR link instead.");
    }
  };

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

        <div className="grid grid-cols-1 gap-6 md:gap-8">
          {/* Search Form */}
          <Card className="supply-chain-card animate-slide-in-right">
            <CardHeader>
              <CardTitle className="text-section flex items-center gap-2">
                <Search className="h-6 w-6 text-primary" />
                Track Produce
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch as any} className="space-content">
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
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <Button type="button" variant="outline" onClick={scanQr}>
                    <QrCode className="h-4 w-4 mr-2" /> Scan QR
                  </Button>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    <Input
                      placeholder="Paste QR link (e.g., http://.../consumer?batchId=0)"
                      value={qrUrl}
                      onChange={(e) => setQrUrl(e.target.value)}
                      onBlur={parseQrUrl}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <input id="autorefresh" type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                  <Label htmlFor="autorefresh">Auto refresh every 10s</Label>
                </div>
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
          {searched && notFound && (
            <div className="animate-fade-in-up">
              <Card className="border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" /> Batch Not Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{notFound}</p>
                  <p className="text-sm text-muted-foreground mt-2">Tip: Batch IDs are numeric (e.g., 0, 1, 2). Create a batch from the Farmer Dashboard, then try again.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {searched && !notFound && (
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