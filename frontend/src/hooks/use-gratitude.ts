import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
};
import {
  gratitudeApi,
  CreateGratitudeEntryDto,
  UpdateGratitudeEntryDto,
  GratitudeFilters,
} from '@/lib/api/gratitude';

// Query keys
const GRATITUDE_KEYS = {
  all: ['gratitude'] as const,
  lists: () => [...GRATITUDE_KEYS.all, 'list'] as const,
  list: (filters: GratitudeFilters, page: number, limit: number) =>
    [...GRATITUDE_KEYS.lists(), { filters, page, limit }] as const,
  details: () => [...GRATITUDE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...GRATITUDE_KEYS.details(), id] as const,
  summary: (fromDate?: string, toDate?: string) =>
    [...GRATITUDE_KEYS.all, 'summary', { fromDate, toDate }] as const,
  insights: () => [...GRATITUDE_KEYS.all, 'insights'] as const,
};

// Hook for getting paginated gratitude entries
export function useGratitudeEntries(
  filters: GratitudeFilters = {},
  page = 1,
  limit = 20
) {
  return useQuery({
    queryKey: GRATITUDE_KEYS.list(filters, page, limit),
    queryFn: () => gratitudeApi.getAll(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for getting a specific gratitude entry
export function useGratitudeEntry(id: string) {
  return useQuery({
    queryKey: GRATITUDE_KEYS.detail(id),
    queryFn: () => gratitudeApi.getById(id),
    enabled: !!id,
  });
}

// Hook for getting gratitude summary
export function useGratitudeSummary(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: GRATITUDE_KEYS.summary(fromDate, toDate),
    queryFn: () => gratitudeApi.getSummary(fromDate, toDate),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for getting relationship insights
export function useRelationshipInsights() {
  return useQuery({
    queryKey: GRATITUDE_KEYS.insights(),
    queryFn: () => gratitudeApi.getInsights(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook for creating gratitude entries
export function useCreateGratitudeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGratitudeEntryDto) => gratitudeApi.create(data),
    onSuccess: (newEntry) => {
      // Invalidate and refetch gratitude lists
      queryClient.invalidateQueries({ queryKey: GRATITUDE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: GRATITUDE_KEYS.summary() });
      queryClient.invalidateQueries({ queryKey: GRATITUDE_KEYS.insights() });

      toast.success('Gratitude entry created successfully! 🙏');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create gratitude entry';
      toast.error(message);
    },
  });
}

// Hook for updating gratitude entries
export function useUpdateGratitudeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGratitudeEntryDto }) =>
      gratitudeApi.update(id, data),
    onSuccess: (updatedEntry) => {
      // Update the specific entry in cache
      queryClient.setQueryData(
        GRATITUDE_KEYS.detail(updatedEntry.id),
        updatedEntry
      );

      // Invalidate lists and summary
      queryClient.invalidateQueries({ queryKey: GRATITUDE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: GRATITUDE_KEYS.summary() });
      queryClient.invalidateQueries({ queryKey: GRATITUDE_KEYS.insights() });

      toast.success('Gratitude entry updated successfully! ✨');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update gratitude entry';
      toast.error(message);
    },
  });
}

// Hook for deleting gratitude entries
export function useDeleteGratitudeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gratitudeApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: GRATITUDE_KEYS.detail(deletedId) });

      // Invalidate lists and summary
      queryClient.invalidateQueries({ queryKey: GRATITUDE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: GRATITUDE_KEYS.summary() });
      queryClient.invalidateQueries({ queryKey: GRATITUDE_KEYS.insights() });

      toast.success('Gratitude entry deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete gratitude entry';
      toast.error(message);
    },
  });
}

// Utility hook for invalidating gratitude queries
export function useInvalidateGratitude() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: GRATITUDE_KEYS.all });
    },
    invalidateLists: () => {
      queryClient.invalidateQueries({ queryKey: GRATITUDE_KEYS.lists() });
    },
    invalidateSummary: () => {
      queryClient.invalidateQueries({ queryKey: GRATITUDE_KEYS.summary() });
    },
    invalidateInsights: () => {
      queryClient.invalidateQueries({ queryKey: GRATITUDE_KEYS.insights() });
    },
  };
}
