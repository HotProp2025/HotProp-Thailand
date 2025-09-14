import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBuyerRequirementSchema, type InsertBuyerRequirement, type BuyerRequirement } from "@shared/schema";
import { getCountries, getStates } from "@shared/location-data";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";

// Static arrays moved to component functions to support translation

interface RequirementFormProps {
  requirement?: BuyerRequirement;
  isEditing?: boolean;
  onSuccess?: () => void;
}

export default function RequirementForm({ requirement, isEditing = false, onSuccess }: RequirementFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [amenities, setAmenities] = useState<string[]>(requirement?.requiredAmenities || []);
  const [newAmenity, setNewAmenity] = useState("");
  const [isAmenitiesOpen, setIsAmenitiesOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>(requirement?.country || "");
  const [availableStates, setAvailableStates] = useState<Array<{code: string, name: string}>>([]);

  // Translated arrays
  const getPropertyTypes = () => [
    { value: "house", label: t('propertyType.house') },
    { value: "apartment", label: t('propertyType.apartment') },
    { value: "land", label: t('propertyType.land') },
    { value: "townhouse", label: t('propertyType.townhouse') },
    { value: "poolvilla", label: t('propertyType.poolvilla') },
  ];

  const getTransactionTypes = () => [
    { value: "buy", label: t('transactionType.buy') },
    { value: "rent", label: t('transactionType.rent') },
    { value: "buy_or_rent", label: t('transactionType.buy_or_rent') },
  ];

  const getCurrencies = () => [
    { value: "USD", label: t('currency.USD') },
    { value: "THB", label: t('currency.THB') },
  ];

  const getAreaUnits = () => [
    { value: "sqm", label: t('unit.sqmDetailed') },
    { value: "sqw", label: t('unit.sqwDetailed') },
  ];

  const getUrgencyLevels = () => [
    { value: "flexible", label: t('urgency.flexible') },
    { value: "normal", label: t('urgency.normal') },
    { value: "urgent", label: t('urgency.urgent') },
  ];

  const getPredefinedAmenities = () => [
    t('amenity.carPark'),
    t('amenity.coveredCarPark'),
    t('amenity.garden'),
    t('amenity.childrenPlayground'),
    t('amenity.communalPool'),
    t('amenity.privatePool'),
    t('amenity.sauna'),
    t('amenity.gym'),
    t('amenity.nearBeach'),
    t('amenity.nearSchool'),
    t('amenity.nearHospital'),
    t('amenity.nearRestaurants'),
    t('amenity.nearConvenience'),
    t('amenity.quietLocation'),
    t('amenity.seaView'),
    t('amenity.mountainView'),
    t('amenity.lakeView'),
    t('amenity.gardenView'),
    t('amenity.balcony'),
    t('amenity.rooftopTerrace'),
    t('amenity.petsOk'),
    t('amenity.laundryFacilities'),
    t('amenity.internetWifi'),
    t('amenity.security24h'),
  ];

  // Get location data with current language preference
  const getCountryOptions = () => {
    const language = t('lang') === 'th' ? 'th' : 'en';
    return getCountries(language);
  };

  const getStateOptions = (countryCode: string) => {
    const language = t('lang') === 'th' ? 'th' : 'en';
    return getStates(countryCode, language);
  };

  // Update available states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const states = getStateOptions(selectedCountry);
      setAvailableStates(states);
    } else {
      setAvailableStates([]);
    }
  }, [selectedCountry, t]);

  // Initialize states for existing data
  useEffect(() => {
    if (requirement?.country) {
      setSelectedCountry(requirement.country);
    }
  }, [requirement]);

  const form = useForm<InsertBuyerRequirement>({
    resolver: zodResolver(insertBuyerRequirementSchema),
    defaultValues: requirement ? {
      buyerId: requirement.buyerId,
      title: requirement.title,
      description: requirement.description || "",
      propertyType: requirement.propertyType,
      transactionType: requirement.transactionType,
      minPrice: requirement.minPrice || "",
      maxPrice: requirement.maxPrice || "",
      // New separate price fields for buy_or_rent transactions
      minPurchasePrice: requirement.minPurchasePrice || "",
      maxPurchasePrice: requirement.maxPurchasePrice || "",
      minRentPrice: requirement.minRentPrice || "",
      maxRentPrice: requirement.maxRentPrice || "",
      currency: requirement.currency,
      city: requirement.city,
      state: requirement.state || "",
      country: requirement.country,
      minBedrooms: requirement.minBedrooms,
      minBathrooms: requirement.minBathrooms,
      minArea: requirement.minArea || "",
      maxArea: requirement.maxArea || "",
      areaUnit: requirement.areaUnit,
      minBuildSize: requirement.minBuildSize || "",
      minLandSize: requirement.minLandSize || "",
      landSizeUnit: requirement.landSizeUnit,
      urgency: requirement.urgency,
      contactEmail: requirement.contactEmail,
      contactPhone: requirement.contactPhone || "",
      requiredAmenities: requirement.requiredAmenities || [],
    } : {
      buyerId: user?.id || "",
      title: "",
      description: "",
      propertyType: undefined,
      transactionType: undefined,
      minPrice: "",
      maxPrice: "",
      // New separate price fields for buy_or_rent transactions
      minPurchasePrice: "",
      maxPurchasePrice: "",
      minRentPrice: "",
      maxRentPrice: "",
      currency: undefined,
      city: "",
      state: "",
      country: "",
      minBedrooms: undefined,
      minBathrooms: undefined,
      minArea: "",
      maxArea: "",
      areaUnit: undefined,
      minBuildSize: "",
      minLandSize: "",
      landSizeUnit: undefined,
      urgency: undefined,
      contactEmail: user?.email || "",
      contactPhone: "",
      requiredAmenities: [],
    },
  });

  const propertyType = form.watch("propertyType");
  const transactionType = form.watch("transactionType");
  const isLandProperty = propertyType === "land";
  const isBuyOrRent = transactionType === "buy_or_rent";

  const saveRequirementMutation = useMutation({
    mutationFn: async (data: InsertBuyerRequirement) => {
      const url = isEditing && requirement?.id 
        ? `/api/buyer-requirements/${requirement.id}`
        : "/api/buyer-requirements";
      const method = isEditing ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-requirements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/buyer-requirements"] });
      if (isEditing && requirement?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/buyer-requirements", requirement.id] });
      }
      toast({
        title: isEditing ? "Requirement updated successfully!" : "Requirement posted successfully!",
        description: isEditing 
          ? "Your requirement has been updated." 
          : "Property owners can now see what you're looking for.",
      });
      if (!isEditing) {
        form.reset();
        setAmenities([]);
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      // Check if this is a PREMIUM_REQUIRED error
      if (error.message.includes('403:')) {
        try {
          const errorBody = error.message.split('403:')[1].trim();
          const parsedError = JSON.parse(errorBody);
          if (parsedError.code === 'PREMIUM_REQUIRED') {
            toast({
              title: "Premium Membership Required",
              description: (
                <div className="space-y-2">
                  <p>{parsedError.message}</p>
                  <a href="/premium-signup" className="underline text-blue-500 hover:text-blue-600">
                    Sign up for Premium Membership →
                  </a>
                </div>
              ),
              variant: "destructive",
              duration: 10000, // Show for 10 seconds
            });
            return;
          }
        } catch {
          // Fall through to default error handling
        }
      }
      
      toast({
        title: isEditing ? "Failed to update requirement" : "Failed to post requirement",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRequirementMutation = useMutation({
    mutationFn: async () => {
      if (!isEditing || !requirement?.id) {
        throw new Error("Cannot delete requirement - not in editing mode or no requirement ID");
      }
      return apiRequest("DELETE", `/api/buyer-requirements/${requirement.id}`, {});
    },
    onSuccess: () => {
      toast({
        title: t('success.requirementDeleted'),
        description: t('success.requirementDeletedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/my-requirements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/buyer-requirements'] });
      navigate('/my-requirements');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: t('error.failedToDelete'),
        description: error.message || t('error.tryAgain'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBuyerRequirement) => {
    // Clean up empty or undefined values for optional fields
    const cleanedData = {
      ...data,
      requiredAmenities: amenities,
      buyerId: user?.id || "",
      minPrice: data.minPrice || null,
      maxPrice: data.maxPrice || null,
      // New dual price fields
      minPurchasePrice: data.minPurchasePrice || null,
      maxPurchasePrice: data.maxPurchasePrice || null,
      minRentPrice: data.minRentPrice || null,
      maxRentPrice: data.maxRentPrice || null,
      // Area and size fields
      minArea: data.minArea || null,
      maxArea: data.maxArea || null,
      minLandSize: data.minLandSize || null,
      maxLandSize: data.maxLandSize || null,
      minBuildSize: data.minBuildSize || null,
      maxBuildSize: data.maxBuildSize || null,
      // Bedroom/bathroom fields
      minBedrooms: data.minBedrooms || null,
      minBathrooms: data.minBathrooms || null,
      // Contact fields
      contactPhone: data.contactPhone || null,
      contactEmail: data.contactEmail || null,
    };
    
    saveRequirementMutation.mutate(cleanedData);
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  const removeAmenity = (amenity: string) => {
    setAmenities(amenities.filter(a => a !== amenity));
  };

  const togglePredefinedAmenity = (amenity: string) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter(a => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? t('form.update') : t('addListing.postRequirement')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.whatLookingFor')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('placeholder.requirementTitle')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('form.describeRequirement')}
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.propertyType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('placeholder.selectPropertyType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getPropertyTypes().map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="transactionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.listingType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('placeholder.selectListingType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getTransactionTypes().map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Price Section - Conditional rendering based on transaction type */}
            {isBuyOrRent ? (
              /* Separate price sections for purchase and rent */
              <div className="space-y-6">
                {/* Purchase Price Section */}
                <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
                  <h4 className="text-md font-medium mb-3 text-blue-700 dark:text-blue-300">
                    {t('form.purchasePriceRange')} ({t('form.optional')})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minPurchasePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.minPurchasePrice')} {t('form.numbersOnly')}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder={t('placeholder.price')} {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxPurchasePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.maxPurchasePrice')} {t('form.numbersOnly')}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder={t('placeholder.price')} {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Rent Price Section */}
                <div className="border rounded-lg p-4 bg-green-50/50 dark:bg-green-950/20">
                  <h4 className="text-md font-medium mb-3 text-green-700 dark:text-green-300">
                    {t('form.rentalPriceRange')} ({t('form.optional')})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minRentPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.minRentalPrice')} {t('form.numbersOnly')}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder={t('placeholder.price')} {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxRentPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.maxRentalPrice')} {t('form.numbersOnly')}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder={t('placeholder.price')} {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Currency selector for both price types */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.currency')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('form.selectCurrency')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getCurrencies().map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ) : (
              /* Traditional single price section for buy or rent only */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="minPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.minPrice')} {t('form.numbersOnly')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={t('placeholder.price')} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.maxPrice')} {t('form.numbersOnly')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={t('placeholder.price')} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.currency')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('form.selectCurrency')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getCurrencies().map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.country')}</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCountry(value);
                        // Clear state when country changes
                        form.setValue('state', '');
                      }} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('placeholder.selectCountry')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getCountryOptions().map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
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
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.state')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                      disabled={!selectedCountry || availableStates.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedCountry 
                              ? t('placeholder.selectCountryFirst') 
                              : availableStates.length === 0 
                                ? t('placeholder.noStatesAvailable')
                                : t('placeholder.selectState')
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableStates.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
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
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.city')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('placeholder.city')} {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className={`grid grid-cols-1 gap-4 ${isLandProperty ? 'md:grid-cols-1' : 'md:grid-cols-3'}`}>
              {!isLandProperty && (
                <>
                  <FormField
                    control={form.control}
                    name="minBedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.minBedrooms')} {t('form.numbersOnly')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder={t('placeholder.bedrooms')} 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minBathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.minBathrooms')} {t('form.numbersOnly')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder={t('placeholder.bathrooms')} 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.urgency')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('form.selectType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getUrgencyLevels().map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Area fields - conditional based on property type */}
            {(propertyType === "house" || propertyType === "poolvilla" || propertyType === "townhouse") && (
              <>
                {/* Living Area for House, Pool Villa, Townhouse */}
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="minBuildSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.minLivingArea')} {t('form.numbersOnly')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder={t('placeholder.area')} 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-gray-500">{t('unit.sqmDetailed')}</p>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Land Area for House, Pool Villa, Townhouse */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minLandSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.minLandArea')} {t('form.numbersOnly')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder={t('placeholder.area')} 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landSizeUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.areaUnit')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('placeholder.selectUnit')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getAreaUnits().map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {/* Living Area for Condo */}
            {propertyType === "apartment" && (
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="minBuildSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.minLivingArea')} {t('form.numbersOnly')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('placeholder.area')} 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-gray-500">{t('unit.sqmDetailed')}</p>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Land Area for Land */}
            {propertyType === "land" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minLandSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.minLandArea')} {t('form.numbersOnly')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('placeholder.area')} 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="landSizeUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.areaUnit')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "sqm"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('placeholder.selectUnit')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getAreaUnits().map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.contactPhoneOptional')}</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder={t('placeholder.phoneExample')} {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.contactEmailLabel')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t('placeholder.emailExample')} {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>{t('form.requiredAmenitiesOptional')}</FormLabel>
              
              {/* Predefined Amenities Dropdown */}
              <Collapsible open={isAmenitiesOpen} onOpenChange={setIsAmenitiesOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between mt-2" type="button">
                    {t('form.selectFromCommonAmenities')}
                    {isAmenitiesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2 p-4 border rounded-md bg-gray-50 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {getPredefinedAmenities().map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity}
                          checked={amenities.includes(amenity)}
                          onCheckedChange={() => togglePredefinedAmenity(amenity)}
                        />
                        <label
                          htmlFor={amenity}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Custom Amenity Input */}
              <div className="flex gap-2 mt-2">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder={t('form.addAmenity')}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
                />
                <Button type="button" onClick={addAmenity} variant="outline">
                  {t('form.addAmenity')}
                </Button>
              </div>

              {/* Selected Amenities */}
              <div className="flex flex-wrap gap-2 mt-2">
                {amenities.map((amenity, index) => (
                  <Badge key={index} variant="secondary" className="px-2 py-1">
                    {amenity}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => removeAmenity(amenity)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              {isEditing && requirement?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="destructive"
                      disabled={deleteRequirementMutation.isPending}
                      className="flex-1"
                      data-testid="button-delete-requirement"
                    >
                      {deleteRequirementMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t('form.deleting')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          {t('form.delete')}
                        </div>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('confirm.deleteRequirement')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('confirm.deleteRequirementDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteRequirementMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {t('form.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              <Button 
                type="submit" 
                disabled={saveRequirementMutation.isPending}
                className={`${isEditing && requirement?.id ? 'flex-1' : 'w-full'} bg-hotprop-primary hover:bg-hotprop-primary/90`}
                data-testid="button-submit-requirement"
              >
                {saveRequirementMutation.isPending 
                  ? t('form.savingListing')
                  : (isEditing ? t('form.update') : t('form.saveRequirement'))
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}