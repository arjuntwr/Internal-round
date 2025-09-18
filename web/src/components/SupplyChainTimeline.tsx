import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wheat, Truck, Store, ShoppingCart, Calendar, DollarSign } from "lucide-react";

interface TimelineEntry {
  id: string;
  type: "farm" | "distributor" | "retailer" | "consumer";
  name: string;
  date: string;
  price?: string;
  location?: string;
}

interface SupplyChainTimelineProps {
  batchId?: string;
  entries: TimelineEntry[];
}

const SupplyChainTimeline = ({ batchId, entries }: SupplyChainTimelineProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "farm": return <Wheat className="h-5 w-5 text-primary" />;
      case "distributor": return <Truck className="h-5 w-5 text-secondary" />;
      case "retailer": return <Store className="h-5 w-5 text-accent" />;
      case "consumer": return <ShoppingCart className="h-5 w-5 text-success" />;
      default: return <Wheat className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "farm": return "Farm";
      case "distributor": return "Distributor";
      case "retailer": return "Retailer";
      case "consumer": return "Consumer";
      default: return type;
    }
  };

  return (
    <Card className="supply-chain-card">
      <CardHeader>
        <CardTitle className="text-section flex items-center gap-2">
          📈 Supply Chain Timeline
          {batchId && <Badge variant="outline">Batch #{batchId}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={entry.id} className="timeline-item">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  {getIcon(entry.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{entry.name}</h4>
                    <Badge variant="secondary">{getTypeLabel(entry.type)}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{entry.date}</span>
                    </div>
                    {entry.price && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{entry.price}</span>
                      </div>
                    )}
                    {entry.location && (
                      <span className="text-muted-foreground">{entry.location}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {entries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No timeline data available. Enter a valid batch ID to view the supply chain history.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplyChainTimeline;