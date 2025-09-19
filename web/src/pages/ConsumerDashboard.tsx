import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import SupplyChainTimeline from "@/components/SupplyChainTimeline";
import PriceRequestButton from "@/components/PriceRequestButton";
import { Search, ShoppingCart, AlertCircle, QrCode, Link as LinkIcon, EyeOff, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProduce } from "@/lib/api";
import ProfileSummary from "@/components/ProfileSummary";

const ConsumerDashboard = () => {
  const [batchId, setBatchId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [searched, setSearched] = useState(false);
  const [produceData, setProduceData] = useState<any>(null);
  const [pricesHidden, setPricesHidden] = useState(false);
  // Known address labels (demo accounts)
  const addressLabels: Record<string, string> = {
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": "Farmer (Acct 1)",
    "0x2ACfBaC0C9AE7b16DB3274785d265CFe440773de": "Distributor (Acct 2)",
  };
  
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
      
      // Store the full produce data
      setProduceData(result);
      setPricesHidden((result as any).pricesHidden || false);
      
      // Transform backend data to timeline format using on-chain timestamps when available
      const formatDate = (isoOrTs: any) => {
        if (!isoOrTs) return "Unknown date";
        try {
          const d = typeof isoOrTs === 'number' ? new Date(isoOrTs * 1000) : new Date(isoOrTs);
          return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        } catch {
          return String(isoOrTs);
        }
      };

      const formatPriceRange = (p: number | null | undefined) => {
        if (p == null || !Number.isFinite(p)) return "Price Hidden";
        // Show ±10% range
        const min = Math.max(0, p * 0.9);
        const max = p * 1.1;
        const fmt = (n: number) => `₹${Math.round(n)}`;
        return `${fmt(min)} - ${fmt(max)}`;
      };

      const labelFor = (addr: string) => addressLabels[addr] || addr;

      const timelineData = [
        {
          id: "1",
          type: "farm" as const,
          name: labelFor(result.farmer || "Unknown Farm"),
          date: result.harvestDate || "Harvest date unknown",
          location: result.location || "Farm Location",
        },
        ...result.history.map((transfer: any, index: number) => ({
          id: String(index + 2),
          type: index === result.history.length - 1 ? "consumer" as const : "distributor" as const,
          name: labelFor(transfer.to),
          date: formatDate(transfer.blockTimestamp),
          price: transfer.priceHidden ? "Price Hidden" : formatPriceRange(transfer.price),
          priceHidden: transfer.priceHidden,
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
    const raw = qrUrl.trim();
    if (!raw) return;
    // 1) If it's a plain numeric ID, accept directly
    if (/^\d+$/.test(raw)) {
      setBatchId(raw);
      handleSearch(null as any);
      return;
    }
    // 2) Try parse as URL and extract batchId
    try {
      const url = new URL(raw);
      const id = url.searchParams.get("batchId");
      if (id && /^\d+$/.test(id)) {
        setBatchId(id);
        handleSearch(null as any);
        return;
      }
      // 3) Fallback: try to find batchId=123 anywhere in the string
      const match = raw.match(/batchId=(\d+)/i);
      if (match) {
        setBatchId(match[1]);
        handleSearch(null as any);
        return;
      }
    } catch {
      // Not a valid URL; try to find an ID within the string
      const match = raw.match(/batchId=(\d+)/i) || raw.match(/\b(\d{1,6})\b/);
      if (match) {
        setBatchId(match[1]);
        handleSearch(null as any);
      } else {
        toast({
          title: "Unrecognized QR content",
          description: "Could not find a batchId. Paste a link containing ?batchId= or a numeric ID.",
          variant: "destructive",
        });
      }
    }
  };

  // Scan QR using BarcodeDetector if available
  const scanQr = async () => {
    // Feature detect
    // @ts-ignore
    const Supported = (window as any).BarcodeDetector !== undefined;
    if (!Supported) {
      toast({
        title: "QR scanning not supported",
        description: "Paste the QR link or enter the numeric Batch ID instead.",
        variant: "destructive",
      });
      return;
    }
    let stream: MediaStream | null = null;
    try {
      // @ts-ignore
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const video = document.createElement("video");
      video.srcObject = stream as any;
      await video.play();
      await new Promise(r => setTimeout(r, 800));
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const bitmap = await createImageBitmap(canvas);
      // @ts-ignore
      const codes = await detector.detect(bitmap);
      if (codes && codes.length > 0) {
        // Pick first value with digits or fallback to first
        const preferred = codes.find((c: any) => /\d+/.test(c.rawValue)) || codes[0];
        const value = String(preferred.rawValue || "");
        setQrUrl(value);
        // Reuse parser logic
        try {
          const url = new URL(value);
          const id = url.searchParams.get("batchId");
          if (id && /^\d+$/.test(id)) {
            setBatchId(id);
            handleSearch(null as any);
            return;
          }
        } catch {}
        if (/^\d+$/.test(value)) {
          setBatchId(value);
          handleSearch(null as any);
          return;
        }
        const match = value.match(/batchId=(\d+)/i) || value.match(/\b(\d{1,6})\b/);
        if (match) {
          setBatchId(match[1]);
          handleSearch(null as any);
          return;
        }
        toast({
          title: "QR read but no batchId found",
          description: "Ensure the QR contains ?batchId=123 or only the numeric ID.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "No QR detected",
          description: "Try again or paste the QR link.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Unable to scan QR",
        description: "Camera access denied or detection failed. Paste the QR link instead.",
        variant: "destructive",
      });
    } finally {
      if (stream) stream.getTracks().forEach(t => t.stop());
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
          <ProfileSummary title="Your Profile" />
        </div>

        {/* Hero Banner */}
        <Card className="mb-4 bg-gradient-to-r from-primary/10 to-transparent border-primary/20 animate-fade-in-up">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Find Any Batch in Seconds</h3>
                <p className="text-sm text-muted-foreground mt-1">Search by Batch ID or scan a QR. Try demo IDs like <span className="font-medium">001</span> or <span className="font-medium">002</span>.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">Live Tracking</Badge>
                <Badge variant="outline">QR Ready</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

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

              {/* Compact demo hint */}
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                Tip: Try demo IDs 001 or 002 to see sample supply chain data.
              </div>
            </CardContent>
          </Card>

          {/* Timeline Results */}
          {isLoading && (
            <div className="animate-fade-in-up space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="supply-chain-card bg-card p-5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {searched && notFound && !isLoading && (
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

          {searched && !notFound && !isLoading && (
            <div className="animate-fade-in-up space-y-6">
              {/* Summary row: when purchased (last transfer) */}
              {produceData?.lastTransferDateISO && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Purchased on {new Date(produceData.lastTransferDateISO).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </CardTitle>
                  </CardHeader>
                </Card>
              )}
              {/* Price Visibility Notice */}
              {pricesHidden && (
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <CardTitle className="text-orange-800 flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Price Information Protected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-orange-700 mb-2">
                          The farmer has set price visibility to private for this batch. 
                          You can request access to view pricing information.
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Private Pricing
                          </Badge>
                        </div>
                      </div>
                      <PriceRequestButton 
                        batchId={Number(batchId)} 
                        onRequestSent={() => {
                          toast({
                            title: "Request Sent! 📤",
                            description: "The farmer will be notified of your price access request.",
                            variant: "default",
                          });
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

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