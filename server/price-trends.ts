import { storage } from './storage.js';
import type { Property } from '../shared/schema.js';

interface PriceTrendData {
  neighborhood: string;
  city: string;
  state: string;
  saleData: {
    averagePrice: number;
    medianPrice: number;
    propertyCount: number;
    pricePerSqft: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
  };
  rentData: {
    averagePrice: number;
    medianPrice: number;
    propertyCount: number;
    pricePerSqft: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
  };
  lastUpdated: string;
}

interface PropertyPrice {
  price: number;
  pricePerSqft: number;
  transactionType: string;
  createdAt: Date;
  neighborhood: string;
  city: string;
  state: string;
}

export class PriceTrendsService {
  /**
   * Generate comprehensive price trend data for all neighborhoods
   */
  async generatePriceTrends(): Promise<PriceTrendData[]> {
    try {
      console.log('🔍 Generating smart price trend data...');
      
      // Get all active properties
      const properties = await storage.getProperties({});
      
      if (properties.length === 0) {
        console.log('📭 No properties found for price trend analysis');
        return [];
      }

      // Group properties by neighborhood
      const neighborhoodData = this.groupPropertiesByNeighborhood(properties);
      
      const trendData: PriceTrendData[] = [];

      for (const [neighborhoodKey, properties] of Array.from(neighborhoodData.entries())) {
        const [city, state] = neighborhoodKey.split('|');
        const neighborhood = this.extractNeighborhood(city);
        
        // Calculate trends for sale properties
        const saleProperties = properties.filter((p: any) => 
          p.transactionType === 'sell' && p.price && p.price > 0
        );
        
        // Calculate trends for rental properties
        const rentProperties = properties.filter((p: any) => 
          (p.transactionType === 'rent' || p.transactionType === 'sell_or_rent') && 
          p.rentPrice && p.rentPrice > 0
        );

        const saleData = this.calculateTrendData(saleProperties, 'sale');
        const rentData = this.calculateTrendData(rentProperties, 'rent');

        // Only include neighborhoods with sufficient data
        if (saleData.propertyCount > 0 || rentData.propertyCount > 0) {
          trendData.push({
            neighborhood,
            city,
            state,
            saleData,
            rentData,
            lastUpdated: new Date().toISOString()
          });
        }
      }

      console.log(`📊 Generated price trends for ${trendData.length} neighborhoods`);
      return trendData.sort((a, b) => 
        (b.saleData.propertyCount + b.rentData.propertyCount) - 
        (a.saleData.propertyCount + a.rentData.propertyCount)
      );
      
    } catch (error) {
      console.error('❌ Error generating price trends:', error);
      return [];
    }
  }

  /**
   * Group properties by neighborhood (city + state)
   */
  private groupPropertiesByNeighborhood(properties: Property[]): Map<string, Property[]> {
    const grouped = new Map<string, Property[]>();
    
    for (const property of properties) {
      if (!property.city || !property.state) continue;
      
      const key = `${property.city.trim()}|${property.state.trim()}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(property);
    }
    
    return grouped;
  }

  /**
   * Extract neighborhood name from city string
   */
  private extractNeighborhood(city: string): string {
    // Handle "Area, District" format common in Thailand
    const parts = city.split(',');
    return parts[0].trim();
  }

  /**
   * Calculate trend data for a group of properties
   */
  private calculateTrendData(properties: Property[], type: 'sale' | 'rent'): {
    averagePrice: number;
    medianPrice: number;
    propertyCount: number;
    pricePerSqft: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
  } {
    if (properties.length === 0) {
      return {
        averagePrice: 0,
        medianPrice: 0,
        propertyCount: 0,
        pricePerSqft: 0,
        trend: 'stable',
        trendPercentage: 0
      };
    }

    // Extract prices based on transaction type
    const prices = properties.map(p => {
      const price = type === 'sale' ? Number(p.price) : Number(p.rentPrice);
      const area = Number(p.area) || Number(p.buildSize) || 100; // Default area if missing
      return {
        price,
        pricePerSqft: price / area,
        createdAt: new Date(p.createdAt || new Date())
      };
    }).filter(p => p.price > 0);

    if (prices.length === 0) {
      return {
        averagePrice: 0,
        medianPrice: 0,
        propertyCount: 0,
        pricePerSqft: 0,
        trend: 'stable',
        trendPercentage: 0
      };
    }

    // Calculate statistics
    const sortedPrices = prices.map(p => p.price).sort((a, b) => a - b);
    const averagePrice = sortedPrices.reduce((sum, price) => sum + price, 0) / sortedPrices.length;
    const medianPrice = this.calculateMedian(sortedPrices);
    const averagePricePerSqft = prices.reduce((sum, p) => sum + p.pricePerSqft, 0) / prices.length;

    // Calculate trend (simplified - based on recent vs older listings)
    const { trend, trendPercentage } = this.calculateTrend(prices);

    return {
      averagePrice: Math.round(averagePrice),
      medianPrice: Math.round(medianPrice),
      propertyCount: properties.length,
      pricePerSqft: Math.round(averagePricePerSqft),
      trend,
      trendPercentage
    };
  }

  /**
   * Calculate median value
   */
  private calculateMedian(sortedValues: number[]): number {
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];
  }

  /**
   * Calculate price trend direction and percentage
   */
  private calculateTrend(prices: { price: number; createdAt: Date }[]): {
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
  } {
    if (prices.length < 4) {
      return { trend: 'stable', trendPercentage: 0 };
    }

    // Sort by date
    const sortedByDate = prices.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    // Compare recent quarter vs older quarter
    const quarterSize = Math.floor(sortedByDate.length / 4);
    const recentPrices = sortedByDate.slice(-quarterSize);
    const olderPrices = sortedByDate.slice(0, quarterSize);

    const recentAvg = recentPrices.reduce((sum, p) => sum + p.price, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((sum, p) => sum + p.price, 0) / olderPrices.length;

    const changePercentage = ((recentAvg - olderAvg) / olderAvg) * 100;

    let trend: 'up' | 'down' | 'stable';
    if (Math.abs(changePercentage) < 2) {
      trend = 'stable';
    } else if (changePercentage > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }

    return {
      trend,
      trendPercentage: Math.round(Math.abs(changePercentage) * 10) / 10
    };
  }

  /**
   * Get price trend data for a specific neighborhood
   */
  async getNeighborhoodTrend(city: string, state: string): Promise<PriceTrendData | null> {
    const allTrends = await this.generatePriceTrends();
    return allTrends.find(trend => 
      trend.city.toLowerCase() === city.toLowerCase() && 
      trend.state.toLowerCase() === state.toLowerCase()
    ) || null;
  }

  /**
   * Get top performing neighborhoods by price growth
   */
  async getTopPerformingNeighborhoods(limit: number = 10): Promise<PriceTrendData[]> {
    const allTrends = await this.generatePriceTrends();
    return allTrends
      .filter(trend => trend.saleData.trend === 'up' || trend.rentData.trend === 'up')
      .sort((a, b) => {
        const aTrend = Math.max(a.saleData.trendPercentage, a.rentData.trendPercentage);
        const bTrend = Math.max(b.saleData.trendPercentage, b.rentData.trendPercentage);
        return bTrend - aTrend;
      })
      .slice(0, limit);
  }
}

export const priceTrendsService = new PriceTrendsService();