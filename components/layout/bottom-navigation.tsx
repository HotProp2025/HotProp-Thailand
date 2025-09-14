import { Search, Heart, Plus, User, MessageSquare, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";


export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: "/search", icon: Search, labelKey: "nav.search" },
    { path: "/favorites", icon: Heart, labelKey: "nav.saved" },
    { path: "/add-listing", icon: Plus, labelKey: "nav.list" },
    { path: "/resources", icon: BookOpen, labelKey: "nav.resources" },
    { path: "/messages", icon: MessageSquare, labelKey: "nav.messages" },
    { path: "/profile", icon: User, labelKey: "nav.profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ path, icon: Icon, labelKey }) => {
            const isActive = location === path;
            return (
              <Button
                key={path}
                variant="ghost"
                size="sm"
                onClick={() => setLocation(path)}
                className={`flex flex-col items-center py-2 px-3 ${
                  isActive ? "text-hotprop-primary" : "text-gray-500"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium mt-1">{t(labelKey)}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
