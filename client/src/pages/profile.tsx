import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, LogOut, Crown, Home, Heart, Star, Search, Trash2, Shield, CheckCircle } from "lucide-react";
import PropertyCard from "@/components/property/property-card";
import RequirementCard from "@/components/requirement/requirement-card";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Property, BuyerRequirement } from "@shared/schema";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("properties");
  const tabsRef = useRef<HTMLDivElement>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const scrollToTabs = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const { data: myProperties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ["/api/my-properties"],
  });

  const { data: favorites, isLoading: isLoadingFavorites } = useQuery<Property[]>({
    queryKey: ["/api/favorites"],
  });

  const { data: myRequirements, isLoading: isLoadingRequirements } = useQuery<BuyerRequirement[]>({
    queryKey: ["/api/my-requirements"],
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/auth/delete-account");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete account");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      const message = language === 'th' && data.messageTH ? data.messageTH : data.message;
      toast({
        title: language === 'th' ? "ลบบัญชีเรียบร้อย" : "Account Deleted",
        description: message,
        duration: 5000,
      });
      // Clear all cached data and logout
      queryClient.clear();
      logout();
      setLocation("/");
    },
    onError: (error: any) => {
      const message = language === 'th' && error.messageTH ? error.messageTH : error.message;
      toast({
        title: language === 'th' ? "เกิดข้อผิดพลาด" : "Error",
        description: message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  return (
    <div className="px-4 py-6">
      <Card className="mb-6">
        <CardHeader className="text-center">
          <div className="flex flex-col items-center">
            <Avatar className="w-20 h-20 mb-4">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-hotprop-primary text-white text-lg">
                {user.firstName?.[0] || "U"}{user.lastName?.[0] || ""}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{user.firstName} {user.lastName}</CardTitle>
            <p className="text-gray-600">{user.email}</p>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={user.subscriptionType === "premium" ? "default" : "secondary"}>
                {user.subscriptionType === "premium" ? (
                  <>
                    <Crown className="w-3 h-3 mr-1" />
                    {t('profile.premium')}
                  </>
                ) : (
                  t('profile.free')
                )}
              </Badge>
              {user.isVerified && (
                <Badge variant="outline" className="text-hotprop-success border-hotprop-success">
                  <Star className="w-3 h-3 mr-1" />
                  {t('profile.verified')}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setLocation("/edit-profile")}
            >
              <Edit className="w-4 h-4 mr-2" />
              {t('profile.editProfile')}
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              {t('profile.logout')}
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          {/* Danger Zone */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {language === 'th' ? 'การจัดการบัญชี' : 'Account Management'}
            </h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  data-testid="button-delete-account"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'th' ? 'ลบบัญชี' : 'Delete Account'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {language === 'th' ? 'ยืนยันการลบบัญชี' : 'Confirm Account Deletion'}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-left space-y-2">
                    <div className="text-red-600 font-medium">
                      {language === 'th' ? 'คำเตือน: การดำเนินการนี้ไม่สามารถยกเลิกได้' : 'Warning: This action cannot be undone'}
                    </div>
                    <div>
                      {language === 'th' 
                        ? 'เมื่อลบบัญชีแล้ว ข้อมูลต่อไปนี้จะถูกลบหรือปิดการใช้งาน:'
                        : 'When you delete your account, the following data will be removed or deactivated:'
                      }
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li>{language === 'th' ? 'ประกาศอสังหาริมทรัพย์ทั้งหมด' : 'All your property listings'}</li>
                      <li>{language === 'th' ? 'ความต้องการซื้อ/เช่าทั้งหมด' : 'All your buyer requirements'}</li>
                      <li>{language === 'th' ? 'รายการโปรดทั้งหมด' : 'All your saved favorites'}</li>
                      <li>{language === 'th' ? 'ข้อความและการแจ้งเตือนทั้งหมด' : 'All your messages and notifications'}</li>
                      <li>{language === 'th' ? 'ข้อมูลส่วนตัวทั้งหมด' : 'All your personal data'}</li>
                    </ul>
                    <div className="mt-3">
                      {language === 'th' 
                        ? 'คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของคุณอย่างถาวร?'
                        : 'Are you sure you want to permanently delete your account?'
                      }
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAccountMutation.mutate()}
                    disabled={deleteAccountMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleteAccountMutation.isPending 
                      ? (language === 'th' ? 'กำลังลบ...' : 'Deleting...')
                      : (language === 'th' ? 'ลบบัญชี' : 'Delete Account')
                    }
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card 
          className="text-center p-4 cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => {
            setActiveTab("properties");
            scrollToTabs();
          }}
          data-testid="button-my-listings"
        >
          <Home className="w-6 h-6 mx-auto mb-2 text-hotprop-primary" />
          <p className="text-2xl font-bold">{myProperties?.length || 0}</p>
          <p className="text-sm text-gray-600">{t('profile.listings')}</p>
        </Card>
        <Card 
          className="text-center p-4 cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => {
            setActiveTab("saved");
            scrollToTabs();
          }}
          data-testid="button-saved"
        >
          <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
          <p className="text-2xl font-bold">{favorites?.length || 0}</p>
          <p className="text-sm text-gray-600">{t('profile.saved')}</p>
        </Card>
        <Card 
          className="text-center p-4 cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => {
            setActiveTab("requirements");
            scrollToTabs();
          }}
          data-testid="button-my-requirements"
        >
          <Search className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold">{myRequirements?.length || 0}</p>
          <p className="text-sm text-gray-600">{t('profile.requests')}</p>
        </Card>
      </div>

      {user.subscriptionType === "free" && (
        <Card className="mb-6 bg-gradient-to-r from-hotprop-primary to-hotprop-secondary text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">{t('profile.upgradeToPremium')}</h3>
                <p className="text-sm opacity-90">{t('profile.upgradeDescription')}</p>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setLocation("/premium")}
              >
                {t('profile.upgrade')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs ref={tabsRef} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            {t('profile.myProperties')}
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            {t('profile.saved')}
          </TabsTrigger>
          <TabsTrigger value="requirements" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            {t('profile.myRequirements')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="properties" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">{t('profile.myListings')}</h2>
            {myProperties && myProperties.length > 0 && (
              <Button 
                size="sm"
                className="bg-hotprop-primary hover:bg-hotprop-primary/90"
                onClick={() => setLocation("/add-listing")}
              >
                {t('profile.addNew')}
              </Button>
            )}
          </div>
          {isLoadingProperties ? (
            <div className="bg-gray-200 animate-pulse rounded-2xl h-32"></div>
          ) : myProperties && myProperties.length > 0 ? (
            <div className="space-y-4">
              {myProperties.map((property) => (
                <div key={property.id} className="space-y-2">
                  <PropertyCard property={property} showEditButton={true} />
                  {/* Get Verified Button for Premium Members with unverified properties */}
                  {user?.subscriptionType === "premium" && property.verificationStatus !== "verified" && (
                    <div className="ml-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            {property.verificationStatus === "pending" || property.verificationStatus === "requested" 
                              ? t('profile.verificationPending')
                              : property.verificationStatus === "rejected"
                              ? t('profile.verificationRejected')
                              : t('profile.getVerifiedDescription')
                            }
                          </p>
                          <p className="text-xs text-blue-700">
                            {property.verificationStatus === "pending" || property.verificationStatus === "requested"
                              ? t('profile.verificationPendingDesc')
                              : property.verificationStatus === "rejected"
                              ? t('profile.verificationRejectedDesc')
                              : t('profile.verificationBenefits')
                            }
                          </p>
                        </div>
                      </div>
                      {(property.verificationStatus === "none" || property.verificationStatus === "rejected") && (
                        <Button 
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => setLocation(`/edit-listing/${property.id}#verification`)}
                          data-testid={`button-get-verified-${property.id}`}
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          {t('profile.getVerified')}
                        </Button>
                      )}
                      {property.verificationStatus === "verified" && (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t('profile.verified')}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Home className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">{t('profile.noPropertiesYet')}</p>
                <Button 
                  className="bg-hotprop-primary hover:bg-hotprop-primary/90"
                  onClick={() => setLocation("/add-listing")}
                >
                  {t('profile.createFirstListing')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">{t('profile.savedProperties')}</h2>
          </div>
          {isLoadingFavorites ? (
            <div className="bg-gray-200 animate-pulse rounded-2xl h-32"></div>
          ) : favorites && favorites.length > 0 ? (
            <div className="space-y-4">
              {favorites.map((property) => (
                <PropertyCard key={property.id} property={property} showEditButton={false} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Heart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">{t('profile.noSavedYet')}</p>
                <Button 
                  className="bg-hotprop-primary hover:bg-hotprop-primary/90"
                  onClick={() => setLocation("/")}
                >
                  {t('profile.browseProperties')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">{t('profile.myRequirements')}</h2>
            {myRequirements && myRequirements.length > 0 && (
              <Button 
                size="sm"
                className="bg-hotprop-secondary hover:bg-hotprop-secondary/90"
                onClick={() => setLocation("/post-requirement")}
              >
                {t('profile.addNew')}
              </Button>
            )}
          </div>
          {isLoadingRequirements ? (
            <div className="bg-gray-200 animate-pulse rounded-2xl h-32"></div>
          ) : myRequirements && myRequirements.length > 0 ? (
            <div className="space-y-4">
              {myRequirements.map((requirement) => (
                <RequirementCard key={requirement.id} requirement={requirement} showActions={true} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">{t('profile.noRequirementsYet')}</p>
                <Button 
                  className="bg-hotprop-secondary hover:bg-hotprop-secondary/90"
                  onClick={() => setLocation("/post-requirement")}
                >
                  {t('profile.postFirstRequirement')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
