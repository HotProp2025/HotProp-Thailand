import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const [location] = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

  // Extract token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. Please check your email for the correct link.");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified successfully!");
          toast({
            title: "Email Verified!",
            description: "Your account has been verified. You can now log in.",
          });
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed. The link may be invalid or expired.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    };

    verifyEmail();
  }, [token, toast]);

  const handleResendVerification = async () => {
    if (!resendEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address to resend verification.",
        variant: "destructive",
      });
      return;
    }

    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Verification email sent!",
          description: "Please check your email for the verification link.",
        });
        setResendEmail("");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send verification email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "verifying":
        return <Loader2 className="w-12 h-12 text-hotprop-primary animate-spin" />;
      case "success":
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case "error":
        return <AlertCircle className="w-12 h-12 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "verifying":
        return "text-hotprop-primary";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">{getStatusIcon()}</div>
          <div className="space-y-2">
            <CardTitle className={`text-2xl ${getStatusColor()}`}>
              {status === "verifying" && "Verifying Email"}
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
            <CardDescription className="text-center">
              {message}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "success" && (
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-600">
                Welcome to HotProp! Your account is now ready to use.
              </div>
              <Button 
                className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90"
                onClick={() => window.location.href = "/login"}
              >
                Go to Login
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Need a new verification link?
                </h3>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hotprop-primary focus:border-transparent"
                  />
                  <Button
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = "/"}
                  className="text-hotprop-primary border-hotprop-primary hover:bg-hotprop-primary/10"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          )}

          {status === "verifying" && (
            <div className="text-center text-sm text-gray-600">
              Please wait while we verify your email address...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}