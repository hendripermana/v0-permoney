import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionList } from '../transaction-list';
import { Transaction } from '@/types/transaction';

// Mock data
const mockTransactions: Transaction[] = [
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
    tags: [{ tag: 'essential' }, { tag: 'monthly' }],
    splits: [],
    ledgerEntries: [],
  },
  {
    id: '2',
    householdId: 'household-1',
    amountCents: 10000000,
    currency: 'IDR',
    description: 'Salary payment',
    date: '2024-01-01T00:00:00.000Z',
    accountId: 'account-1',
    categoryId: 'salary',
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    account: {
      id: 'account-1',
      name: 'BCA Checking',
      type: 'ASSET',
      currency: 'IDR',
    },
    category: {
      id: 'salary',
      name: 'Salary',
      color: '#10b981',
      icon: 'briefcase',
    },
    tags: [],
    splits: [],
    ledgerEntries: [],
  },
];

const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();
const mockOnView = jest.fn();
const mockOnFiltersChange = jest.fn();

describe('TransactionList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders transactions correctly', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
    expect(screen.getByText('Salary payment')).toBeInTheDocument();
    expect(screen.getByText('Supermarket ABC')).toBeInTheDocument();
    expect(screen.getByText('BCA Checking')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('displays transaction amounts with correct formatting and colors', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Check expense amount (negative, should be red)
    const expenseAmount = screen.getByText('Rp50,000.00');
    expect(expenseAmount).toHaveClass('text-red-600');

    // Check income amount (positive, should be green)
    const incomeAmount = screen.getByText('Rp100,000.00');
    expect(incomeAmount).toHaveClass('text-green-600');
  });

  it('displays transaction icons correctly', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Should have expense and income icons
    const icons = screen.getAllByRole('img', { hidden: true });
    expect(icons).toHaveLength(2);
  });

  it('displays tags correctly', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('essential')).toBeInTheDocument();
    expect(screen.getByText('monthly')).toBeInTheDocument();
  });

  it('calls onView when transaction row is clicked', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const transactionRow = screen.getByText('Grocery shopping').closest('tr');
    fireEvent.click(transactionRow!);

    expect(mockOnView).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('opens dropdown menu and calls appropriate actions', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Click dropdown menu button
    const menuButtons = screen.getAllByRole('button', { name: /more/i });
    fireEvent.click(menuButtons[0]);

    // Check if menu items are visible
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();

    // Click edit
    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('shows loading state', () => {
    render(
      <TransactionList
        transactions={[]}
        isLoading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Should show skeleton loaders
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    // Skeleton components would be rendered
  });

  it('shows empty state when no transactions', () => {
    render(
      <TransactionList
        transactions={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('No transactions found')).toBeInTheDocument();
    expect(screen.getByText('Start by adding your first transaction.')).toBeInTheDocument();
  });

  it('handles search functionality', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
        onFiltersChange={mockOnFiltersChange}
        filters={{}}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search transactions...');
    fireEvent.change(searchInput, { target: { value: 'grocery' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        merchant: 'grocery',
      })
    );
  });

  it('shows delete confirmation dialog', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Open dropdown menu
    const menuButtons = screen.getAllByRole('button', { name: /more/i });
    fireEvent.click(menuButtons[0]);

    // Click delete
    fireEvent.click(screen.getByText('Delete'));

    // Should show confirmation dialog
    expect(screen.getByText('Delete Transaction')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this transaction?')).toBeInTheDocument();

    // Confirm delete
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockOnDelete).toHaveBeenCalledWith(mockTransactions[0].id);
  });
});
