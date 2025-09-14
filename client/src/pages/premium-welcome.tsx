import { useLanguage } from "@/contexts/language-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, CheckCircle, Home } from "lucide-react";

export default function PremiumWelcome() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen p-4" data-testid="premium-welcome-page">
      <Card className="mt-8">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-6" data-testid="welcome-title">
            {t('premium.welcomeTitle')}
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed" data-testid="welcome-message">
            {t('premium.welcomeMessage')}
          </p>
          
          <Button 
            onClick={() => setLocation("/")} 
            className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90 text-white font-medium py-3"
            data-testid="back-to-home-button"
          >
            <Home className="w-4 h-4 mr-2" />
            {t('premium.backToHome')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}