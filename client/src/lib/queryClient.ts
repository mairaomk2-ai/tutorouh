import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to resolve API URL for different deployment environments
function resolveApiUrl(url: string): string {
  // If URL is already absolute, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // For relative URLs, ensure they work in all deployment scenarios
  if (url.startsWith('/')) {
    return url; // Keep relative URLs as-is for same-origin requests
  }
  
  return '/' + url; // Add leading slash if missing
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { headers?: Record<string, string>; timeout?: number }
): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...options?.headers,
  };
  
  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options?.timeout || 15000); // 15 second default timeout for better mobile experience

  try {
    const res = await fetch(resolveApiUrl(url), {
      method,
      headers,
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out - please check your connection and try again');
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for better mobile experience

    try {
      const res = await fetch(resolveApiUrl(queryKey.join("/") as string), {
        headers,
        credentials: "include",
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out - please check your internet connection and try again');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server - please check your internet connection');
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: (failureCount, error: any) => {
        // Only retry on network errors, not auth errors
        if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
