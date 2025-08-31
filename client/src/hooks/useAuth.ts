import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  userType: "student" | "teacher";
  firstName: string;
  lastName?: string;
  profileImage?: string;
  mobile?: string;
}

interface Profile {
  id: string;
  // Student profile fields
  class?: string;
  schoolName?: string;
  // Teacher profile fields
  subjects?: string[];
  bio?: string;
  qualification?: string;
  experience?: number;
  city?: string;
  isVerified?: boolean;
  rating?: string;
  studentCount?: number;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    // Clean check for token on initialization with timeout safety
    try {
      const storedToken = localStorage.getItem("token");
      if (storedToken && storedToken !== "null" && storedToken !== "undefined" && storedToken.length > 10) {
        return storedToken;
      }
    } catch (e) {
      console.error("Error accessing localStorage:", e);
    }
    try {
      localStorage.removeItem("token");
    } catch (e) {
      console.error("Error removing token:", e);
    }
    return null;
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors to prevent stuck loading
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 1; // Reduced retries
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retryDelay: 500,
    networkMode: 'online'
  });

  useEffect(() => {
    // Clear invalid tokens with timeout protection
    if (error && (error.message.includes("401") || error.message.includes("Invalid token") || error.message.includes("Unauthorized") || error.message.includes("403"))) {
      console.log("Clearing invalid token due to auth error:", error.message);
      setToken(null);
      try {
        localStorage.removeItem("token");
      } catch (e) {
        console.error("Error removing token:", e);
      }
    }
  }, [error]);

  const login = (newToken: string) => {
    if (newToken && newToken !== "null" && newToken !== "undefined" && newToken.length > 10) {
      try {
        setToken(newToken);
        localStorage.setItem("token", newToken);
        console.log("Successfully logged in with new token");
      } catch (e) {
        console.error("Error saving token:", e);
      }
    }
  };

  const logout = () => {
    setToken(null);
    try {
      localStorage.removeItem("token");
    } catch (e) {
      console.error("Error removing token:", e);
    }
    // Use location.replace for cleaner navigation
    window.location.replace("/");
  };

  // Prevent stuck loading - only show loading for brief periods
  const shouldShowLoading = isLoading && !!token && !error;

  return {
    user: (data as any)?.user as User | null,
    profile: (data as any)?.profile as Profile | null,
    isLoading: shouldShowLoading,
    isAuthenticated: !!(data as any)?.user && !!token && !error,
    token,
    login,
    logout,
    refetch,
    error: error?.message || null,
  };
}
