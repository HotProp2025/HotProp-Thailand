import { Building, Home, MapPin, Building2, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";


interface PropertyTypeSelectorProps {
  selectedType?: string;
  onTypeSelect: (type: string) => void;
}

export default function PropertyTypeSelector({ selectedType, onTypeSelect }: PropertyTypeSelectorProps) {
  const { t } = useLanguage();
  
  const propertyTypes = [
    { id: "house", label: t('propertyType.house'), icon: Home },
    { id: "apartment", label: t('propertyType.apartment'), icon: Building },
    { id: "land", label: t('propertyType.land'), icon: MapPin },
    { id: "townhouse", label: t('propertyType.townhouse'), icon: Building2 },
    { id: "poolvilla", label: t('propertyType.poolvilla'), icon: Waves },
  ];
  
  return (
    <div className="px-4 py-4 bg-white border-b">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('search.propertyTypes')}</h2>
      <div className="flex justify-between space-x-2 pb-2">
        {propertyTypes.map(({ id, label, icon: Icon }) => {
          const isSelected = selectedType === id;
          return (
            <Button
              key={id}
              variant="ghost"
              onClick={() => onTypeSelect(isSelected ? "" : id)}
              className="flex-1 flex flex-col items-center p-2 h-auto min-w-0"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-1 ${
                isSelected 
                  ? "bg-hotprop-primary bg-opacity-100" 
                  : "bg-hotprop-primary bg-opacity-10"
              }`}>
                <Icon className={`w-5 h-5 ${
                  isSelected ? "text-white" : "text-hotprop-primary"
                }`} />
              </div>
              <p className="text-xs font-medium text-gray-700 text-center leading-tight">{label}</p>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
