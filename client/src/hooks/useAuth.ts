import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false,
  });

  // User is authenticated if we have user data and no 401 error
  const isAuthenticated = !!user && !error;

  return {
    user: isAuthenticated ? user : null,
    isLoading,
    isAuthenticated,
  };
}
