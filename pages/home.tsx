import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/property/property-card";
import WelcomePopup from "@/components/welcome-popup";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";
import type { Property } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAdmin, user } = useAuth();
  const { t } = useLanguage();
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  
  // Check if user is premium
  const isPremiumUser = user?.subscriptionType === 'premium';

  // Check if we should show the welcome popup
  useEffect(() => {
    const shouldShowWelcome = localStorage.getItem("show_welcome_popup");
    if (shouldShowWelcome === "true") {
      setShowWelcomePopup(true);
      // Remove the flag so it doesn't show again
      localStorage.removeItem("show_welcome_popup");
    }
  }, []);

  const { data: featuredProperties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties/featured"],
  });

  return (
    <>
      {/* Welcome Popup */}
      <WelcomePopup 
        isOpen={showWelcomePopup} 
        onClose={() => setShowWelcomePopup(false)} 
      />
      
      {/* Top Action Buttons */}
      <div className="px-4 py-4 bg-white">
        <div className={`grid gap-4 ${isAdmin ? 'grid-cols-3' : isPremiumUser ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {/* Premium Button - Hide for premium users, show Premium Member badge instead */}
          {!isPremiumUser ? (
            <Button
              variant="outline"
              onClick={() => setLocation("/premium")}
              className="h-20 rounded-xl bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 hover:from-yellow-100 hover:to-yellow-200"
              data-testid="premium-upgrade-button"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center mb-1">
                  <Star className="w-5 h-5 text-yellow-600 mr-1" />
                  <span className="font-bold text-yellow-800">{t('home.premium')}</span>
                </div>
                <span className="text-xs text-yellow-700">{t('home.premiumDescription')}</span>
              </div>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setLocation("/premium")}
              className="h-20 rounded-xl bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200"
              data-testid="premium-member-badge"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center mb-1">
                  <Star className="w-5 h-5 text-green-600 mr-1" />
                  <span className="font-bold text-green-800">{t('home.premiumMember')}</span>
                </div>
                <span className="text-xs text-green-700">{t('home.activeSubscription')}</span>
              </div>
            </Button>
          )}

          {/* Resources Button */}
          <Button
            variant="outline"
            onClick={() => setLocation("/resources")}
            className="h-20 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center mb-1">
                <BookOpen className="w-5 h-5 text-blue-600 mr-1" />
                <span className="font-bold text-blue-800">{t('home.resources')}</span>
              </div>
              <span className="text-xs text-blue-700">{t('home.resourcesDescription')}</span>
            </div>
          </Button>

          {/* Admin Button - Only show for admin users */}
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setLocation("/admin")}
              className="h-20 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border-red-200 hover:from-red-100 hover:to-red-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center mb-1">
                  <Settings className="w-5 h-5 text-red-600 mr-1" />
                  <span className="font-bold text-red-800">{t('home.admin')}</span>
                </div>
                <span className="text-xs text-red-700">{t('home.adminPanel')}</span>
              </div>
            </Button>
          )}
        </div>
      </div>

      {/* Welcome Note */}
      <div className="px-4 py-6">
        <div className="text-center bg-gradient-to-r from-hotprop-primary/10 to-hotprop-primary/5 rounded-lg p-6 border border-hotprop-primary/20">
          <h1 className="text-2xl font-bold text-hotprop-primary mb-2">
            <div>{t('home.welcomeTitle1')}</div>
            <div>{t('home.welcomeTitle2')}</div>
          </h1>
          <p className="text-gray-600 text-sm">
            {t('home.welcomeDescription')}
          </p>
        </div>
      </div>

      {/* Featured Properties Section */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{t('home.featuredProperties')}</h2>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/search")}
            className="text-hotprop-primary text-sm font-medium"
          >
            {t('home.viewAll')}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse h-48 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {featuredProperties && featuredProperties.length > 0 ? (
              featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('home.noFeaturedProperties')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
