import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";
import { apiRequest } from "@/lib/queryClient";
import {
  Send, Paperclip, MoreVertical, Phone, Video,
  Image as ImageIcon, Mic, Smile, Search,
  ArrowLeft, Circle, CheckCheck, Check, MessageCircle,
  Camera
} from "lucide-react";
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
  isOnline?: boolean;
}

export default function MessagesPremium() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [match, params] = useRoute("/messages/:userId");
  const selectedUserId = params?.userId;

  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { sendMessage, clearMessages, messages: socketMessages, typingUsers, onlineUsers } = useSocket();
  
  // Clear socket messages when switching conversations
  useEffect(() => {
    if (selectedUserId) {
      clearMessages();
    }
  }, [selectedUserId]);

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute cache to reduce loading
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedUserId],
    enabled: !!user && !!selectedUserId,
    staleTime: 30 * 1000, // 30 seconds cache for messages
  });

  const selectedUser = (conversations as any)?.find((conv: Conversation) => 
    conv.userId === selectedUserId
  );

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, attachment, attachmentType }: {
      content: string;
      attachment?: string;
      attachmentType?: string;
    }) => {
      if (!selectedUserId) throw new Error("No user selected");
      // Only use socket for sending - avoid double messages
      sendMessage(selectedUserId, content, attachment, attachmentType);
      return { success: true };
    },
    onSuccess: () => {
      // Remove automatic query invalidation to prevent double loading
      // Socket will handle real-time updates
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

  useEffect(() => {
    if (selectedUserId && messages) {
      markAsReadMutation.mutate();
    }
  }, [selectedUserId, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, socketMessages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    
    const content = messageText.trim();
    setMessageText(""); // Clear input immediately to prevent double submission
    
    // Immediately add message to UI for instant feedback
    const tempMessage = {
      id: `temp-${Date.now()}`,
      fromUserId: user?.id || '',
      toUserId: selectedUserId || '',
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    
    sendMessageMutation.mutate({
      content,
    });
  };

  // Image upload mutation
  const imageUploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (selectedUserId) {
        sendMessageMutation.mutate({
          content: "📷 Photo",
          attachment: data.imagePath,
          attachmentType: "image"
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      imageUploadMutation.mutate(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = (conversations as any)?.filter((conv: Conversation) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter socket messages to only include current conversation and avoid duplicates
  const currentConversationSocketMessages = (Array.isArray(socketMessages) ? socketMessages : [])
    .filter(msg => 
      selectedUserId && (
        (msg.fromUserId === user?.id && msg.toUserId === selectedUserId) ||
        (msg.fromUserId === selectedUserId && msg.toUserId === user?.id)
      )
    );

  // Combine and deduplicate messages
  const allMessagesMap = new Map();
  
  // Add database messages first
  (Array.isArray(messages) ? messages : []).forEach(msg => {
    allMessagesMap.set(msg.id, msg);
  });
  
  // Add socket messages (only if not already in database)
  currentConversationSocketMessages.forEach(msg => {
    if (!allMessagesMap.has(msg.id)) {
      allMessagesMap.set(msg.id, msg);
    }
  });
  
  const allMessages = Array.from(allMessagesMap.values())
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const isUserOnline = selectedUserId && onlineUsers.includes(selectedUserId);
  const isUserTyping = selectedUserId && typingUsers.includes(selectedUserId);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (timestamp?: string) => {
    if (!timestamp) return "Unknown";
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="bg-white flex relative overflow-x-hidden h-screen"
         style={{ height: '100vh', minHeight: '100vh', maxHeight: '100vh' }}>
      {/* Sidebar - Conversations List */}
      <div className={`${selectedUserId ? 'hidden md:flex' : 'flex'} w-full md:w-72 flex-col border-r border-gray-200 bg-gray-50 flex-shrink-0`}>
        {/* Search Header */}
        <div className="p-3 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-0 bg-gray-100 focus:bg-white h-9"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading && (!conversations || (conversations as any[])?.length === 0) ? (
            <div className="p-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conversation: Conversation) => (
              <a
                key={conversation.userId}
                href={`/messages/${conversation.userId}`}
                className={`flex items-center space-x-3 p-3 hover:bg-white transition-colors border-b border-gray-100 ${
                  selectedUserId === conversation.userId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={conversation.profileImage} />
                    <AvatarFallback>
                      {conversation.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {onlineUsers.includes(conversation.userId) && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900 truncate">
                        {conversation.name}
                      </p>
                      {conversation.isVerified && (
                        <VerifiedBadge isVerified={true} size="sm" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatLastSeen(conversation.lastMessageAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-blue-500 text-white text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {selectedUserId ? (
          <>
            {/* Chat Header - WhatsApp style */}
            <div className="p-3 bg-green-600 text-white flex items-center justify-between flex-shrink-0" style={{ minHeight: '60px' }}>
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 text-white hover:bg-green-700"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                
                <div className="relative flex-shrink-0">
                  <Avatar className="w-10 h-10 border-2 border-white">
                    <AvatarImage src={selectedUser?.profileImage} />
                    <AvatarFallback className="bg-green-800 text-white">
                      {selectedUser?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isUserOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-green-600 rounded-full"></div>
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1">
                    <p className="font-medium text-white truncate">{selectedUser?.name || 'User'}</p>
                    {selectedUser?.isVerified && (
                      <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-green-100">
                    {isUserTyping ? 'Typing...' : isUserOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Button variant="ghost" size="sm" className="p-2 text-white hover:bg-green-700">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area - WhatsApp style with fixed height */}
            <div 
              className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50 flex flex-col"
              style={{ 
                height: 'calc(100vh - 160px)', // Fixed: screen minus header (60px), input area (80px), and navigation (20px)
                maxHeight: 'calc(100vh - 160px)'
              }}
            >
              {messagesLoading && (!messages || (messages as any[])?.length === 0) ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-xs p-3 rounded-lg ${
                        i % 2 === 0 ? 'bg-gray-200' : 'bg-blue-200'
                      } animate-pulse`}>
                        <div className="h-4 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : allMessages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1"></div>
                  <div className="space-y-2 py-2">
                    {allMessages.map((message: Message) => {
                      const isOwnMessage = message.fromUserId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1`}
                        >
                          <div
                            className={`max-w-[70%] p-2.5 rounded-xl ${
                              isOwnMessage
                                ? 'bg-blue-500 text-white rounded-br-sm'
                                : 'bg-white border border-gray-200 rounded-bl-sm'
                            }`}
                            style={{
                              wordWrap: 'break-word',
                              wordBreak: 'break-word'
                            }}
                          >
                            {message.attachmentType === 'image' && message.attachment ? (
                              <div className="mb-2">
                                <img 
                                  src={message.attachment} 
                                  alt="Shared image" 
                                  className="max-w-full rounded-lg cursor-pointer"
                                  style={{ maxHeight: '200px' }}
                                  onClick={() => window.open(message.attachment, '_blank')}
                                />
                              </div>
                            ) : null}
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <div className={`flex items-center justify-end mt-1 text-xs gap-1 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <span>{formatTime(message.createdAt)}</span>
                              {isOwnMessage && (
                                message.isRead ? (
                                  <CheckCheck className="w-3 h-3" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {isUserTyping && (
                      <div className="flex justify-start mb-1">
                        <div className="bg-white border border-gray-200 rounded-xl rounded-bl-sm p-3">
                          <div className="flex items-center space-x-1">
                            <Circle className="w-1.5 h-1.5 fill-gray-400 animate-bounce" />
                            <Circle className="w-1.5 h-1.5 fill-gray-400 animate-bounce delay-100" />
                            <Circle className="w-1.5 h-1.5 fill-gray-400 animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </>
              )}
            </div>

            {/* Message Input - WhatsApp style */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex-shrink-0" style={{ height: '80px' }}>
              <div className="flex items-end space-x-2 max-w-full">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-shrink-0 p-2 text-gray-600 hover:text-gray-800"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Camera className="w-5 h-5" />
                </Button>
                
                <div className="flex-1 relative min-w-0">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="border border-gray-300 bg-white rounded-3xl px-4 py-2 text-base min-h-[40px] resize-none"
                    style={{ paddingBottom: '8px', paddingTop: '8px' }}
                  />
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="bg-green-500 hover:bg-green-600 flex-shrink-0 p-2 rounded-full w-10 h-10"
                  size="sm"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h2>
              <p className="text-sm text-gray-600">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}