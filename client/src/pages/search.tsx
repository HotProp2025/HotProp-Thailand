import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PropertyCard from "@/components/property/property-card";
import RequirementCard from "@/components/requirement/requirement-card";
import PropertySearch from "@/components/property/property-search";
import PropertyTypeSelector from "@/components/property/property-type-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal } from "lucide-react";
import { getCurrencySymbol } from "@/lib/currency";
import { useLanguage } from "@/contexts/language-context";
import type { Property, BuyerRequirement, PropertySearchParams } from "@shared/schema";

export default function Search() {
  const [location] = useLocation();
  const [searchParams, setSearchParams] = useState<PropertySearchParams>({});
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "THB">("THB");
  const [activeTab, setActiveTab] = useState('properties');
  const { t } = useLanguage();

  // Calculate maximum price based on transaction type and currency
  const getMaxPrice = () => {
    const isRental = searchParams.transactionType === "rent";
    
    if (isRental) {
      return selectedCurrency === "USD" ? 25000 : 800000;
    } else {
      return selectedCurrency === "USD" ? 10000000 : 35000000;
    }
  };

  const getStepSize = () => {
    const isRental = searchParams.transactionType === "rent";
    
    if (isRental) {
      return selectedCurrency === "USD" ? 500 : 10000;
    } else {
      return selectedCurrency === "USD" ? 10000 : 250000;
    }
  };

  // Parse URL query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const newParams: any = {};
    
    const query = urlParams.get('q');
    if (query) newParams.query = query;
    
    const transactionType = urlParams.get('transactionType');
    if (transactionType) newParams.transactionType = transactionType;
    
    const propertyType = urlParams.get('propertyType');
    if (propertyType) newParams.propertyType = propertyType;
    
    if (Object.keys(newParams).length > 0) {
      setSearchParams(prev => ({ ...prev, ...newParams }));
    }
  }, [location]);

  // Initialize currency from search params
  useEffect(() => {
    if (searchParams.currency) {
      setSelectedCurrency(searchParams.currency);
    }
  }, [searchParams.currency]);

  // Update price range when transaction type or currency changes
  useEffect(() => {
    const maxPrice = getMaxPrice();
    setPriceRange(prev => [prev[0], Math.min(prev[1], maxPrice)]);
  }, [searchParams.transactionType, selectedCurrency]);

  // Separate queries for properties and requirements
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties", searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      // Include all search parameters including transaction type
      const propertyParams = { ...searchParams };
      
      Object.entries(propertyParams).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });
      
      const res = await fetch(`/api/properties?${params}`);
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
  });

  const { data: requirements = [], isLoading: isLoadingRequirements } = useQuery<BuyerRequirement[]>({
    queryKey: ["/api/buyer-requirements", searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      // Include all search parameters including transaction type
      const requirementParams = { ...searchParams };
      
      Object.entries(requirementParams).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });
      
      const res = await fetch(`/api/buyer-requirements?${params}`);
      if (!res.ok) throw new Error("Failed to fetch requirements");
      return res.json();
    },
  });

  // Determine the overall loading state
  const isLoading = isLoadingProperties && isLoadingRequirements;

  const handleSearch = (query: string) => {
    setSearchParams(prev => ({ ...prev, query }));
  };

  const handlePropertyTypeSelect = (type: string) => {
    setSearchParams(prev => ({ 
      ...prev, 
      propertyType: type as any || undefined 
    }));
  };

  const handleFilterApply = () => {
    setSearchParams(prev => ({
      ...prev,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      currency: selectedCurrency,
    }));
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearchParams({ query: searchParams.query });
    const maxPrice = getMaxPrice();
    setPriceRange([0, maxPrice]);
    setSelectedCurrency("USD");
  };



  return (
    <>
      <PropertySearch 
        onSearch={handleSearch} 
        onFilterClick={() => setShowFilters(true)} 
      />
      
      <div className="px-4 py-4 bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('search.iWantTo')}</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { id: "buy", label: t('search.buy'), icon: "🛒" },
            { id: "rent", label: t('search.rent'), icon: "🔑" },
            { id: "sell", label: t('search.sell'), icon: "🏷️" },
            { id: "let", label: t('search.let'), icon: "🏠" },
          ].map(({ id, label, icon }) => {
            const isSelected = searchParams.transactionType === id;
            return (
              <Button
                key={id}
                variant={isSelected ? "default" : "outline"}
                onClick={() => setSearchParams(prev => ({ 
                  ...prev, 
                  transactionType: isSelected ? undefined : id as any 
                }))}
                className={`rounded-xl py-8 px-3 text-center ${
                  isSelected 
                    ? "bg-hotprop-primary text-white hover:bg-hotprop-primary/90" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg mb-2">{icon}</span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      <PropertyTypeSelector 
        selectedType={searchParams.propertyType}
        onTypeSelect={handlePropertyTypeSelect}
      />

      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetTrigger asChild>
          <div style={{ display: 'none' }}>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </SheetTrigger>
        <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t('search.filters')}</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div>
                    <Label>{t('search.currency')}</Label>
                    <Select 
                      value={selectedCurrency} 
                      onValueChange={(value) => setSelectedCurrency(value as "USD" | "THB")}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="THB">THB (฿)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('search.priceRange')}</Label>
                    <div className="mt-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={getMaxPrice()}
                        step={getStepSize()}
                        className="w-full"
                      />
                      <div className="flex justify-between mt-2 text-sm text-gray-600">
                        <span>{getCurrencySymbol(selectedCurrency)}{priceRange[0].toLocaleString()}</span>
                        <span>
                          {priceRange[1] >= getMaxPrice() ? 
                            `${getCurrencySymbol(selectedCurrency)}${priceRange[1].toLocaleString()}+` :
                            `${getCurrencySymbol(selectedCurrency)}${priceRange[1].toLocaleString()}`
                          }
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {searchParams.transactionType === "rent" ? 
                          t('search.maxRental', { amount: `${getCurrencySymbol(selectedCurrency)}${getMaxPrice().toLocaleString()}` }) :
                          t('search.maxSalePrice', { amount: `${getCurrencySymbol(selectedCurrency)}${getMaxPrice().toLocaleString()}` })
                        }
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>{t('search.bedrooms')}</Label>
                    <Select 
                      value={searchParams.bedrooms?.toString() || ""} 
                      onValueChange={(value) => setSearchParams(prev => ({ 
                        ...prev, 
                        bedrooms: value === "any" ? undefined : (value ? parseInt(value) : undefined) 
                      }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={t('search.any')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t('search.any')}</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('search.bathrooms')}</Label>
                    <Select 
                      value={searchParams.bathrooms?.toString() || ""} 
                      onValueChange={(value) => setSearchParams(prev => ({ 
                        ...prev, 
                        bathrooms: value === "any" ? undefined : (value ? parseInt(value) : undefined) 
                      }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={t('search.any')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t('search.any')}</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('search.city')}</Label>
                    <Input
                      value={searchParams.city || ""}
                      onChange={(e) => setSearchParams(prev => ({ 
                        ...prev, 
                        city: e.target.value || undefined 
                      }))}
                      placeholder={t('search.enterCity')}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleFilterApply} className="flex-1 bg-hotprop-primary hover:bg-hotprop-primary/90">
                      {t('search.applyFilters')}
                    </Button>
                    <Button onClick={clearFilters} variant="outline">
                      {t('search.clear')}
                    </Button>
                  </div>
                </div>
              </SheetContent>
      </Sheet>

      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="properties" data-testid="tab-properties">{t('search.properties')}</TabsTrigger>
            <TabsTrigger value="requirements" data-testid="tab-requirements">{t('search.requirements')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="properties" className="mt-0">
            {isLoadingProperties ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-200 animate-pulse rounded-2xl h-80"></div>
                ))}
              </div>
            ) : properties && properties.length > 0 ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {t('search.propertiesFound', { count: properties.length })}
                  </p>
                </div>
                <div className="space-y-4">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('search.noPropertiesFound')}</h3>
                <p className="text-gray-600 mb-4">
                  {searchParams.query || Object.keys(searchParams).length > 0
                    ? t('search.adjustCriteria')
                    : t('search.startSearching')
                  }
                </p>
                <Button onClick={clearFilters} variant="outline">
                  {t('search.clearFilters')}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="requirements" className="mt-0">
            {isLoadingRequirements ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-200 animate-pulse rounded-2xl h-80"></div>
                ))}
              </div>
            ) : requirements && requirements.length > 0 ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">{t('search.showingBuyerRequirements')}</span>
                    <br />{t('search.buyerRequirementsDescription')}
                  </p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {t('search.requirementsFound', { count: requirements.length })}
                  </p>
                </div>
                <div className="space-y-4">
                  {requirements.map((requirement) => (
                    <RequirementCard key={requirement.id} requirement={requirement} showActions={false} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('search.noRequirementsFound')}</h3>
                <p className="text-gray-600 mb-4">
                  {searchParams.query || Object.keys(searchParams).length > 0
                    ? t('search.adjustCriteria')
                    : t('search.browseRequirements')
                  }
                </p>
                <Button onClick={clearFilters} variant="outline">
                  {t('search.clearFilters')}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
