import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocumentCapture } from "./DocumentCapture";
import { Shield, CheckCircle, Clock, AlertCircle, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PropertyVerificationProps {
  propertyId?: string;
  verificationStatus?: string;
  verificationNotes?: string;
  isOwner: boolean;
  isPremiumUser: boolean;
  onVerificationSubmitted?: () => void;
}

export function PropertyVerification({ 
  propertyId, 
  verificationStatus = "none",
  verificationNotes,
  isOwner, 
  isPremiumUser,
  onVerificationSubmitted 
}: PropertyVerificationProps) {
  const [showChanoteCapture, setShowChanoteCapture] = useState(false);
  const [showIdCapture, setShowIdCapture] = useState(false);
  const [chanoteFile, setChanoteFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Don't show anything if user is not the owner or not premium
  if (!isOwner || !isPremiumUser) {
    return null;
  }

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case "verified":
        return (
          <Badge className="bg-green-500 text-white" data-testid="badge-verified">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified Owner
          </Badge>
        );
      case "requested":
      case "pending":
        return (
          <Badge className="bg-yellow-500 text-white" data-testid="badge-pending">
            <Clock className="w-3 h-3 mr-1" />
            Verification Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 text-white" data-testid="badge-rejected">
            <AlertCircle className="w-3 h-3 mr-1" />
            Verification Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" data-testid="badge-unverified">
            <Shield className="w-3 h-3 mr-1" />
            Not Verified
          </Badge>
        );
    }
  };

  const getUploadUrl = async (documentType: 'chanote' | 'id') => {
    if (!propertyId) {
      throw new Error("Property ID is required for verification");
    }
    
    const response = await fetch(`/api/properties/${propertyId}/verification/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
      },
      body: JSON.stringify({ documentType })
    });

    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }

    const data = await response.json();
    
    return {
      method: "PUT" as const,
      url: data.uploadURL
    };
  };

  const uploadDocument = async (file: File, documentType: 'chanote' | 'id') => {
    try {
      const { url } = await getUploadUrl(documentType);
      
      // Upload file to the presigned URL
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return url.split('?')[0]; // Return URL without query parameters
    } catch (error) {
      console.error(`Error uploading ${documentType}:`, error);
      throw error;
    }
  };

  const handleChanoteCapture = (file: File) => {
    setChanoteFile(file);
    setShowChanoteCapture(false);
    toast({
      title: "Chanote Captured",
      description: "Chanote document photo has been captured successfully.",
    });
  };

  const handleIdCapture = (file: File) => {
    setIdFile(file);
    setShowIdCapture(false);
    toast({
      title: "ID Captured", 
      description: "ID/Passport photo has been captured successfully.",
    });
  };

  const submitVerification = async () => {
    if (!propertyId || !chanoteFile || !idFile) {
      toast({
        title: "Documents Required",
        description: "Please capture both chanote and ID documents before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload both documents
      const [chanoteUrl, idUrl] = await Promise.all([
        uploadDocument(chanoteFile, 'chanote'),
        uploadDocument(idFile, 'id')
      ]);

      // Submit verification request
      const response = await fetch(`/api/properties/${propertyId}/verification/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        },
        body: JSON.stringify({
          chanoteDocumentURL: chanoteUrl,
          idDocumentURL: idUrl
        })
      });

      if (!response.ok) {
        throw new Error("Failed to submit verification");
      }

      toast({
        title: "Verification Submitted",
        description: "Your ownership verification request has been submitted for review.",
      });

      // Clear captured files
      setChanoteFile(null);
      setIdFile(null);
      
      // Notify parent component
      onVerificationSubmitted?.();
      
    } catch (error) {
      console.error('Verification submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit verification request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verificationStatus === "verified") {
    return (
      <Alert className="border-green-200 bg-green-50" data-testid="alert-verified">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <span>This property has verified ownership</span>
            {getStatusBadge()}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (verificationStatus === "requested" || verificationStatus === "pending") {
    return (
      <Alert className="border-yellow-200 bg-yellow-50" data-testid="alert-pending">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="flex items-center justify-between">
            <span>Ownership verification is under review</span>
            {getStatusBadge()}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mt-6" data-testid="card-verification">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Ownership Verification
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Verify your property ownership to build trust with potential buyers/renters. 
          This optional feature requires photos of your chanote and ID/passport for name verification.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {verificationStatus === "rejected" && (
          <Alert className="border-red-200 bg-red-50" data-testid="alert-rejected">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <div>Your previous verification request was rejected.</div>
                {verificationNotes && (
                  <div className="text-sm bg-red-100 p-2 rounded border border-red-200">
                    <strong>Reason:</strong> {verificationNotes}
                  </div>
                )}
                <div className="text-sm">You can try again with clearer documents.</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Chanote Document</label>
            <Button
              type="button"
              onClick={() => setShowChanoteCapture(true)}
              variant={chanoteFile ? "default" : "outline"}
              className="w-full h-20 flex flex-col items-center gap-2"
              data-testid="button-capture-chanote"
            >
              <Camera className="h-6 w-6" />
              <span>{chanoteFile ? "Chanote Captured" : "Capture Chanote"}</span>
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">ID/Passport</label>
            <Button
              type="button"
              onClick={() => setShowIdCapture(true)}
              variant={idFile ? "default" : "outline"}
              className="w-full h-20 flex flex-col items-center gap-2"
              data-testid="button-capture-id"
            >
              <Camera className="h-6 w-6" />
              <span>{idFile ? "ID Captured" : "Capture ID/Passport"}</span>
            </Button>
          </div>
        </div>

        {chanoteFile && idFile && (
          <Button
            type="button"
            onClick={submitVerification}
            disabled={isSubmitting}
            className="w-full"
            data-testid="button-submit-verification"
          >
            {isSubmitting ? "Submitting..." : "Submit for Verification"}
          </Button>
        )}

        <DocumentCapture
          documentType="chanote"
          onCapture={handleChanoteCapture}
          onCancel={() => setShowChanoteCapture(false)}
          isOpen={showChanoteCapture}
        />

        <DocumentCapture
          documentType="id"
          onCapture={handleIdCapture}
          onCancel={() => setShowIdCapture(false)}
          isOpen={showIdCapture}
        />
      </CardContent>
    </Card>
  );
}