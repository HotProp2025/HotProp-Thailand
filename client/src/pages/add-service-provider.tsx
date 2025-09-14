// This component is now replaced by admin-services.tsx
// Service provider management is admin-only functionality

import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AddServiceProvider() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to resources page as this is now admin-only
    setLocation("/resources");
  }, [setLocation]);

  return null;
}