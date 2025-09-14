import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Building2, Hammer, PenTool, Palette, MapPin, Wrench, Waves, Trees, MoreHorizontal, ExternalLink, Mail, Truck, Sparkles, Camera, FileText, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import type { ServiceProvider } from "@shared/schema";

function getServiceCategories(t: (key: string) => string) {
  return [
    { id: "legal", label: t('serviceCategory.legal'), icon: Building2, description: t('serviceCategory.legal.description') },
    { id: "building", label: t('serviceCategory.building'), icon: Hammer, description: t('serviceCategory.building.description') },
    { id: "architects", label: t('serviceCategory.architects'), icon: PenTool, description: t('serviceCategory.architects.description') },
    { id: "interior", label: t('serviceCategory.interior'), icon: Palette, description: t('serviceCategory.interior.description') },
    { id: "surveyors", label: t('serviceCategory.surveyors'), icon: MapPin, description: t('serviceCategory.surveyors.description') },
    { id: "handymen", label: t('serviceCategory.handymen'), icon: Wrench, description: t('serviceCategory.handymen.description') },
    { id: "pool", label: t('serviceCategory.pool'), icon: Waves, description: t('serviceCategory.pool.description') },
    { id: "garden", label: t('serviceCategory.garden'), icon: Trees, description: t('serviceCategory.garden.description') },
    { id: "relocation", label: t('serviceCategory.relocation'), icon: Truck, description: t('serviceCategory.relocation.description') },
    { id: "cleaning", label: t('serviceCategory.cleaning'), icon: Sparkles, description: t('serviceCategory.cleaning.description') },
    { id: "photography", label: t('serviceCategory.photography'), icon: Camera, description: t('serviceCategory.photography.description') },
    { id: "other", label: t('serviceCategory.other'), icon: MoreHorizontal, description: t('serviceCategory.other.description') },
  ];
}

function getOtherResourceCategories(t: (key: string) => string) {
  return [
    { id: "documents", label: t('resourceCategory.documents'), icon: FileText, description: t('resourceCategory.documents.description') },
    { id: "links", label: t('resourceCategory.links'), icon: Link, description: t('resourceCategory.links.description') },
  ];
}

export default function Resources() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("providers");
  const { t } = useLanguage();
  
  const serviceCategories = getServiceCategories(t);

  const { data: serviceProviders, isLoading } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/service-providers", selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      
      const res = await fetch(`/api/service-providers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch service providers");
      return res.json();
    },
  });

  const filteredProviders = selectedCategory 
    ? serviceProviders?.filter(provider => provider.category === selectedCategory)
    : serviceProviders;

  return (
    <>
      <div className="px-4 py-4 bg-white border-b">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t('resources.title')}</h1>
            <p className="text-sm text-gray-600">{t('resources.description')}</p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
          <TabsTrigger value="providers">{t('resources.serviceProviders')}</TabsTrigger>
          <TabsTrigger value="resources">{t('resources.otherResources')}</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="mt-0">
          {/* Category Filter */}
          <div className="px-4 py-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{t('resources.serviceCategories')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedCategory === "" ? "default" : "outline"}
                onClick={() => setSelectedCategory("")}
                className="h-auto py-2 px-3 justify-start text-left"
              >
                <span className="text-sm">{t('resources.allServices')}</span>
              </Button>
              {serviceCategories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <Button
                    key={category.id}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className="h-auto py-2 px-3 justify-start text-left"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="text-sm">{category.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Service Providers List */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedCategory 
                  ? serviceCategories.find(c => c.id === selectedCategory)?.label || t('resources.allServices')
                  : t('resources.allServices')
                }
              </h2>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-32" />
                ))}
              </div>
            ) : filteredProviders && filteredProviders.length > 0 ? (
              <div className="space-y-4">
                {filteredProviders.map((provider) => (
                  <ServiceProviderCard key={provider.id} provider={provider} serviceCategories={serviceCategories} t={t} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {t('resources.noServiceProviders')}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {t('resources.contactAdmin')} <a href="mailto:admin@hotprop.com" className="text-hotprop-primary hover:underline">{t('resources.contactUs')}</a> to get your business listed.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-0">
          <OtherResources t={t} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function OtherResources({ t }: { t: (key: string) => string }) {
  const [selectedResourceCategory, setSelectedResourceCategory] = useState<string>("");
  
  const otherResourceCategories = getOtherResourceCategories(t);

  // Mock data for now - these would come from admin-managed content
  const documents = [
    {
      id: "1",
      title: t('resource.purchaseAgreement.title'),
      description: t('resource.purchaseAgreement.description'),
      category: "documents",
      downloadUrl: "#",
      fileType: "PDF"
    },
    {
      id: "2", 
      title: t('resource.rentalContract.title'),
      description: t('resource.rentalContract.description'),
      category: "documents",
      downloadUrl: "#",
      fileType: "PDF"
    },
    {
      id: "3",
      title: t('resource.dueDiligence.title'),
      description: t('resource.dueDiligence.description'),
      category: "documents", 
      downloadUrl: "#",
      fileType: "PDF"
    }
  ];

  const links = [
    {
      id: "1",
      title: t('resource.legalAI.title'),
      description: t('resource.legalAI.description'),
      category: "links",
      url: "https://example.com/legal-ai",
      external: true
    },
    {
      id: "2",
      title: t('resource.landDept.title'),
      description: t('resource.landDept.description'),
      category: "links", 
      url: "https://example.com/land-dept",
      external: true
    },
    {
      id: "3",
      title: t('resource.taxCalculator.title'),
      description: t('resource.taxCalculator.description'),
      category: "links",
      url: "https://example.com/tax-calc", 
      external: true
    }
  ];

  const filteredResources = selectedResourceCategory === "documents" 
    ? documents 
    : selectedResourceCategory === "links"
    ? links
    : [
        ...documents.map(doc => ({ ...doc, key: `doc-${doc.id}` })),
        ...links.map(link => ({ ...link, key: `link-${link.id}` }))
      ];

  return (
    <>
      {/* Resource Category Filter */}
      <div className="px-4 py-4 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-3">{t('resources.resourceCategories')}</h3>
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant={selectedResourceCategory === "" ? "default" : "outline"}
            onClick={() => setSelectedResourceCategory("")}
            className="h-auto py-2 px-3 justify-start text-left"
          >
            <span className="text-sm">{t('resources.allResources')}</span>
          </Button>
          {otherResourceCategories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedResourceCategory === category.id;
            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                onClick={() => setSelectedResourceCategory(category.id)}
                className="h-auto py-2 px-3 justify-start text-left"
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="text-sm">{category.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Resources List */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedResourceCategory === "documents" 
              ? t('resourceCategory.documents')
              : selectedResourceCategory === "links"
              ? t('resourceCategory.links')
              : t('resources.allResources')
            }
          </h2>
        </div>

        {filteredResources.length > 0 ? (
          <div className="space-y-4">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} t={t} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('resources.noResources')}</p>
            <p className="text-sm text-gray-400 mt-2">
              {t('resources.contactAdminResources')} <a href="mailto:admin@hotprop.com" className="text-hotprop-primary hover:underline">{t('resources.contactUs')}</a> for submissions.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description: string;
    category: string;
    downloadUrl?: string;
    url?: string;
    fileType?: string;
    external?: boolean;
  };
}

function ResourceCard({ resource, t }: ResourceCardProps & { t: (key: string) => string }) {
  const handleResourceClick = () => {
    if (resource.category === "documents" && resource.downloadUrl) {
      // For documents, trigger download
      window.open(resource.downloadUrl, '_blank');
    } else if (resource.category === "links" && resource.url) {
      // For links, open in new tab
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={handleResourceClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {resource.category === "documents" ? (
              <FileText className="w-8 h-8 text-blue-600" />
            ) : (
              <Link className="w-8 h-8 text-green-600" />
            )}
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {resource.title}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {resource.fileType && (
              <Badge variant="outline" className="text-xs">
                {resource.fileType}
              </Badge>
            )}
            {resource.external && (
              <ExternalLink className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-end">
          <Button 
            size="sm"
            className="bg-hotprop-primary hover:bg-hotprop-primary/90"
          >
            {resource.category === "documents" ? t('resources.download') : t('resources.visit')}
            {resource.category === "links" && <ExternalLink className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ServiceProviderCardProps {
  provider: ServiceProvider;
  serviceCategories: Array<{ id: string; label: string; icon: any; description: string }>;
  t: (key: string) => string;
}

function ServiceProviderCard({ provider, serviceCategories, t }: ServiceProviderCardProps) {
  const [, setLocation] = useLocation();

  const handleEmailContact = () => {
    if (provider.email) {
      const subject = encodeURIComponent(`Service Inquiry - ${provider.companyName}`);
      const body = encodeURIComponent(`Hello ${provider.contactPersonName},\n\nI found your listing on HotProp and would like to inquire about your services.\n\nBest regards`);
      window.open(`mailto:${provider.email}?subject=${subject}&body=${body}`);
    }
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {provider.logoUrl && (
              <img
                src={provider.logoUrl}
                alt={`${provider.companyName} logo`}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {provider.companyName}
              </CardTitle>
              <p className="text-sm text-gray-600">{provider.contactPersonName}</p>
              {provider.email && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Mail className="w-3 h-3" />
                  {provider.email}
                </p>
              )}
              {provider.websiteUrl && (
                <a 
                  href={provider.websiteUrl.startsWith('http') ? provider.websiteUrl : `https://${provider.websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-hotprop-primary hover:underline flex items-center gap-1 mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t('resources.visitWebsite')}
                </a>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {serviceCategories.find(c => c.id === provider.category)?.label || provider.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Service Locations */}
          {provider.serviceLocations && provider.serviceLocations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">{t('resources.serviceAreas')}</p>
              <div className="flex flex-wrap gap-1">
                {provider.serviceLocations.map((location, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {location}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {provider.description}
            </p>
          </div>

          {/* Contact Actions */}
          <div className="flex gap-2 pt-2">
            {provider.email && (
              <Button
                onClick={handleEmailContact}
                className="flex-1 bg-hotprop-primary hover:bg-hotprop-primary/90"
                size="sm"
              >
                <Mail className="w-4 h-4 mr-1" />
                {t('resources.email')}
              </Button>
            )}
            {provider.phoneNumber && (
              <Button
                onClick={() => window.open(`tel:${provider.phoneNumber}`)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {t('resources.call')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}