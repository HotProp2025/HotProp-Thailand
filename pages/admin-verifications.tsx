import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shield, Eye, Check, X, Calendar, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatPropertyPrice } from "@/lib/currency";
import type { PropertyWithOwnerInfo } from "@shared/schema";

interface DocumentViewerProps {
  title: string;
  documentUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

function DocumentViewer({ title, documentUrl, isOpen, onClose }: DocumentViewerProps) {
  const isPdf = documentUrl.toLowerCase().includes('.pdf') || documentUrl.includes('application/pdf');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-document-viewer">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {isPdf ? (
            <iframe
              src={documentUrl}
              className="w-full h-[70vh] border rounded"
              title={title}
              data-testid="iframe-pdf-viewer"
            />
          ) : (
            <img
              src={documentUrl}
              alt={title}
              className="w-full h-auto max-h-[70vh] object-contain rounded border"
              data-testid="img-document-viewer"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface VerificationCardProps {
  property: PropertyWithOwnerInfo;
  onApprove: (propertyId: string) => void;
  onReject: (propertyId: string, reason: string) => void;
  isProcessing: boolean;
}

function VerificationCard({ property, onApprove, onReject, isProcessing }: VerificationCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showChanoteViewer, setShowChanoteViewer] = useState(false);
  const [showIdViewer, setShowIdViewer] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleReject = () => {
    onReject(property.id, rejectReason);
    setShowRejectDialog(false);
    setRejectReason("");
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Card className="mb-4" data-testid={`verification-card-${property.id}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{property.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(property.verificationRequestedAt)}
                </Badge>
                {property.ownerIsPremium && (
                  <Badge className="bg-yellow-500 text-white">Premium Owner</Badge>
                )}
              </div>
            </div>
            <Badge 
              variant="outline" 
              className="text-blue-600 border-blue-200"
              data-testid="badge-verification-status"
            >
              <Shield className="w-3 h-3 mr-1" />
              {property.verificationStatus === 'requested' ? 'Pending Review' : 'Under Review'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Property Details</h4>
              <p className="text-sm text-gray-600 flex items-center mb-1">
                <MapPin className="w-3 h-3 mr-1" />
                {property.city}, {property.state}
              </p>
              <div className="text-sm font-medium text-hotprop-primary">
                {(() => {
                  const formattedPrice = formatPropertyPrice(property.price, property.currency || "USD", property.transactionType, property.rentPrice || undefined, property.rentCurrency || undefined);
                  
                  if (typeof formattedPrice === 'object' && formattedPrice.type === 'dual') {
                    return (
                      <div>
                        <div>Sale: {formattedPrice.sale}</div>
                        <div>Rent: {formattedPrice.rent}</div>
                      </div>
                    );
                  }
                  
                  return formattedPrice as string;
                })()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Type: {property.propertyType} • Transaction: {property.transactionType}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Verification Documents</h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowChanoteViewer(true)}
                  className="flex-1"
                  data-testid="button-view-chanote"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Chanote
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowIdViewer(true)}
                  className="flex-1"
                  data-testid="button-view-id"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View ID/Passport
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t">
            <Button
              onClick={() => onApprove(property.id)}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
              data-testid="button-approve-verification"
            >
              <Check className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              onClick={() => setShowRejectDialog(true)}
              disabled={isProcessing}
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              data-testid="button-reject-verification"
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Viewers */}
      {property.chanoteDocumentPath && (
        <DocumentViewer
          title="Chanote Document"
          documentUrl={property.chanoteDocumentPath}
          isOpen={showChanoteViewer}
          onClose={() => setShowChanoteViewer(false)}
        />
      )}

      {property.idDocumentPath && (
        <DocumentViewer
          title="ID/Passport Document"
          documentUrl={property.idDocumentPath}
          isOpen={showIdViewer}
          onClose={() => setShowIdViewer(false)}
        />
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent data-testid="dialog-reject-verification">
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Reason for rejection</Label>
              <Textarea
                id="reject-reason"
                placeholder="Please provide a reason for rejecting this verification request..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1"
                data-testid="textarea-reject-reason"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                data-testid="button-cancel-reject"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-reject"
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminVerifications() {
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

  // Fetch pending verifications
  const { data: pendingVerifications, isLoading: isLoadingVerifications } = useQuery<PropertyWithOwnerInfo[]>({
    queryKey: ["/api/admin/verifications/pending"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Approve verification mutation
  const approveMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await fetch(`/api/admin/verifications/${propertyId}/approve`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to approve verification");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification Approved",
        description: "The property verification has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications/pending"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve verification. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject verification mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ propertyId, reason }: { propertyId: string; reason: string }) => {
      const response = await fetch(`/api/admin/verifications/${propertyId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject verification");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification Rejected",
        description: "The property verification has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications/pending"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject verification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (propertyId: string) => {
    approveMutation.mutate(propertyId);
  };

  const handleReject = (propertyId: string, reason: string) => {
    rejectMutation.mutate({ propertyId, reason });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl" data-testid="admin-verifications-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Verification Requests</h1>
        <p className="text-gray-600">Review and manage ownership verification requests from premium users.</p>
      </div>

      {isLoadingVerifications ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-hotprop-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading verification requests...</p>
        </div>
      ) : !pendingVerifications || pendingVerifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Verifications</h3>
            <p className="text-gray-600">There are currently no property verification requests to review.</p>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="mb-4 text-sm text-gray-600">
            {pendingVerifications.length} verification request{pendingVerifications.length !== 1 ? 's' : ''} pending review
          </div>
          
          {pendingVerifications.map((property) => (
            <VerificationCard
              key={property.id}
              property={property}
              onApprove={handleApprove}
              onReject={handleReject}
              isProcessing={approveMutation.isPending || rejectMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}