import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff } from "lucide-react";
import logoUrl from "@assets/HotProp-Logo_1755342220119.png";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    setToken(tokenParam);
  }, []);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast({
        title: t('resetPassword.error'),
        description: t('resetPassword.invalidToken'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", {
        token,
        password: data.password,
      });
      
      if (res.ok) {
        toast({
          title: t('resetPassword.success'),
          description: t('resetPassword.successDescription'),
        });
        setLocation("/login");
      } else {
        const errorData = await res.json();
        toast({
          title: t('resetPassword.error'),
          description: errorData.message || t('resetPassword.tryAgain'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('resetPassword.error'),
        description: t('resetPassword.tryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="w-full space-y-6">
          <div className="text-center">
            <div className="mb-6 mx-auto">
              <img src={logoUrl} alt="HotProp Logo" className="h-20 w-auto mx-auto" />
            </div>
            <div className="flex justify-center mb-6">
              <LanguageSelector />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('resetPassword.invalidToken')}</CardTitle>
              <CardDescription>{t('resetPassword.invalidTokenDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                variant="outline"
                onClick={() => setLocation("/forgot-password")}
                data-testid="button-request-new-reset"
              >
                {t('resetPassword.requestNew')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full space-y-6">
        <div className="text-center">
          <div className="mb-6 mx-auto">
            <img src={logoUrl} alt="HotProp Logo" className="h-20 w-auto mx-auto" />
          </div>
          <div className="flex justify-center mb-6">
            <LanguageSelector />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('resetPassword.title')}</CardTitle>
            <CardDescription>{t('resetPassword.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('resetPassword.newPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder={t('resetPassword.passwordPlaceholder')} 
                            className="pr-10"
                            data-testid="input-new-password"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-new-password"
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('resetPassword.confirmPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder={t('resetPassword.confirmPasswordPlaceholder')} 
                            className="pr-10"
                            data-testid="input-confirm-password"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            data-testid="button-toggle-confirm-password"
                          >
                            {showConfirmPassword ? (
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

                <Button 
                  type="submit" 
                  className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90"
                  disabled={isSubmitting}
                  data-testid="button-reset-password"
                >
                  {isSubmitting ? t('resetPassword.resetting') : t('resetPassword.resetPassword')}
                </Button>
              </form>
            </Form>

            <div className="text-center mt-6">
              <Button
                variant="link"
                className="p-0 h-auto text-hotprop-primary"
                onClick={() => setLocation("/login")}
                data-testid="link-back-to-login"
              >
                {t('resetPassword.backToLogin')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}