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

// Mock data for demonstration
const mockAccounts = [
  {
    id: 'acc-1',
    householdId: 'default-household',
    name: 'Main Checking',
    type: 'ASSET',
    subtype: 'checking',
    currency: 'IDR',
    institutionId: 'bca',
    accountNumber: '1234567890',
    balanceCents: 500000000, // 5 million IDR
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'acc-2',
    householdId: 'default-household',
    name: 'Credit Card',
    type: 'LIABILITY',
    subtype: 'credit_card',
    currency: 'IDR',
    institutionId: 'bca',
    accountNumber: '9876543210',
    balanceCents: -25000000, // -250k IDR
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'acc-3',
    householdId: 'default-household',
    name: 'Savings Account',
    type: 'ASSET',
    subtype: 'savings',
    currency: 'IDR',
    institutionId: 'mandiri',
    accountNumber: '1111111111',
    balanceCents: 1000000000, // 10 million IDR
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];

const mockInstitutions = [
  {
    id: 'bca',
    name: 'Bank Central Asia (BCA)',
    code: 'BCA',
    country: 'ID',
    type: 'BANK',
  },
  {
    id: 'mandiri',
    name: 'Bank Mandiri',
    code: 'MANDIRI',
    country: 'ID',
    type: 'BANK',
  },
];

// GET /api/accounts - List accounts
app.get('/', async (c) => {
  const householdId = c.req.query('householdId');

  if (!householdId) {
    return c.json({ error: 'householdId is required' }, 400);
  }

  try {
    const accounts = mockAccounts.filter(account => account.householdId === householdId);

    return c.json({ data: accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/accounts/:id - Get single account
app.get('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const account = mockAccounts.find(account => account.id === id);

    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }

    return c.json({ data: account });
  } catch (error) {
    console.error('Error fetching account:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/accounts - Create new account
app.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.householdId || !body.name || !body.type) {
      return c.json({
        error: 'Missing required fields: householdId, name, type'
      }, 400);
    }

    // Create new account
    const newAccount = {
      id: `acc-${Date.now()}`,
      householdId: body.householdId,
      name: body.name,
      type: body.type,
      subtype: body.subtype || 'other',
      currency: body.currency || 'IDR',
      institutionId: body.institutionId,
      accountNumber: body.accountNumber,
      balanceCents: body.balanceCents || 0,
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In production, save to database
    // await db.accounts.create(newAccount);

    return c.json({
      data: newAccount,
      message: 'Account created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating account:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/accounts/:id - Update account
app.put('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const body = await c.req.json();
    const account = mockAccounts.find(account => account.id === id);

    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // Update account
    Object.assign(account, {
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return c.json({
      data: account,
      message: 'Account updated successfully'
    });
  } catch (error) {
    console.error('Error updating account:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/accounts/:id - Delete account
app.delete('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const index = mockAccounts.findIndex(account => account.id === id);

    if (index === -1) {
      return c.json({ error: 'Account not found' }, 404);
    }

    // Remove account
    mockAccounts.splice(index, 1);

    return c.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/institutions - List institutions
app.get('/institutions', async (c) => {
  try {
    return c.json({ data: mockInstitutions });
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/accounts/analytics/balance - Get balance summary
app.get('/analytics/balance', async (c) => {
  const householdId = c.req.query('householdId');

  if (!householdId) {
    return c.json({ error: 'householdId is required' }, 400);
  }

  try {
    const householdAccounts = mockAccounts.filter(account => account.householdId === householdId);

    const totalAssets = householdAccounts
      .filter(account => account.type === 'ASSET')
      .reduce((sum, account) => sum + account.balanceCents, 0);

    const totalLiabilities = householdAccounts
      .filter(account => account.type === 'LIABILITY')
      .reduce((sum, account) => sum + Math.abs(account.balanceCents), 0);

    const netWorth = totalAssets - totalLiabilities;

    return c.json({
      totalAccounts: householdAccounts.length,
      totalAssets,
      totalLiabilities,
      netWorth,
      averageBalance: householdAccounts.length > 0
        ? householdAccounts.reduce((sum, account) => sum + Math.abs(account.balanceCents), 0) / householdAccounts.length
        : 0,
    });
  } catch (error) {
    console.error('Error fetching balance summary:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
