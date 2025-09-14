import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { insertServiceProviderSchema, type InsertServiceProvider, type ServiceProvider } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const serviceCategories = [
  { value: "legal", label: "Legal Services" },
  { value: "building", label: "Building Services" },
  { value: "architects", label: "Architects" },
  { value: "interior", label: "Interior Designers" },
  { value: "surveyors", label: "Surveyors" },
  { value: "handymen", label: "Handymen" },
  { value: "pool", label: "Pool Cleaners" },
  { value: "garden", label: "Gardeners" },
  { value: "other", label: "Other" },
];

interface ServiceProviderFormProps {
  provider?: ServiceProvider | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ServiceProviderForm({ provider, onSuccess, onCancel }: ServiceProviderFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [serviceLocations, setServiceLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState("");

  const isEditing = !!provider;

  const form = useForm<InsertServiceProvider>({
    resolver: zodResolver(insertServiceProviderSchema.extend({
      description: insertServiceProviderSchema.shape.description.refine((val) => {
        const wordCount = val.trim().split(/\s+/).length;
        return wordCount <= 70;
      }, "Description must be 70 words or less")
    })),
    defaultValues: {
      userId: user?.id || "",
      category: provider?.category || "",
      companyName: provider?.companyName || "",
      contactPersonName: provider?.contactPersonName || "",
      email: provider?.email || "",
      serviceLocations: [],
      description: provider?.description || "",
      phoneNumber: provider?.phoneNumber || "",
      logoUrl: provider?.logoUrl || "",
      websiteUrl: provider?.websiteUrl || "",
      isActive: provider?.isActive ?? true,
    },
  });

  // Set initial service locations
  useEffect(() => {
    if (provider?.serviceLocations) {
      setServiceLocations(provider.serviceLocations);
    }
  }, [provider]);

  const saveProviderMutation = useMutation({
    mutationFn: async (data: InsertServiceProvider) => {
      const endpoint = isEditing 
        ? `/api/service-providers/${provider.id}` 
        : "/api/service-providers";
      const method = isEditing ? "PUT" : "POST";
      
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Service provider ${isEditing ? "updated" : "added"} successfully!`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "add"} service provider`,
        variant: "destructive",
      });
    },
  });

  const addLocation = () => {
    if (newLocation.trim() && !serviceLocations.includes(newLocation.trim())) {
      setServiceLocations([...serviceLocations, newLocation.trim()]);
      setNewLocation("");
    }
  };

  const removeLocation = (location: string) => {
    setServiceLocations(serviceLocations.filter(l => l !== location));
  };

  const onSubmit = (data: InsertServiceProvider) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to manage service providers",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...data,
      userId: user.id,
      serviceLocations,
    };

    saveProviderMutation.mutate(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Category *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {serviceCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactPersonName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Person Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter contact person name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address *</FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder="Enter business email address" 
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Service Locations</FormLabel>
          <div className="flex gap-2 mt-2">
            <Input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Add service location"
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
            />
            <Button type="button" onClick={addLocation} variant="outline" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {serviceLocations.map((location, index) => (
              <Badge key={index} variant="secondary" className="px-2 py-1">
                {location}
                <X
                  className="w-3 h-3 ml-1 cursor-pointer"
                  onClick={() => removeLocation(location)}
                />
              </Badge>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description of Services * (Max 70 words)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the services offered..."
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="websiteUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website URL (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.example.com" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="logoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo URL (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter logo image URL" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <div className="text-sm text-gray-600">
                  Control whether this service provider is visible to users
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={saveProviderMutation.isPending}
            className="flex-1 bg-hotprop-primary hover:bg-hotprop-primary/90"
          >
            {saveProviderMutation.isPending 
              ? (isEditing ? "Updating..." : "Adding...") 
              : (isEditing ? "Update Provider" : "Add Provider")
            }
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saveProviderMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}