import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import logoUrl from "@assets/HotProp-Logo_1755342220119.png";

export default function Register() {
  const { register, isRegisterPending } = useAuth();
  const [, setLocation] = useLocation();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<InsertUser & { confirmPassword: string; agreeToTerms: boolean; notRealEstateAgent: boolean }>({
    resolver: zodResolver(
      insertUserSchema
        .extend({
          confirmPassword: insertUserSchema.shape.password,
          agreeToTerms: z.boolean(),
          notRealEstateAgent: z.boolean(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        })
        .refine((data) => data.agreeToTerms, {
          message: "You must agree to the terms",
          path: ["agreeToTerms"],
        })
        .refine((data) => data.notRealEstateAgent, {
          message: "You must confirm you are not a real estate agent",
          path: ["notRealEstateAgent"],
        })
    ),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      agreeToTerms: false,
      notRealEstateAgent: false,
    },
  });

  const onSubmit = (data: InsertUser & { confirmPassword: string; agreeToTerms: boolean; notRealEstateAgent: boolean }) => {
    const { confirmPassword, agreeToTerms, notRealEstateAgent, ...userData } = data;
    register(userData, {
      onSuccess: (response: any) => {
        if (response.needsVerification) {
          // Email verification required - show message and redirect to sign-in page
          const message = language === 'th' ? response.messageTH : response.message;
          toast({
            title: language === 'th' ? "ลงทะเบียนสำเร็จ! ✉️" : "Registration Successful! ✉️",
            description: message,
            duration: 10000,
          });
          // Redirect to sign-in page after successful registration
          setLocation("/");
        } else {
          // No verification needed - proceed normally
          toast({
            title: language === 'th' ? "ลงทะเบียนสำเร็จ!" : "Registration Successful!",
            description: response.message,
            duration: 5000,
          });
          // Navigate to home page after successful registration
          setLocation("/");
        }
      },
      onError: (error: any) => {
        toast({
          title: "Registration Failed",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    });
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
            <CardTitle>{t('register.title')}</CardTitle>
            <CardDescription>{t('register.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Platform Explanation */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h3 className="font-semibold text-blue-900 mb-2">{t('register.platformNotice')}</h3>
              <p className="text-sm text-blue-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('register.platformDescription') }}>
              </p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('register.firstName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('register.firstNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('register.lastName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('register.lastNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.email')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t('register.emailPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.phone')}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder={t('register.phonePlaceholder')} {...field} value={field.value || ""} />
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
                      <FormLabel>{t('register.password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder={t('register.passwordPlaceholder')} 
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('register.confirmPassword')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder={t('register.confirmPasswordPlaceholder')} 
                            className="pr-10"
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

                {/* Agent Confirmation - Required */}
                <FormField
                  control={form.control}
                  name="notRealEstateAgent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border-2 border-orange-200 rounded-lg bg-orange-50">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-semibold text-orange-900">
                          {t('register.notAgentConfirm')}
                        </FormLabel>
                        <p className="text-xs text-orange-700 mt-1">
                          {t('register.notAgentRequired')}
                        </p>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm">
                          {t('register.agreeTerms')}{" "}
                          <Button variant="link" className="p-0 h-auto text-hotprop-primary">
                            {t('register.termsOfService')}
                          </Button>
                          {" "}{t('register.and')}{" "}
                          <Button variant="link" className="p-0 h-auto text-hotprop-primary">
                            {t('register.privacyPolicy')}
                          </Button>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90"
                  disabled={isRegisterPending}
                >
                  {isRegisterPending ? t('register.creatingAccount') : t('register.createAccount')}
                </Button>
              </form>
            </Form>

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t('register.haveAccount')}{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-hotprop-primary"
                  onClick={() => setLocation("/")}
                >
                  {t('register.signIn')}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
