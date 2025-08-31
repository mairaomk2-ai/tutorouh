import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, MessageCircle, Search, Eye, Clock,
  User, Image, RefreshCw, Filter
} from 'lucide-react';

interface Conversation {
  id: string;
  content: string;
  attachment?: string;
  attachmentType?: string;
  isRead: boolean;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    profileImage?: string;
  };
  toUser: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

export default function AdminConversations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

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

  const { data: conversations = [], refetch } = useQuery({
    queryKey: ['/api/admin/conversations'],
    enabled: !!user,
  });

  const filteredConversations = (conversations as Conversation[]).filter((conv: Conversation) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.content.toLowerCase().includes(searchLower) ||
      conv.fromUser.name.toLowerCase().includes(searchLower) ||
      conv.toUser.name.toLowerCase().includes(searchLower)
    );
  });

  // Group conversations by participants
  const groupedConversations = filteredConversations.reduce((acc: any, conv: Conversation) => {
    const key = [conv.fromUser.id, conv.toUser.id].sort().join('-');
    if (!acc[key]) {
      acc[key] = {
        participants: [conv.fromUser, conv.toUser],
        messages: [],
        lastMessage: null,
        messageCount: 0
      };
    }
    acc[key].messages.push(conv);
    acc[key].messageCount++;
    if (!acc[key].lastMessage || new Date(conv.createdAt) > new Date(acc[key].lastMessage.createdAt)) {
      acc[key].lastMessage = conv;
    }
    return acc;
  }, {});

  const conversationList = Object.entries(groupedConversations).map(([key, data]: [string, any]) => ({
    id: key,
    ...data
  }));

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
                <h1 className="text-xl font-bold text-gray-900">Chat Monitoring</h1>
                <p className="text-sm text-gray-500">Monitor all platform conversations (Read-only)</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="flex items-center space-x-2"
              data-testid="button-refresh-conversations"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <span>Conversations ({conversationList.length})</span>
                </CardTitle>
                <CardDescription>All user conversations on the platform</CardDescription>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-conversations"
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {conversationList
                    .sort((a, b) => new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime())
                    .map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedConversation === conversation.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation.id)}
                      data-testid={`conversation-${conversation.id}`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        {conversation.participants.map((participant: any, index: number) => (
                          <div key={participant.id} className="flex items-center space-x-2">
                            {index > 0 && <span className="text-gray-400">↔</span>}
                            <img
                              src={participant.profileImage || '/default-avatar.jpg'}
                              alt={participant.name}
                              className="w-8 h-8 rounded-full border border-gray-200"
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {participant.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {conversation.lastMessage && (
                        <div>
                          <p className="text-sm text-gray-600 line-clamp-1 mb-1">
                            {conversation.lastMessage.attachment ? (
                              <span className="flex items-center">
                                <Image className="w-4 h-4 mr-1" />
                                {conversation.lastMessage.attachmentType === 'image' ? 'Image' : 'File'}
                              </span>
                            ) : (
                              conversation.lastMessage.content
                            )}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {conversation.messageCount} messages
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Messages Details */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <span>Conversation Details</span>
                  </CardTitle>
                  <CardDescription>
                    WhatsApp-like conversation view (Read-only for admin monitoring)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-gradient-to-b from-blue-50 to-white max-h-96 overflow-y-auto">
                    {groupedConversations[selectedConversation]?.messages
                      .sort((a: Conversation, b: Conversation) => 
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                      )
                      .map((message: Conversation, index: number) => (
                        <div key={index} className="mb-4">
                          <div className="flex items-start space-x-3">
                            <img
                              src={message.fromUser.profileImage || '/default-avatar.jpg'}
                              alt={message.fromUser.name}
                              className="w-8 h-8 rounded-full border border-gray-200 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium text-blue-700">
                                  {message.fromUser.name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  to {message.toUser.name}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                              
                              <div className="bg-white p-3 rounded-lg border shadow-sm">
                                {message.attachment ? (
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <Image className="w-4 h-4" />
                                    <span className="text-sm">
                                      Shared {message.attachmentType || 'file'}
                                    </span>
                                    {message.content && (
                                      <span className="text-sm">: {message.content}</span>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                    {message.content}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleDateString()} at{' '}
                                  {new Date(message.createdAt).toLocaleTimeString()}
                                </span>
                                {message.isRead && (
                                  <Badge variant="outline" className="text-xs text-blue-600">
                                    Read
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        This is a read-only view for monitoring purposes. You cannot send messages.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a conversation to view the full chat history</p>
                    <p className="text-sm mt-2">All conversations are monitored for platform safety</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Messages</p>
                    <p className="text-2xl font-bold">{(conversations as Conversation[]).length}</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Conversations</p>
                    <p className="text-2xl font-bold">{conversationList.length}</p>
                  </div>
                  <User className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">With Attachments</p>
                    <p className="text-2xl font-bold">
                      {(conversations as Conversation[]).filter((c: Conversation) => c.attachment).length}
                    </p>
                  </div>
                  <Image className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unread Messages</p>
                    <p className="text-2xl font-bold">
                      {(conversations as Conversation[]).filter((c: Conversation) => !c.isRead).length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}