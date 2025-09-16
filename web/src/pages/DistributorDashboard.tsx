import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft, History, Loader2, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { transferOwnership } from "@/lib/api";

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
  const addressBook = [
    { label: "Distributor (Acct 2)", address: "0x2ACfBaC0C9AE7b16DB3274785d265CFe440773de" },
    { label: "Farmer (Acct 1)", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
      <div className="container mx-auto px-4 py-8 space-section">
        <div className="animate-fade-in-up">
          <h1 className="text-display flex items-center gap-3 mb-2">
            🚚 Distributor Dashboard
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Transfer produce ownership through the supply chain with blockchain verification.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:gap-8 xl:grid-cols-2">
          {/* Transfer Ownership Form */}
          <Card className="supply-chain-card animate-slide-in-right">
            <CardHeader>
              <CardTitle className="text-section flex items-center gap-2">
                <ArrowRightLeft className="h-6 w-6 text-secondary" />
                Transfer Ownership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-content">
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
                <div className="h-px bg-border my-3" />
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
              <div className="space-content">
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
        </div>
      </div>
    </div>
  );
};

export default DistributorDashboard;