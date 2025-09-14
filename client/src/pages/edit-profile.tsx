import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { z } from "zod";

// Schema will use dynamic validation messages
const createEditProfileSchema = (t: (key: string) => string) => z.object({
  firstName: z.string().min(1, t('editProfile.firstNameRequired')),
  lastName: z.string().min(1, t('editProfile.lastNameRequired')),
  phone: z.string().optional(),
});

export default function EditProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  
  const editProfileSchema = createEditProfileSchema(t);
  type EditProfileData = z.infer<typeof editProfileSchema>;

  const form = useForm<EditProfileData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: EditProfileData) => {
      const response = await apiRequest("PUT", "/api/auth/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: t('editProfile.profileUpdated'),
        description: t('editProfile.profileUpdatedDesc'),
      });
      setLocation("/profile");
    },
    onError: (error: Error) => {
      toast({
        title: t('editProfile.updateFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditProfileData) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <div className="px-4 py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/profile")}
          className="mr-3"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">{t('editProfile.title')}</h1>
      </div>

      <Card>
        <CardHeader className="text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="bg-hotprop-primary text-white text-lg">
              {user.firstName[0]}{user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <CardTitle>{user.email}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('editProfile.firstName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('editProfile.firstNamePlaceholder')} {...field} />
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
                    <FormLabel>{t('editProfile.lastName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('editProfile.lastNamePlaceholder')} {...field} />
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
                    <FormLabel>{t('editProfile.phoneNumber')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('editProfile.phonePlaceholder')} 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation("/profile")}
                >
                  {t('editProfile.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-hotprop-primary hover:bg-hotprop-primary/90"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? t('editProfile.saving') : t('editProfile.saveChanges')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}