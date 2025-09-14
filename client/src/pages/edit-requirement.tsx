import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import RequirementForm from "@/components/requirement/requirement-form";
import type { BuyerRequirement } from "@shared/schema";

export default function EditRequirement() {
  const [, params] = useRoute("/edit-requirement/:id");
  const [, setLocation] = useLocation();
  const requirementId = params?.id;

  const { data: requirement, isLoading } = useQuery<BuyerRequirement>({
    queryKey: ["/api/buyer-requirements", requirementId],
    enabled: !!requirementId,
  });

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="bg-gray-200 animate-pulse rounded-2xl h-96"></div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="px-4 py-6">
        <Card>
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Requirement Not Found</h3>
            <p className="text-gray-600 mb-4">The requirement you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/profile")}>
              Back to Profile
            </Button>
          </CardContent>
        </Card>
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
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Requirement</h1>
          <p className="text-gray-600 text-sm">Update your property requirements</p>
        </div>
      </div>

      <RequirementForm 
        requirement={requirement}
        isEditing={true}
        onSuccess={() => setLocation("/profile")} 
      />
    </div>
  );
}