import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  apiClient, 
  Household, 
  HouseholdMember, 
  CreateHouseholdData, 
  InviteMemberData, 
  UpdateMemberData,
  ViewType 
} from '../lib/api';

// Query keys
export const householdKeys = {
  all: ['households'] as const,
  lists: () => [...householdKeys.all, 'list'] as const,
  list: (filters: string) => [...householdKeys.lists(), { filters }] as const,
  details: () => [...householdKeys.all, 'detail'] as const,
  detail: (id: string) => [...householdKeys.details(), id] as const,
  members: (id: string) => [...householdKeys.detail(id), 'members'] as const,
  filteredData: (id: string, viewType: ViewType) => 
    [...householdKeys.detail(id), 'filtered-data', viewType] as const,
  permissions: (id: string, permission: string) => 
    [...householdKeys.detail(id), 'permissions', permission] as const,
  role: (id: string) => [...householdKeys.detail(id), 'role'] as const,
};

// Households queries
export function useHouseholds() {
  return useQuery({
    queryKey: householdKeys.lists(),
    queryFn: () => apiClient.getHouseholds(),
  });
}

export function useHousehold(id: string) {
  return useQuery({
    queryKey: householdKeys.detail(id),
    queryFn: () => apiClient.getHousehold(id),
    enabled: !!id,
  });
}

export function useHouseholdMembers(householdId: string) {
  return useQuery({
    queryKey: householdKeys.members(householdId),
    queryFn: () => apiClient.getMembers(householdId),
    enabled: !!householdId,
  });
}

export function useFilteredData(householdId: string, viewType: ViewType) {
  return useQuery({
    queryKey: householdKeys.filteredData(householdId, viewType),
    queryFn: () => apiClient.getFilteredData(householdId, viewType),
    enabled: !!householdId,
  });
}

export function useHouseholdPermission(householdId: string, permission: string) {
  return useQuery({
    queryKey: householdKeys.permissions(householdId, permission),
    queryFn: () => apiClient.checkPermission(householdId, permission),
    enabled: !!householdId && !!permission,
  });
}

export function useUserRole(householdId: string) {
  return useQuery({
    queryKey: householdKeys.role(householdId),
    queryFn: () => apiClient.getUserRole(householdId),
    enabled: !!householdId,
  });
}

export function useAvailablePermissions() {
  return useQuery({
    queryKey: ['permissions', 'available'],
    queryFn: () => apiClient.getAvailablePermissions(),
  });
}

export function useHouseholdPermissions(householdId: string) {
  return useQuery({
    queryKey: [...householdKeys.detail(householdId), 'user-permissions'],
    queryFn: () => apiClient.getHouseholdPermissions(householdId),
    enabled: !!householdId,
  });
}

// Household mutations
export function useCreateHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHouseholdData) => apiClient.createHousehold(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() });
    },
  });
}

export function useUpdateHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateHouseholdData> }) =>
      apiClient.updateHousehold(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: householdKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() });
    },
  });
}

export function useDeleteHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteHousehold(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: householdKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: householdKeys.lists() });
    },
  });
}

// Member mutations
export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ householdId, data }: { householdId: string; data: InviteMemberData }) =>
      apiClient.inviteMember(householdId, data),
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({ queryKey: householdKeys.members(householdId) });
      queryClient.invalidateQueries({ queryKey: householdKeys.detail(householdId) });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      householdId, 
      memberId, 
      data 
    }: { 
      householdId: string; 
      memberId: string; 
      data: UpdateMemberData 
    }) =>
      apiClient.updateMember(householdId, memberId, data),
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({ queryKey: householdKeys.members(householdId) });
      queryClient.invalidateQueries({ queryKey: householdKeys.detail(householdId) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ householdId, memberId }: { householdId: string; memberId: string }) =>
      apiClient.removeMember(householdId, memberId),
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({ queryKey: householdKeys.members(householdId) });
      queryClient.invalidateQueries({ queryKey: householdKeys.detail(householdId) });
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ householdId, settings }: { householdId: string; settings: Record<string, any> }) =>
      apiClient.updateSettings(householdId, settings),
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({ queryKey: householdKeys.detail(householdId) });
    },
  });
}
