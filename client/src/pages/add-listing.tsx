import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import PropertyForm from "@/components/property/property-form";
import RequirementForm from "@/components/requirement/requirement-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/language-context";

export default function AddListing() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();
  
  // Get initial tab from URL parameter
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    return tabParam === 'requirement' ? 'requirement' : 'property';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Update tab when location changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const newTab = tabParam === 'requirement' ? 'requirement' : 'property';
    setActiveTab(newTab);
  }, [location]);

  const handleSuccess = () => {
    setLocation("/profile");
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('addListing.title')}</h1>
        <p className="text-gray-600">{t('addListing.description')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="property" data-testid="tab-list-property">{t('addListing.listProperty')}</TabsTrigger>
          <TabsTrigger value="requirement" data-testid="tab-post-requirement">{t('addListing.postRequirement')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="property" className="mt-0">
          <PropertyForm key="new-listing" onSuccess={handleSuccess} />
        </TabsContent>
        
        <TabsContent value="requirement" className="mt-0">
          <RequirementForm onSuccess={handleSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
