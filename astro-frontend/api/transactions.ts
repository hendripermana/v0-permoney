import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';

const app = new Hono();

// Enable CORS for all routes
app.use('*', cors());

// Cache middleware for read operations
app.use('*', cache({
  cacheName: 'permoney-api',
  cacheControl: 'max-age=300', // 5 minutes
}));

// Mock data for demonstration (replace with actual database calls)
const mockTransactions = [
  {
    id: '1',
    householdId: 'default-household',
    amount: 50000,
    currency: 'IDR',
    description: 'Grocery shopping',
    categoryId: 'food-dining',
    date: '2024-01-15',
    accountId: 'acc-1',
    createdBy: 'user-1',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    householdId: 'default-household',
    amount: 2500000,
    currency: 'IDR',
    description: 'Monthly salary',
    categoryId: 'salary',
    date: '2024-01-01',
    accountId: 'acc-1',
    createdBy: 'user-1',
    createdAt: '2024-01-01T09:00:00Z',
  },
  {
    id: '3',
    householdId: 'default-household',
    amount: 150000,
    currency: 'IDR',
    description: 'Gas station',
    categoryId: 'transportation',
    date: '2024-01-14',
    accountId: 'acc-1',
    createdBy: 'user-1',
    createdAt: '2024-01-14T16:30:00Z',
  },
];

// GET /api/transactions - List transactions with caching
app.get('/', async (c) => {
  const householdId = c.req.query('householdId');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  if (!householdId) {
    return c.json({ error: 'householdId is required' }, 400);
  }

  try {
    // Filter by household and apply pagination
    const filteredTransactions = mockTransactions
      .filter(t => t.householdId === householdId)
      .slice(offset, offset + limit);

    return c.json({
      data: filteredTransactions,
      pagination: {
        limit,
        offset,
        total: mockTransactions.length,
        hasMore: offset + limit < mockTransactions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/transactions/:id - Get single transaction
app.get('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const transaction = mockTransactions.find(t => t.id === id);

    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    return c.json({ data: transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/transactions - Create new transaction
app.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.householdId || !body.amount || !body.description) {
      return c.json({
        error: 'Missing required fields: householdId, amount, description'
      }, 400);
    }

    // Create new transaction
    const newTransaction = {
      id: `txn-${Date.now()}`,
      householdId: body.householdId,
      amount: body.amount,
      currency: body.currency || 'IDR',
      description: body.description,
      categoryId: body.categoryId,
      date: body.date || new Date().toISOString().split('T')[0],
      accountId: body.accountId || 'default-account',
      createdBy: body.createdBy || 'user-1',
      createdAt: new Date().toISOString(),
    };

    // In production, save to database
    // await db.transactions.create(newTransaction);

    return c.json({
      data: newTransaction,
      message: 'Transaction created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/transactions/:id - Update transaction
app.put('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const body = await c.req.json();
    const transaction = mockTransactions.find(t => t.id === id);

    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    // Update transaction
    Object.assign(transaction, {
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return c.json({
      data: transaction,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/transactions/:id - Delete transaction
app.delete('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const index = mockTransactions.findIndex(t => t.id === id);

    if (index === -1) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    // Remove transaction
    mockTransactions.splice(index, 1);

    return c.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/transactions/analytics/summary - Get transaction summary
app.get('/analytics/summary', async (c) => {
  const householdId = c.req.query('householdId');

  if (!householdId) {
    return c.json({ error: 'householdId is required' }, 400);
  }

  try {
    const householdTransactions = mockTransactions.filter(t => t.householdId === householdId);

    const totalIncome = householdTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = householdTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netIncome = totalIncome - totalExpenses;

    return c.json({
      totalTransactions: householdTransactions.length,
      totalIncome,
      totalExpenses,
      netIncome,
      averageTransaction: householdTransactions.length > 0
        ? householdTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / householdTransactions.length
        : 0,
    });
  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
