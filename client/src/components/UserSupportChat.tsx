import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Send, 
  X,
  Phone,
  MoreVertical
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SupportMessage {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: string;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
  isFromAdmin: boolean;
}

export default function UserSupportChat() {
  const [open, setOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages = [], isLoading } = useQuery<SupportMessage[]>({
    queryKey: ["/api/support/user-messages"],
    refetchInterval: open ? 2000 : false, // Real-time updates when chat is open
    enabled: open,
  });

  const sendMutation = useMutation({
    mutationFn: (data: { message: string; subject?: string }) =>
      apiRequest("POST", "/api/support/message", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/user-messages"] });
      setMessageText("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    // For first message, use it as subject and message
    const isFirstMessage = messages.length === 0;
    
    sendMutation.mutate({
      message: messageText,
      subject: isFirstMessage ? "Support Request" : undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Group messages by conversation thread
  const conversationMessages = messages.flatMap(msg => [
    {
      id: msg.id,
      text: msg.message,
      isFromAdmin: false,
      timestamp: msg.createdAt,
      userName: msg.userName,
    },
    ...(msg.adminReply ? [{
      id: `${msg.id}-reply`,
      text: msg.adminReply,
      isFromAdmin: true,
      timestamp: msg.repliedAt || msg.createdAt,
      userName: "Support Team",
    }] : [])
  ]).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full w-14 h-14 shadow-xl transition-all hover:scale-105 border-2 border-white/20"
          data-testid="button-support-chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[420px] h-[500px] p-0 overflow-hidden bg-white border-gray-200">
        {/* Chat Header */}
        <DialogHeader className="p-3 bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 border-2 border-white/30">
                <AvatarImage src="https://ui-avatars.com/api/?name=Support+Team&background=ffffff&color=16a34a" />
                <AvatarFallback className="bg-white text-green-600 font-semibold text-sm">
                  ST
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-base font-semibold text-white">
                  Support Team
                </DialogTitle>
                <p className="text-green-100 text-xs">Online • Ready to help</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-3 bg-gray-50" ref={scrollRef}>
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : conversationMessages.length === 0 ? (
              <div className="text-center py-6">
                <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  Start a conversation
                </p>
                <p className="text-gray-400 text-xs">
                  We're here to help you
                </p>
              </div>
            ) : (
              conversationMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isFromAdmin ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] ${msg.isFromAdmin ? 'order-2' : ''}`}>
                    {msg.isFromAdmin && (
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src="https://ui-avatars.com/api/?name=Support+Team&background=2563eb&color=fff" />
                          <AvatarFallback className="bg-blue-600 text-white text-xs">ST</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500 font-medium">Support Team</span>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 ${
                        msg.isFromAdmin
                          ? 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                          : 'bg-gradient-to-r from-green-600 to-green-700 text-white rounded-br-none shadow-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                    </div>
                    <p className={`text-xs text-gray-400 mt-1 ${
                      msg.isFromAdmin ? 'ml-8' : 'text-right'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {sendMutation.isPending && (
              <div className="flex justify-end">
                <div className="max-w-[85%]">
                  <div className="bg-gradient-to-r from-blue-600/70 to-blue-700/70 text-white rounded-2xl rounded-br-none px-4 py-3 shadow-lg">
                    <p className="text-sm">{messageText}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right flex items-center justify-end space-x-1">
                    <div className="animate-spin rounded-full h-2 w-2 border border-gray-400 border-t-transparent"></div>
                    <span>Sending...</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-3 bg-white border-t border-gray-200">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Input
                ref={inputRef}
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-full px-3 py-2 bg-gray-50 text-sm"
                disabled={sendMutation.isPending}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-full w-9 h-9 p-0 shadow-lg transition-all duration-200"
              data-testid="button-send-message"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}