import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  attachment?: string;
  attachmentType?: string;
  createdAt: string;
}

export function useSocket() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [userLastSeen, setUserLastSeen] = useState<Map<string, string>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) return;

    const newSocket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on("connect", () => {
      console.log("Socket.io connected");
      setSocket(newSocket);
      // Emit user online status
      newSocket.emit("user_online", user.id);
    });

    newSocket.on("message_received", (message: Message) => {
      setMessages(prev => {
        // Avoid duplicates
        const exists = prev.find(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    newSocket.on("message_sent", (message: Message) => {
      setMessages(prev => {
        // Avoid duplicates
        const exists = prev.find(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    newSocket.on("user_typing", (data: { userId: string }) => {
      setTypingUsers(prev => new Set([...Array.from(prev), data.userId]));
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }, 3000);
    });

    newSocket.on("user_stopped_typing", (data: { userId: string }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    newSocket.on("user_status_change", (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      if (data.isOnline) {
        setOnlineUsers(prev => new Set([...Array.from(prev), data.userId]));
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
        if (data.lastSeen) {
          setUserLastSeen(prev => new Map(prev.set(data.userId, data.lastSeen!)));
        }
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Socket.io disconnected");
      setSocket(null);
    });

    newSocket.on("message_error", (data: { error: string }) => {
      console.error("Message error:", data.error);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const sendMessage = (toUserId: string, content: string, attachment?: string, attachmentType?: string) => {
    if (socket && socket.connected) {
      socket.emit("send_message", {
        fromUserId: user?.id,
        toUserId,
        content,
        attachment,
        attachmentType,
      });
    }
  };

  const sendTyping = (toUserId: string) => {
    if (socket && socket.connected) {
      socket.emit("typing_start", {
        fromUserId: user?.id,
        toUserId,
      });
    }
  };

  const stopTyping = (toUserId: string) => {
    if (socket && socket.connected) {
      socket.emit("typing_stop", {
        fromUserId: user?.id,
        toUserId,
      });
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    sendMessage,
    sendTyping,
    stopTyping,
    clearMessages,
    messages,
    typingUsers: Array.from(typingUsers),
    onlineUsers: Array.from(onlineUsers),
    userLastSeen,
    isConnected: socket?.connected || false,
  };
}
