import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, RotateCcw, Trash2, Home, User, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ValidationItem {
  id: string;
  title: string;
  type: 'property' | 'requirement';
  isActive: boolean;
  lastValidated: string;
  validationExpires?: string;
  needsValidation: boolean;
  owner?: {
    firstName: string;
    lastName: string;
  };
}

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function ValidationModal({ isOpen, onClose, userId }: ValidationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch validation items from backend
  const { data: validationItems = [], isLoading } = useQuery<ValidationItem[]>({
    queryKey: [`/api/validation-items/${userId}`],
    enabled: isOpen && !!userId,
  });

  // Mutation for confirming a listing
  const confirmListingMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'property' | 'requirement' }) => {
      const endpoint = type === 'property' ? '/api/confirm-property' : '/api/confirm-requirement';
      const response = await apiRequest('POST', endpoint, { 
        [type === 'property' ? 'propertyId' : 'requirementId']: id 
      });
      return response.json();
    },
    onSuccess: (_, { type }) => {
      toast({ 
        title: "Success!", 
        description: `${type === 'property' ? 'Property' : 'Requirement'} confirmed successfully` 
      });
      queryClient.invalidateQueries({ queryKey: [`/api/validation-items/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (_, { type }) => {
      toast({ 
        title: "Error", 
        description: `Failed to confirm ${type}`, 
        variant: "destructive" 
      });
    }
  });

  // Mutation for reactivating a listing
  const reactivateListingMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'property' | 'requirement' }) => {
      const endpoint = type === 'property' ? '/api/reactivate-property' : '/api/reactivate-requirement';
      const response = await apiRequest('POST', endpoint, { 
        [type === 'property' ? 'propertyId' : 'requirementId']: id 
      });
      return response.json();
    },
    onSuccess: (_, { type }) => {
      toast({ 
        title: "Success!", 
        description: `${type === 'property' ? 'Property' : 'Requirement'} reactivated successfully` 
      });
      queryClient.invalidateQueries({ queryKey: [`/api/validation-items/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (_, { type }) => {
      toast({ 
        title: "Error", 
        description: `Failed to reactivate ${type}`, 
        variant: "destructive" 
      });
    }
  });

  // Mutation for deleting a listing
  const deleteListingMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'property' | 'requirement' }) => {
      const endpoint = type === 'property' ? `/api/properties/${id}` : `/api/requirements/${id}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`Failed to delete ${type}`);
      return response.json();
    },
    onSuccess: (_, { type }) => {
      toast({ 
        title: "Success!", 
        description: `${type === 'property' ? 'Property' : 'Requirement'} deleted successfully` 
      });
      queryClient.invalidateQueries({ queryKey: [`/api/validation-items/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (_, { type }) => {
      toast({ 
        title: "Error", 
        description: `Failed to delete ${type}`, 
        variant: "destructive" 
      });
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isExpiringSoon = (expiresString?: string) => {
    if (!expiresString) return false;
    const expires = new Date(expiresString);
    const now = new Date();
    const hoursUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0;
  };

  const isExpired = (expiresString?: string) => {
    if (!expiresString) return false;
    return new Date(expiresString) < new Date();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-validation">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Listing Validation Required
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-24" />
            ))}
          </div>
        ) : validationItems.length === 0 ? (
          <div className="text-center py-8">
            <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All listings confirmed</h3>
            <p className="text-gray-500">
              All your properties and requirements are up to date and confirmed.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-gray-600 mb-4">
              Please confirm that your listings are still available and accurate. Items not confirmed within 24 hours will be automatically deactivated.
            </p>
            
            {validationItems.map((item) => (
              <div 
                key={item.id} 
                className={`border rounded-lg p-4 ${
                  !item.isActive ? 'bg-red-50 border-red-200' : 
                  isExpired(item.validationExpires) ? 'bg-red-50 border-red-200' :
                  isExpiringSoon(item.validationExpires) ? 'bg-yellow-50 border-yellow-200' : 
                  'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {item.type === 'property' ? (
                        <Home className="h-4 w-4 text-hotprop-primary" />
                      ) : (
                        <User className="h-4 w-4 text-hotprop-primary" />
                      )}
                      <h3 className="font-semibold text-gray-900" data-testid={`text-validation-title-${item.id}`}>
                        {item.title}
                      </h3>
                      <Badge 
                        variant={item.type === 'property' ? 'default' : 'secondary'}
                        className="text-xs"
                        data-testid={`badge-type-${item.id}`}
                      >
                        {item.type === 'property' ? 'Property' : 'Requirement'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>Last validated: {formatDate(item.lastValidated)}</span>
                      {item.validationExpires && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Expires: {formatDate(item.validationExpires)}
                        </span>
                      )}
                    </div>

                    {!item.isActive && (
                      <Badge variant="destructive" className="mb-2">
                        Deactivated
                      </Badge>
                    )}
                    
                    {isExpired(item.validationExpires) && item.isActive && (
                      <Badge variant="destructive" className="mb-2">
                        Expired - Needs Reactivation
                      </Badge>
                    )}
                    
                    {isExpiringSoon(item.validationExpires) && item.isActive && (
                      <Badge className="mb-2 bg-yellow-100 text-yellow-800">
                        Expires Soon
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  {item.isActive && !isExpired(item.validationExpires) ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => confirmListingMutation.mutate({ id: item.id, type: item.type })}
                      disabled={confirmListingMutation.isPending}
                      data-testid={`button-confirm-${item.id}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {confirmListingMutation.isPending ? 'Confirming...' : 'Confirm'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reactivateListingMutation.mutate({ id: item.id, type: item.type })}
                      disabled={reactivateListingMutation.isPending}
                      className="text-hotprop-primary border-hotprop-primary hover:bg-hotprop-primary hover:text-white"
                      data-testid={`button-reactivate-${item.id}`}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {reactivateListingMutation.isPending ? 'Reactivating...' : 'Reactivate'}
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteListingMutation.mutate({ id: item.id, type: item.type })}
                    disabled={deleteListingMutation.isPending}
                    data-testid={`button-delete-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {deleteListingMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}