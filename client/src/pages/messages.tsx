import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send, Search, Users, Clock, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Conversation, MessageWithSender } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";
import { getLocalizedDescription } from "@/utils/translation-helpers";

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const conversationParam = urlParams.get('conversation');

  const { data: conversations, isLoading: isLoadingConversations, refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: messages, isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/conversations", selectedConversation, "messages"],
    enabled: !!selectedConversation,
    refetchInterval: 5000, // Refresh every 5 seconds when conversation is open
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; content: string }) => {
      const response = await apiRequest("POST", `/api/conversations/${data.conversationId}/messages`, {
        content: data.content
      });
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
      refetchConversations();
    },
    onError: (error: Error) => {
      toast({
        title: t('messages.failedToSend'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Effect to auto-open conversation from URL parameter
  useEffect(() => {
    if (conversationParam && conversations && conversations.length > 0) {
      const targetConversation = conversations.find(conv => conv.id === conversationParam);
      if (targetConversation) {
        handleOpenConversation(conversationParam);
        // Clean up URL parameter after opening
        const url = new URL(window.location.href);
        url.searchParams.delete('conversation');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [conversationParam, conversations]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim()) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: newMessage.trim(),
    });
  };

  const filteredConversations = conversations?.filter((conv) => 
    conv.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    searchTerm === ""
  ) || [];

  const selectedConv = conversations?.find(c => c.id === selectedConversation);

  const handleOpenConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedConversation(null);
    setNewMessage("");
  };

  return (
    <>
      {/* Full-width Conversations List */}
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('messages.title')}
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('messages.searchConversations')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {isLoadingConversations ? (
                <div className="p-4">
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-4 border-b">
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg text-gray-600 mb-2">{t('messages.noConversations')}</p>
                  <p className="text-sm text-gray-500">{t('messages.startMessaging')}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleOpenConversation(conversation.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-hotprop-primary text-white">
                            {conversation.subject?.[0] || "C"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-semibold text-gray-900 truncate">
                              {conversation.subject || t('messages.conversation')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(conversation.lastMessageAt!), { addSuffix: true })}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {conversation.propertyId ? t('messages.propertyInquiry') : t('messages.generalMessage')}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {conversation.propertyId ? t('messages.property') : t('messages.message')}
                            </Badge>
                            {!conversation.isActive && (
                              <Badge variant="secondary" className="text-xs">{t('messages.inactive')}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Message Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-3xl w-[90vw] h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedConv?.subject || t('messages.conversation')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col min-h-0 p-6 pt-4">
            <ScrollArea className="flex-1 p-4 border rounded-lg bg-gray-50 mb-4">
              {isLoadingMessages ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages?.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-hotprop-primary text-white text-sm">
                          {message.senderName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UN'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.senderName || t('messages.unknownUser')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(message.createdAt!), { addSuffix: true })}
                          </span>
                          {!message.isRead && (
                            <Badge variant="secondary" className="text-xs">{t('messages.new')}</Badge>
                          )}
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-sm whitespace-pre-wrap">
                            {getLocalizedDescription(
                              message.content, 
                              message.contentEn, 
                              message.contentTh, 
                              language
                            ) || message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  )) || []}
                </div>
              )}
            </ScrollArea>
            
            <form onSubmit={handleSendMessage} className="border-t pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t('messages.typeMessage')}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  disabled={sendMessageMutation.isPending}
                  data-testid="input-message"
                />
                <Button
                  type="submit"
                  disabled={sendMessageMutation.isPending || !newMessage.trim()}
                  className="bg-hotprop-primary hover:bg-hotprop-primary/90"
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}