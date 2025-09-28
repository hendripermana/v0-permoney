import { renderHook, waitFor } from '@/test-utils/testing-library';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useCategorizeTransaction,
} from '../use-transactions';
import { transactionApi } from '@/lib/api/transactions';
import { CreateTransactionData, UpdateTransactionData } from '@/types/transaction';

// Mock the API
jest.mock('@/lib/api/transactions');
const mockedTransactionApi = transactionApi as jest.Mocked<typeof transactionApi>;

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
    dismiss: jest.fn(),
    toasts: [],
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches transactions successfully', async () => {
    const mockTransactions = {
      transactions: [
        {
          id: '1',
          description: 'Test transaction',
          amountCents: 10000,
          currency: 'IDR',
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    };

    mockedTransactionApi.getAll.mockResolvedValue(mockTransactions);

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTransactions);
    expect(mockedTransactionApi.getAll).toHaveBeenCalledWith({});
  });

  it('handles transaction fetch error', async () => {
    const error = new Error('Failed to fetch transactions');
    mockedTransactionApi.getAll.mockRejectedValue(error);

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('passes filters to API call', async () => {
    const filters = {
      accountId: 'account-1',
      categoryId: 'category-1',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    mockedTransactionApi.getAll.mockResolvedValue({
      transactions: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    });

    renderHook(() => useTransactions(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockedTransactionApi.getAll).toHaveBeenCalledWith(filters);
    });
  });
});

describe('useCreateTransaction', () => {
  it('creates transaction successfully', async () => {
    const newTransaction = {
      id: '1',
      description: 'New transaction',
      amountCents: 10000,
      currency: 'IDR',
    };

    mockedTransactionApi.create.mockResolvedValue(newTransaction as any);

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: createWrapper(),
    });

    const transactionData: CreateTransactionData = {
      amountCents: 10000,
      currency: 'IDR',
      description: 'New transaction',
      date: '2024-01-01T00:00:00.000Z',
      accountId: 'account-1',
    };

    result.current.mutate(transactionData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedTransactionApi.create).toHaveBeenCalledWith(transactionData);
    expect(result.current.data).toEqual(newTransaction);
  });

  it('handles create transaction error', async () => {
    const error = new Error('Failed to create transaction');
    mockedTransactionApi.create.mockRejectedValue(error);

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: createWrapper(),
    });

    const transactionData: CreateTransactionData = {
      amountCents: 10000,
      currency: 'IDR',
      description: 'New transaction',
      date: '2024-01-01T00:00:00.000Z',
      accountId: 'account-1',
    };

    result.current.mutate(transactionData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useUpdateTransaction', () => {
  it('updates transaction successfully', async () => {
    const updatedTransaction = {
      id: '1',
      description: 'Updated transaction',
      amountCents: 20000,
      currency: 'IDR',
    };

    mockedTransactionApi.update.mockResolvedValue(updatedTransaction as any);

    const { result } = renderHook(() => useUpdateTransaction(), {
      wrapper: createWrapper(),
    });

    const updateData: UpdateTransactionData = {
      description: 'Updated transaction',
      amountCents: 20000,
    };

    result.current.mutate({ id: '1', data: updateData });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedTransactionApi.update).toHaveBeenCalledWith('1', updateData);
    expect(result.current.data).toEqual(updatedTransaction);
  });

  it('handles update transaction error', async () => {
    const error = new Error('Failed to update transaction');
    mockedTransactionApi.update.mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateTransaction(), {
      wrapper: createWrapper(),
    });

    const updateData: UpdateTransactionData = {
      description: 'Updated transaction',
    };

    result.current.mutate({ id: '1', data: updateData });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useDeleteTransaction', () => {
  it('deletes transaction successfully', async () => {
    mockedTransactionApi.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteTransaction(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedTransactionApi.delete).toHaveBeenCalledWith('1');
  });

  it('handles delete transaction error', async () => {
    const error = new Error('Failed to delete transaction');
    mockedTransactionApi.delete.mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteTransaction(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useCategorizeTransaction', () => {
  it('categorizes transaction successfully', async () => {
    const categorizedTransaction = {
      id: '1',
      description: 'Test transaction',
      categoryId: 'category-1',
      category: {
        id: 'category-1',
        name: 'Food & Dining',
        color: '#ef4444',
        icon: 'utensils',
      },
    };

    mockedTransactionApi.categorize.mockResolvedValue(categorizedTransaction as any);

    const { result } = renderHook(() => useCategorizeTransaction(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', categoryId: 'category-1' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedTransactionApi.categorize).toHaveBeenCalledWith('1', 'category-1');
    expect(result.current.data).toEqual(categorizedTransaction);
  });

  it('handles categorize transaction error', async () => {
    const error = new Error('Failed to categorize transaction');
    mockedTransactionApi.categorize.mockRejectedValue(error);

    const { result } = renderHook(() => useCategorizeTransaction(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', categoryId: 'category-1' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});
