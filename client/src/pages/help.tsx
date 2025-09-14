import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/language-context";
import { MessageSquare, Mail, HelpCircle, Send, Loader2 } from "lucide-react";

export default function Help() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const [inAppMessage, setInAppMessage] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  // In-app support message mutation
  const inAppMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      return await apiRequest("POST", "/api/support/message", data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "Your support message has been sent. We'll get back to you soon.",
      });
      setInAppMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: (error) => {
      console.error("Support message error:", error);
      toast({
        title: "Error",
        description: "Failed to send your message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Email support message mutation
  const emailMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string; userEmail?: string; userName?: string }) => {
      return await apiRequest("POST", "/api/support/email", data);
    },
    onSuccess: () => {
      toast({
        title: "Email sent!",
        description: "Your support email has been sent to our team.",
      });
      setEmailSubject("");
      setEmailMessage("");
    },
    onError: (error) => {
      console.error("Support email error:", error);
      toast({
        title: "Error",
        description: "Failed to send your email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inAppMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please enter your message before sending.",
        variant: "destructive",
      });
      return;
    }
    inAppMutation.mutate({ message: inAppMessage.trim() });
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: "All fields required",
        description: "Please fill in both subject and message.",
        variant: "destructive",
      });
      return;
    }
    emailMutation.mutate({
      subject: emailSubject.trim(),
      message: emailMessage.trim(),
      userEmail: user?.email,
      userName: `${user?.firstName} ${user?.lastName}`.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-hotprop-primary/10 rounded-full">
              <HelpCircle className="h-8 w-8 text-hotprop-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('help.title')}
          </h1>
          <p className="text-gray-600">
            {t('help.subtitle')}
          </p>
        </div>

        {/* Help Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('help.contactUs')}
            </CardTitle>
            <CardDescription>
              {t('help.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="in-app" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="in-app" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('help.inAppMessage')}
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('help.sendEmail')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="in-app" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-hotprop-primary" />
                      {t('help.inAppTitle')}
                    </CardTitle>
                    <CardDescription>
                      {t('help.inAppDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleInAppSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="in-app-message">
                          {t('help.yourMessage')}
                        </Label>
                        <Textarea
                          id="in-app-message"
                          placeholder={t('help.messagePlaceholder')}
                          value={inAppMessage}
                          onChange={(e) => setInAppMessage(e.target.value)}
                          rows={4}
                          className="mt-1"
                          data-testid="textarea-support-message"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90"
                        disabled={inAppMutation.isPending}
                        data-testid="button-send-in-app-message"
                      >
                        {inAppMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('help.sending')}
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            {t('help.sendMessage')}
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-5 w-5 text-hotprop-primary" />
                      {t('help.emailTitle')}
                    </CardTitle>
                    <CardDescription>
                      {t('help.emailDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="email-subject">
                          {t('help.subject')}
                        </Label>
                        <Input
                          id="email-subject"
                          placeholder={t('help.subjectPlaceholder')}
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="mt-1"
                          data-testid="input-email-subject"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email-message">
                          {t('help.yourMessage')}
                        </Label>
                        <Textarea
                          id="email-message"
                          placeholder={t('help.messagePlaceholder')}
                          value={emailMessage}
                          onChange={(e) => setEmailMessage(e.target.value)}
                          rows={4}
                          className="mt-1"
                          data-testid="textarea-email-message"
                        />
                      </div>
                      {user && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                          <p>
                            <strong>{t('help.fromUser')}:</strong> {user.firstName} {user.lastName} ({user.email})
                          </p>
                        </div>
                      )}
                      <Button
                        type="submit"
                        className="w-full bg-hotprop-primary hover:bg-hotprop-primary/90"
                        disabled={emailMutation.isPending}
                        data-testid="button-send-email"
                      >
                        {emailMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('help.sending')}
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            {t('help.sendEmail')}
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {t('help.faqTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-hotprop-primary pl-4">
              <h3 className="font-semibold text-gray-900">
                {t('help.faq1Question')}
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                {t('help.faq1Answer')}
              </p>
            </div>
            <div className="border-l-4 border-hotprop-primary pl-4">
              <h3 className="font-semibold text-gray-900">
                {t('help.faq2Question')}
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                {t('help.faq2Answer')}
              </p>
            </div>
            <div className="border-l-4 border-hotprop-primary pl-4">
              <h3 className="font-semibold text-gray-900">
                {t('help.faq3Question')}
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                {t('help.faq3Answer')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}