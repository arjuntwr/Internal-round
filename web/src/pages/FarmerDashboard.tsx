import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProduceCard from "@/components/ProduceCard";
import { Calendar, Plus, Wheat, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FarmerDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    cropName: "",
    quantity: "",
    harvestDate: "",
  });
  const [recentBatches, setRecentBatches] = useState([
    { batchId: "001", cropName: "Wheat", quantity: "100kg", harvestDate: "Sept 10, 2025", status: "available" },
    { batchId: "002", cropName: "Corn", quantity: "150kg", harvestDate: "Sept 12, 2025", status: "available" },
    { batchId: "003", cropName: "Rice", quantity: "200kg", harvestDate: "Sept 15, 2025", status: "transferred" },
  ]);
  
  const { toast } = useToast();

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

    // Integrate with blockchain backend
    try {
      const response = await fetch('http://localhost:3000/produce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cropName: formData.cropName,
          quantity: parseInt(formData.quantity),
          harvestDate: formData.harvestDate,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      const newBatch = {
        batchId: String(result.batchId || recentBatches.length + 1).padStart(3, "0"),
        cropName: formData.cropName,
        quantity: formData.quantity,
        harvestDate: formData.harvestDate,
        status: "available" as const,
      };
      
      setRecentBatches(prev => [newBatch, ...prev]);
      setFormData({ cropName: "", quantity: "", harvestDate: "" });
      
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-section">
        <div className="animate-fade-in-up">
          <h1 className="text-display flex items-center gap-3 mb-2">
            👨‍🌾 Farmer Dashboard
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Register your produce batches on the blockchain for transparent supply chain tracking.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
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
                    placeholder="e.g., Wheat, Corn, Rice"
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
                    placeholder="e.g., 100"
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
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No produce batches yet. Add your first batch above! 🌱
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

export default FarmerDashboard;