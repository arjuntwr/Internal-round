import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-content animate-fade-in-up">
        <div className="mb-6">
          <AlertTriangle className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-display mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Oops! This page seems to have gotten lost in the supply chain.
          </p>
        </div>
        <Button asChild variant="hero" size="lg">
          <Link to="/">
            <Home className="mr-2 h-5 w-5" />
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
