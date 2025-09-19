import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Navigation from "./components/Navigation";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EmailVerification from "./pages/EmailVerification";
import ResendVerification from "./pages/ResendVerification";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/AdminDashboard";
import FarmerDashboard from "./pages/FarmerDashboard";
import DistributorDashboard from "./pages/DistributorDashboard";
import ConsumerDashboard from "./pages/ConsumerDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  return (
    <Routes>
      {isLoading && (
        <Route
          path="*"
          element={
            <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
              Loading...
            </div>
          }
        />
      )}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/resend-verification" element={<ResendVerification />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Index />} />
      
      {/* Protected Profile */}
      <Route element={<ProtectedRoute allowedRoles={['farmer', 'distributor', 'consumer']} />}>
        <Route path="/profile" element={<Profile />} />
      </Route>
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} requireVerified />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['farmer']} requireVerified />}>
        <Route path="/farmer" element={<FarmerDashboard />} />
      </Route>
      
      <Route element={<ProtectedRoute allowedRoles={['distributor']} requireVerified />}>
        <Route path="/distributor" element={<DistributorDashboard />} />
      </Route>
      
      <Route element={<ProtectedRoute allowedRoles={['consumer']} requireVerified />}>
        <Route path="/consumer" element={<ConsumerDashboard />} />
      </Route>
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <Navigation />
            <AppRoutes />
            <Footer />
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
