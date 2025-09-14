import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PropertyForm from "@/components/property/property-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Property } from "@shared/schema";

export default function EditListing() {
  const [match, params] = useRoute("/edit-listing/:id");
  const [, setLocation] = useLocation();
  const propertyId = params?.id;

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ["/api/properties", propertyId],
    enabled: !!propertyId,
  });

  // Auto-scroll to verification section if hash is present
  useEffect(() => {
    if (property && !isLoading && window.location.hash === '#verification') {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        const verificationElement = document.getElementById('verification');
        if (verificationElement) {
          verificationElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }
  }, [property, isLoading]);

  const handleSuccess = () => {
    setLocation("/profile");
  };

  if (!match || !propertyId) {
    setLocation("/profile");
    return null;
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/profile")}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Edit Listing</h1>
        </div>
        <div className="bg-gray-200 animate-pulse rounded-2xl h-96"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="px-4 py-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Property Not Found</h1>
        <Button onClick={() => setLocation("/profile")}>
          Go Back to Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/profile")}
          className="mr-3"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Listing</h1>
      </div>

      <PropertyForm 
        initialData={property} 
        isEditing={true}
        onSuccess={handleSuccess} 
      />
    </div>
  );
}