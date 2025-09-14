import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { LanguageProvider } from "@/contexts/language-context";
import MobileLayout from "@/components/layout/mobile-layout";
import Home from "@/pages/home";
import Search from "@/pages/search";
import Favorites from "@/pages/favorites";
import AddListing from "@/pages/add-listing";
import PostRequirement from "@/pages/post-requirement";
import Requirements from "@/pages/requirements";
import EditProfile from "@/pages/edit-profile";
import EditListing from "@/pages/edit-listing";
import EditRequirement from "@/pages/edit-requirement";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import PropertyDetails from "@/pages/property-details";
import Resources from "@/pages/resources";
import AddServiceProvider from "@/pages/add-service-provider";
import AdminServices from "@/pages/admin-services";
import AdminVerifications from "@/pages/admin-verifications";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import Notifications from "@/pages/notifications";
import VerifyEmail from "@/pages/verify-email";
import ValidateListing from "@/pages/validate-listing";
import SimpleValidation from "@/pages/simple-validation";
import TestValidation from "@/pages/test-validation";
import PriceTrends from "@/pages/PriceTrends";
import PremiumSignup from "@/pages/PremiumSignup";
import PremiumWelcome from "@/pages/premium-welcome";
import Help from "@/pages/help";
import { ScrollToTop } from "@/components/ScrollToTop";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-hotprop-primary rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-hotprop-primary mb-2">HotProp</h1>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Switch>
      {/* Public routes that work regardless of auth status */}
      <Route path="/validate-listing" component={SimpleValidation} />
      <Route path="/test-validation" component={TestValidation} />
      
      {!isAuthenticated ? (
        <>
          <Route path="/register" component={Register} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/" component={Login} />
          <Route component={Login} />
        </>
      ) : (
        <MobileLayout>
          <Route path="/" component={Home} />
          <Route path="/search" component={Search} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/add-listing" component={AddListing} />
          <Route path="/post-requirement" component={PostRequirement} />
          <Route path="/requirements" component={Requirements} />
          <Route path="/edit-profile" component={EditProfile} />
          <Route path="/edit-listing/:id" component={EditListing} />
          <Route path="/edit-requirement/:id" component={EditRequirement} />
          <Route path="/profile" component={Profile} />
          <Route path="/messages" component={Messages} />
          <Route path="/property/:id" component={PropertyDetails} />
          <Route path="/resources" component={Resources} />
          <Route path="/add-service-provider" component={AddServiceProvider} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/services" component={AdminServices} />
          <Route path="/admin/verifications" component={AdminVerifications} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/price-trends" component={PriceTrends} />
          <Route path="/premium" component={PremiumSignup} />
          <Route path="/premium-welcome" component={PremiumWelcome} />
          <Route path="/help" component={Help} />
        </MobileLayout>
      )}
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
