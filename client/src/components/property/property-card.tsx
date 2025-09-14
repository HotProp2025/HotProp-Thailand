import { Heart, Bed, Bath, Maximize, Calendar, Crown, ImageIcon, Edit, Shield, RotateCcw, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { formatPropertyPrice, createGoogleMapsUrl } from "@/lib/currency";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedTitle, getLocalizedDescription } from "@/utils/translation-helpers";
import type { PropertyWithOwnerInfo } from "@shared/schema";

interface PropertyCardProps {
  property: PropertyWithOwnerInfo;
  showEditButton?: boolean;
}

export default function PropertyCard({ property, showEditButton = false }: PropertyCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  
  // Get localized content
  const localizedTitle = getLocalizedTitle(
    property.title,
    property.titleEn,
    property.titleTh,
    language
  );
  
  const localizedDescription = getLocalizedDescription(
    property.description,
    property.descriptionEn,
    property.descriptionTh,
    language
  );

  // Translated property type
  const getPropertyTypeLabel = (type: string) => {
    return t(`propertyType.${type}` as any);
  };

  // Translated transaction type
  const getTransactionTypeLabel = (type: string) => {
    return t(`transactionType.${type}` as any);
  };

  const { data: isFavoriteData } = useQuery({
    queryKey: ["/api/favorites", property.id, "check"],
    enabled: !!user,
  });

  const isFavorite = (isFavoriteData as any)?.isFavorite || false;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${property.id}`, undefined);
      } else {
        await apiRequest("POST", "/api/favorites", { propertyId: property.id });
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

  const reactivatePropertyMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/reactivate-property", { propertyId: property.id });
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Property reactivated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/my-properties"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reactivate property", variant: "destructive" });
    }
  });

  const renderPrice = (price: string, currency: string, transactionType: string, rentPrice?: string, rentCurrency?: string) => {
    const formattedPrice = formatPropertyPrice(price, currency, transactionType, rentPrice, rentCurrency);
    
    if (typeof formattedPrice === 'object' && formattedPrice.type === 'dual') {
      return (
        <div className="flex flex-col">
          <div className="text-hotprop-primary text-xl font-bold">{t('transactionType.sell')}: {formattedPrice.sale}</div>
          <div className="text-hotprop-primary text-xl font-bold">{t('transactionType.rent')}: {formattedPrice.rent}</div>
        </div>
      );
    }
    
    return formattedPrice as string;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return t('card.hoursAgo', { hours: diffInHours });
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return t('card.daysAgo', { days: diffInDays });
    }
  };

  const getOwnerInitials = () => {
    // In a real app, you'd fetch owner details
    return "OW";
  };

  return (
    <Card 
      className={`property-card bg-white rounded-2xl shadow-sm mb-4 overflow-hidden cursor-pointer relative ${
        property.isPremium ? "premium-glow" : ""
      }`}
      onClick={() => setLocation(`/property/${property.id}`)}
    >
      {/* Separate deactivated badge to ensure always visible */}
      {!property.isActive && (
        <div 
          className="absolute top-2 left-2 z-50 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-lg border-2 border-white"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          {t('card.deactivated')}
        </div>
      )}
      
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
        {property.isPremium && (
          <Badge className="bg-hotprop-warning text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
            <Crown className="w-3 h-3 mr-1" />
            {t('card.premium')}
          </Badge>
        )}
        {property.ownerIsPremium && (
          <Badge className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
            <Crown className="w-2.5 h-2.5 mr-1" />
            {t('card.premiumOwner')}
          </Badge>
        )}
        {property.isVerified && (
          <Badge 
            className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center"
            data-testid="badge-verified-owner"
          >
            <Shield className="w-2.5 h-2.5 mr-1" />
            {t('card.verifiedOwner')}
          </Badge>
        )}
      </div>
      
      <div className="relative">
        {property.images && property.images.length > 0 ? (
          <img 
            src={property.images[0]} 
            alt={localizedTitle}
            className="w-full h-48 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-48 bg-gray-100 flex items-center justify-center ${property.images && property.images.length > 0 ? 'hidden' : ''}`}>
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">{t('card.noImageAvailable')}</p>
          </div>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          {showEditButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/edit-listing/${property.id}`);
              }}
              className="w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteMutation.mutate();
            }}
            className="w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100"
          >
            <Heart 
              className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`} 
            />
          </Button>
        </div>
        
        {property.images && property.images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
            1/{property.images.length}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{localizedTitle}</h3>
          <div className="text-hotprop-primary text-xl font-bold mb-2">
            {renderPrice(property.price, property.currency || "USD", property.transactionType, property.rentPrice || undefined, property.rentCurrency || undefined)}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              window.open(createGoogleMapsUrl(property.address || '', property.city || undefined, property.state || undefined), '_blank');
            }}
            className="text-gray-600 text-sm hover:text-hotprop-primary transition-colors underline decoration-dotted underline-offset-2"
          >
            {property.city}, {property.state}
          </button>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          {property.bedrooms && (
            <span className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              {property.bedrooms} {t('form.bedrooms')}
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              {property.bathrooms} {t('form.bathrooms')}
            </span>
          )}
          {/* Land Size: Show for Land, Houses, Townhouses, Pool Villas */}
          {((property.landSize || property.area) && ["land", "house", "townhouse", "poolvilla"].includes(property.propertyType)) && (
            <span className="flex items-center">
              <Maximize className="w-4 h-4 mr-1" />
              {t('form.landSize')}: {parseFloat(property.landSize || property.area || '0').toLocaleString()} {property.landSizeUnit || property.areaUnit}
            </span>
          )}
          {/* Build Size: Show for Apartments, Houses, Townhouses, Pool Villas */}
          {((property.buildSize && ["apartment", "house", "townhouse", "poolvilla"].includes(property.propertyType)) || 
            (property.area && ["apartment", "house", "townhouse", "poolvilla"].includes(property.propertyType) && !property.buildSize)) && (
            <span className="flex items-center">
              <Maximize className="w-4 h-4 mr-1" />
              {t('form.buildSize')}: {parseFloat(property.buildSize || property.area || '0').toLocaleString()} {property.buildSizeUnit || property.areaUnit}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-300 text-gray-600 text-xs">
                {getOwnerInitials()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">Owner</span>
          </div>
          <span className="text-xs text-gray-500 flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {formatTimeAgo(new Date(property.createdAt || new Date()))}
          </span>
        </div>
        
        {/* Reactivation button for deactivated properties */}
        {showEditButton && !property.isActive && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                reactivatePropertyMutation.mutate();
              }}
              disabled={reactivatePropertyMutation.isPending}
              className="w-full text-hotprop-primary border-hotprop-primary hover:bg-hotprop-primary hover:text-white"
              data-testid={`button-reactivate-property-${property.id}`}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {reactivatePropertyMutation.isPending ? t('card.reactivating') : t('card.reactivateProperty')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
