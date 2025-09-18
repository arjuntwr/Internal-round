import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Wheat } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div className="bg-card p-4 rounded-lg flex items-center gap-4">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

interface DashboardBannerProps {
  name: string;
  totalBatches: number;
  pendingRequests: number;
}

const DashboardBanner: React.FC<DashboardBannerProps> = ({ name, totalBatches, pendingRequests }) => {
  return (
    <Card className="mb-8 bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back, {name}! 👋</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard 
          title="Total Produce Batches" 
          value={totalBatches} 
          icon={<Wheat className="h-6 w-6 text-primary-foreground" />} 
          color="bg-primary"
        />
        <StatCard 
          title="Pending Price Requests" 
          value={pendingRequests} 
          icon={<Bell className="h-6 w-6 text-red-500" />} 
          color="bg-red-500/10"
        />
      </CardContent>
    </Card>
  );
};

export default DashboardBanner;
