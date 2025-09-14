import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Crown, Check, CreditCard, Smartphone, Gift, ArrowLeft, Star, Bell, TrendingUp, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useLanguage } from "@/contexts/language-context";

interface PremiumPlan {
  id: string;
  nameKey: string;
  price: number;
  durationKey: string;
  savingsKey?: string;
  features: string[];
}

const premiumPlans: PremiumPlan[] = [
  {
    id: "monthly",
    nameKey: "premium.monthlyPremium",
    price: 299,
    durationKey: "premium.perMonth",
    features: [
      "premium.propertyVerification",
      "premium.instantNotifications",
      "premium.priceVisualization",
      "premium.prioritySupport",
      "premium.advancedFilters",
      "premium.unlimitedListings"
    ]
  },
  {
    id: "sixmonths",
    nameKey: "premium.sixMonthPremium",
    price: 999,
    durationKey: "premium.forSixMonths",
    savingsKey: "premium.save33",
    features: [
      "premium.allMonthlyFeatures",
      "premium.propertyVerification",
      "premium.instantNotifications",
      "premium.priceVisualization",
      "premium.prioritySupport",
      "premium.advancedFilters",
      "premium.unlimitedListings",
      "premium.bestValue"
    ]
  }
];

export default function PremiumSignup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  
  // Check if user is already premium
  const isPremiumUser = user?.subscriptionType === 'premium';
  
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  
  // Initialize Stripe with key from backend
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const response = await apiRequest("GET", "/api/stripe/config");
        const { publishableKey } = await response.json();
        setStripePromise(loadStripe(publishableKey));
      } catch (error) {
        console.error("Failed to load Stripe config:", error);
      }
    };
    
    initializeStripe();
  }, []);

  const selectedPlanDetails = premiumPlans.find(plan => plan.id === selectedPlan);

  const handleContinue = () => {
    if (!paymentMethod) {
      toast({
        title: t('premium.toast.selectPaymentMethod'),
        description: t('premium.toast.selectPaymentDesc'),
        variant: "destructive"
      });
      return;
    }
    setShowPaymentForm(true);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      if (paymentMethod === "promptpay") {
        // Handle PromptPay payment via Stripe
        const response = await apiRequest("POST", "/api/premium/promptpay", {
          planId: selectedPlan,
          amount: selectedPlanDetails?.price
        });
        
        const result = await response.json();
        setClientSecret(result.clientSecret);
        setIsProcessing(false);
        
      } else if (paymentMethod === "creditcard") {
        // Create subscription setup first
        const response = await apiRequest("POST", "/api/premium/create-subscription", {
          planId: selectedPlan
        });
        
        const result = await response.json();
        setClientSecret(result.clientSecret);
        // Store additional data needed for confirmation
        sessionStorage.setItem('priceId', result.priceId);
        sessionStorage.setItem('customerId', result.customerId);
      }
    } catch (error: any) {
      toast({
        title: t('premium.toast.paymentFailed'),
        description: error.message || t('premium.toast.paymentFailedDesc'),
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  // PromptPay payment component
  const PromptPayForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [localProcessing, setLocalProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      
      if (!stripe || !elements || !clientSecret) {
        toast({
          title: t('premium.toast.paymentFailed'),
          description: "Payment system not ready. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setLocalProcessing(true);

      try {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/premium-welcome`,
          },
        });

        if (error) {
          toast({
            title: t('premium.toast.paymentFailed'),
            description: error.message || t('premium.toast.paymentFailedDesc'),
            variant: "destructive"
          });
          setLocalProcessing(false);
        }
        // Success handling is done via webhook/redirect
      } catch (err: any) {
        toast({
          title: t('premium.toast.paymentFailed'),
          description: err.message || t('premium.toast.paymentFailedDesc'),
          variant: "destructive"
        });
        setLocalProcessing(false);
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('premium.promptpayTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PaymentElement />
          </CardContent>
        </Card>
        
        <Button 
          type="submit"
          className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90 mt-4"
          size="lg"
          disabled={!stripe || !clientSecret || localProcessing}
          data-testid="complete-promptpay-button"
        >
          {localProcessing ? t('premium.processing') : t('premium.payWithPromptPay')}
        </Button>
      </form>
    );
  };

  // Stripe card element component
  const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [localProcessing, setLocalProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      
      if (!stripe || !elements || !clientSecret) {
        toast({
          title: t('premium.toast.paymentSetupFailed'),
          description: "Payment system not ready. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const card = elements.getElement(CardElement);
      if (!card) {
        toast({
          title: t('premium.toast.paymentSetupFailed'),
          description: "Card information not available. Please refresh and try again.",
          variant: "destructive"
        });
        return;
      }

      setLocalProcessing(true);

      try {
        const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
          payment_method: {
            card: card,
          }
        });

        if (error) {
          toast({
            title: t('premium.toast.paymentSetupFailed'),
            description: error.message || t('premium.toast.paymentFailedDesc'),
            variant: "destructive"
          });
          setLocalProcessing(false);
        } else if (setupIntent.status === 'succeeded') {
          // Confirm subscription with backend
          try {
            const priceId = sessionStorage.getItem('priceId');
            await apiRequest("POST", "/api/premium/confirm-subscription", {
              setupIntentId: setupIntent.id,
              priceId: priceId,
              planId: selectedPlan
            });

            // Clean up session storage
            sessionStorage.removeItem('priceId');
            sessionStorage.removeItem('customerId');

            toast({
              title: t('premium.toast.welcomeToPremium'),
              description: t('premium.toast.welcomeDesc'),
            });

            // Redirect to premium welcome page
            setLocation("/premium-welcome");
          } catch (error: any) {
            toast({
              title: t('premium.toast.subscriptionSetupFailed'),
              description: error.message || t('premium.toast.contactSupport'),
              variant: "destructive"
            });
            setLocalProcessing(false);
          }
        }
      } catch (err: any) {
        toast({
          title: t('premium.toast.paymentSetupFailed'),
          description: err.message || t('premium.toast.paymentFailedDesc'),
          variant: "destructive"
        });
        setLocalProcessing(false);
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('premium.creditCardInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border border-gray-300 rounded-md">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Button 
          type="submit"
          className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90 mt-4 h-auto py-3"
          size="lg"
          disabled={!stripe || !clientSecret || localProcessing}
          data-testid="complete-payment-button"
        >
          {localProcessing ? (
            t('premium.processing')
          ) : (
            <div className="text-center">
              <div>{t('premium.startFreeTrial')}</div>
              <div className="text-xs opacity-90 font-normal mt-1">
                (Your card will be charged only after 2 weeks)
              </div>
            </div>
          )}
        </Button>
      </form>
    );
  };

  const handleDowngrade = async () => {
    try {
      const response = await apiRequest("POST", "/api/premium/cancel");
      const result = await response.json();
      
      toast({
        title: t('premium.toast.subscriptionCancelled'),
        description: t('premium.toast.downgradedDesc'),
      });
      
      // Redirect to home page after downgrade
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    } catch (error: any) {
      toast({
        title: t('premium.toast.downgradeFailed'),
        description: error.message || t('premium.toast.paymentFailedDesc'),
        variant: "destructive"
      });
    }
  };

  // If user is already premium, show premium member badge instead
  if (isPremiumUser) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen" data-testid="premium-member-page">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h1 className="text-2xl font-bold text-hotprop-primary">{t('premium.premiumMember')}</h1>
            </div>
          </div>

          {/* Premium Member Badge */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-200 text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Crown className="w-8 h-8 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-700">{t('premium.premiumMember')}</span>
              </div>
              <p className="text-gray-600 mb-4">{t('premium.enjoyingBenefits')}</p>
              <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <Check className="w-4 h-4" />
                <span>{t('premium.activeSubscription')}</span>
              </div>
            </div>

            {/* Premium Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>{t('premium.yourPremiumBenefits')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 text-left">{t('premium.propertyVerification')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 text-left">{t('premium.instantNotifications')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 text-left">{t('premium.priceVisualization')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 text-left">{t('premium.prioritySupport')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 text-left">{t('premium.advancedFilters')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 text-left">{t('premium.unlimitedListings')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation("/price-trends")}
                className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {t('premium.viewPriceTrends')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/notifications")}
                className="w-full"
              >
                <Bell className="w-4 h-4 mr-2" />
                {t('premium.viewNotifications')}
              </Button>
            </div>

            {/* Subtle Downgrade Option */}
            <div className="mt-12 pt-4 text-center">
              <button 
                onClick={handleDowngrade}
                className="text-xs text-gray-400 hover:text-gray-500 underline transition-colors"
                data-testid="downgrade-button"
              >
                {t('premium.cancelSubscription')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen" data-testid="premium-signup-page">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-bold text-hotprop-primary">{t('premium.upgradeTitle')}</h1>
          </div>
        </div>

        {!showPaymentForm ? (
          <>
            {/* Plan Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('premium.choosePlan')}</h2>
              <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                {premiumPlans.map((plan) => (
                  <Card key={plan.id} className={`cursor-pointer transition-all ${
                    selectedPlan === plan.id ? 'ring-2 ring-hotprop-primary border-hotprop-primary' : 'border-gray-200'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={plan.id} id={plan.id} />
                        <Label htmlFor={plan.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-800">{t(plan.nameKey)}</h3>
                                {plan.savingsKey && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                    {t(plan.savingsKey)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                ฿{plan.price.toLocaleString()} {t(plan.durationKey)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <div key={index} className="flex items-start space-x-2 text-xs text-gray-600">
                                <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-left">{t(feature)}</span>
                              </div>
                            ))}
                            {plan.features.length > 3 && (
                              <p className="text-xs text-gray-500 text-left">{t('premium.moreFeatures', { count: plan.features.length - 3 })}</p>
                            )}
                          </div>
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('premium.paymentMethod')}</h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <Card className={`cursor-pointer transition-all ${
                  paymentMethod === "promptpay" ? 'ring-2 ring-hotprop-primary border-hotprop-primary' : 'border-gray-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="promptpay" id="promptpay" />
                      <Label htmlFor="promptpay" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="w-6 h-6 text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-gray-800">{t('premium.promptpayTitle')}</h3>
                            <p className="text-sm text-gray-500">{t('premium.promptpayDesc')}</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`cursor-pointer transition-all ${
                  paymentMethod === "creditcard" ? 'ring-2 ring-hotprop-primary border-hotprop-primary' : 'border-gray-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="creditcard" id="creditcard" />
                      <Label htmlFor="creditcard" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="w-6 h-6 text-green-600" />
                            <div>
                              <h3 className="font-semibold text-gray-800">{t('premium.creditCardTitle')}</h3>
                              <p className="text-sm text-gray-500">{t('premium.creditCardDesc')}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 text-green-600">
                            <Gift className="w-4 h-4" />
                            <span className="text-xs font-medium">{t('premium.twoWeeksFree')}</span>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </RadioGroup>

              {paymentMethod === "creditcard" && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-2">
                      <Gift className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800">{t('premium.freeTrialTerms')}</p>
                        <p className="text-green-700 mt-1">
                          {t('premium.freeTrialDesc')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Continue Button */}
            <Button 
              onClick={handleContinue}
              className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90"
              size="lg"
              data-testid="continue-payment-button"
            >
              {t('premium.continueToPayment')}
            </Button>
          </>
        ) : (
          <>
            {/* Payment Form */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentForm(false)}
                  className="p-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-lg font-semibold text-gray-800">{t('premium.completePayment')}</h2>
              </div>

              {/* Order Summary */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('premium.plan')}</span>
                      <span className="text-sm font-medium">{selectedPlanDetails ? t(selectedPlanDetails.nameKey) : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('premium.amount')}</span>
                      <span className="text-sm font-medium">฿{selectedPlanDetails?.price.toLocaleString()}</span>
                    </div>
                    {paymentMethod === "creditcard" && (
                      <div className="flex justify-between text-green-600">
                        <span className="text-sm">{t('premium.trialPeriod')}</span>
                        <span className="text-sm font-medium">{t('premium.twoWeeksFree')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {paymentMethod === "promptpay" && clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PromptPayForm />
                </Elements>
              ) : paymentMethod === "promptpay" ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Smartphone className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-800 mb-2">{t('premium.promptpayPayment')}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {t('premium.qrInstructions')}
                    </p>
                  </CardContent>
                </Card>
              ) : clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm />
                </Elements>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CreditCard className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-800 mb-2">{t('premium.creditCardPayment')}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {t('premium.securePaymentSetup')}
                    </p>
                  </CardContent>
                </Card>
              )}

              {((!clientSecret && paymentMethod !== "promptpay") || (paymentMethod === "promptpay" && !clientSecret)) && (
                <Button 
                  onClick={handlePayment}
                  className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90"
                  size="lg"
                  disabled={isProcessing}
                  data-testid="complete-payment-button"
                >
                  {isProcessing ? (
                    <>{t('premium.processing')}</>
                  ) : paymentMethod === "promptpay" ? (
                    <>{t('premium.promptpayPayment')}</>
                  ) : (
                    <>{t('premium.setUpPayment')}</>
                  )}
                </Button>
              )}
            </div>
          </>
        )}

        {/* Features List */}
        {!showPaymentForm && (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-800">
                <Crown className="w-5 h-5" />
                <span>{t('premium.featuresTitle')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedPlanDetails?.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">{t(feature)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}