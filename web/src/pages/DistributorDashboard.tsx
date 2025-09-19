import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft, History, Loader2, Truck, Search, ShoppingCart } from "lucide-react";
import ProfileSummary from "@/components/ProfileSummary";
import { useToast } from "@/hooks/use-toast";
import PriceRequestButton from "@/components/PriceRequestButton";
import { transferOwnership, getProduce } from "@/lib/api";

interface Transfer {
  id: string;
  batchId: string;
  recipient: string;
  price: string;
  date: string;
}

const DistributorDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    batchId: "",
    recipient: "",
    price: "",
  });
  const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([
    { id: "1", batchId: "001", recipient: "Store A", price: "₹50", date: "11 Sept 2025" },
    { id: "2", batchId: "002", recipient: "Store B", price: "₹75", date: "13 Sept 2025" },
    { id: "3", batchId: "003", recipient: "Store C", price: "₹100", date: "16 Sept 2025" },
  ]);
  
  const { toast } = useToast();
  const [traceId, setTraceId] = useState("");
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceResult, setTraceResult] = useState<any | null>(null);
  const addressBook = [
    { label: "Distributor (Acct 2)", address: "0x2ACfBaC0C9AE7b16DB3274785d265CFe440773de" },
    { label: "Farmer (Acct 1)", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
  ];
  const addressLabels: Record<string, string> = Object.fromEntries(addressBook.map(e => [e.address, e.label]));
  const labelFor = (addr: string) => addressLabels[addr] || addr;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const viewTrace = async () => {
    if (!traceId.trim()) {
      toast({ title: "Enter a batch ID", variant: "destructive" });
      return;
    }
    const idNum = Number(traceId);
    if (!Number.isFinite(idNum) || idNum < 0) {
      toast({ title: "Invalid batch ID", variant: "destructive" });
      return;
    }
    setTraceLoading(true);
    try {
      const data = await getProduce(idNum);
      setTraceResult(data);
      toast({ title: `Trace loaded for #${traceId}` });
    } catch (e: any) {
      toast({ title: "Trace failed", description: e?.error || String(e), variant: "destructive" });
      setTraceResult(null);
    } finally {
      setTraceLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.batchId || !formData.recipient || !formData.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before transferring ownership.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Integrate with backend via API client
    try {
      const batchIdNum = Number(formData.batchId);
      const priceNum = Number(String(formData.price).replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(batchIdNum) || batchIdNum < 0) {
        throw new Error("Invalid batch ID");
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(formData.recipient.trim())) {
        throw new Error("Recipient must be a valid 0x address");
      }
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        throw new Error("Price must be a positive number");
      }

      await transferOwnership({
        batchId: batchIdNum,
        recipient: formData.recipient.trim(),
        price: priceNum,
      });
      
      const newTransfer: Transfer = {
        id: String(recentTransfers.length + 1),
        batchId: formData.batchId,
        recipient: formData.recipient,
        price: formData.price,
        date: new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "short", 
          day: "numeric" 
        }),
      };
      
      setRecentTransfers(prev => [newTransfer, ...prev]);
      setFormData({ batchId: "", recipient: "", price: "" });
      
      toast({
        title: "Transfer Successful! 🚚",
        description: `Batch #${newTransfer.batchId} ownership transferred to ${newTransfer.recipient}.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error transferring ownership:', error);
      toast({
        title: "Transfer Failed",
        description: `Failed to transfer ownership: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 space-section">
        <div className="animate-fade-in-up">
          <h1 className="text-display flex items-center gap-3 mb-2">
            🚚 Distributor Dashboard
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Transfer produce ownership through the supply chain with blockchain verification.
          </p>
          <ProfileSummary title="Your Profile" />
          {/* Quick Trace Bar (top) */}
          <div className="w-full border border-border rounded-lg p-5 mb-10 bg-muted/40">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <div className="flex-1">
                <Label htmlFor="topTraceId">Quick Trace Batch ID</Label>
                <Input id="topTraceId" placeholder="e.g., 0, 1, 2" value={traceId} onChange={(e) => setTraceId(e.target.value)} />
              </div>
              <Button onClick={viewTrace} disabled={traceLoading} variant="outline" className="sm:w-40">
                {traceLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>) : (<><Search className="h-4 w-4 mr-2" /> Trace</>)}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:gap-10 xl:grid-cols-2">
          {/* Transfer Ownership Form */}
          <Card className="supply-chain-card animate-slide-in-right">
            <CardHeader>
              <CardTitle className="text-section flex items-center gap-2">
                <ArrowRightLeft className="h-6 w-6 text-secondary" />
                Transfer Ownership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label>Quick Select Recipient</Label>
                  <div className="flex gap-2 flex-wrap">
                    {addressBook.map((entry) => (
                      <Button key={entry.address} type="button" variant="outline" onClick={() => setFormData(prev => ({ ...prev, recipient: entry.address }))}>
                        {entry.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-border" />
                <div className="space-y-2">
                  <Label htmlFor="batchId">Batch ID</Label>
                  <Input
                    id="batchId"
                    name="batchId"
                    placeholder="e.g., 0, 1, 2 (numeric on-chain batch ID)"
                    value={formData.batchId}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient</Label>
                  <Input
                    id="recipient"
                    name="recipient"
                    placeholder="e.g., 0x7099... (Ethereum address of recipient)"
                    value={formData.recipient}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    name="price"
                    placeholder="e.g., 100 (numeric price; ₹ symbol optional)"
                    value={formData.price}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-secondary hover:bg-secondary/90" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing Transfer...
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      Transfer Ownership 🚀
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Transfers */}
          <Card className="supply-chain-card animate-slide-in-right" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="text-section flex items-center gap-2">
                <History className="h-6 w-6 text-secondary" />
                Recent Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransfers.length > 0 ? (
                  recentTransfers.map((transfer) => (
                    <div
                      key={transfer.id}
                      className="p-4 border border-border rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Batch #{transfer.batchId} → {transfer.recipient}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transfer.price} • {transfer.date}
                          </p>
                        </div>
                        <ArrowRightLeft className="h-4 w-4 text-secondary" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No transfers yet. Start transferring produce ownership! 🚛
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trace Batch (Sale/Arrival dates) */}
          <Card className="supply-chain-card animate-slide-in-right" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="text-section flex items-center gap-2">
                <Search className="h-6 w-6 text-secondary" />
                Trace Batch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="traceId">Batch ID</Label>
                  <Input id="traceId" placeholder="e.g., 0, 1, 2" value={traceId} onChange={(e) => setTraceId(e.target.value)} />
                </div>
                <Button onClick={viewTrace} disabled={traceLoading} variant="outline" className="w-full">
                  {traceLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>) : (<><Search className="h-4 w-4 mr-2" /> View Trace</>)}
                </Button>

                {traceResult && (
                  <div className="mt-4 p-5 border border-border rounded-lg bg-muted/50 space-y-3">
                    <div className="text-sm">Crop: <span className="font-medium">{traceResult.cropName}</span></div>
                    <div className="text-sm">Harvest: <span className="font-medium">{traceResult.harvestDate || 'Unknown'}</span></div>
                    <div className="text-sm">Last Transfer To: <span className="font-medium">{labelFor(traceResult.lastTransferTo || 'No transfers yet')}</span></div>
                    <div className="text-sm flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Sold/Arrived on: <span className="font-medium">{traceResult.lastTransferDateISO ? new Date(traceResult.lastTransferDateISO).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                    </div>
                    {traceResult.pricesHidden && traceId && (
                      <div className="pt-2 flex items-center justify-between gap-2">
                        <div className="text-xs text-muted-foreground">Price is protected. Request access from the farmer.</div>
                        <PriceRequestButton 
                          batchId={Number(traceId)} 
                          onRequestSent={() => toast({ title: 'Request Sent! 📤', description: 'The farmer will be notified of your request.' })}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Previous Transactions from trace history */}
          {traceResult?.history?.length > 0 && (
            <Card className="supply-chain-card animate-slide-in-right" style={{ animationDelay: "0.25s" }}>
              <CardHeader>
                <CardTitle className="text-section flex items-center gap-2">
                  <History className="h-6 w-6 text-secondary" />
                  Previous Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {traceResult.history.map((h: any, idx: number) => (
                    <div key={`${h.txHash}-${idx}`} className="p-4 border border-border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm">
                            From <span className="font-medium">{labelFor(h.from)}</span> → To <span className="font-medium">{labelFor(h.to)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {h.blockTimestamp ? new Date(h.blockTimestamp * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown date'}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          {h.priceHidden ? (
                            <span className="text-muted-foreground">Price Hidden</span>
                          ) : (
                            <span className="font-medium">₹{h.price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
);
};

export default DistributorDashboard;