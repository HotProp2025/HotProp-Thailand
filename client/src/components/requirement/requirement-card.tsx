import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, MapPin, Home, DollarSign, Calendar, Phone, Mail, RotateCcw, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { BuyerRequirement } from "@shared/schema";
import MessageModal from "@/components/messaging/message-modal";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedTitle, getLocalizedDescription, translateAmenity } from "@/utils/translation-helpers";

interface RequirementCardProps {
  requirement: BuyerRequirement;
  showActions?: boolean;
}

export default function RequirementCard({ requirement, showActions = false }: RequirementCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  
  // Get localized content
  const localizedTitle = getLocalizedTitle(
    requirement.title,
    requirement.titleEn,
    requirement.titleTh,
    language
  );
  
  const localizedDescription = getLocalizedDescription(
    requirement.description,
    requirement.descriptionEn,
    requirement.descriptionTh,
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

  // Translated urgency level
  const getUrgencyLabel = (urgency: string) => {
    return t(`urgency.${urgency}` as any);
  };


  const deleteRequirementMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/buyer-requirements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-requirements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/buyer-requirements"] });
      toast({
        title: "Requirement deleted",
        description: "Your requirement has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete requirement",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reactivateRequirementMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/reactivate-requirement", { requirementId: requirement.id });
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Requirement reactivated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/my-requirements"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reactivate requirement", variant: "destructive" });
    }
  });

  const formatPrice = (price: string | null) => {
    if (!price) return null;
    const num = parseFloat(price);
    return num.toLocaleString();
  };

  const getUrgencyColor = (urgency: string | null) => {
    switch (urgency) {
      case "urgent": return "bg-red-100 text-red-800";
      case "normal": return "bg-blue-100 text-blue-800";
      case "flexible": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-800 mb-1">{localizedTitle}</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {!requirement.isActive && (
                <Badge className="bg-red-500 text-white text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {t('card.deactivated')}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {getPropertyTypeLabel(requirement.propertyType)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getTransactionTypeLabel(requirement.transactionType)}
              </Badge>
              {requirement.urgency && (
                <Badge className={`text-xs ${getUrgencyColor(requirement.urgency)}`}>
                  {getUrgencyLabel(requirement.urgency)}
                </Badge>
              )}
            </div>
          </div>
          {showActions && (
            <div className="flex gap-1 ml-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0"
                onClick={() => setLocation(`/edit-requirement/${requirement.id}`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => deleteRequirementMutation.mutate(requirement.id)}
                disabled={deleteRequirementMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {localizedDescription && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{localizedDescription}</p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Price Display - Handle dual pricing for buy_or_rent */}
          {requirement.transactionType === 'buy_or_rent' ? (
            <div className="col-span-2 space-y-1">
              {/* Purchase Price */}
              {(requirement.minPurchasePrice || requirement.maxPurchasePrice) && (
                <div className="flex items-center text-gray-600">
                  <DollarSign className="h-4 w-4 mr-1 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700 mr-1">{t('form.purchase')}:</span>
                  <span>
                    {requirement.minPurchasePrice && requirement.maxPurchasePrice
                      ? `${formatPrice(requirement.minPurchasePrice)} - ${formatPrice(requirement.maxPurchasePrice)}`
                      : requirement.maxPurchasePrice
                      ? `${t('card.upTo')} ${formatPrice(requirement.maxPurchasePrice)}`
                      : `${t('card.from')} ${formatPrice(requirement.minPurchasePrice)}`}
                    {" "}{requirement.currency}
                  </span>
                </div>
              )}
              {/* Rent Price */}
              {(requirement.minRentPrice || requirement.maxRentPrice) && (
                <div className="flex items-center text-gray-600">
                  <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-xs font-medium text-green-700 mr-1">{t('form.rent')}:</span>
                  <span>
                    {requirement.minRentPrice && requirement.maxRentPrice
                      ? `${formatPrice(requirement.minRentPrice)} - ${formatPrice(requirement.maxRentPrice)}`
                      : requirement.maxRentPrice
                      ? `${t('card.upTo')} ${formatPrice(requirement.maxRentPrice)}`
                      : `${t('card.from')} ${formatPrice(requirement.minRentPrice)}`}
                    {" "}{requirement.currency}/month
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Single price range for buy or rent only */
            (requirement.minPrice || requirement.maxPrice) && (
              <div className="flex items-center text-gray-600">
                <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                <span>
                  {requirement.minPrice && requirement.maxPrice
                    ? `${formatPrice(requirement.minPrice)} - ${formatPrice(requirement.maxPrice)}`
                    : requirement.maxPrice
                    ? `${t('card.upTo')} ${formatPrice(requirement.maxPrice)}`
                    : `${t('card.from')} ${formatPrice(requirement.minPrice)}`}
                  {" "}{requirement.currency}
                </span>
              </div>
            )
          )}

          {(requirement.city || requirement.state || requirement.country) && (
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-1 text-blue-600" />
              <span className="truncate">
                {[requirement.city, requirement.state, requirement.country]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}

          {(requirement.minBedrooms || requirement.minBathrooms) && (
            <div className="flex items-center text-gray-600">
              <Home className="h-4 w-4 mr-1 text-purple-600" />
              <span>
                {requirement.minBedrooms && `${requirement.minBedrooms}+ ${t('card.bed')}`}
                {requirement.minBedrooms && requirement.minBathrooms && ", "}
                {requirement.minBathrooms && `${requirement.minBathrooms}+ ${t('card.bath')}`}
              </span>
            </div>
          )}

          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-1 text-gray-500" />
            <span>{requirement.createdAt ? new Date(requirement.createdAt).toLocaleDateString() : "N/A"}</span>
          </div>
        </div>

        {requirement.requiredAmenities && requirement.requiredAmenities.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">{t('card.required')}</p>
            <div className="flex flex-wrap gap-1">
              {requirement.requiredAmenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {translateAmenity(amenity, t)}
                </Badge>
              ))}
              {requirement.requiredAmenities.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  {t('card.more', { count: requirement.requiredAmenities.length - 3 })}
                </Badge>
              )}
            </div>
          </div>
        )}

        {!showActions && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex gap-2">
              <MessageModal
                recipientId={requirement.buyerId}
                recipientName="Buyer"
                requirement={requirement}
                trigger={
                  <Button
                    size="sm"
                    className="bg-hotprop-primary hover:bg-hotprop-primary/90 text-white flex-1"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    <span className="text-xs">{t('card.message')}</span>
                  </Button>
                }
              />
              {requirement.contactPhone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${requirement.contactPhone}`);
                  }}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  <span className="text-xs">{t('card.call')}</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Reactivation button for deactivated requirements */}
        {showActions && !requirement.isActive && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => reactivateRequirementMutation.mutate()}
              disabled={reactivateRequirementMutation.isPending}
              className="w-full text-hotprop-primary border-hotprop-primary hover:bg-hotprop-primary hover:text-white"
              data-testid={`button-reactivate-requirement-${requirement.id}`}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {reactivateRequirementMutation.isPending ? t('card.reactivating') : t('card.reactivateRequirement')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}