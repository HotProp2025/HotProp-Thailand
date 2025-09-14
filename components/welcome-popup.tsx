import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { Home, Search, FileText, Users, Wrench, X } from "lucide-react";

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomePopup({ isOpen, onClose }: WelcomePopupProps) {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  const handleNavigation = (path: string) => {
    setLocation(path);
    onClose();
  };

  const welcomeTitle = language === 'th' ? 'ยินดีต้อนรับสู่ HotProp!' : 'Welcome to HotProp!';
  const welcomeSubtitle = language === 'th' ? 'วันนี้คุณต้องการทำอะไร?' : 'What would you like to do today?';

  const actionButtons = [
    {
      id: 'list-property',
      title: language === 'th' ? 'ประกาศขายอสังหาฯ' : 'List a Property',
      description: language === 'th' ? 'ลงประกาศขาย/ให้เช่าอสังหาริมทรัพย์' : 'Post your property for sale or rent',
      icon: Home,
      path: '/add-listing',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800',
    },
    {
      id: 'list-requirement',
      title: language === 'th' ? 'ประกาศหาซื้อ/เช่า' : 'List a Requirement',
      description: language === 'th' ? 'ประกาศความต้องการหาซื้อหรือเช่า' : 'Post what you\'re looking for',
      icon: FileText,
      path: '/add-listing?tab=requirement',
      color: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-800',
    },
    {
      id: 'search',
      title: language === 'th' ? 'ค้นหา' : 'Search',
      description: language === 'th' ? 'ค้นหาอสังหาฯและความต้องการ' : 'Search properties and requirements',
      icon: Search,
      path: '/search',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800',
    },
    {
      id: 'find-services',
      title: language === 'th' ? 'หาบริการ/แม่แบบ' : 'Find Services/Templates',
      description: language === 'th' ? 'ค้นหาบริการและเทมเพลตที่เป็นประโยชน์' : 'Find helpful services and templates',
      icon: Wrench,
      path: '/resources',
      color: 'bg-teal-50 hover:bg-teal-100 border-teal-200 !text-gray-900 dark:!text-gray-900',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 gap-0" data-testid="welcome-popup">
        {/* Close button in top-right corner */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          data-testid="button-close-welcome"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Header */}
        <DialogHeader className="text-center p-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
            {welcomeTitle}
          </DialogTitle>
          <p className="text-gray-600 text-base">
            {welcomeSubtitle}
          </p>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          {actionButtons.map((button) => {
            const IconComponent = button.icon;
            return (
              <Button
                key={button.id}
                variant="outline"
                className={`w-full h-auto p-4 justify-start ${button.color} transition-all duration-200`}
                onClick={() => handleNavigation(button.path)}
                data-testid={`button-${button.id}`}
              >
                <div className="flex items-center w-full">
                  <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">
                      {button.title}
                    </div>
                    <div className="text-xs opacity-80 mt-0.5">
                      {button.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-gray-500">
            {language === 'th' 
              ? 'คุณสามารถเข้าถึงฟีเจอร์เหล่านี้ได้จากเมนูด้านล่างเสมอ'
              : 'You can always access these features from the bottom menu'
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}