import { render, screen, fireEvent } from '@/test-utils/testing-library';
import { TransactionCalendar } from '../transaction-calendar';
import { Transaction } from '@/types/transaction';

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    householdId: 'household-1',
    amountCents: -5000000,
    currency: 'IDR',
    description: 'Grocery shopping',
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
  {
    id: '2',
    householdId: 'household-1',
    amountCents: 10000000,
    currency: 'IDR',
    description: 'Salary payment',
    date: '2024-01-15T00:00:00.000Z',
    accountId: 'account-1',
    categoryId: 'salary',
    createdBy: 'user-1',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
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

const mockOnDateSelect = jest.fn();
const mockOnTransactionClick = jest.fn();
const mockOnAddTransaction = jest.fn();

// Mock date-fns functions
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'MMMM yyyy') return 'January 2024';
    if (formatStr === 'd') return '15';
    return date.toString();
  }),
  startOfMonth: jest.fn((date) => new Date(2024, 0, 1)),
  endOfMonth: jest.fn((date) => new Date(2024, 0, 31)),
  eachDayOfInterval: jest.fn(() => [
    new Date(2024, 0, 15), // January 15, 2024
  ]),
  isSameDay: jest.fn((date1, date2) => 
    date1.getDate() === date2.getDate() && 
    date1.getMonth() === date2.getMonth() && 
    date1.getFullYear() === date2.getFullYear()
  ),
  isSameMonth: jest.fn(() => true),
  addMonths: jest.fn((date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, date.getDate())),
  subMonths: jest.fn((date, amount) => new Date(date.getFullYear(), date.getMonth() - amount, date.getDate())),
  startOfWeek: jest.fn((date) => date),
  endOfWeek: jest.fn((date) => date),
}));

describe('TransactionCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders calendar with month header', () => {
    render(
      <TransactionCalendar
        transactions={mockTransactions}
        onDateSelect={mockOnDateSelect}
        onTransactionClick={mockOnTransactionClick}
        onAddTransaction={mockOnAddTransaction}
      />
    );

    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(
      <TransactionCalendar
        transactions={mockTransactions}
        onDateSelect={mockOnDateSelect}
        onTransactionClick={mockOnTransactionClick}
        onAddTransaction={mockOnAddTransaction}
      />
    );

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
  });

  it('renders weekday headers', () => {
    render(
      <TransactionCalendar
        transactions={mockTransactions}
        onDateSelect={mockOnDateSelect}
        onTransactionClick={mockOnTransactionClick}
        onAddTransaction={mockOnAddTransaction}
      />
    );

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('displays transaction summaries on calendar days', () => {
    render(
      <TransactionCalendar
        transactions={mockTransactions}
        onDateSelect={mockOnDateSelect}
        onTransactionClick={mockOnTransactionClick}
        onAddTransaction={mockOnAddTransaction}
      />
    );

    // Should show income and expense amounts for the day
    expect(screen.getByText('+Rp100,000')).toBeInTheDocument();
    expect(screen.getByText('-Rp50,000')).toBeInTheDocument();
  });

  it('calls onDateSelect when a date is clicked', () => {
    render(
      <TransactionCalendar
        transactions={mockTransactions}
        onDateSelect={mockOnDateSelect}
        onTransactionClick={mockOnTransactionClick}
        onAddTransaction={mockOnAddTransaction}
      />
    );

    const dateCell = screen.getByText('15').closest('div');
    fireEvent.click(dateCell!);

    expect(mockOnDateSelect).toHaveBeenCalled();
  });

  it('calls onTransactionClick when a transaction is clicked', () => {
    render(
      <TransactionCalendar
        transactions={mockTransactions}
        onDateSelect={mockOnDateSelect}
        onTransactionClick={mockOnTransactionClick}
        onAddTransaction={mockOnAddTransaction}
      />
    );

    const transactionElement = screen.getByText('Grocery shopping');
    fireEvent.click(transactionElement);

    expect(mockOnTransactionClick).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('navigates to previous month', () => {
    render(
      <TransactionCalendar
        transactions={mockTransactions}
        onDateSelect={mockOnDateSelect}
        onTransactionClick={mockOnTransactionClick}
        onAddTransaction={mockOnAddTransaction}
      />
    );

    const prevButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevButton);

    // The component should re-render with the previous month
    // This would be tested by checking if the month header changes
  });

  it('navigates to next month', () => {
    render(
      <TransactionCalendar
        transactions={mockTransactions}
        onDateSelect={mockOnDateSelect}
        onTransactionClick={mockOnTransactionClick}
        onAddTransaction={mockOnAddTransaction}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // The component should re-render with the next month
  });

  it('navigates to current month when Today is clicked', () => {
    render(
      <TransactionCalendar
        transactions={mockTransactions}
        onDateSelect={mockOnDateSelect}
        onTransactionClick={mockOnTransactionClick}
        onAddTransaction={mockOnAddTransaction}
      />
    );

    const todayButton = screen.getByRole('button', { name: /today/i });
    fireEvent.click(todayButton);

    // Should navigate to current month
  });

  it('highlights selected date', () => {
    const selectedDate = new Date(2024, 0, 15);
    
    render(
      <TransactionCalendar
        transactions={mockTransactions}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        onTransactionClick={mockOnTransactionClick}
        onAddTransaction={mockOnAddTransaction}
      />
    );

    // The selected date should have special styling
    const selectedDateElement = screen.getByText('15').closest('div');
    expect(selectedDateElement).toHaveClass('bg-blue-100');
  });

  it('shows add transaction button when onAddTransaction is provided', () => {
    render(
      <TransactionCalendar
        transactions={mockTransactions}
        onDateSelect={mockOnDateSelect}
        onTransactionClick={mockOnTransactionClick}
        onAddTransaction={mockOnAddTransaction}
      />
    );

    // Add transaction buttons should be present (though may be hidden initially)
    const addButtons = screen.getAllByRole('button', { name: /add/i });
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it('calls onAddTransaction when add button is clicked', () => {
    render(
      <TransactionCalendar
        transactions={mockTransactions}
        onDateSelect={mockOnDateSelect}
        onTransactionClick={mockOnTransactionClick}
        onAddTransaction={mockOnAddTransaction}
      />
    );

    // Find and click an add transaction button
    const addButton = screen.getAllByRole('button', { name: /add/i })[0];
    fireEvent.click(addButton);

    expect(mockOnAddTransaction).toHaveBeenCalled();
  });

  it('displays transaction popover with details', () => {
    render(
      <TransactionCalendar
        transactions={mockTransactions}
        onDateSelect={mockOnDateSelect}
        onTransactionClick={mockOnTransactionClick}
        onAddTransaction={mockOnAddTransaction}
      />
    );

    // Hover over a transaction to show popover
    const transactionElement = screen.getByText('Grocery shopping');
    fireEvent.mouseEnter(transactionElement);

    // Popover should show transaction details
    expect(screen.getByText('Account: BCA Checking')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });
});
