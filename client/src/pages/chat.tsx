import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  Paperclip, 
  ArrowLeft,
  Phone,
  Video,
  MoreVertical
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { VerifiedBadge } from "@/components/verified-badge";

interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  attachment?: string;
  attachmentType?: string;
  isRead: boolean;
  isLiked?: boolean;
  createdAt: string;
}

interface Conversation {
  userId: string;
  name: string;
  profileImage?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isVerified?: boolean;
}

export default function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [match, params] = useRoute("/messages/:userId");
  const selectedUserId = params?.userId;

  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasAutoSent, setHasAutoSent] = useState(false);

  const { sendMessage, messages: socketMessages, onlineUsers } = useSocket();

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages", selectedUserId],
    enabled: !!user && !!selectedUserId,
  });

  // Get selected user info
  const selectedUser = (conversations as any)?.find((conv: Conversation) => conv.userId === selectedUserId);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; attachment?: File }) => {
      if (!selectedUserId) throw new Error("No user selected");
      
      const formData = new FormData();
      formData.append("content", messageData.content);
      if (messageData.attachment) {
        formData.append("attachment", messageData.attachment);
      }
      
      return fetch(`/api/messages/${selectedUserId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      
      // Send via socket for real-time
      if (selectedUserId) {
        sendMessage(selectedUserId, data.content, data.attachment);
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

  // Auto-send message from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoMessage = urlParams.get('autoMessage');
    
    if (autoMessage && selectedUserId && !hasAutoSent) {
      setMessageText(autoMessage);
      setTimeout(() => {
        sendMessageMutation.mutate({ content: autoMessage });
        setHasAutoSent(true);
        // Clean URL
        window.history.replaceState({}, '', `/messages/${selectedUserId}`);
      }, 1000);
    }
  }, [selectedUserId, hasAutoSent]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, socketMessages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate({ content: messageText.trim() });
    // Keep focus on input after sending message
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && messageText.trim()) {
      sendMessageMutation.mutate({ 
        content: messageText.trim(), 
        attachment: file 
      });
    }
  };

  // Combine database messages with socket messages
  const allMessages = [
    ...(Array.isArray(messages) ? messages : []),
    ...(selectedUserId && socketMessages[selectedUserId] ? socketMessages[selectedUserId] : [])
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (!selectedUserId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-gray-600">Choose a contact to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white relative">
      {/* Chat Header - Fixed */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center space-x-3">
          <Link href="/messages">
            <Button variant="ghost" size="sm" className="p-1">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          
          <Avatar className="w-10 h-10">
            <AvatarImage src={selectedUser?.profileImage} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {selectedUser?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 text-base">
                {selectedUser?.name || "User"}
              </h3>
              {selectedUser?.isVerified && <VerifiedBadge isVerified={true} />}
            </div>
            <p className="text-sm text-gray-500">
              {onlineUsers.includes(selectedUserId) ? "Online" : "Last seen recently"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Container - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50 mt-16 mb-20">
        {messagesLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {allMessages.map((message: Message) => {
              const isOwn = message.fromUserId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 border rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.attachment && (
                      <div className="mt-2">
                        {message.attachmentType?.startsWith('image/') ? (
                          <img 
                            src={`/uploads/${message.attachment}`}
                            alt="Attachment" 
                            className="max-w-full rounded-lg"
                          />
                        ) : (
                          <a 
                            href={`/uploads/${message.attachment}`}
                            className="text-blue-400 underline text-sm"
                            download
                          >
                            📎 {message.attachment}
                          </a>
                        )}
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - Fixed at Bottom */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 fixed bottom-0 left-0 right-0 z-50">
        <div className="flex items-center space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="p-2"
          >
            <Paperclip className="w-5 h-5 text-gray-500" />
          </Button>
          
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                // Scroll to bottom when input is focused to handle keyboard appearing
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              placeholder="Type a message..."
              className="border-gray-300 rounded-full px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={sendMessageMutation.isPending}
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="rounded-full w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700"
          >
            {sendMessageMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}