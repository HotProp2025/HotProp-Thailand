import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, Home, ArrowRight } from "lucide-react";

interface ValidationResponse {
  success: boolean;
  message: string;
}

export default function ValidateListing() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const type = urlParams.get('type');
  
  console.log('ValidateListing - location:', location);
  console.log('ValidateListing - window.location.href:', window.location.href);
  console.log('ValidateListing - window.location.search:', window.location.search);
  console.log('ValidateListing - token:', token);
  console.log('ValidateListing - type:', type);

  const { data, isLoading, error } = useQuery<ValidationResponse>({
    queryKey: ['/api/validate-listing', token, type],
    queryFn: async () => {
      if (!token || !type) throw new Error('Missing token or type');
      const response = await fetch(`/api/validate-listing?token=${token}&type=${type}`);
      if (!response.ok) throw new Error('Validation failed');
      return response.json();
    },
    enabled: !!(token && type),
  });

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Validating your listing...
          </h1>
          <p className="text-gray-600">
            Please wait while we confirm your listing status.
          </p>
        </div>
      </div>
    );
  }

  // Debug information
  if (!token || !type) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Missing Parameters
          </h1>
          <div className="text-left text-sm text-gray-600 mb-6">
            <p><strong>Token:</strong> {token || 'Not found'}</p>
            <p><strong>Type:</strong> {type || 'Not found'}</p>
            <p><strong>URL:</strong> {window.location.href}</p>
            <p><strong>Search:</strong> {window.location.search}</p>
          </div>
          <Button onClick={handleGoHome} className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Validation Error
          </h1>
          <p className="text-gray-600 mb-6">
            Unable to validate your listing. Please try again later.
          </p>
          <div className="text-left text-xs text-gray-500 mb-6">
            <p>Error: {String(error)}</p>
          </div>
          <Button onClick={handleGoHome} className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  if (data?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            ✅ Validation Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            {data.message}
          </p>
          <div className="space-y-3">
            <Button onClick={handleGoToDashboard} className="w-full">
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to My Dashboard
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Back to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Validation Failed
        </h1>
        <p className="text-gray-600 mb-6">
          {data?.message || 'Unable to validate your listing. The link may have expired or already been used.'}
        </p>
        <div className="space-y-3">
          <Button onClick={handleGoToDashboard} className="w-full">
            <ArrowRight className="h-4 w-4 mr-2" />
            Go to My Dashboard
          </Button>
          <Button variant="outline" onClick={handleGoHome} className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Back to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
}