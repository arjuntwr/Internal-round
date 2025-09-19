import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/WhatsApp_Image_2025-09-19_at_15.59.43_3f7f1e7f-removebg-preview.png"
              alt="Agri Tree"
              className="h-8 w-8 object-contain logo-glow"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.src = '/placeholder.svg';
              }}
            />
            <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} Agri Tree</span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/farmer" className="hover:text-foreground transition-colors">Farmer</Link>
            <Link to="/distributor" className="hover:text-foreground transition-colors">Distributor</Link>
            <Link to="/consumer" className="hover:text-foreground transition-colors">Consumer</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
