import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Shield, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { isAdmin, isLoading, isAuthenticated } = useAuth();

  // Admin access control
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-hotprop-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">You must be logged in to access the admin panel.</p>
          <Button onClick={() => setLocation("/")} className="bg-hotprop-primary hover:bg-hotprop-primary/90">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin privileges to access this page.</p>
          <Button onClick={() => setLocation("/")} className="bg-hotprop-primary hover:bg-hotprop-primary/90">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl" data-testid="admin-dashboard">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-4 text-hotprop-primary hover:text-hotprop-primary/80"
          data-testid="button-back-home"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage platform features and content.</p>
      </div>

      {/* Admin Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Property Verifications */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/admin/verifications")}>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Property Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Review and manage property ownership verification requests from premium users.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div>• Review chanote and ID documents</div>
              <div>• Approve or reject verification requests</div>
              <div>• Send notifications to property owners</div>
            </div>
            <Button 
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
              data-testid="button-verifications"
            >
              Manage Verifications
            </Button>
          </CardContent>
        </Card>

        {/* Service Providers */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/admin/services")}>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="w-5 h-5 mr-2 text-green-600" />
              Service Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Manage service providers and their offerings on the platform.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div>• Review and approve service providers</div>
              <div>• Manage service categories</div>
              <div>• Monitor service quality</div>
            </div>
            <Button 
              className="w-full mt-4 bg-green-600 hover:bg-green-700"
              data-testid="button-services"
            >
              Manage Services
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}