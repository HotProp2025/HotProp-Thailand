import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginCredentials } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logoUrl from "@assets/HotProp-Logo_1755342220119.png";

export default function Login() {
  const { user, login, isLoginPending, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  
  // Redirect to home page if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    login(data, {
      onSuccess: () => {
        // Redirect to home page after successful login
        setLocation("/");
      },
      onError: (error: any) => {
        // Check if the error is specifically about email verification
        if (error.message?.includes("verify your email") || error.needsVerification) {
          setShowResendVerification(true);
          // Show bilingual error message
          const errorMessage = language === 'th' && error.messageTH ? error.messageTH : error.message;
          toast({
            title: language === 'th' ? "จำเป็นต้องยืนยันอีเมล" : "Email Verification Required",
            description: errorMessage,
            variant: "destructive",
            duration: 10000,
          });
        }
      }
    });
  };

  const handleResendVerification = async (email: string) => {
    setResendingVerification(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: t('verifyEmail.resendSuccess'),
          description: t('verifyEmail.checkEmail'),
        });
        setShowResendVerification(false);
      } else {
        toast({
          title: t('verifyEmail.resendFailed'),
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('verifyEmail.resendFailed'),
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full space-y-6">
        <div className="text-center">
          <div className="mb-6 mx-auto">
            <img src={logoUrl} alt="HotProp Logo" className="h-20 w-auto mx-auto" />
          </div>
          {/* Language Selector */}
          <div className="flex justify-center mb-6">
            <LanguageSelector />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('login.welcomeBack')}</CardTitle>
            <CardDescription>{t('login.signInToContinue')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.email')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t('login.emailPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder={t('login.passwordPlaceholder')} 
                            className="pr-10"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-right mb-4">
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-hotprop-primary text-sm"
                    onClick={() => setLocation("/forgot-password")}
                    data-testid="link-forgot-password"
                  >
                    {t('forgotPassword.linkText')}
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90"
                  disabled={isLoginPending}
                >
                  {isLoginPending ? t('login.signingIn') : t('login.signIn')}
                </Button>
              </form>
            </Form>

            {/* Email Verification Resend Section */}
            {showResendVerification && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  {t('login.emailNotVerified')}
                </h3>
                <p className="text-sm text-yellow-700 mb-3">
                  {t('login.resendVerificationText')}
                </p>
                <Button
                  onClick={() => handleResendVerification(form.getValues('email'))}
                  disabled={resendingVerification}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  data-testid="button-resend-verification"
                >
                  {resendingVerification ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('login.sendingVerification')}
                    </>
                  ) : (
                    t('login.resendVerification')
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowResendVerification(false)}
                  className="w-full mt-2 text-sm"
                >
                  {t('login.cancelResend')}
                </Button>
              </div>
            )}

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t('login.noAccount')}{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-hotprop-primary"
                  onClick={() => setLocation("/register")}
                >
                  {t('login.signUp')}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>{t('login.termsAndPrivacy')}</p>
        </div>
      </div>
    </div>
  );
}
