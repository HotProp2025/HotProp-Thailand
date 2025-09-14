import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema, type InsertProperty, type Property } from "@shared/schema";
import { getCountries, getStates } from "@shared/location-data";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Upload, ImageIcon, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";
import { PropertyVerification } from "@/components/PropertyVerification";
import { useLanguage } from "@/contexts/language-context";
import type { UploadResult } from "@uppy/core";

// Static arrays moved to component functions to support translation

interface PropertyFormProps {
  onSuccess?: () => void;
  initialData?: Property;
  isEditing?: boolean;
}

export default function PropertyForm({ onSuccess, initialData, isEditing = false }: PropertyFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [amenities, setAmenities] = useState<string[]>(initialData?.amenities || []);
  const [newAmenity, setNewAmenity] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialData?.images || []);
  const [showAmenitiesDropdown, setShowAmenitiesDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>(initialData?.country || "");
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
    { value: "sell", label: t('transactionType.sell') },
    { value: "rent", label: t('transactionType.rent') },
    { value: "sell_or_rent", label: t('transactionType.sell_or_rent') },
  ];

  const getCurrencies = () => [
    { value: "USD", label: t('currency.USD') },
    { value: "THB", label: t('currency.THB') },
  ];

  const getAreaUnits = () => [
    { value: "sqm", label: t('unit.sqm') },
    { value: "sqw", label: t('unit.sqw') },
  ];

  const getAreaUnitsDetailed = () => [
    { value: "sqm", label: t('unit.sqmDetailed') },
    { value: "sqw", label: t('unit.sqwDetailed') },
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
    if (initialData?.country) {
      setSelectedCountry(initialData.country);
    }
  }, [initialData]);

  const form = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: initialData ? {
      ownerId: initialData.ownerId,
      title: initialData.title,
      description: initialData.description || "",
      propertyType: initialData.propertyType,
      transactionType: initialData.transactionType,
      price: initialData.price,
      currency: initialData.currency,
      rentPrice: initialData.rentPrice,
      rentCurrency: initialData.rentCurrency,
      address: initialData.address,
      city: initialData.city,
      state: initialData.state || "",
      country: initialData.country,
      bedrooms: initialData.bedrooms,
      bathrooms: initialData.bathrooms,
      area: initialData.area || "",
      areaUnit: initialData.areaUnit,
      landSize: initialData.landSize || "",
      landSizeUnit: initialData.landSizeUnit,
      buildSize: initialData.buildSize || "",
      buildSizeUnit: initialData.buildSizeUnit,
      yearBuilt: initialData.yearBuilt,
      amenities: initialData.amenities || [],
      images: initialData.images || [],
      videos: initialData.videos || [],
      isPremium: initialData.isPremium || false,
    } : {
      ownerId: user?.id || "",
      title: "",
      description: "",
      propertyType: undefined,
      transactionType: undefined,
      price: "",
      currency: undefined,
      rentPrice: undefined,
      rentCurrency: undefined,
      address: "",
      city: "",
      state: "",
      country: "",
      areaUnit: undefined,
      landSizeUnit: undefined,
      buildSizeUnit: undefined,
      amenities: [],
      images: [],
      videos: [],
      isPremium: false,
    },
  });

  // Watch transaction type to show/hide rent pricing fields
  const transactionType = form.watch("transactionType");
  const showRentPricing = transactionType === "sell_or_rent";
  
  // Watch property type to show/hide area fields based on property type
  const propertyType = form.watch("propertyType");
  const showLandAndBuildSize = ["house", "townhouse", "poolvilla"].includes(propertyType);
  const showLandSizeOnly = propertyType === "land";
  const showBuildSizeOnly = propertyType === "apartment";
  const showGeneralArea = false; // Remove general area field - use specific fields instead

  const createPropertyMutation = useMutation({
    mutationFn: async (data: InsertProperty) => {
      const endpoint = isEditing ? `/api/properties/${initialData?.id}` : "/api/properties";
      const method = isEditing ? "PUT" : "POST";
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-properties"] });
      toast({
        title: isEditing ? "Property updated successfully!" : "Property listed successfully!",
        description: isEditing ? "Your property has been updated." : "Your property is now live on HotProp.",
      });
      form.reset();
      setAmenities([]);
      setUploadedImages([]);
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
        title: "Failed to create listing",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async () => {
      if (!isEditing || !initialData?.id) {
        throw new Error("Cannot delete property - not in editing mode or no property ID");
      }
      return apiRequest("DELETE", `/api/properties/${initialData.id}`, {});
    },
    onSuccess: () => {
      toast({
        title: t('success.propertyDeleted'),
        description: t('success.propertyDeletedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/my-properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      navigate('/my-properties');
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

  const onSubmit = (data: InsertProperty) => {
    // Clean the data by removing empty string fields for optional numeric fields
    const cleanedData: any = {
      ...data,
      amenities,
      images: uploadedImages,
      ownerId: user?.id || "",
    };

    // Remove empty string fields for optional numeric fields
    if (cleanedData.bedrooms === "" || cleanedData.bedrooms === null) delete cleanedData.bedrooms;
    if (cleanedData.bathrooms === "" || cleanedData.bathrooms === null) delete cleanedData.bathrooms;
    if (cleanedData.area === "" || cleanedData.area === null) delete cleanedData.area;
    if (cleanedData.landSize === "" || cleanedData.landSize === null) delete cleanedData.landSize;
    if (cleanedData.buildSize === "" || cleanedData.buildSize === null) delete cleanedData.buildSize;
    if (cleanedData.rentPrice === "" || cleanedData.rentPrice === null) delete cleanedData.rentPrice;

    createPropertyMutation.mutate(cleanedData);
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

  const handleImageUpload = async () => {
    try {
      console.log("Getting upload parameters...");
      const response = await apiRequest("POST", "/api/objects/upload");
      const data = await response.json();
      console.log("Upload URL received:", data.uploadURL);
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Failed to get upload URL:", error);
      toast({
        title: "Upload failed",
        description: "Failed to get upload URL",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleImageUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    try {
      console.log("Upload complete:", result);
      if (result.successful && result.successful.length > 0) {
        const newImageUrls: string[] = [];
        for (const file of result.successful) {
          const uploadURL = file.uploadURL;
          if (uploadURL) {
            console.log("Processing uploaded file:", uploadURL);
            // Set ACL policy for the uploaded image
            const response = await apiRequest("PUT", "/api/property-images", {
              imageURL: uploadURL,
            });
            const data = await response.json();
            console.log("ACL response:", data);
            newImageUrls.push(data.objectPath);
          }
        }
        setUploadedImages(prev => [...prev, ...newImageUrls]);
        toast({
          title: "Images uploaded",
          description: `${result.successful.length} image(s) uploaded successfully`,
        });
      }
      
      if (result.failed && result.failed.length > 0) {
        console.error("Some uploads failed:", result.failed);
        toast({
          title: "Some uploads failed",
          description: `${result.failed.length} image(s) failed to upload`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Upload processing error:", error);
      toast({
        title: "Upload processing failed",
        description: "Images uploaded but failed to process",
        variant: "destructive",
      });
    }
  };

  const removeImage = (imageUrl: string) => {
    setUploadedImages(prev => prev.filter(img => img !== imageUrl));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? t('form.update') : t('addListing.listProperty')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('placeholder.propertyTitle')} {...field} />
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
                      placeholder={t('placeholder.description')}
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

            {/* Sale Price Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {showRentPricing ? t('form.salePriceLabel') : t('form.priceLabel')} {t('form.numbersOnly')}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={t('placeholder.price')} {...field} />
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
                    <FormLabel>
                      {showRentPricing ? t('form.currency') : t('form.currency')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "THB"} defaultValue="THB">
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

            {/* Rent Price Section - Only show when sell_or_rent is selected */}
            {showRentPricing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rentPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.rentPrice')} {t('form.numbersOnly')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={t('placeholder.price')} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rentCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.currency')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "THB"} defaultValue="THB">
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

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.address')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('placeholder.address')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <Input placeholder={t('placeholder.city')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bedrooms, Bathrooms, and Year Built - Not required for Land */}
            {propertyType !== "land" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.bedrooms')} {t('form.numbersOnly')}</FormLabel>
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
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.bathrooms')} {t('form.numbersOnly')}</FormLabel>
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

                <FormField
                  control={form.control}
                  name="yearBuilt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.yearBuilt')} {t('form.numbersOnly')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('placeholder.yearBuilt')} 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Area fields are now property-type specific - no general area field */}

            {/* Land Size and Build Size for Houses, Townhouses, Pool Villas */}
            {showLandAndBuildSize && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="landSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.landSize')} {t('form.numbersOnly')}</FormLabel>
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
                        <FormLabel>{t('form.landSizeUnit')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "sqm"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('placeholder.selectUnit')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getAreaUnitsDetailed().map(unit => (
                              <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="buildSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.buildSize')} {t('form.numbersOnly')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder={t('placeholder.area')} 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buildSizeUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.buildSizeUnit')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "sqm"} disabled>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('unit.sqmDetailed')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sqm">{t('unit.sqmDetailed')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {/* Land Size only for Land properties */}
            {showLandSizeOnly && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="landSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.landSize')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('placeholder.area')} 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
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
                      <FormLabel>{t('form.landSizeUnit')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "sqw"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('placeholder.selectUnit')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getAreaUnitsDetailed().map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Living Size only for Apartments */}
            {showBuildSizeOnly && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="buildSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.buildSize')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="" 
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
                  name="buildSizeUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.buildSizeUnit')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "sqm"} disabled>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('unit.sqmDetailed')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sqm">{t('unit.sqmDetailed')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div>
              <FormLabel>{t('form.amenities')}</FormLabel>
              
              {/* Predefined Amenities Dropdown */}
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAmenitiesDropdown(!showAmenitiesDropdown)}
                  className="w-full justify-between"
                >
                  {t('form.selectFromCommonAmenities')}
                  {showAmenitiesDropdown ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {showAmenitiesDropdown && (
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      {getPredefinedAmenities().map((amenity) => (
                        <div key={amenity} className="flex items-center space-x-2">
                          <Checkbox
                            id={amenity}
                            checked={amenities.includes(amenity)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAmenities([...amenities, amenity]);
                              } else {
                                setAmenities(amenities.filter(a => a !== amenity));
                              }
                            }}
                          />
                          <label
                            htmlFor={amenity}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {amenity}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Amenity Input */}
              <div className="flex gap-2 mt-3">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder={t('form.addAmenity')}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
                />
                <Button type="button" onClick={addAmenity} variant="outline">
                  {t('form.addNew')}
                </Button>
              </div>

              {/* Selected Amenities */}
              <div className="flex flex-wrap gap-2 mt-3">
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

            {/* Property Verification - Show for premium users when editing */}
            {isEditing && initialData && user?.subscriptionType === 'premium' && (
              <div id="verification" className="scroll-mt-16">
                <PropertyVerification
                  propertyId={initialData.id}
                  verificationStatus={initialData.verificationStatus || undefined}
                  verificationNotes={initialData.verificationNotes || undefined}
                  isOwner={true}
                  isPremiumUser={true}
                  onVerificationSubmitted={() => {
                    // Refresh the property data after verification is submitted
                    queryClient.invalidateQueries({ queryKey: ['/api/my-properties'] });
                    queryClient.invalidateQueries({ queryKey: [`/api/properties/${initialData.id}`] });
                  }}
                />
              </div>
            )}

            <div>
              <FormLabel>{t('form.addMedia')}</FormLabel>
              <div className="space-y-4">
                <ObjectUploader
                  maxNumberOfFiles={20}
                  maxFileSize={10485760} // 10MB
                  onGetUploadParameters={handleImageUpload}
                  onComplete={handleImageUploadComplete}
                  buttonClassName="border-2 border-dashed border-gray-300 rounded-lg p-6 w-full bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center text-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-gray-600 font-medium mb-1">{t('form.uploadMedia')}</p>
                    <p className="text-sm text-gray-500">Up to 20 photos & videos, max 10MB each</p>
                  </div>
                </ObjectUploader>
                
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                          <img
                            src={imageUrl}
                            alt={`Property image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(imageUrl)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>


            <div className="flex gap-4">
              {isEditing && initialData?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="destructive"
                      disabled={deletePropertyMutation.isPending}
                      className="flex-1"
                      data-testid="button-delete-property"
                    >
                      {deletePropertyMutation.isPending ? (
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
                      <AlertDialogTitle>{t('confirm.deleteProperty')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('confirm.deletePropertyDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deletePropertyMutation.mutate()}
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
                disabled={createPropertyMutation.isPending}
                className={`${isEditing && initialData?.id ? 'flex-1' : 'w-full'} bg-hotprop-primary hover:bg-hotprop-primary/90 h-auto py-3`}
                data-testid="button-submit-property"
              >
                {createPropertyMutation.isPending ? (
                  <div className="text-center">
                    <div className="text-sm">{t('form.savingListing')}</div>
                  </div>
                ) : (
                  isEditing ? t('form.update') : t('form.save')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
