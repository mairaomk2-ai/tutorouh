import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, MessageCircle, Send, Clock, CheckCircle,
  AlertCircle, User, Phone, Mail, GraduationCap, BookOpen
} from 'lucide-react';

export default function AdminSupportConversations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.userType !== 'admin') {
        setLocation('/admin/login');
        return;
      }
      setUser(userData);
    } else {
      setLocation('/admin/login');
    }
  }, [setLocation]);

  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/admin/support-conversations'],
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['/api/admin/support-conversations', selectedConversation?.userId, 'messages'],
    enabled: !!selectedConversation?.userId,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/support-conversations/${userId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send reply');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-conversations', selectedConversation?.userId, 'messages'] });
      setReplyMessage('');
      toast({
        title: 'Reply sent',
        description: 'Your reply has been sent successfully',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send reply',
      });
    },
  });

  const handleSendReply = () => {
    if (replyMessage.trim() && selectedConversation) {
      replyMutation.mutate({
        userId: selectedConversation.userId,
        message: replyMessage.trim()
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-orange-600 bg-orange-50';
      case 'replied': return 'text-green-600 bg-green-50';
      case 'closed': return 'text-gray-600 bg-gray-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/admin/dashboard')}
                className="flex items-center space-x-2"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="border-l border-gray-300 h-6"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Support Conversations</h1>
                <p className="text-sm text-gray-500">WhatsApp-style support chat monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <span>Support Chats ({conversations.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No support conversations yet</p>
                    </div>
                  ) : (
                    conversations.map((conversation: any) => (
                      <div
                        key={conversation.userId}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedConversation?.userId === conversation.userId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                        data-testid={`conversation-${conversation.userId}`}
                      >
                        <div className="flex items-start space-x-3">
                          <img
                            src={conversation.userImage || '/default-avatar.jpg'}
                            alt={conversation.userName}
                            className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {conversation.userName}
                              </h3>
                              <div className="flex items-center space-x-1">
                                {conversation.userType === 'teacher' ? (
                                  <BookOpen className="w-3 h-3 text-purple-600" />
                                ) : (
                                  <GraduationCap className="w-3 h-3 text-green-600" />
                                )}
                                <span className="text-xs text-gray-500">
                                  {formatTime(conversation.lastMessageTime)}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{conversation.userEmail}</p>
                            <p className="text-sm text-gray-700 mt-1 truncate">
                              {conversation.lastMessage}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <Badge className={`text-xs px-2 py-1 ${getStatusColor(conversation.status)}`}>
                                {conversation.status}
                              </Badge>
                              {conversation.messageCount > 1 && (
                                <span className="text-xs text-gray-500">
                                  {conversation.messageCount} messages
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center space-x-4">
                      <img
                        src={selectedConversation.userImage || '/default-avatar.jpg'}
                        alt={selectedConversation.userName}
                        className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover"
                      />
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {selectedConversation.userName}
                        </h2>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{selectedConversation.userEmail}</span>
                          </div>
                          <Badge className={`${getStatusColor(selectedConversation.status)}`}>
                            {selectedConversation.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages Area */}
                  <CardContent className="flex-1 p-0">
                    <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No messages in this conversation</p>
                        </div>
                      ) : (
                        messages.map((message: any) => (
                          <div key={message.id} className="space-y-2">
                            {/* User Message */}
                            <div className="flex justify-start">
                              <div className="max-w-xs lg:max-w-md bg-gray-100 rounded-lg p-3">
                                <p className="text-sm text-gray-800">{message.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Admin Reply */}
                            {message.adminReply && (
                              <div className="flex justify-end">
                                <div className="max-w-xs lg:max-w-md bg-blue-500 text-white rounded-lg p-3">
                                  <p className="text-sm">{message.adminReply}</p>
                                  <div className="flex items-center justify-end mt-1 space-x-1">
                                    <p className="text-xs text-blue-100">Admin</p>
                                    <CheckCircle className="w-3 h-3 text-blue-200" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>

                  {/* Reply Input */}
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your reply..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                        className="flex-1"
                        data-testid="input-reply-message"
                      />
                      <Button
                        onClick={handleSendReply}
                        disabled={!replyMessage.trim() || replyMutation.isPending}
                        className="px-4"
                        data-testid="button-send-reply"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                    <p className="text-sm">Choose a support conversation from the left to start chatting</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}