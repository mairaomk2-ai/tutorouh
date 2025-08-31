import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, MessageCircle, Clock, CheckCircle2,
  XCircle, Send, RefreshCw, Filter, Search, User
} from 'lucide-react';

interface SupportMessage {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: string;
  adminReply?: string;
  createdAt: string;
  repliedAt?: string;
}

export default function AdminSupport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'replied'>('all');

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

  const { data: supportMessages = [], refetch } = useQuery({
    queryKey: ['/api/admin/support-messages'],
    enabled: !!user,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ messageId, adminReply }: { messageId: string; adminReply: string }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/support-messages/${messageId}/reply`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminReply }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reply');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-messages'] });
      setReplyText('');
      setSelectedMessage(null);
      toast({
        title: 'Reply sent',
        description: 'Your reply has been sent to the user',
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
    if (!selectedMessage || !replyText.trim()) {
      return;
    }

    replyMutation.mutate({
      messageId: selectedMessage.id,
      adminReply: replyText.trim(),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-orange-700 bg-gradient-to-r from-orange-100 to-yellow-100 border border-orange-200 shadow-sm';
      case 'replied':
        return 'text-green-700 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 shadow-sm';
      case 'closed':
        return 'text-gray-700 bg-gradient-to-r from-gray-100 to-slate-100 border border-gray-200 shadow-sm';
      default:
        return 'text-blue-700 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 shadow-sm';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-3 h-3" />;
      case 'replied':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'closed':
        return <XCircle className="w-3 h-3" />;
      default:
        return <MessageCircle className="w-3 h-3" />;
    }
  };

  const filteredMessages = (supportMessages as SupportMessage[]).filter((msg: SupportMessage) => {
    if (filterStatus === 'all') return true;
    return msg.status === filterStatus;
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg shadow-xl border-b border-blue-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Support Messages</h1>
                <p className="text-sm text-blue-600/70">Monitor and respond to user support requests</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="flex items-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
              data-testid="button-refresh-messages"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Messages List */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xl font-bold">Support Messages</span>
                      <p className="text-blue-100 text-sm font-normal">({filteredMessages.length} messages)</p>
                    </div>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant={filterStatus === 'all' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilterStatus('all')}
                      className="text-white border-white/30 hover:bg-white/20"
                      data-testid="filter-all"
                    >
                      All
                    </Button>
                    <Button
                      variant={filterStatus === 'open' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilterStatus('open')}
                      className="text-white border-white/30 hover:bg-white/20"
                      data-testid="filter-open"
                    >
                      Open
                    </Button>
                    <Button
                      variant={filterStatus === 'replied' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilterStatus('replied')}
                      className="text-white border-white/30 hover:bg-white/20"
                      data-testid="filter-replied"
                    >
                      Replied
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">No messages found</p>
                      <p className="text-gray-400 text-sm">All support messages will appear here</p>
                    </div>
                  ) : (
                    filteredMessages.map((message: SupportMessage) => (
                      <div
                        key={message.id}
                        className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                          selectedMessage?.id === message.id 
                            ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg transform scale-[1.02]' 
                            : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50'
                        }`}
                        onClick={() => setSelectedMessage(message)}
                        data-testid={`message-${message.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg mb-2">{message.subject}</h3>
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                                <User className="w-4 h-4" />
                                <span className="font-medium">{message.userName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400">•</span>
                                <span>{message.userEmail}</span>
                              </div>
                            </div>
                          </div>
                          <Badge className={`text-xs px-3 py-1 font-medium ${getStatusColor(message.status)}`}>
                            {getStatusIcon(message.status)}
                            <span className="ml-1 capitalize">{message.status}</span>
                          </Badge>
                        </div>
                        <p className="text-gray-700 line-clamp-3 mb-3 leading-relaxed">{message.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            📅 {new Date(message.createdAt).toLocaleDateString()} at{' '}
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                          {message.adminReply && (
                            <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Replied</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Details & Reply */}
          <div className="lg:col-span-1">
            {selectedMessage ? (
              <div className="space-y-6">
                {/* Message Details */}
                <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-lg">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <User className="w-5 h-5" />
                      </div>
                      <span>Message Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Subject</label>
                        <p className="text-gray-900">{selectedMessage.subject}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">From</label>
                        <p className="text-gray-900">{selectedMessage.userName}</p>
                        <p className="text-sm text-gray-500">{selectedMessage.userEmail}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <div>
                          <Badge className={getStatusColor(selectedMessage.status)}>
                            {getStatusIcon(selectedMessage.status)}
                            <span className="ml-1">{selectedMessage.status}</span>
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date</label>
                        <p className="text-gray-900">
                          {new Date(selectedMessage.createdAt).toLocaleDateString()} at{' '}
                          {new Date(selectedMessage.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Original Message */}
                <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <span>Original Message</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border-l-4 border-orange-400">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">{selectedMessage.message}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Previous Reply (if exists) */}
                {selectedMessage.adminReply && (
                  <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span>Previous Admin Reply</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-l-4 border-blue-400">
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base mb-4">{selectedMessage.adminReply}</p>
                        {selectedMessage.repliedAt && (
                          <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-100 px-3 py-2 rounded-lg inline-flex">
                            <Clock className="w-4 h-4" />
                            <span>Replied on {new Date(selectedMessage.repliedAt).toLocaleDateString()} at {new Date(selectedMessage.repliedAt).toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reply Form */}
                <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Send className="w-5 h-5" />
                      </div>
                      <span>Send New Reply</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                          <MessageCircle className="w-4 h-4" />
                          <span>Your Reply Message</span>
                        </label>
                        <Textarea
                          placeholder="Type your detailed reply here... Be helpful and professional. This message will be sent directly to the user."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={8}
                          className="resize-none border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-200 rounded-xl p-4 text-base leading-relaxed"
                          data-testid="textarea-reply"
                        />
                        <p className="text-xs text-gray-500 flex items-center space-x-1">
                          <span>📝</span>
                          <span>Characters: {replyText.length}</span>
                        </p>
                      </div>
                      <Button
                        onClick={handleSendReply}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                        disabled={!replyText.trim() || replyMutation.isPending}
                        data-testid="button-send-reply"
                      >
                        {replyMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            <span>Sending Reply...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-3" />
                            <span>Send Reply to User</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 blur-xl scale-150"></div>
                      <MessageCircle className="w-20 h-20 mx-auto mb-6 text-gray-400 relative" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Message</h3>
                    <p className="text-gray-500 leading-relaxed">Choose a support message from the left panel<br/>to view details and send a reply</p>
                    <div className="mt-6 flex justify-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}