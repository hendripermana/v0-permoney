"use client"

import { useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, "queryKey" | "queryFn"> {
  prefetch?: boolean
  backgroundRefetch?: boolean
  optimisticUpdate?: (oldData: T | undefined, newData: Partial<T>) => T
}

export function useOptimizedQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options: OptimizedQueryOptions<T> = {},
) {
  const queryClient = useQueryClient()
  const prefetchedRef = useRef(false)

  const { prefetch = false, backgroundRefetch = true, optimisticUpdate, ...queryOptions } = options

  const prefetchQuery = useCallback(() => {
    if (prefetch && !prefetchedRef.current) {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 1000 * 60 * 5, // 5 minutes
      })
      prefetchedRef.current = true
    }
  }, [queryClient, queryKey, queryFn, prefetch])

  const query = useQuery({
    queryKey,
    queryFn,
    refetchOnWindowFocus: backgroundRefetch,
    refetchOnReconnect: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) {
        return false
      }
      return failureCount < 2
    },
    ...queryOptions,
  })

  const updateOptimistically = useCallback(
    (newData: Partial<T>) => {
      if (optimisticUpdate) {
        queryClient.setQueryData(queryKey, (oldData: T | undefined) => optimisticUpdate(oldData, newData))
      }
    },
    [queryClient, queryKey, optimisticUpdate],
  )

  // Prefetch on mount if enabled
  useEffect(() => {
    prefetchQuery()
  }, [prefetchQuery])

  return {
    ...query,
    prefetch: prefetchQuery,
    updateOptimistically,
  }
}

export function usePaginatedQuery<T>(
  baseQueryKey: readonly unknown[],
  queryFn: (page: number, pageSize: number) => Promise<{ data: T[]; total: number; hasMore: boolean }>,
  options: {
    pageSize?: number
    initialPage?: number
    prefetchNextPage?: boolean
  } = {},
) {
  const { pageSize = 20, initialPage = 1, prefetchNextPage = true } = options
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [...baseQueryKey, "paginated", initialPage, pageSize],
    queryFn: () => queryFn(initialPage, pageSize),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  })

  useEffect(() => {
    if (prefetchNextPage && query.data?.hasMore) {
      const nextPage = initialPage + 1
      queryClient.prefetchQuery({
        queryKey: [...baseQueryKey, "paginated", nextPage, pageSize],
        queryFn: () => queryFn(nextPage, pageSize),
        staleTime: 1000 * 60 * 5,
      })
    }
  }, [query.data?.hasMore, initialPage, pageSize, prefetchNextPage, queryClient, baseQueryKey, queryFn])

  const loadNextPage = useCallback(() => {
    if (query.data?.hasMore) {
      const nextPage = initialPage + 1
      return queryClient.fetchQuery({
        queryKey: [...baseQueryKey, "paginated", nextPage, pageSize],
        queryFn: () => queryFn(nextPage, pageSize),
      })
    }
    return Promise.resolve(null)
  }, [query.data?.hasMore, initialPage, pageSize, queryClient, baseQueryKey, queryFn])

  return {
    ...query,
    loadNextPage,
    hasNextPage: query.data?.hasMore ?? false,
  }
}
