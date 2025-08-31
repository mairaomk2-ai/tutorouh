import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  Paperclip, 
  MoreVertical,
  ArrowLeft,
  Circle
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

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [match, params] = useRoute("/messages/:userId");
  const selectedUserId = params?.userId;

  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasAutoSent, setHasAutoSent] = useState(false);

  const { sendMessage, sendTyping, stopTyping, messages: socketMessages, typingUsers, onlineUsers, userLastSeen } = useSocket();

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

  // Send message mutation - only via socket.io for real-time
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, attachment, attachmentType }: {
      content: string;
      attachment?: string;
      attachmentType?: string;
    }) => {
      if (!selectedUserId) throw new Error("No user selected");

      // Send only via Socket.io - it handles database saving on server
      sendMessage(selectedUserId, content, attachment, attachmentType);

      return { success: true };
    },
    onSuccess: () => {
      // Refresh conversations and messages after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedUserId] });
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) return;
      await apiRequest("POST", `/api/messages/${selectedUserId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, socketMessages]);

  // Mark messages as read when conversation opens
  useEffect(() => {
    if (selectedUserId && user) {
      markAsReadMutation.mutate();
    }
  }, [selectedUserId, user]);

  // Auto-send message from URL parameters
  useEffect(() => {
    if (selectedUserId && !hasAutoSent) {
      const urlParams = new URLSearchParams(window.location.search);
      const autoMessage = urlParams.get('autoMessage');
      
      if (autoMessage) {
        setHasAutoSent(true);
        // Send the auto message after a short delay to ensure everything is loaded
        setTimeout(() => {
          sendMessageMutation.mutate({ content: autoMessage });
        }, 500);
        
        // Clean URL by removing the autoMessage parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('autoMessage');
        window.history.replaceState({}, '', url.pathname);
      }
    }
  }, [selectedUserId, hasAutoSent, sendMessageMutation]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!selectedUserId) return;

    if (!isTyping) {
      setIsTyping(true);
      sendTyping(selectedUserId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (selectedUserId) {
        stopTyping(selectedUserId);
      }
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedUserId) return;

    sendMessageMutation.mutate({
      content: messageText.trim(),
    });

    setMessageText("");
    setIsTyping(false);
    
    // Show success toast
    toast({
      title: "Message sent",
      description: "Your message has been delivered successfully.",
    });
  };

  const handleMessageLike = async (messageId: string) => {
    try {
      await apiRequest("POST", `/api/messages/${messageId}/like`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedUserId] });
    } catch (error) {
      console.error("Failed to like message:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUserId) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Send image message
        sendMessage(selectedUserId, `Shared an image`, data.imagePath, file.type);
      } else {
        toast({
          title: "Upload failed",
          description: data.message || "Failed to upload image",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload error", 
        description: "Failed to upload image",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return date.toLocaleDateString([], { weekday: 'long' });
    return date.toLocaleDateString();
  };

  // Combine API messages with socket messages and remove duplicates
  const allMessages = [...((messages as any) || []), ...socketMessages];
  const uniqueMessages = allMessages
    .filter((message, index, self) => 
      index === self.findIndex((m: any) => m.id === message.id)
    )
    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-14 pb-20">
      {/* Conversations Sidebar */}
      <div className={`${selectedUserId ? 'hidden md:block' : 'block'} w-full md:w-96 bg-white border-r border-gray-200`}>
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Messages</h2>
        </div>

        <div className="overflow-y-auto pb-24 md:pb-0">
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : conversations && Array.isArray(conversations) && conversations.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {conversations.map((conversation: any, index: number) => (
                <Link key={`conv-${conversation.userId}-${index}`} href={`/messages/${conversation.userId}`}>
                  <div className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedUserId === conversation.userId ? 'bg-primary/5 border-r-2 border-primary' : ''
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={conversation.profileImage} />
                          <AvatarFallback>
                            {conversation.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-1 -right-1">
                          <VerifiedBadge isVerified={conversation.isVerified || false} size="lg" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {conversation.name}
                            </h3>
                          </div>
                          {conversation.lastMessageAt && (
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessageAt)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-primary text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No conversations yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Start messaging teachers or students from the requirements page
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedUserId ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Header */}
          {selectedUser && (
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Link href="/messages">
                    <Button variant="ghost" size="sm" className="md:hidden">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>

                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={selectedUser.profileImage} />
                      <AvatarFallback>
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1">
                      <VerifiedBadge isVerified={selectedUser.isVerified || false} size="lg" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium text-gray-900">{selectedUser.name}</h3>
                    </div>
                    {typingUsers.includes(selectedUserId) && (
                      <p className="text-sm text-primary">Typing...</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {onlineUsers.includes(selectedUserId) ? (
                      <div className="flex items-center space-x-1">
                        <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                        <span>Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Circle className="w-2 h-2 fill-gray-400 text-gray-400" />
                        <span>Last seen {userLastSeen.get(selectedUserId) ? new Date(userLastSeen.get(selectedUserId)!).toLocaleTimeString() : 'recently'}</span>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-2 sm:p-4 space-y-3 sm:space-y-4 pb-24 md:pb-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : uniqueMessages.length > 0 ? (
              uniqueMessages.map((message: Message, index) => (
                <div 
                  key={`msg-${message.id || index}`}
                  onDoubleClick={() => handleMessageLike(message.id)}
                  className="relative cursor-pointer"
                >
                  {/* Date separator */}
                  {index === 0 || formatDate(message.createdAt) !== formatDate(uniqueMessages[index - 1].createdAt) && (
                    <div className="text-center my-4">
                      <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  )}

                  <div className={`flex ${message.fromUserId === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`message-bubble relative ${
                      message.fromUserId === user.id 
                        ? 'message-sent bg-primary text-white' 
                        : 'message-received bg-white border'
                    }`}>
                      <p className="text-sm">{message.content}</p>

                      {message.attachment && (
                        <div className="mt-2">
                          {message.attachmentType?.startsWith('image/') ? (
                            <img 
                              src={message.attachment} 
                              alt="Attachment" 
                              className="max-w-xs rounded-lg"
                            />
                          ) : (
                            <a 
                              href={message.attachment} 
                              className="text-blue-500 underline text-sm"
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              View attachment
                            </a>
                          )}
                        </div>
                      )}

                      <div className={`text-xs mt-1 flex justify-between items-center ${
                        message.fromUserId === user.id ? 'text-primary-foreground/70' : 'text-gray-500'
                      }`}>
                        <span>{formatTime(message.createdAt)}</span>
                        {message.fromUserId === user.id && (
                          <span className="ml-2">
                            {message.isRead ? 'Seen' : 'Sent'}
                          </span>
                        )}
                      </div>

                      {message.isLiked && (
                        <div className="absolute -top-1 -right-1 text-red-500 text-sm">
                          ♥️
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Start the conversation by sending a message
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                ref={fileInputRef}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              <Input
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sendMessageMutation.isPending}
              />

              <Button 
                type="submit" 
                disabled={!messageText.trim() || sendMessageMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a conversation
            </h3>
            <p className="text-gray-600">
              Choose a conversation from the sidebar to start messaging
            </p>
          </div>
        </div>
      )}
    </div>
  );
}