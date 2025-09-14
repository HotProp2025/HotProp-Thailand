import { useQuery } from "@tanstack/react-query";
import PropertyCard from "@/components/property/property-card";
import { Heart } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { Property } from "@shared/schema";

export default function Favorites() {
  const { data: favorites, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/favorites"],
  });
  const { t } = useLanguage();

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('favorites.title')}</h1>
        <p className="text-gray-600">{t('favorites.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-2xl h-80"></div>
          ))}
        </div>
      ) : favorites && favorites.length > 0 ? (
        <div className="space-y-4">
          {favorites.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('favorites.noSavedTitle')}</h3>
          <p className="text-gray-600 mb-4">
            {t('favorites.noSavedDescription')}
          </p>
        </div>
      )}
    </div>
  );
}
