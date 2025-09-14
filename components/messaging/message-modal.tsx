import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send } from "lucide-react";
import type { Property, BuyerRequirement } from "@shared/schema";

interface MessageModalProps {
  recipientId: string;
  recipientName: string;
  property?: Property;
  requirement?: BuyerRequirement;
  trigger?: React.ReactNode;
}

export default function MessageModal({ 
  recipientId, 
  recipientName, 
  property, 
  requirement,
  trigger 
}: MessageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { 
      recipientId: string; 
      initialMessage: string; 
      propertyId?: string; 
      requirementId?: string;
    }) => {
      const response = await apiRequest("POST", "/api/conversations", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "Your message has been sent successfully.",
      });
      setMessage("");
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message before sending.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      recipientId,
      initialMessage: message,
      propertyId: property?.id,
      requirementId: requirement?.id,
    });
  };

  const getPrefilledMessage = () => {
    if (property) {
      return `Hi ${recipientName},\n\nI'm interested in your property listing: ${property.title}\nLocation: ${property.address}, ${property.city}\n\nPlease let me know more details.\n\nThanks!`;
    } else if (requirement) {
      return `Hi ${recipientName},\n\nI saw your requirement for: ${requirement.title}\nLocation: ${requirement.city || "Any location"}\n\nI might have something that matches your needs. Let's discuss!\n\nThanks!`;
    }
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            className="bg-hotprop-secondary hover:bg-hotprop-secondary/90 text-white flex-1"
            onClick={() => {
              setMessage(getPrefilledMessage());
            }}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Message to {recipientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {(property || requirement) && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                {property ? "About Property:" : "About Requirement:"}
              </p>
              <p className="text-sm text-gray-600">
                {property?.title || requirement?.title}
              </p>
              <p className="text-xs text-gray-500">
                {property?.address || requirement?.city || "Location not specified"}
              </p>
            </div>
          )}
          
          <div>
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending || !message.trim()}
              className="bg-hotprop-primary hover:bg-hotprop-primary/90 flex-1"
            >
              {sendMessageMutation.isPending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}