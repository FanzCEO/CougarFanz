import { useQuery } from "@tanstack/react-query";

export function useUserPacks(userId: string | undefined) {
  return useQuery({
    queryKey: ['/api/users', userId, 'packs'],
    enabled: !!userId,
    retry: false,
  });
}

export function useAllPacks() {
  return useQuery({
    queryKey: ['/api/packs'],
    retry: false,
  });
}

export function usePack(packId: string | undefined) {
  return useQuery({
    queryKey: ['/api/packs', packId],
    enabled: !!packId,
    retry: false,
  });
}
