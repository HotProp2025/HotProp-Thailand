import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, LoginCredentials, InsertUser } from "@shared/schema";

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;

      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) {
          localStorage.removeItem("auth_token");
          return null;
        }
        
        return await res.json();
      } catch {
        localStorage.removeItem("auth_token");
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        const error = new Error(errorData.message || "Login failed");
        // Attach the needsVerification flag to the error for the UI to use
        (error as any).needsVerification = errorData.needsVerification;
        throw error;
      }
      return await res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      // Set flag to show welcome popup on next page load
      localStorage.setItem("show_welcome_popup", "true");
      // Remove login success toast as welcome popup serves this purpose
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      // Only store token and set user data if token is provided (no verification needed)
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        queryClient.setQueryData(["/api/auth/me"], data.user);
        // Set flag to show welcome popup for new users too
        localStorage.setItem("show_welcome_popup", "true");
      }
      // Don't show default success message - let the calling component handle it
    },
    onError: (error: Error) => {
      // Don't show default error message - let the calling component handle it
      throw error;
    },
  });

  const logout = () => {
    localStorage.removeItem("auth_token");
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.clear();
    toast({
      title: "Logged out",
      description: "Successfully logged out.",
    });
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
  };
}
