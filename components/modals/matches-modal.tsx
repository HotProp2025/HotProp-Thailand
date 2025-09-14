import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Bed, Bath, Square, Heart, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface Match {
  id: string;
  title: string;
  propertyType: string;
  transactionType: string;
  price: number;
  rentPrice?: number;
  currency: string;
  address: string;
  city: string;
  country: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  areaUnit?: string;
  images: string[];
  compatibilityScore: number;
  matchingCriteria: string[];
  ownerId: string;
  ownerName?: string;
}

interface MatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function MatchesModal({ isOpen, onClose, userId }: MatchesModalProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('properties');

  // Fetch property matches
  const { data: propertyMatches = [], isLoading: isLoadingProperties } = useQuery<Match[]>({
    queryKey: [`/api/matches/property/${userId}`],
    enabled: isOpen && !!userId,
  });

  // Fetch requirement matches
  const { data: requirementMatches = [], isLoading: isLoadingRequirements } = useQuery<Match[]>({
    queryKey: [`/api/matches/requirement/${userId}`],
    enabled: isOpen && !!userId,
  });

  const handleViewDetails = (matchId: string) => {
    setLocation(`/property/${matchId}`);
    onClose();
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getTransactionBadgeColor = (transactionType: string) => {
    switch (transactionType) {
      case 'sell': return 'bg-green-100 text-green-800';
      case 'rent': return 'bg-blue-100 text-blue-800';
      case 'sell_or_rent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderMatches = (matches: Match[], isLoading: boolean, type: 'property' | 'requirement') => {
    if (isLoading) {
      return (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-32" />
          ))}
        </div>
      );
    }

    if (matches.length === 0) {
      return (
        <div className="text-center py-8">
          <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
          <p className="text-gray-500">
            No {type === 'property' ? 'properties' : 'requirements'} match your criteria with 80%+ compatibility.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
        {matches.slice(0, 5).map((match) => (
          <div key={match.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg text-gray-900" data-testid={`text-match-title-${match.id}`}>
                    {match.title}
                  </h3>
                  <Badge 
                    className={`px-2 py-1 text-xs ${getTransactionBadgeColor(match.transactionType)}`}
                    data-testid={`badge-transaction-${match.id}`}
                  >
                    {match.transactionType === 'sell_or_rent' ? 'Sell/Rent' : match.transactionType}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {match.city}, {match.country}
                  </span>
                  {match.bedrooms && (
                    <span className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      {match.bedrooms} bed
                    </span>
                  )}
                  {match.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {match.bathrooms} bath
                    </span>
                  )}
                  {match.area && (
                    <span className="flex items-center gap-1">
                      <Square className="h-4 w-4" />
                      {match.area} {match.areaUnit}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-hotprop-primary">
                      {formatPrice(
                        match.transactionType === 'rent' ? match.rentPrice || match.price : match.price,
                        match.currency
                      )}
                    </span>
                    {match.transactionType === 'rent' && (
                      <span className="text-sm text-gray-500">/month</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="bg-green-100 text-green-800"
                      data-testid={`badge-compatibility-${match.id}`}
                    >
                      {match.compatibilityScore}% match
                    </Badge>
                  </div>
                </div>

                {match.matchingCriteria && match.matchingCriteria.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Matching criteria:</p>
                    <div className="flex flex-wrap gap-1">
                      {match.matchingCriteria.map((criteria, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                          {criteria}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {match.images && match.images.length > 0 && (
                <div className="ml-4 flex-shrink-0">
                  <img
                    src={match.images[0]}
                    alt={match.title}
                    className="w-24 h-24 object-cover rounded-lg"
                    data-testid={`img-match-photo-${match.id}`}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleViewDetails(match.id)}
                className="flex-1"
                data-testid={`button-view-details-${match.id}`}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View Details
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Add to favorites logic could go here
                }}
                data-testid={`button-favorite-${match.id}`}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-matches">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-hotprop-primary" />
            Latest Matches
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="properties" data-testid="tab-properties">Properties</TabsTrigger>
            <TabsTrigger value="requirements" data-testid="tab-requirements">Requirements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="properties" className="mt-4">
            {renderMatches(propertyMatches, isLoadingProperties, 'property')}
          </TabsContent>
          
          <TabsContent value="requirements" className="mt-4">
            {renderMatches(requirementMatches, isLoadingRequirements, 'requirement')}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}