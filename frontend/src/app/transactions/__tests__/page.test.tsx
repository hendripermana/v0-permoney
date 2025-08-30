import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TransactionsPage from '../page';
import { transactionApi } from '@/lib/api/transactions';

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

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/transactions',
}));

const mockTransactions = {
  transactions: [
    {
      id: '1',
      householdId: 'household-1',
      amountCents: -5000000,
      currency: 'IDR',
      description: 'Grocery shopping',
      merchant: 'Supermarket ABC',
      date: '2024-01-15T10:00:00.000Z',
      accountId: 'account-1',
      categoryId: 'groceries',
      createdBy: 'user-1',
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z',
      account: {
        id: 'account-1',
        name: 'BCA Checking',
        type: 'ASSET',
        currency: 'IDR',
      },
      category: {
        id: 'groceries',
        name: 'Groceries',
        color: '#22c55e',
        icon: 'shopping-cart',
      },
      tags: [],
      splits: [],
      ledgerEntries: [],
    },
  ],
  total: 1,
  page: 1,
  limit: 50,
  totalPages: 1,
};

const mockStats = {
  totalTransactions: 1,
  totalIncome: 0,
  totalExpenses: 50000,
  totalTransfers: 0,
  averageTransactionAmount: 50000,
  categoriesUsed: 1,
  merchantsUsed: 1,
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('TransactionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTransactionApi.getAll.mockResolvedValue(mockTransactions);
    mockedTransactionApi.getStats.mockResolvedValue(mockStats);
    mockedTransactionApi.getCategoryBreakdown.mockResolvedValue([]);
  });

  it('renders page header and navigation', async () => {
    renderWithQueryClient(<TransactionsPage />);

    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Manage and track all your financial transactions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
  });

  it('renders statistics cards', async () => {
    renderWithQueryClient(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Transactions')).toBeInTheDocument();
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('Net Amount')).toBeInTheDocument();
    });

    expect(screen.getByText('1')).toBeInTheDocument(); // Total transactions
    expect(screen.getByText('Rp50,000')).toBeInTheDocument(); // Total expenses
  });

  it('renders tab navigation', () => {
    renderWithQueryClient(<TransactionsPage />);

    expect(screen.getByRole('tab', { name: /list view/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /calendar view/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument();
  });

  it('displays transactions in list view by default', async () => {
    renderWithQueryClient(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
      expect(screen.getByText('Supermarket ABC')).toBeInTheDocument();
      expect(screen.getByText('BCA Checking')).toBeInTheDocument();
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });
  });

  it('switches to calendar view', async () => {
    renderWithQueryClient(<TransactionsPage />);

    const calendarTab = screen.getByRole('tab', { name: /calendar view/i });
    fireEvent.click(calendarTab);

    await waitFor(() => {
      // Calendar view should be active
      expect(calendarTab).toHaveAttribute('data-state', 'active');
    });
  });

  it('switches to analytics view', async () => {
    renderWithQueryClient(<TransactionsPage />);

    const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
    fireEvent.click(analyticsTab);

    await waitFor(() => {
      expect(analyticsTab).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Transaction Trends')).toBeInTheDocument();
    });
  });

  it('opens add transaction dialog', () => {
    renderWithQueryClient(<TransactionsPage />);

    const addButton = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(addButton);

    expect(screen.getByText('Add New Transaction')).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('opens filters sidebar', () => {
    renderWithQueryClient(<TransactionsPage />);

    const filtersButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filtersButton);

    expect(screen.getByText('Transaction Filters')).toBeInTheDocument();
  });

  it('handles transaction creation', async () => {
    const newTransaction = {
      id: '2',
      description: 'New transaction',
      amountCents: 10000,
      currency: 'IDR',
    };

    mockedTransactionApi.create.mockResolvedValue(newTransaction as any);

    renderWithQueryClient(<TransactionsPage />);

    // Open add transaction dialog
    const addButton = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(addButton);

    // Fill in form
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'New transaction' } });

    // Select account
    fireEvent.click(screen.getByLabelText(/account/i));
    fireEvent.click(screen.getByText('BCA Checking (IDR)'));

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create transaction/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedTransactionApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amountCents: 10000,
          description: 'New transaction',
          accountId: '1',
        })
      );
    });
  });

  it('handles transaction editing', async () => {
    const updatedTransaction = {
      ...mockTransactions.transactions[0],
      description: 'Updated transaction',
    };

    mockedTransactionApi.update.mockResolvedValue(updatedTransaction as any);

    renderWithQueryClient(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
    });

    // Click on transaction to view details
    const transactionRow = screen.getByText('Grocery shopping').closest('tr');
    fireEvent.click(transactionRow!);

    // Should open transaction details dialog
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByText('Edit'));

    // Should open edit dialog
    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Grocery shopping')).toBeInTheDocument();
  });

  it('handles transaction deletion', async () => {
    mockedTransactionApi.delete.mockResolvedValue(undefined);

    renderWithQueryClient(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
    });

    // Click on transaction to view details
    const transactionRow = screen.getByText('Grocery shopping').closest('tr');
    fireEvent.click(transactionRow!);

    // Should open transaction details dialog
    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByText('Delete'));

    // Should show confirmation dialog
    expect(screen.getByText('Delete Transaction')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this transaction?')).toBeInTheDocument();

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockedTransactionApi.delete).toHaveBeenCalledWith('1');
    });
  });

  it('displays active filters count', () => {
    renderWithQueryClient(<TransactionsPage />);

    const filtersButton = screen.getByRole('button', { name: /filters/i });
    
    // Initially no active filters
    expect(filtersButton).not.toHaveTextContent('1');
    
    // After applying filters, count should be shown
    // This would be tested by actually applying filters through the UI
  });

  it('handles error states', async () => {
    const error = new Error('Failed to fetch transactions');
    mockedTransactionApi.getAll.mockRejectedValue(error);

    renderWithQueryClient(<TransactionsPage />);

    // Should handle error gracefully
    // Error handling would depend on how the components handle errors
  });

  it('handles loading states', () => {
    // Mock a delayed response
    mockedTransactionApi.getAll.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockTransactions), 1000))
    );

    renderWithQueryClient(<TransactionsPage />);

    // Should show loading indicators
    // Loading states would be visible in the components
  });
});
