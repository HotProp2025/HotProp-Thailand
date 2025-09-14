import { useState } from "react";
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
import logoUrl from "@assets/HotProp-Logo_1755342220119.png";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", data);
      if (res.ok) {
        setEmailSent(true);
        toast({
          title: t('forgotPassword.emailSent'),
          description: t('forgotPassword.emailSentDescription'),
        });
      } else {
        const errorData = await res.json();
        toast({
          title: t('forgotPassword.error'),
          description: errorData.message || t('forgotPassword.tryAgain'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('forgotPassword.error'),
        description: t('forgotPassword.tryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
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
              <CardTitle>{t('forgotPassword.emailSent')}</CardTitle>
              <CardDescription>{t('forgotPassword.checkEmail')}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-600">{t('forgotPassword.emailSentInstructions')}</p>
              <Button
                variant="outline"
                onClick={() => setLocation("/login")}
                data-testid="button-back-to-login"
              >
                {t('forgotPassword.backToLogin')}
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
            <CardTitle>{t('forgotPassword.title')}</CardTitle>
            <CardDescription>{t('forgotPassword.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('forgotPassword.email')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder={t('forgotPassword.emailPlaceholder')} 
                          data-testid="input-email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90"
                  disabled={isSubmitting}
                  data-testid="button-send-reset-email"
                >
                  {isSubmitting ? t('forgotPassword.sending') : t('forgotPassword.sendResetEmail')}
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
                {t('forgotPassword.backToLogin')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}