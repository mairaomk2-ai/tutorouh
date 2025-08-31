import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, MessageCircle, Search, Eye, Users, 
  Clock, Image, Paperclip, GraduationCap, BookOpen
} from 'lucide-react';

export default function AdminChatMonitoring() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationsScrollRef = useRef<HTMLDivElement>(null);

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
    queryKey: ['/api/admin/conversations'],
    enabled: !!user,
    // Removed auto-refresh to prevent page jumping during login/navigation
  });

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

  const filteredConversations = (conversations as any[]).filter((conv: any) =>
    conv.fromUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.toUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group conversations by participants
  const groupedConversations = filteredConversations.reduce((acc: any[], conv: any) => {
    const key = [conv.fromUser.id, conv.toUser.id].sort().join('-');
    const existing = acc.find(group => group.key === key);
    
    if (existing) {
      existing.messages.push(conv);
      existing.lastMessage = conv.createdAt > existing.lastMessage ? conv.createdAt : existing.lastMessage;
      existing.messageCount = existing.messages.length;
    } else {
      acc.push({
        key,
        fromUser: conv.fromUser,
        toUser: conv.toUser,
        messages: [conv],
        lastMessage: conv.createdAt,
        messageCount: 1
      });
    }
    
    return acc;
  }, []).sort((a: any, b: any) => new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime());

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.messages]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg shadow-xl border-b border-blue-200 sticky top-0 z-50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/admin/dashboard')}
                className="flex items-center space-x-2 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="border-l border-blue-300 h-6"></div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Chat Monitoring</h1>
                <p className="text-sm text-blue-600/70">Monitor platform conversations for safety</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 h-full">
        <div className="h-full p-4 sm:p-6 lg:p-8">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Conversations List */}
            <div className="lg:col-span-1 h-full">
              <Card className="h-full flex flex-col shadow-xl bg-white/80 backdrop-blur-sm border-0">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xl font-bold">Active Conversations</span>
                      <p className="text-purple-100 text-sm font-normal">({groupedConversations.length} conversations)</p>
                    </div>
                  </CardTitle>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/90 border-white/30"
                      data-testid="input-search-conversations"
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <div 
                    ref={conversationsScrollRef}
                    className="h-full space-y-0 overflow-y-auto scroll-smooth"
                    style={{ maxHeight: 'calc(100vh - 280px)' }}
                  >
                    {groupedConversations.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No conversations found</p>
                        <p className="text-sm">All active chats will appear here</p>
                      </div>
                    ) : (
                      groupedConversations.map((conversation: any) => (
                        <div
                          key={conversation.key}
                          className={`p-5 border-b hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 cursor-pointer transition-all duration-300 ${
                            selectedConversation?.key === conversation.key 
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-l-4 border-l-purple-500 shadow-lg' 
                              : ''
                          }`}
                          onClick={() => setSelectedConversation(conversation)}
                          data-testid={`conversation-${conversation.key}`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="flex -space-x-2">
                              <img
                                src={conversation.fromUser.profileImage || '/default-avatar.jpg'}
                                alt={conversation.fromUser.name}
                                className="w-10 h-10 rounded-full border-3 border-white object-cover shadow-lg"
                              />
                              <img
                                src={conversation.toUser.profileImage || '/default-avatar.jpg'}
                                alt={conversation.toUser.name}
                                className="w-10 h-10 rounded-full border-3 border-white object-cover shadow-lg"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                  {conversation.fromUser.name} ↔ {conversation.toUser.name}
                                </h3>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {formatTime(conversation.lastMessage)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1 line-clamp-2 leading-relaxed">
                                {conversation.messages[conversation.messages.length - 1].content}
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                                  {conversation.messageCount} messages
                                </Badge>
                                <div className="flex items-center space-x-2">
                                  <GraduationCap className="w-4 h-4 text-green-600" />
                                  <BookOpen className="w-4 h-4 text-purple-600" />
                                </div>
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

            {/* Chat View */}
            <div className="lg:col-span-2 h-full">
              <Card className="h-full flex flex-col shadow-xl bg-white/80 backdrop-blur-sm border-0">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <CardHeader className="border-b bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex -space-x-2">
                          <img
                            src={selectedConversation.fromUser.profileImage || '/default-avatar.jpg'}
                            alt={selectedConversation.fromUser.name}
                            className="w-12 h-12 rounded-full border-3 border-white object-cover shadow-lg"
                          />
                          <img
                            src={selectedConversation.toUser.profileImage || '/default-avatar.jpg'}
                            alt={selectedConversation.toUser.name}
                            className="w-12 h-12 rounded-full border-3 border-white object-cover shadow-lg"
                          />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold">
                            {selectedConversation.fromUser.name} ↔ {selectedConversation.toUser.name}
                          </h2>
                          <p className="text-blue-100">
                            {selectedConversation.messageCount} messages • Last activity: {formatTime(selectedConversation.lastMessage)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-white border-white/30 hover:bg-white/20">
                          <Eye className="w-4 h-4 mr-2" />
                          Monitor
                        </Button>
                      </div>
                    </CardHeader>

                    {/* Messages Area */}
                    <CardContent className="flex-1 p-0 overflow-hidden">
                      <div 
                        className="h-full overflow-y-auto p-6 space-y-4 scroll-smooth"
                        style={{ maxHeight: 'calc(100vh - 300px)' }}
                      >
                        {selectedConversation.messages.sort((a: any, b: any) => 
                          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        ).map((message: any) => (
                          <div
                            key={message.id}
                            className={`flex ${message.fromUser.id === selectedConversation.fromUser.id ? 'justify-start' : 'justify-end'}`}
                          >
                            <div className={`max-w-lg rounded-xl p-4 shadow-lg ${
                              message.fromUser.id === selectedConversation.fromUser.id 
                                ? 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 border border-gray-300' 
                                : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border border-blue-400'
                            }`}>
                              <div className="flex items-center space-x-3 mb-3">
                                <img
                                  src={message.fromUser.profileImage || '/default-avatar.jpg'}
                                  alt={message.fromUser.name}
                                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                />
                                <span className="text-sm font-semibold">{message.fromUser.name}</span>
                              </div>
                              
                              {message.attachmentType === 'image' && message.attachment && (
                                <div className="mb-3">
                                  <img
                                    src={message.attachment}
                                    alt="Attachment"
                                    className="max-w-full h-auto rounded-lg shadow-lg"
                                  />
                                </div>
                              )}
                              
                              {message.attachmentType !== 'image' && message.attachment && (
                                <div className="flex items-center space-x-3 mb-3 p-3 bg-white bg-opacity-20 rounded-lg">
                                  <Paperclip className="w-5 h-5" />
                                  <span className="text-sm font-medium">Attachment</span>
                                </div>
                              )}
                              
                              <p className="text-base leading-relaxed">{message.content}</p>
                              <div className="flex items-center justify-end mt-3 space-x-2 opacity-75">
                                <Clock className="w-4 h-4" />
                                <p className="text-sm">
                                  {formatTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Auto scroll anchor */}
                        <div ref={messagesEndRef} />
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 blur-xl scale-150"></div>
                        <MessageCircle className="w-24 h-24 mx-auto mb-6 text-gray-400 relative" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-700 mb-3">Select a Conversation</h3>
                      <p className="text-gray-500 leading-relaxed max-w-md">Choose a conversation from the left panel to monitor messages and ensure platform safety</p>
                      <div className="mt-8 flex justify-center space-x-3">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}