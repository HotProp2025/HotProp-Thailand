import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Clock, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ListingStatusProps {
  id: string;
  type: 'property' | 'requirement';
  isActive: boolean;
  title: string;
  lastValidated?: string | null;
  lastValidationReminder?: string | null;
  validationExpires?: string | null;
  validationResponseReceived?: boolean | null;
  onReactivate?: () => void;
}

export default function ListingStatus({
  id,
  type,
  isActive,
  title,
  lastValidated,
  lastValidationReminder,
  validationExpires,
  validationResponseReceived,
  onReactivate
}: ListingStatusProps) {
  const [isReactivating, setIsReactivating] = useState(false);
  const { toast } = useToast();

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const endpoint = type === 'property' ? '/api/reactivate-property' : '/api/reactivate-requirement';
      const bodyKey = type === 'property' ? 'propertyId' : 'requirementId';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ [bodyKey]: id })
      });

      if (response.ok) {
        toast({
          title: "Reactivated Successfully",
          description: `Your ${type} "${title}" has been reactivated and is now visible on the platform.`,
        });
        
        // Invalidate relevant queries to refresh the data
        if (type === 'property') {
          await queryClient.invalidateQueries({ queryKey: ['/api/my-properties'] });
        } else {
          await queryClient.invalidateQueries({ queryKey: ['/api/my-requirements'] });
        }
        
        onReactivate?.();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reactivate');
      }
    } catch (error: any) {
      toast({
        title: "Reactivation Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReactivating(false);
    }
  };

  const getValidationStatus = () => {
    if (!isActive) {
      return {
        status: 'inactive',
        message: 'This listing was deactivated due to missed validation',
        color: 'destructive' as const,
        icon: AlertCircle
      };
    }

    if (validationExpires && new Date(validationExpires) > new Date()) {
      return {
        status: 'pending',
        message: `Validation required by ${new Date(validationExpires).toLocaleDateString()}`,
        color: 'warning' as const,
        icon: Clock
      };
    }

    return {
      status: 'active',
      message: 'Listing is active and verified',
      color: 'default' as const,
      icon: CheckCircle
    };
  };

  const validation = getValidationStatus();
  const Icon = validation.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${validation.status === 'active' ? 'text-green-500' : validation.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`} />
          <Badge variant={validation.color === 'warning' ? 'secondary' : validation.color}>
            {validation.status === 'active' ? 'Active' : validation.status === 'pending' ? 'Validation Pending' : 'Inactive'}
          </Badge>
        </div>
        
        {!isActive && (
          <Button
            onClick={handleReactivate}
            disabled={isReactivating}
            size="sm"
            className="bg-hotprop-primary hover:bg-hotprop-primary/90"
          >
            {isReactivating ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                Reactivating...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reactivate
              </>
            )}
          </Button>
        )}
      </div>

      {validation.status !== 'active' && (
        <Alert variant={validation.status === 'pending' ? 'default' : 'destructive'}>
          <Icon className="h-4 w-4" />
          <AlertDescription>{validation.message}</AlertDescription>
        </Alert>
      )}

      {!isActive && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Don't worry! You can reactivate this {type} anytime by clicking the "Reactivate" button above. 
            Once reactivated, it will be visible on the platform again.
          </AlertDescription>
        </Alert>
      )}

      {lastValidated && (
        <div className="text-xs text-gray-500">
          Last validated: {new Date(lastValidated).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}