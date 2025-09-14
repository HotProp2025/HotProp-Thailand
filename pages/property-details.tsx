import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, 
  Share2, 
  Flag, 
  ArrowLeft, 
  Bed, 
  Bath, 
  Maximize, 
  Calendar,
  MapPin,
  Crown,
  Phone,
  Mail,
  CheckCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  Shield
} from "lucide-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema, type Property, type InsertReport } from "@shared/schema";
import { formatPropertyPrice, createGoogleMapsUrl } from "@/lib/currency";
import { getLocalizedTitle, getLocalizedDescription, translateAmenity, formatYearForLanguage } from "@/utils/translation-helpers";
import { useLanguage } from "@/contexts/language-context";
import MessageModal from "@/components/messaging/message-modal";

type PropertyWithOwner = Property & {
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  } | null;
  ownerIsPremium?: boolean;
  isVerified?: boolean;
};

export default function PropertyDetails() {
  const params = useParams();
  const propertyId = params.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const { data: property, isLoading } = useQuery<PropertyWithOwner>({
    queryKey: ["/api/properties", propertyId],
    enabled: !!propertyId,
  });

  const { data: isFavoriteData } = useQuery({
    queryKey: ["/api/favorites", propertyId, "check"],
    enabled: !!user && !!propertyId,
  });

  // Get localized content
  const localizedTitle = property ? getLocalizedTitle(
    property.title,
    (property as any).titleEn,
    (property as any).titleTh,
    language
  ) : '';
  
  const localizedDescription = property ? getLocalizedDescription(
    property.description,
    (property as any).descriptionEn,
    (property as any).descriptionTh,
    language
  ) : null;

  const isFavorite = (isFavoriteData as any)?.isFavorite || false;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${propertyId}`, undefined);
      } else {
        await apiRequest("POST", "/api/favorites", { propertyId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: isFavorite 
          ? "Property removed from your saved list" 
          : "Property added to your saved list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    },
  });

  const reportForm = useForm<InsertReport>({
    resolver: zodResolver(insertReportSchema),
    defaultValues: {
      reporterId: user?.id || "",
      propertyId: propertyId || "",
      reason: "",
      description: "",
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (data: InsertReport) => {
      await apiRequest("POST", "/api/reports", data);
    },
    onSuccess: () => {
      toast({
        title: "Report submitted",
        description: "Thank you for reporting this listing. We'll review it shortly.",
      });
      setShowReportDialog(false);
      reportForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get images array early for navigation functions
  const images = property?.images && property.images.length > 0 
    ? property.images 
    : ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"];

  // Image navigation functions
  const goToPrevious = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1);
    }
  };

  const goToNext = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => prev === images.length - 1 ? 0 : prev + 1);
    }
  };

  // Touch gesture handling
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 1) {
      goToNext();
    }
    if (isRightSwipe && images.length > 1) {
      goToPrevious();
    }
  };

  const handleShare = async () => {
    if (navigator.share && property) {
      try {
        await navigator.share({
          title: localizedTitle,
          text: `Check out this property: ${localizedTitle}`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Property link copied to clipboard",
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Property link copied to clipboard",
      });
    }
  };

  // Function to translate amenities

// Remove the custom formatPrice function since we'll use the unified one

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const onReportSubmit = (data: InsertReport) => {
    reportMutation.mutate({
      ...data,
      reporterId: user?.id || "",
      propertyId: propertyId || "",
    });
  };

  const handleCall = () => {
    if (property?.owner?.phone) {
      window.location.href = `tel:${property.owner.phone}`;
    } else {
      toast({
        title: "No phone number",
        description: "The owner hasn't provided a phone number.",
        variant: "destructive",
      });
    }
  };

  const getOwnerName = () => {
    if (property?.owner) {
      return `${property.owner.firstName || ''} ${property.owner.lastName || ''}`.trim() || 'Property Owner';
    }
    return 'Property Owner';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="animate-pulse">
          <div className="h-80 bg-gray-200"></div>
          <div className="p-4 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Property Not Found</h1>
          <p className="text-gray-600 mb-4">The property you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/")} className="bg-hotprop-primary hover:bg-hotprop-primary/90">
            Go Home
          </Button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('propertyDetails.back')}
          </Button>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5" />
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavoriteMutation.mutate()}
                disabled={toggleFavoriteMutation.isPending}
              >
                <Heart 
                  className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`} 
                />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative bg-gray-900">
        <div 
          className="relative w-full h-80 overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img 
            src={images[currentImageIndex]} 
            alt={localizedTitle}
            className="w-full h-full object-cover"
          />
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {property.isPremium && (
              <Badge className="bg-hotprop-warning text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                <Crown className="w-3 h-3 mr-1" />
                PREMIUM
              </Badge>
            )}
            {property.ownerIsPremium && (
              <Badge className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                <Crown className="w-2.5 h-2.5 mr-1" />
                Premium
              </Badge>
            )}
            {property.isVerified && (
              <Badge 
                className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center"
                data-testid="badge-verified-owner-details"
              >
                <Shield className="w-2.5 h-2.5 mr-1" />
                Verified Owner
              </Badge>
            )}
          </div>
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          
          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1}/{images.length}
            </div>
          )}
          
          {/* Dot Indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentImageIndex === index ? "bg-white" : "bg-white bg-opacity-50"
                  }`}
                />
              ))}
            </div>
          )}
          
          {/* Keyboard navigation hint */}
          {images.length > 1 && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              Swipe or use arrows
            </div>
          )}
        </div>
      </div>

      {/* Property Info */}
      <div className="p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">{localizedTitle}</h1>
          
          <div className="flex items-center justify-between mb-3">
            <div className="text-3xl font-bold text-hotprop-primary">
              {(() => {
                const formattedPrice = formatPropertyPrice(property.price, property.currency || "USD", property.transactionType, property.rentPrice || undefined, property.rentCurrency || undefined);
                if (typeof formattedPrice === 'object') {
                  return (
                    <div className="flex flex-col">
                      <div className="text-3xl font-bold text-hotprop-primary">Sale: {formattedPrice.sale}</div>
                      <div className="text-3xl font-bold text-hotprop-primary">Rent: {formattedPrice.rent}</div>
                    </div>
                  );
                }
                return formattedPrice;
              })()}
            </div>
            <Badge variant="outline">
              {t(`transactionType.${property.transactionType}` as any)}
            </Badge>
          </div>
          
          <button 
            onClick={() => window.open(createGoogleMapsUrl(property.address || '', property.city || undefined, property.state || undefined), '_blank')}
            className="flex items-center text-gray-600 hover:text-hotprop-primary transition-colors cursor-pointer group"
          >
            <MapPin className="w-4 h-4 mr-1 group-hover:text-hotprop-primary" />
            <span className="text-sm underline decoration-dotted underline-offset-2 group-hover:text-hotprop-primary">
              {property.address}, {property.city}, {property.state}
            </span>
          </button>
        </div>

        {/* Property Details */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className={`grid gap-4 text-center ${
              (["house", "townhouse", "poolvilla"].includes(property.propertyType) && (property.landSize || property.buildSize)) ||
              (property.propertyType === "land" && property.landSize) ||
              (property.propertyType === "apartment" && property.buildSize)
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" 
                : "grid-cols-3"
            }`}>
              {property.bedrooms && (
                <div>
                  <Bed className="w-6 h-6 mx-auto mb-2 text-hotprop-primary" />
                  <p className="text-lg font-semibold">{property.bedrooms}</p>
                  <p className="text-sm text-gray-600">{t('property.bedrooms')}</p>
                </div>
              )}
              {property.bathrooms && (
                <div>
                  <Bath className="w-6 h-6 mx-auto mb-2 text-hotprop-primary" />
                  <p className="text-lg font-semibold">{property.bathrooms}</p>
                  <p className="text-sm text-gray-600">{t('property.bathrooms')}</p>
                </div>
              )}
              {/* Land Size: Show for Land, Houses, Townhouses, Pool Villas */}
              {((property.landSize || property.area) && ["land", "house", "townhouse", "poolvilla"].includes(property.propertyType)) && (
                <div>
                  <Maximize className="w-6 h-6 mx-auto mb-2 text-hotprop-primary" />
                  <p className="text-lg font-semibold">{parseFloat(property.landSize || property.area || '0').toLocaleString()}</p>
                  <p className="text-sm text-gray-600">
                    {t('form.landSize')} ({property.landSizeUnit || property.areaUnit})
                  </p>
                </div>
              )}
              {/* Build Size: Show for Apartments, Houses, Townhouses, Pool Villas */}
              {((property.buildSize && ["apartment", "house", "townhouse", "poolvilla"].includes(property.propertyType)) || 
                (property.area && ["apartment", "house", "townhouse", "poolvilla"].includes(property.propertyType) && !property.buildSize)) && (
                <div>
                  <Maximize className="w-6 h-6 mx-auto mb-2 text-hotprop-primary" />
                  <p className="text-lg font-semibold">{parseFloat(property.buildSize || property.area || '0').toLocaleString()}</p>
                  <p className="text-sm text-gray-600">
                    {t('form.buildSize')} ({property.buildSizeUnit || property.areaUnit})
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {localizedDescription && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-3">{t('propertyDetails.description')}</h2>
              <p className="text-gray-700 leading-relaxed">{localizedDescription}</p>
            </CardContent>
          </Card>
        )}

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-3">{t('propertyDetails.amenities')}</h2>
              <div className="grid grid-cols-2 gap-2">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 mr-2 text-hotprop-success" />
                    {translateAmenity(amenity, t)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Property Details */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-3">{t('propertyDetails.details')}</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('propertyDetails.propertyType')}</span>
                <span className="font-medium capitalize">{t(`propertyType.${property.propertyType}` as any)}</span>
              </div>
              {property.yearBuilt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('propertyDetails.yearBuilt')}</span>
                  <span className="font-medium">{formatYearForLanguage(property.yearBuilt, language)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">{t('propertyDetails.listed')}</span>
                <span className="font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatTimeAgo(new Date(property.createdAt || new Date()))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owner Information */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-3">{t('propertyDetails.listedBy')}</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-hotprop-primary text-white">
                    {property?.owner ? 
                      `${property.owner.firstName[0]}${property.owner.lastName[0]}` : 
                      "OW"
                    }
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {property?.owner ? 
                      `${property.owner.firstName} ${property.owner.lastName}` : 
                      "Property Owner"
                    }
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    <span>4.8 {t('propertyDetails.rating')}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCall}
                  disabled={!property?.owner?.phone}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {t('propertyDetails.call')}
                </Button>
                <MessageModal
                  recipientId={property?.owner?.id || ''}
                  recipientName={getOwnerName()}
                  property={property}
                  trigger={
                    <Button 
                      size="sm" 
                      className="bg-hotprop-primary hover:bg-hotprop-primary/90"
                      disabled={!property?.owner?.id}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {t('propertyDetails.sendMessage')}
                    </Button>
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Listing */}
        <div className="flex justify-center mb-8">
          <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                <Flag className="w-4 h-4 mr-2" />
                {t('propertyDetails.reportListing')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Property Listing</DialogTitle>
                <DialogDescription>
                  Help us maintain quality by reporting inappropriate or fake listings.
                </DialogDescription>
              </DialogHeader>
              <Form {...reportForm}>
                <form onSubmit={reportForm.handleSubmit(onReportSubmit)} className="space-y-4">
                  <FormField
                    control={reportForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for reporting</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fake">Fake listing</SelectItem>
                            <SelectItem value="spam">Spam</SelectItem>
                            <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                            <SelectItem value="outdated">Outdated information</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={reportForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional details (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide more details about the issue..."
                            className="min-h-[80px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowReportDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={reportMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {reportMutation.isPending ? "Submitting..." : "Submit Report"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
