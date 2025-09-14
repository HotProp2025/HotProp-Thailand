import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MapPin, DollarSign, Users } from "lucide-react";
import RequirementCard from "@/components/requirement/requirement-card";
import type { BuyerRequirement } from "@shared/schema";

export default function Requirements() {
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const { data: requirements, isLoading } = useQuery<BuyerRequirement[]>({
    queryKey: ["/api/buyer-requirements"],
  });

  // Filter requirements based on search criteria
  const filteredRequirements = requirements?.filter((req) => {
    const matchesSearch = !searchTerm || 
      req.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.country?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPropertyType = propertyTypeFilter === "all" || req.propertyType === propertyTypeFilter;
    const matchesTransactionType = transactionTypeFilter === "all" || req.transactionType === transactionTypeFilter;
    const matchesUrgency = urgencyFilter === "all" || req.urgency === urgencyFilter;

    const matchesLocation = !locationFilter ||
      req.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      req.state?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      req.country?.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesPropertyType && matchesTransactionType && matchesUrgency && matchesLocation;
  }) || [];

  const clearFilters = () => {
    setSearchTerm("");
    setPropertyTypeFilter("all");
    setTransactionTypeFilter("all");
    setLocationFilter("");
    setUrgencyFilter("all");
  };

  const activeFiltersCount = [
    propertyTypeFilter !== "all",
    transactionTypeFilter !== "all",
    urgencyFilter !== "all",
    locationFilter !== "",
    searchTerm !== ""
  ].filter(Boolean).length;

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Buyer Requirements</h1>
        <p className="text-gray-600 text-sm">See what buyers and renters are looking for</p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search requirements, locations, descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Property Type Filter */}
            <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="pool-villa">Pool Villa</SelectItem>
              </SelectContent>
            </Select>

            {/* Transaction Type Filter */}
            <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Looking for" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="buy">Looking to Buy</SelectItem>
                <SelectItem value="rent">Looking to Rent</SelectItem>
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Urgency Filter */}
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeFiltersCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
              Clear All Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {filteredRequirements.length} Requirements Found
          </h2>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{requirements?.length || 0} total</span>
          </div>
        </div>
      </div>

      {/* Requirements List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-2xl h-32"></div>
          ))}
        </div>
      ) : filteredRequirements.length > 0 ? (
        <div className="space-y-4">
          {filteredRequirements.map((requirement) => (
            <RequirementCard key={requirement.id} requirement={requirement} showActions={false} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {requirements?.length === 0 ? "No Requirements Posted Yet" : "No Matching Requirements"}
            </h3>
            <p className="text-gray-600 mb-4">
              {requirements?.length === 0 
                ? "Be the first to see buyer requirements when they're posted"
                : "Try adjusting your search criteria to find more results"
              }
            </p>
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}