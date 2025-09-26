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
const mockHouseholds = [
  {
    id: 'default-household',
    name: 'Personal Finance',
    baseCurrency: 'IDR',
    settings: {
      theme: 'system',
      notifications: true,
      budgetAlerts: true,
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];

const mockCategories = [
  { id: 'salary', name: 'Salary', slug: 'salary', type: 'INCOME', icon: '💰', color: '#10B981' },
  { id: 'freelance', name: 'Freelance', slug: 'freelance', type: 'INCOME', icon: '💼', color: '#059669' },
  { id: 'food-dining', name: 'Food & Dining', slug: 'food-dining', type: 'EXPENSE', icon: '🍽️', color: '#EF4444' },
  { id: 'transportation', name: 'Transportation', slug: 'transportation', type: 'EXPENSE', icon: '🚗', color: '#F97316' },
  { id: 'shopping', name: 'Shopping', slug: 'shopping', type: 'EXPENSE', icon: '🛍️', color: '#8B5CF6' },
];

// GET /api/households - List households
app.get('/', async (c) => {
  try {
    return c.json({ data: mockHouseholds });
  } catch (error) {
    console.error('Error fetching households:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/households/:id - Get single household
app.get('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const household = mockHouseholds.find(h => h.id === id);

    if (!household) {
      return c.json({ error: 'Household not found' }, 404);
    }

    return c.json({ data: household });
  } catch (error) {
    console.error('Error fetching household:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/households - Create new household
app.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.name) {
      return c.json({
        error: 'Missing required field: name'
      }, 400);
    }

    // Create new household
    const newHousehold = {
      id: `hh-${Date.now()}`,
      name: body.name,
      baseCurrency: body.baseCurrency || 'IDR',
      settings: body.settings || {
        theme: 'system',
        notifications: true,
        budgetAlerts: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In production, save to database
    // await db.households.create(newHousehold);

    return c.json({
      data: newHousehold,
      message: 'Household created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating household:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/households/:id - Update household
app.put('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const body = await c.req.json();
    const household = mockHouseholds.find(h => h.id === id);

    if (!household) {
      return c.json({ error: 'Household not found' }, 404);
    }

    // Update household
    Object.assign(household, {
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return c.json({
      data: household,
      message: 'Household updated successfully'
    });
  } catch (error) {
    console.error('Error updating household:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/categories - List categories
app.get('/categories', async (c) => {
  try {
    return c.json({ data: mockCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/households/:id/analytics/dashboard - Get dashboard analytics
app.get('/:id/analytics/dashboard', async (c) => {
  const id = c.req.param('id');

  try {
    const household = mockHouseholds.find(h => h.id === id);

    if (!household) {
      return c.json({ error: 'Household not found' }, 404);
    }

    // Mock analytics data (in production, calculate from actual transactions)
    const dashboardData = {
      householdId: id,
      householdName: household.name,
      totalBalance: 2500000000, // 25 million IDR
      monthlyIncome: 15000000,  // 15 million IDR
      monthlyExpenses: 8000000, // 8 million IDR
      transactionCount: 45,
      accountCount: 3,
      budgetCount: 5,
      lastUpdated: new Date().toISOString(),
    };

    return c.json({ data: dashboardData });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/households/:id/analytics/spending - Get spending analytics
app.get('/:id/analytics/spending', async (c) => {
  const id = c.req.param('id');
  const period = c.req.query('period') || 'month'; // month, quarter, year

  try {
    // Mock spending data by category
    const spendingData = [
      {
        categoryId: 'food-dining',
        categoryName: 'Food & Dining',
        amount: 3000000,
        transactionCount: 25,
        percentage: 37.5,
      },
      {
        categoryId: 'transportation',
        categoryName: 'Transportation',
        amount: 1500000,
        transactionCount: 12,
        percentage: 18.75,
      },
      {
        categoryId: 'shopping',
        categoryName: 'Shopping',
        amount: 1200000,
        transactionCount: 8,
        percentage: 15.0,
      },
      {
        categoryId: 'bills-utilities',
        categoryName: 'Bills & Utilities',
        amount: 1000000,
        transactionCount: 5,
        percentage: 12.5,
      },
      {
        categoryId: 'entertainment',
        categoryName: 'Entertainment',
        amount: 800000,
        transactionCount: 6,
        percentage: 10.0,
      },
    ];

    return c.json({
      data: spendingData,
      period,
      totalSpent: 8000000,
    });
  } catch (error) {
    console.error('Error fetching spending analytics:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/households/:id/analytics/income - Get income analytics
app.get('/:id/analytics/income', async (c) => {
  const id = c.req.param('id');
  const period = c.req.query('period') || 'month';

  try {
    // Mock income data by source
    const incomeData = [
      {
        source: 'Salary',
        amount: 12000000,
        percentage: 80.0,
      },
      {
        source: 'Freelance',
        amount: 2000000,
        percentage: 13.33,
      },
      {
        source: 'Investment',
        amount: 1000000,
        percentage: 6.67,
      },
    ];

    return c.json({
      data: incomeData,
      period,
      totalIncome: 15000000,
    });
  } catch (error) {
    console.error('Error fetching income analytics:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
