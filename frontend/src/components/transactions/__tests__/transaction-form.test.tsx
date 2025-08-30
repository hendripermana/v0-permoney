import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransactionForm } from '../transaction-form';
import { Account, Category } from '@/types/transaction';

// Mock data
const mockAccounts: Account[] = [
  { id: '1', name: 'BCA Checking', type: 'ASSET', subtype: 'BANK', currency: 'IDR', balance: 5000000, isActive: true },
  { id: '2', name: 'Mandiri Savings', type: 'ASSET', subtype: 'BANK', currency: 'IDR', balance: 10000000, isActive: true },
];

const mockCategories: Category[] = [
  { id: 'food-dining', name: 'Food & Dining', color: '#ef4444', icon: 'utensils' },
  { id: 'groceries', name: 'Groceries', color: '#22c55e', icon: 'shopping-cart' },
];

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

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

describe('TransactionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    renderWithQueryClient(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithQueryClient(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /create transaction/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/account is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    renderWithQueryClient(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test transaction' } });
    
    // Select account
    fireEvent.click(screen.getByLabelText(/account/i));
    fireEvent.click(screen.getByText('BCA Checking (IDR)'));

    const submitButton = screen.getByRole('button', { name: /create transaction/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amountCents: 10000, // 100 * 100
          description: 'Test transaction',
          accountId: '1',
          currency: 'IDR',
        })
      );
    });
  });

  it('handles transfer toggle correctly', () => {
    renderWithQueryClient(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const transferToggle = screen.getByLabelText(/this is a transfer between accounts/i);
    fireEvent.click(transferToggle);

    expect(screen.getByLabelText(/from account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to account/i)).toBeInTheDocument();
  });

  it('handles splits toggle correctly', () => {
    renderWithQueryClient(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const splitsToggle = screen.getByRole('switch', { name: /split transaction/i });
    fireEvent.click(splitsToggle);

    expect(screen.getByRole('button', { name: /add split/i })).toBeInTheDocument();
  });

  it('adds and removes tags correctly', () => {
    renderWithQueryClient(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const tagInput = screen.getByPlaceholderText(/add tag/i);
    const addTagButton = screen.getByRole('button', { name: /tag/i });

    fireEvent.change(tagInput, { target: { value: 'test-tag' } });
    fireEvent.click(addTagButton);

    expect(screen.getByText('test-tag')).toBeInTheDocument();

    // Remove tag
    const removeTagButton = screen.getByRole('button', { name: /×/i });
    fireEvent.click(removeTagButton);

    expect(screen.queryByText('test-tag')).not.toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderWithQueryClient(
      <TransactionForm
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('populates form with initial data in edit mode', () => {
    const initialData = {
      amountCents: 50000,
      description: 'Initial transaction',
      accountId: '1',
      categoryId: 'food-dining',
      date: '2024-01-01T00:00:00.000Z',
    };

    renderWithQueryClient(
      <TransactionForm
        initialData={initialData}
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        mode="edit"
      />
    );

    expect(screen.getByDisplayValue('500')).toBeInTheDocument(); // 50000 / 100
    expect(screen.getByDisplayValue('Initial transaction')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update transaction/i })).toBeInTheDocument();
  });
});
