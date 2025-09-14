import { Bell, User, LogOut, Search, AlertTriangle, Star, Check, TrendingUp, Crown, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MatchesModal } from "@/components/modals/matches-modal";
import { ValidationModal } from "@/components/modals/validation-modal";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguage } from "@/contexts/language-context";
import logoUrl from "@assets/HotProp-Logo_1755342220119.png";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  relatedId?: string;
}

export default function Header() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  
  // Modal state management
  const [matchesModalOpen, setMatchesModalOpen] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);

  // Fetch real notifications from backend
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  // Fetch user's requirements to filter notifications properly
  const { data: userRequirements = [] } = useQuery<any[]>({
    queryKey: ["/api/my-requirements"],
    enabled: !!user,
  });

  const { data: userProperties = [] } = useQuery<any[]>({
    queryKey: ["/api/my-properties"],
    enabled: !!user,
  });

  // Filter notifications just like in the notifications page
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

  const markAsRead = async (notificationId: string) => {
    try {
      await apiRequest('PUT', `/api/notifications/${notificationId}/read`, undefined);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!user) return;

    // Mark as read first
    markAsRead(notification.id);
    
    // Open appropriate modal based on notification type
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
        
      default:
        // For other notification types, navigate to notifications page
        setLocation('/notifications');
        break;
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('PUT', '/api/notifications/read-all', undefined);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'latest_matches':
      case 'property_match':
      case 'new_matches':
        return <Search className="w-4 h-4" />;
      case 'listing_deactivated':
      case 'requirement_deactivated':
        return <AlertTriangle className="w-4 h-4" />;
      case 'requirement_match':
        return <Star className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'latest_matches':
      case 'property_match':
        return 'bg-blue-100 text-blue-600';
      case 'listing_deactivated':
      case 'requirement_deactivated':
        return 'bg-red-100 text-red-600';
      case 'new_matches':
        return 'bg-purple-100 text-purple-600';
      case 'requirement_match':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <header className="bg-white shadow-sm px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setLocation("/")}
            className="cursor-pointer"
          >
            <img src={logoUrl} alt="HotProp Logo" className="h-20 w-auto hover:opacity-80 transition-opacity" />
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <LanguageSelector />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-semibold text-sm">{t('header.notifications')}</h3>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-6 px-2"
                    onClick={markAllAsRead}
                  >
                    {t('notifications.markAllRead')}
                  </Button>
                )}
              </div>
              {filteredNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {t('notifications.noNotifications')}
                </div>
              ) : (
                filteredNotifications.slice(0, 3).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`p-3 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationStyle(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(new Date(notification.createdAt))}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              {filteredNotifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="p-3 text-center text-sm text-blue-600 cursor-pointer"
                    onClick={() => setLocation("/notifications")}
                  >
                    {t('home.viewAll')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-8 w-8 rounded-full hover:bg-gray-100"
                onDoubleClick={() => setLocation("/profile")}
              >
                <Avatar className="w-8 h-8 cursor-pointer">
                  <AvatarImage src={user?.avatar || undefined} />
                  <AvatarFallback className="bg-gray-300 text-gray-600">
                    {user ? `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}` : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="px-3 py-2 text-sm text-gray-500 border-b">
                {user ? `${user.firstName} ${user.lastName}` : 'User Menu'}
              </div>
              <DropdownMenuItem onClick={() => setLocation("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>View Profile</span>
              </DropdownMenuItem>
              {user?.subscriptionType === 'premium' && (
                <DropdownMenuItem onClick={() => setLocation("/price-trends")}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span className="flex items-center space-x-1">
                    <span>Price Trends</span>
                    <Crown className="h-3 w-3 text-yellow-500" />
                  </span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setLocation("/help")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
    </header>
  );
}
