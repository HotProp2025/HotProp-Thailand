import { Bell, Search, AlertTriangle, Star, Check, X, ArrowLeft, Home, User, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { MatchesModal } from "@/components/modals/matches-modal";
import { ValidationModal } from "@/components/modals/validation-modal";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/language-context";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  relatedId?: string;
}

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Modal state management
  const [matchesModalOpen, setMatchesModalOpen] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);

  // Fetch real notifications from backend
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  // Fetch user's requirements and properties to determine what notifications to show
  const { data: userRequirements = [] } = useQuery<any[]>({
    queryKey: ["/api/my-requirements"],
    enabled: !!user,
  });

  const { data: userProperties = [] } = useQuery<any[]>({
    queryKey: ["/api/my-properties"],
    enabled: !!user,
  });

  // Filter notifications based on user context and actual deactivations
  const filteredNotifications = notifications.filter((notification) => {
    const hasRequirements = userRequirements.length > 0;
    const hasProperties = userProperties.length > 0;
    const hasActiveRequirements = userRequirements.some((req: any) => req.isActive);
    const hasActiveProperties = userProperties.some((prop: any) => prop.isActive);
    const hasDeactivatedRequirements = userRequirements.some((req: any) => !req.isActive);
    const hasDeactivatedProperties = userProperties.some((prop: any) => !prop.isActive);

    switch (notification.type) {
      case 'property_match':
      case 'latest_matches':
      case 'new_matches':
        // Only show property match notifications if user has posted requirements
        return hasRequirements;
      
      case 'requirement_match':
        // Only show requirement match notifications if user has posted properties
        return hasProperties;
      
      case 'listing_deactivated':
        // Only show if user actually has deactivated properties
        return hasDeactivatedProperties;
        
      case 'requirement_deactivated':
        // Only show if user actually has deactivated requirements
        return hasDeactivatedRequirements;
      
      case 'property_validated':
      case 'requirement_validated':
      case 'validation_reminder':
        // Show validation notifications for users with active listings
        return hasActiveProperties || hasActiveRequirements;
      
      default:
        return true;
    }
  });

  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

  // Reactivation mutations
  const reactivatePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await apiRequest('POST', '/api/reactivate-property', { propertyId });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('notifications.success'), description: t('notifications.propertyReactivated') });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-properties"] });
    },
    onError: () => {
      toast({ title: t('notifications.error'), description: t('notifications.failedReactivateProperty'), variant: "destructive" });
    }
  });

  const reactivateRequirementMutation = useMutation({
    mutationFn: async (requirementId: string) => {
      const response = await apiRequest('POST', '/api/reactivate-requirement', { requirementId });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('notifications.success'), description: t('notifications.requirementReactivated') });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-requirements"] });
    },
    onError: () => {
      toast({ title: t('notifications.error'), description: t('notifications.failedReactivateRequirement'), variant: "destructive" });
    }
  });

  // Handle reactivation click
  const handleReactivate = async (notification: Notification) => {
    if (!notification.relatedId) return;
    
    if (notification.type === 'listing_deactivated') {
      reactivatePropertyMutation.mutate(notification.relatedId);
    } else if (notification.type === 'requirement_deactivated') {
      reactivateRequirementMutation.mutate(notification.relatedId);
    }
  };

  // Handle notification click to open modals
  const handleNotificationClick = (notification: Notification) => {
    if (!user) return;

    // Mark notification as read when clicked
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    switch (notification.type) {
      case 'latest_matches':
      case 'property_match':
      case 'new_matches':
      case 'requirement_match':
        // Open matches modal (now shows both properties and requirements in tabs)
        setMatchesModalOpen(true);
        break;
        
      case 'validation_reminder':
      case 'listing_deactivated':
      case 'requirement_deactivated':
        // Open validation modal for validation/reactivation
        setValidationModalOpen(true);
        break;
        
      case 'message':
        // Navigate to messages page with specific conversation opened
        if (notification.relatedId) {
          setLocation(`/messages?conversation=${notification.relatedId}`);
        } else {
          setLocation('/messages');
        }
        break;
        
      default:
        // For other notification types, don't open modal
        break;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiRequest('PUT', `/api/notifications/${notificationId}/read`, undefined);
      // Refetch notifications to update the list without page reload
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: t('notifications.success'), description: t('notifications.markedAsRead') });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({ title: t('notifications.error'), description: t('notifications.failedMarkAsRead'), variant: "destructive" });
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('PUT', '/api/notifications/read-all', undefined);
      // Refetch notifications to update the list without page reload
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: t('notifications.success'), description: t('notifications.allMarkedAsRead') });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({ title: t('notifications.error'), description: t('notifications.failedMarkAllAsRead'), variant: "destructive" });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiRequest('DELETE', `/api/notifications/${notificationId}`, undefined);
      // Refetch notifications to update the list without page reload
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: t('notifications.success'), description: t('notifications.deleted') });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({ title: t('notifications.error'), description: t('notifications.failedDelete'), variant: "destructive" });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return t('notifications.minAgo', { minutes: diffInMinutes });
    } else if (diffInMinutes < 1440) {
      return t('notifications.hourAgo', { hours: Math.floor(diffInMinutes / 60) });
    } else {
      return t('notifications.dayAgo', { days: Math.floor(diffInMinutes / 1440) });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'property_match':
      case 'latest_matches':
        return Search;
      case 'requirement_match':
        return User;
      case 'new_matches':
        return Star;
      case 'listing_deactivated':
      case 'property_validated':
      case 'requirement_validated':
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm px-4 py-4 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="p-1 h-8 w-8"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Bell className="h-6 w-6 text-hotprop-primary" />
            <h1 className="text-xl font-semibold text-gray-900">{t('notifications.title')}</h1>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="p-1 h-8 w-8"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Bell className="h-6 w-6 text-hotprop-primary" />
            <h1 className="text-xl font-semibold text-gray-900">{t('notifications.title')}</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="bg-hotprop-primary">
                {unreadCount} {t('notifications.new')}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              className="text-sm"
            >
              <Check className="h-4 w-4 mr-1" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">{t('notifications.noNotifications')}</h2>
            <p className="text-gray-500">{t('notifications.allCaughtUp')}</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={`bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'border-l-4 border-l-hotprop-primary bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === 'latest_matches' || notification.type === 'property_match' ? 'bg-blue-100 text-blue-600' :
                    notification.type === 'listing_deactivated' || notification.type.includes('_validated') ? 'bg-orange-100 text-orange-600' :
                    notification.type === 'new_matches' ? 'bg-purple-100 text-purple-600' :
                    notification.type === 'requirement_match' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="h-6 w-6 p-0 text-hotprop-primary"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.content}
                    </p>
                    
                    {/* Reactivation button for deactivated listings */}
                    {(notification.type === 'listing_deactivated' || notification.type === 'requirement_deactivated') && (
                      <div className="mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReactivate(notification);
                          }}
                          disabled={reactivatePropertyMutation.isPending || reactivateRequirementMutation.isPending}
                          className="text-hotprop-primary border-hotprop-primary hover:bg-hotprop-primary hover:text-white"
                          data-testid={`button-reactivate-${notification.relatedId}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          {reactivatePropertyMutation.isPending || reactivateRequirementMutation.isPending 
                            ? t('notifications.reactivating') 
                            : t('notifications.reactivate')
                          }
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-hotprop-primary rounded-full"></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <MatchesModal
        isOpen={matchesModalOpen}
        onClose={() => setMatchesModalOpen(false)}
        userId={user?.id || ''}
      />
      
      <ValidationModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        userId={user?.id || ''}
      />
    </div>
  );
}