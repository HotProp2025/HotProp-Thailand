import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Edit, Trash2, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import type { ServiceProvider } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import ServiceProviderForm from "../components/service-provider-form";

const serviceCategories = [
  { id: "legal", label: "Legal Services" },
  { id: "building", label: "Building Services" },
  { id: "architects", label: "Architects" },
  { id: "interior", label: "Interior Designers" },
  { id: "surveyors", label: "Surveyors" },
  { id: "handymen", label: "Handymen" },
  { id: "pool", label: "Pool Cleaners" },
  { id: "garden", label: "Gardeners" },
  { id: "other", label: "Other" },
];

export default function AdminServices() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const { data: serviceProviders, isLoading: isServiceProvidersLoading } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/service-providers", selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      
      const res = await fetch(`/api/service-providers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch service providers");
      return res.json();
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/service-providers/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Service provider deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-providers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service provider",
        variant: "destructive",
      });
    },
  });

  const filteredProviders = selectedCategory 
    ? serviceProviders?.filter(provider => provider.category === selectedCategory)
    : serviceProviders;

  const handleDelete = (id: string) => {
    deleteProviderMutation.mutate(id);
  };

  const handleFormSuccess = () => {
    setIsAddingNew(false);
    setEditingProvider(null);
    queryClient.invalidateQueries({ queryKey: ["/api/service-providers"] });
  };

  return (
    <>
      <div className="px-4 py-4 bg-white border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Admin - Service Providers</h1>
            <p className="text-sm text-gray-600">Manage service provider directory</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 py-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Service Categories</h3>
          <Button
            onClick={() => setIsAddingNew(true)}
            className="bg-hotprop-primary hover:bg-hotprop-primary/90"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Provider
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={selectedCategory === "" ? "default" : "outline"}
            onClick={() => setSelectedCategory("")}
            className="h-auto py-2 px-3 justify-start text-left"
            size="sm"
          >
            <span className="text-sm">All Services ({serviceProviders?.length || 0})</span>
          </Button>
          {serviceCategories.map((category) => {
            const count = serviceProviders?.filter(p => p.category === category.id).length || 0;
            const isSelected = selectedCategory === category.id;
            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="h-auto py-2 px-3 justify-start text-left"
                size="sm"
              >
                <span className="text-sm">{category.label} ({count})</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Service Providers List */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedCategory 
              ? serviceCategories.find(c => c.id === selectedCategory)?.label || "Services"
              : "All Services"
            }
          </h2>
        </div>

        {isServiceProvidersLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-32" />
            ))}
          </div>
        ) : filteredProviders && filteredProviders.length > 0 ? (
          <div className="space-y-4">
            {filteredProviders.map((provider) => (
              <AdminServiceProviderCard 
                key={provider.id} 
                provider={provider}
                onEdit={setEditingProvider}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {selectedCategory 
                ? `No ${serviceCategories.find(c => c.id === selectedCategory)?.label.toLowerCase()} found`
                : "No service providers found"
              }
            </p>
            <Button onClick={() => setIsAddingNew(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add the first service provider
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Provider Dialog */}
      <Dialog open={isAddingNew || !!editingProvider} onOpenChange={(open) => {
        if (!open) {
          setIsAddingNew(false);
          setEditingProvider(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? "Edit Service Provider" : "Add New Service Provider"}
            </DialogTitle>
          </DialogHeader>
          <ServiceProviderForm
            provider={editingProvider}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsAddingNew(false);
              setEditingProvider(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

interface AdminServiceProviderCardProps {
  provider: ServiceProvider;
  onEdit: (provider: ServiceProvider) => void;
  onDelete: (id: string) => void;
}

function AdminServiceProviderCard({ provider, onEdit, onDelete }: AdminServiceProviderCardProps) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {provider.logoUrl && (
              <img
                src={provider.logoUrl}
                alt={`${provider.companyName} logo`}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {provider.companyName}
              </CardTitle>
              <p className="text-sm text-gray-600">{provider.contactPersonName}</p>
              {provider.email && (
                <p className="text-sm text-gray-500">{provider.email}</p>
              )}
              {provider.websiteUrl && (
                <a 
                  href={provider.websiteUrl.startsWith('http') ? provider.websiteUrl : `https://${provider.websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-hotprop-primary hover:underline flex items-center gap-1 mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Visit Website
                </a>
              )}
              {provider.phoneNumber && (
                <p className="text-sm text-gray-500">{provider.phoneNumber}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={provider.isActive ? "default" : "secondary"} className="text-xs">
              {provider.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {serviceCategories.find(c => c.id === provider.category)?.label || provider.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Service Locations */}
          {provider.serviceLocations && provider.serviceLocations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Service Areas:</p>
              <div className="flex flex-wrap gap-1">
                {provider.serviceLocations.map((location, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {location}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {provider.description}
            </p>
          </div>

          {/* Admin Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onEdit(provider)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Service Provider</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{provider.companyName}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(provider.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}