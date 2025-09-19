import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wheat, Calendar, Package, ArrowRight } from "lucide-react";
import PriceVisibilityIndicator from "@/components/PriceVisibilityIndicator";
import { DEMO_MODE } from "@/config/demo";
import { Link } from "react-router-dom";

interface ProduceCardProps {
  batchId: string;
  cropName: string;
  quantity: string;
  harvestDate: string;
  status: "available" | "transferred" | "sold";
  onViewDetails?: () => void;
  onTransfer?: () => void;
  showTransferButton?: boolean;
  visibility?: 'public' | 'private';
}

const ProduceCard = ({ 
  batchId, 
  cropName, 
  quantity, 
  harvestDate, 
  status,
  onViewDetails,
  onTransfer,
  showTransferButton = false,
  visibility
}: ProduceCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "success";
      case "transferred": return "warning";
      case "sold": return "secondary";
      default: return "secondary";
    }
  };

  return (
    <Card className="supply-chain-card hover-card-pop animate-fade-in-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-title flex items-center gap-2">
            <Wheat className="h-5 w-5 text-primary" />
            {cropName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(status) as any} className="capitalize">
              {status}
            </Badge>
            {visibility && (
              <PriceVisibilityIndicator visibility={visibility} size="sm" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-content">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>Batch #{batchId}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>Quantity: {quantity}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Harvest: {harvestDate}</span>
          </div>
        </div>
        
        <div className="flex gap-2 pt-4">
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails} className="flex-1 btn-shine">
              View Details
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="flex-1 btn-shine">
            <Link to={`/consumer?batchId=${parseInt(batchId, 10)}`}>View Trace</Link>
          </Button>
          {!DEMO_MODE && showTransferButton && onTransfer && (
            <Button variant="farm" size="sm" onClick={onTransfer} className="flex-1">
              Transfer <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProduceCard;