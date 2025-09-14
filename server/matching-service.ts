import type { Property, BuyerRequirement } from "@shared/schema";

interface MatchResult {
  property: Property;
  requirement: BuyerRequirement;
  compatibilityScore: number;
  matchDetails: {
    propertyType: boolean;
    transactionType: boolean;
    priceRange: boolean;
    location: boolean;
    bedrooms: boolean;
    bathrooms: boolean;
    area: boolean;
    landSize: boolean;
    buildSize: boolean;
    amenities: boolean;
  };
}

export interface PropertyMatch {
  property: Property;
  requirement: BuyerRequirement;
  compatibilityScore: number;
  matchingCriteria: string[];
}

export interface RequirementMatch {
  requirement: BuyerRequirement;
  property: Property;
  compatibilityScore: number;
  matchingCriteria: string[];
}

export class MatchingService {
  /**
   * Calculate compatibility score between a property and buyer requirement
   * Returns a score from 0-100 representing percentage match
   */
  calculateCompatibility(property: Property, requirement: BuyerRequirement): number {
    let totalCriteria = 0;
    let matchedCriteria = 0;

    // Property Type (Required - 20 points)
    totalCriteria += 20;
    if (property.propertyType === requirement.propertyType) {
      matchedCriteria += 20;
    }

    // Transaction Type (Required - 20 points)
    totalCriteria += 20;
    if (this.transactionTypesMatch(property.transactionType, requirement.transactionType)) {
      matchedCriteria += 20;
    }

    // Price Range (Important - 15 points)
    totalCriteria += 15;
    if (this.priceInRange(property, requirement)) {
      matchedCriteria += 15;
    }

    // Location (Important - 15 points)
    totalCriteria += 15;
    if (this.locationMatches(property, requirement)) {
      matchedCriteria += 15;
    }

    // Bedrooms (10 points)
    if (requirement.minBedrooms !== null && requirement.minBedrooms !== undefined) {
      totalCriteria += 10;
      if (property.bedrooms && property.bedrooms >= requirement.minBedrooms) {
        matchedCriteria += 10;
      }
    }

    // Bathrooms (5 points)
    if (requirement.minBathrooms !== null && requirement.minBathrooms !== undefined) {
      totalCriteria += 5;
      if (property.bathrooms && property.bathrooms >= requirement.minBathrooms) {
        matchedCriteria += 5;
      }
    }

    // Area (10 points)
    if (requirement.minArea !== null || requirement.maxArea !== null) {
      totalCriteria += 10;
      if (this.areaInRange(property, requirement)) {
        matchedCriteria += 10;
      }
    }

    // Land Size (5 points)
    if (requirement.minLandSize !== null || requirement.maxLandSize !== null) {
      totalCriteria += 5;
      if (this.landSizeInRange(property, requirement)) {
        matchedCriteria += 5;
      }
    }

    // Build Size (5 points)
    if (requirement.minBuildSize !== null || requirement.maxBuildSize !== null) {
      totalCriteria += 5;
      if (this.buildSizeInRange(property, requirement)) {
        matchedCriteria += 5;
      }
    }

    // Amenities (5 points)
    if (requirement.requiredAmenities && requirement.requiredAmenities.length > 0) {
      totalCriteria += 5;
      if (this.amenitiesMatch(property, requirement)) {
        matchedCriteria += 5;
      }
    }

    // Calculate percentage
    return totalCriteria > 0 ? Math.round((matchedCriteria / totalCriteria) * 100) : 0;
  }

  /**
   * Get detailed match information
   */
  getMatchDetails(property: Property, requirement: BuyerRequirement) {
    return {
      propertyType: property.propertyType === requirement.propertyType,
      transactionType: this.transactionTypesMatch(property.transactionType, requirement.transactionType),
      priceRange: this.priceInRange(property, requirement),
      location: this.locationMatches(property, requirement),
      bedrooms: !requirement.minBedrooms || Boolean(property.bedrooms && property.bedrooms >= requirement.minBedrooms),
      bathrooms: !requirement.minBathrooms || Boolean(property.bathrooms && property.bathrooms >= requirement.minBathrooms),
      area: this.areaInRange(property, requirement),
      landSize: this.landSizeInRange(property, requirement),
      buildSize: this.buildSizeInRange(property, requirement),
      amenities: this.amenitiesMatch(property, requirement),
    };
  }

  /**
   * Find all matches for a buyer requirement with at least the minimum compatibility score
   */
  findMatches(properties: Property[], requirement: BuyerRequirement, minCompatibility = 80): MatchResult[] {
    const matches: MatchResult[] = [];

    for (const property of properties) {
      // Skip inactive properties or properties owned by the same user
      if (!property.isActive || property.ownerId === requirement.buyerId) {
        continue;
      }

      const compatibilityScore = this.calculateCompatibility(property, requirement);
      
      if (compatibilityScore >= minCompatibility) {
        matches.push({
          property,
          requirement,
          compatibilityScore,
          matchDetails: this.getMatchDetails(property, requirement)
        });
      }
    }

    // Sort by compatibility score (highest first)
    return matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  /**
   * Find all matches for multiple buyer requirements
   */
  findMatchesForRequirements(properties: Property[], requirements: BuyerRequirement[], minCompatibility = 80): MatchResult[] {
    const allMatches: MatchResult[] = [];

    for (const requirement of requirements) {
      if (!requirement.isActive) continue;
      
      const matches = this.findMatches(properties, requirement, minCompatibility);
      allMatches.push(...matches);
    }

    return allMatches;
  }

  private transactionTypesMatch(propertyType: string, requirementType: string): boolean {
    // Property sell_or_rent matches both buy and rent requirements
    if (propertyType === "sell_or_rent") return true;
    
    // Property sell matches buy requirement
    if (propertyType === "sell" && requirementType === "buy") return true;
    
    // Property rent matches rent requirement
    if (propertyType === "rent" && requirementType === "rent") return true;
    
    return false;
  }

  private priceInRange(property: Property, requirement: BuyerRequirement): boolean {
    // Determine which price to use based on transaction type
    const price = requirement.transactionType === "rent" ? property.rentPrice : property.price;
    const currency = requirement.transactionType === "rent" ? property.rentCurrency : property.currency;

    if (!price) return false;

    // Simple currency matching for now
    if (currency !== requirement.currency) return false;

    const priceValue = parseFloat(price.toString());
    const minPrice = requirement.minPrice ? parseFloat(requirement.minPrice.toString()) : 0;
    const maxPrice = requirement.maxPrice ? parseFloat(requirement.maxPrice.toString()) : Infinity;

    return priceValue >= minPrice && priceValue <= maxPrice;
  }

  private locationMatches(property: Property, requirement: BuyerRequirement): boolean {
    // Exact city match (case insensitive)
    if (requirement.city && property.city) {
      if (property.city.toLowerCase() === requirement.city.toLowerCase()) {
        return true;
      }
    }

    // State match if city not specified
    if (!requirement.city && requirement.state && property.state) {
      if (property.state.toLowerCase() === requirement.state.toLowerCase()) {
        return true;
      }
    }

    // Country match if neither city nor state specified
    if (!requirement.city && !requirement.state && requirement.country && property.country) {
      if (property.country.toLowerCase() === requirement.country.toLowerCase()) {
        return true;
      }
    }

    // If no location criteria specified, consider it a match
    if (!requirement.city && !requirement.state && !requirement.country) {
      return true;
    }

    return false;
  }

  private areaInRange(property: Property, requirement: BuyerRequirement): boolean {
    if (!property.area) return !requirement.minArea && !requirement.maxArea;

    const propertyArea = parseFloat(property.area.toString());
    const minArea = requirement.minArea ? parseFloat(requirement.minArea.toString()) : 0;
    const maxArea = requirement.maxArea ? parseFloat(requirement.maxArea.toString()) : Infinity;

    // TODO: Handle area unit conversions
    return propertyArea >= minArea && propertyArea <= maxArea;
  }

  private landSizeInRange(property: Property, requirement: BuyerRequirement): boolean {
    if (!property.landSize) return !requirement.minLandSize && !requirement.maxLandSize;

    const propertyLandSize = parseFloat(property.landSize.toString());
    const minLandSize = requirement.minLandSize ? parseFloat(requirement.minLandSize.toString()) : 0;
    const maxLandSize = requirement.maxLandSize ? parseFloat(requirement.maxLandSize.toString()) : Infinity;

    return propertyLandSize >= minLandSize && propertyLandSize <= maxLandSize;
  }

  private buildSizeInRange(property: Property, requirement: BuyerRequirement): boolean {
    if (!property.buildSize) return !requirement.minBuildSize && !requirement.maxBuildSize;

    const propertyBuildSize = parseFloat(property.buildSize.toString());
    const minBuildSize = requirement.minBuildSize ? parseFloat(requirement.minBuildSize.toString()) : 0;
    const maxBuildSize = requirement.maxBuildSize ? parseFloat(requirement.maxBuildSize.toString()) : Infinity;

    return propertyBuildSize >= minBuildSize && propertyBuildSize <= maxBuildSize;
  }

  private amenitiesMatch(property: Property, requirement: BuyerRequirement): boolean {
    if (!requirement.requiredAmenities || requirement.requiredAmenities.length === 0) {
      return true;
    }

    if (!property.amenities || property.amenities.length === 0) {
      return false;
    }

    // Check if property has all required amenities
    return requirement.requiredAmenities.every(requiredAmenity =>
      property.amenities!.some(propertyAmenity =>
        propertyAmenity.toLowerCase().includes(requiredAmenity.toLowerCase())
      )
    );
  }

  findMatchesForProperty(
    property: Property,
    requirements: BuyerRequirement[],
    minCompatibility: number = 0
  ): RequirementMatch[] {
    const matches: RequirementMatch[] = [];

    for (const requirement of requirements) {
      const score = this.calculateCompatibilityScore(property, requirement);
      
      if (score >= minCompatibility) {
        matches.push({
          requirement,
          property,
          compatibilityScore: score,
          matchingCriteria: this.getMatchingCriteria(property, requirement)
        });
      }
    }

    return matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  calculateCompatibilityScore(property: Property, requirement: BuyerRequirement): number {
    return this.calculateCompatibility(property, requirement);
  }

  getMatchingCriteria(property: Property, requirement: BuyerRequirement): string[] {
    const criteria: string[] = [];
    
    if (property.propertyType === requirement.propertyType) {
      criteria.push('Property Type');
    }
    if (this.transactionTypesMatch(property.transactionType, requirement.transactionType)) {
      criteria.push('Transaction Type');
    }
    if (this.priceInRange(property, requirement)) {
      criteria.push('Price Range');
    }
    if (this.locationMatches(property, requirement)) {
      criteria.push('Location');
    }
    if (requirement.minBedrooms && property.bedrooms && property.bedrooms >= requirement.minBedrooms) {
      criteria.push('Bedrooms');
    }
    if (requirement.minBathrooms && property.bathrooms && property.bathrooms >= requirement.minBathrooms) {
      criteria.push('Bathrooms');
    }
    if (this.areaInRange(property, requirement)) {
      criteria.push('Area');
    }
    if (this.landSizeInRange(property, requirement)) {
      criteria.push('Land Size');
    }
    if (this.buildSizeInRange(property, requirement)) {
      criteria.push('Build Size');
    }
    if (this.amenitiesMatch(property, requirement)) {
      criteria.push('Amenities');
    }

    return criteria;
  }
}

export const matchingService = new MatchingService();