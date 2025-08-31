import { useState, useEffect } from "react";
import { Bell, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { io, Socket } from "socket.io-client";

interface SupportNotification {
  id: string;
  subject: string;
  adminReply: string;
  repliedAt: Date;
}

interface SupportMessage {
  id: string;
  subject: string;
  message: string;
  status: string;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
}

export default function SupportNotifications() {
  const [notifications, setNotifications] = useState<SupportNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  const { data: userSupportMessages = [] } = useQuery<SupportMessage[]>({
    queryKey: ["/api/support/user-messages"],
    enabled: !!user?.id,
    refetchInterval: 30000, // Check for updates every 30 seconds
  });

  useEffect(() => {
    if (!user?.id) return;

    // Initialize socket connection
    const newSocket = io({ path: "/socket.io/" });
    
    newSocket.emit("join", user.id);
    
    newSocket.on("supportReply", (notification: SupportNotification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Auto-show notifications panel when new notification arrives
      setShowNotifications(true);
      
      // Auto-hide after 5 seconds if user doesn't interact
      setTimeout(() => {
        setShowNotifications(false);
      }, 5000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user?.id]);

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const hasUnreadReplies = userSupportMessages.some(msg => 
    msg.status === "replied" && msg.adminReply && 
    new Date(msg.repliedAt || "").getTime() > Date.now() - (24 * 60 * 60 * 1000) // Within last 24 hours
  );

  const unreadCount = notifications.length + (hasUnreadReplies ? 1 : 0);

  if (!user?.id) return null;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowNotifications(!showNotifications)}
        data-testid="button-notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center p-0"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 max-w-sm z-50">
          <Card className="shadow-lg border">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                <h3 className="font-semibold text-sm">Support Notifications</h3>
                <div className="flex items-center space-x-2">
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllNotifications}
                      className="text-xs h-6 px-2"
                    >
                      Clear All
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {/* Real-time notifications */}
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3 border-b hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <h4 className="font-medium text-sm line-clamp-1">
                          Reply to: {notification.subject}
                        </h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearNotification(notification.id)}
                        className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {notification.adminReply}
                    </p>
                    <span className="text-xs text-gray-400">
                      {new Date(notification.repliedAt).toLocaleString()}
                    </span>
                  </div>
                ))}

                {/* Recent replied messages */}
                {userSupportMessages
                  .filter(msg => msg.status === "replied" && msg.adminReply)
                  .slice(0, 3)
                  .map((message) => (
                    <div
                      key={`msg-${message.id}`}
                      className="p-3 border-b hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <h4 className="font-medium text-sm line-clamp-1">
                          {message.subject}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          Replied
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {message.adminReply}
                      </p>
                      <span className="text-xs text-gray-400">
                        {message.repliedAt && new Date(message.repliedAt).toLocaleString()}
                      </span>
                    </div>
                  ))}

                {notifications.length === 0 && userSupportMessages.length === 0 && (
                  <div className="p-6 text-center">
                    <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}