import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Crown, MapPin, DollarSign, Home, Building } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

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

export default function PriceTrends() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [, setLocation] = useLocation();

  const { data: trendData, isLoading, error } = useQuery({
    queryKey: ['/api/price-trends'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: topPerforming } = useQuery<PriceTrendData[]>({
    queryKey: ['/api/price-trends/top-performing'],
    staleTime: 5 * 60 * 1000,
  });

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen p-4" data-testid="price-trends-error">
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Premium Feature</h2>
            <p className="text-gray-600 mb-4">
              Price trends analysis is exclusively available for Premium members.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Upgrade to Premium to access smart market insights and price trend visualizations.
            </p>
            <Button 
              onClick={() => setLocation("/premium")} 
              className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90"
              data-testid="upgrade-to-premium-button"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen p-4" data-testid="price-trends-loading">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-6">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-bold text-hotprop-primary">Smart Price Trends</h1>
          </div>
          
          {/* Loading skeletons */}
          <Card>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const trends = trendData as PriceTrendData[];

  // Prepare chart data
  const chartData = trends.slice(0, 10).map(trend => ({
    name: trend.neighborhood,
    sale: trend.saleData.averagePrice,
    rent: trend.rentData.averagePrice * 12, // Annualized rent for comparison
    saleCount: trend.saleData.propertyCount,
    rentCount: trend.rentData.propertyCount
  }));

  const trendColors = {
    up: '#10b981',
    down: '#ef4444', 
    stable: '#6b7280'
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen" data-testid="price-trends-page">
      <div className="p-4 space-y-4">
        {/* Premium Header */}
        <div className="flex items-center space-x-2 mb-6">
          <Crown className="w-6 h-6 text-yellow-500" />
          <h1 className="text-2xl font-bold text-hotprop-primary">Smart Price Trends</h1>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Premium</Badge>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="top">Top Areas</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Market Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{trends.length}</div>
                    <div className="text-blue-600">Neighborhoods</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {trends.reduce((sum, t) => sum + t.saleData.propertyCount + t.rentData.propertyCount, 0)}
                    </div>
                    <div className="text-green-600">Properties</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Neighborhood Cards */}
            <div className="space-y-3">
              {trends.slice(0, 5).map((trend, index) => (
                <Card key={index} className="border-l-4 border-l-hotprop-primary">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{trend.neighborhood}</h3>
                        <p className="text-sm text-gray-500">{trend.city}, {trend.state}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Sale Data */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1">
                          <Home className="w-3 h-3 text-blue-500" />
                          <span className="font-medium text-blue-700">For Sale</span>
                        </div>
                        {trend.saleData.propertyCount > 0 ? (
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Avg Price:</span>
                              <span className="font-medium">THB {formatPrice(trend.saleData.averagePrice)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Trend:</span>
                              <div className={`flex items-center space-x-1 text-${trend.saleData.trend === 'up' ? 'green' : trend.saleData.trend === 'down' ? 'red' : 'gray'}-600`}>
                                {getTrendIcon(trend.saleData.trend)}
                                <span className="text-xs font-medium">
                                  {trend.saleData.trendPercentage > 0 && `${trend.saleData.trendPercentage}%`}
                                </span>
                              </div>
                            </div>
                            <div className="text-gray-500">
                              {trend.saleData.propertyCount} properties
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-center py-2">No sale data</div>
                        )}
                      </div>

                      {/* Rent Data */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1">
                          <Building className="w-3 h-3 text-green-500" />
                          <span className="font-medium text-green-700">For Rent</span>
                        </div>
                        {trend.rentData.propertyCount > 0 ? (
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Avg Rent:</span>
                              <span className="font-medium">THB {formatPrice(trend.rentData.averagePrice)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Trend:</span>
                              <div className={`flex items-center space-x-1 text-${trend.rentData.trend === 'up' ? 'green' : trend.rentData.trend === 'down' ? 'red' : 'gray'}-600`}>
                                {getTrendIcon(trend.rentData.trend)}
                                <span className="text-xs font-medium">
                                  {trend.rentData.trendPercentage > 0 && `${trend.rentData.trendPercentage}%`}
                                </span>
                              </div>
                            </div>
                            <div className="text-gray-500">
                              {trend.rentData.propertyCount} properties
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-center py-2">No rent data</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Price Comparison by Neighborhood</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={10}
                    />
                    <YAxis fontSize={10} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `THB ${formatPrice(value)}`,
                        name === 'sale' ? 'Sale Price' : 'Annual Rent'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="sale" fill="#4F7AFF" name="Sale Price" />
                    <Bar dataKey="rent" fill="#10b981" name="Annual Rent" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Count Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData.slice(0, 6)}
                      dataKey="saleCount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#4F7AFF"
                    >
                      {chartData.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Performing Tab */}
          <TabsContent value="top" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span>Top Performing Areas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topPerforming && topPerforming.length > 0 ? (
                  <div className="space-y-3">
                    {topPerforming.slice(0, 8).map((trend: PriceTrendData, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-3">
                          <div className="text-lg font-bold text-green-600">#{index + 1}</div>
                          <div>
                            <div className="font-medium text-gray-800">{trend.neighborhood}</div>
                            <div className="text-sm text-gray-500">{trend.city}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-bold">
                              +{Math.max(trend.saleData.trendPercentage, trend.rentData.trendPercentage)}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {trend.saleData.propertyCount + trend.rentData.propertyCount} properties
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No trending data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Last Updated */}
        <div className="text-center text-xs text-gray-500 py-4">
          Last updated: {trends[0] ? new Date(trends[0].lastUpdated).toLocaleString() : 'N/A'}
        </div>
      </div>
    </div>
  );
}