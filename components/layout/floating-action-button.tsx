import { useState } from "react";
import { Plus, Home, Search as SearchIcon, Users } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function FloatingActionButton() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: "List Property",
      icon: Home,
      action: () => setLocation("/add-listing"),
      className: "bg-hotprop-primary hover:bg-hotprop-primary/90 text-white",
    },
    {
      label: "Post Requirement",
      icon: SearchIcon,
      action: () => setLocation("/post-requirement"),
      className: "bg-hotprop-secondary hover:bg-hotprop-secondary/90 text-white",
    },
    {
      label: "View Requests",
      icon: Users,
      action: () => setLocation("/requirements"),
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-24 right-4 z-40">
      {isOpen && (
        <div className="flex flex-col-reverse space-y-reverse space-y-3 mb-3">
          {actions.map((action, index) => (
            <div key={index} className="flex items-center space-x-3">
              <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {action.label}
              </span>
              <Button
                size="sm"
                className={`w-12 h-12 rounded-full shadow-lg ${action.className}`}
                onClick={() => {
                  action.action();
                  setIsOpen(false);
                }}
              >
                <action.icon className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        size="lg"
        className={`w-14 h-14 rounded-full shadow-lg transition-transform ${
          isOpen 
            ? "bg-gray-600 hover:bg-gray-700 rotate-45" 
            : "bg-hotprop-primary hover:bg-hotprop-primary/90"
        } text-white`}
        onClick={toggleMenu}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}