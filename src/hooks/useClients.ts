import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService, type ClientsResult } from '@/services/clientService';

export const CLIENT_KEYS = {
  all: ['clients'] as const,
  paginated: (page: number, pageSize: number) => ['clients', 'paginated', { page, pageSize }] as const,
  byId: (id: string) => ['clients', 'id', id] as const,
  memberships: (page: number, pageSize: number) => ['clients', 'memberships', { page, pageSize }] as const,
};

export const useClients = (page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: CLIENT_KEYS.paginated(page, pageSize),
    queryFn: () => clientService.getClients(page, pageSize),
    staleTime: 1000 * 60 * 2,
    placeholderData: (previousData) => previousData,
  });
};

export const useClient = (id: string | undefined) => {
  return useQuery({
    queryKey: id ? CLIENT_KEYS.byId(id) : CLIENT_KEYS.all,
    queryFn: () => clientService.getClientById(id!),
    enabled: !!id,
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof clientService.updateClient>[1] }) =>
      clientService.updateClient(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.byId(id) });
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientService.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all });
    },
  });
};

export const useClientMemberships = (page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: CLIENT_KEYS.memberships(page, pageSize),
    queryFn: () => clientService.getMemberships(page, pageSize),
    staleTime: 1000 * 60 * 2,
  });
};