import type { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import {
  insertUserSchema,
  insertAccountSchema,
  insertTransactionSchema,
  insertBudgetSchema,
  insertGoalSchema,
} from '../shared/schema';
import { authService } from './auth-service';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { body, validationResult } from 'express-validator';

// Security middleware - Disabled in development for easier testing
const limiter =
  process.env.NODE_ENV === 'production'
    ? rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
      })
    : (req: any, res: any, next: any) => next(); // No rate limiting in development

// Login rate limiter - Disabled in development for easier testing
const loginLimiter =
  process.env.NODE_ENV === 'production'
    ? rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // limit each IP to 5 login attempts per windowMs
        message: 'Too many login attempts, please try again later.',
      })
    : (req: any, res: any, next: any) => next(); // No rate limiting in development

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'ACCESS_TOKEN_REQUIRED',
      message: 'Access token required',
    });
  }

  try {
    const user = await authService.verifyToken(token);
    if (!user) {
      return res.status(403).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token',
    });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware - Disable CSP in development for Vite
  if (process.env.NODE_ENV === 'development') {
    app.use(
      helmet({
        contentSecurityPolicy: false, // Disable CSP in development
      })
    );
  } else {
    app.use(helmet());
  }

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(limiter);

  // Authentication routes
  app.post(
    '/api/auth/register',
    loginLimiter,
    [
      body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters'),
      body('email').isEmail().withMessage('Invalid email address'),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
    ],
    async (req: Request, res: Response) => {
      try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
          });
        }

        const result = await authService.register(req.body);

        if (result.success) {
          res.json({
            success: true,
            data: {
              user: result.user,
              token: result.token,
            },
            message: 'Registration successful',
          });
        } else {
          res.status(400).json({
            success: false,
            error: result.error,
            message: result.message,
          });
        }
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: 'REGISTRATION_ERROR',
          message: 'An error occurred during registration',
        });
      }
    }
  );

  app.post(
    '/api/auth/login',
    loginLimiter,
    [
      body('email').isEmail().withMessage('Invalid email address'),
      body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req: Request, res: Response) => {
      try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
          });
        }

        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const result = await authService.login(email, password, ipAddress);

        if (result.success) {
          res.json({
            success: true,
            data: {
              user: result.user,
              token: result.token,
            },
            message: 'Login successful',
          });
        } else {
          res.status(401).json({
            success: false,
            error: result.error,
            message: result.message,
          });
        }
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: 'LOGIN_ERROR',
          message: 'An error occurred during login',
        });
      }
    }
  );

  // Social login routes
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { accessToken, profile } = req.body;
      const result = await authService.socialLogin('google', profile);

      if (result.success) {
        res.json({
          success: true,
          data: {
            user: result.user,
            token: result.token,
          },
          message: 'Google login successful',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'SOCIAL_LOGIN_ERROR',
        message: 'An error occurred during Google login',
      });
    }
  });

  app.post('/api/auth/github', async (req, res) => {
    try {
      const { accessToken, profile } = req.body;
      const result = await authService.socialLogin('github', profile);

      if (result.success) {
        res.json({
          success: true,
          data: {
            user: result.user,
            token: result.token,
          },
          message: 'GitHub login successful',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'SOCIAL_LOGIN_ERROR',
        message: 'An error occurred during GitHub login',
      });
    }
  });

  app.post('/api/auth/apple', async (req, res) => {
    try {
      const { accessToken, profile } = req.body;
      const result = await authService.socialLogin('apple', profile);

      if (result.success) {
        res.json({
          success: true,
          data: {
            user: result.user,
            token: result.token,
          },
          message: 'Apple login successful',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'SOCIAL_LOGIN_ERROR',
        message: 'An error occurred during Apple login',
      });
    }
  });

  app.get('/api/auth/verify', authenticateToken, async (req: any, res) => {
    res.json({
      success: true,
      data: { user: req.user },
      message: 'Token verified successfully',
    });
  });

  app.post('/api/auth/logout', authenticateToken, async (req: any, res) => {
    // In a real implementation, you would invalidate the token
    res.json({
      success: true,
      message: 'Logout successful',
    });
  });

  // User profile routes
  app.get('/api/user/profile', authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }

      const { password, ...userProfile } = user;
      res.json({
        success: true,
        data: userProfile,
        message: 'User profile retrieved successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'PROFILE_ERROR',
        message: 'An error occurred while retrieving profile',
      });
    }
  });

  // Accounts routes
  app.get('/api/accounts', authenticateToken, async (req: any, res) => {
    try {
      const accounts = await storage.getAccountsByUserId(req.user.userId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/accounts', authenticateToken, async (req: any, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const account = await storage.insertAccount({
        ...accountData,
        userId: req.user.userId,
      });
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/accounts/:id', authenticateToken, async (req: any, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const account = await storage.updateAccount(
        parseInt(req.params.id),
        req.user.userId,
        accountData
      );
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/accounts/:id', authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteAccount(parseInt(req.params.id), req.user.userId);
      res.json({ message: 'Account deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Transactions routes
  app.get('/api/transactions', authenticateToken, async (req: any, res) => {
    try {
      const { page = 1, limit = 50, accountId, categoryId, type } = req.query;
      const transactions = await storage.getTransactionsByUserId(
        req.user.userId,
        {
          page: parseInt(page),
          limit: parseInt(limit),
          accountId,
          categoryId,
          type,
        }
      );
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/transactions', authenticateToken, async (req: any, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.insertTransaction({
        ...transactionData,
        userId: req.user.userId,
      });
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/transactions/:id', authenticateToken, async (req: any, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.updateTransaction(
        req.params.id,
        req.user.userId,
        transactionData
      );
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete(
    '/api/transactions/:id',
    authenticateToken,
    async (req: any, res) => {
      try {
        await storage.deleteTransaction(req.params.id, req.user.userId);
        res.json({ message: 'Transaction deleted successfully' });
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  // Categories routes
  app.get('/api/categories', authenticateToken, async (req: any, res) => {
    try {
      const categories = await storage.getCategoriesByUserId(req.user.userId);
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Budgets routes
  app.get('/api/budgets', authenticateToken, async (req: any, res) => {
    try {
      const budgets = await storage.getBudgetsByUserId(req.user.userId);
      res.json(budgets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/budgets', authenticateToken, async (req: any, res) => {
    try {
      const budgetData = insertBudgetSchema.parse(req.body);
      const budget = await storage.insertBudget({
        ...budgetData,
        userId: req.user.userId,
      });
      res.json(budget);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Goals routes
  app.get('/api/goals', authenticateToken, async (req: any, res) => {
    try {
      const goals = await storage.getGoalsByUserId(req.user.userId);
      res.json(goals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/goals', authenticateToken, async (req: any, res) => {
    try {
      const goalData = insertGoalSchema.parse(req.body);
      const goal = await storage.insertGoal({
        ...goalData,
        userId: req.user.userId,
      });
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Dashboard analytics routes
  app.get(
    '/api/dashboard/overview',
    authenticateToken,
    async (req: any, res) => {
      try {
        const overview = await storage.getDashboardOverview(req.user.userId);
        res.json(overview);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get(
    '/api/dashboard/spending-trends',
    authenticateToken,
    async (req: any, res) => {
      try {
        const { period = 'month' } = req.query;
        const trends = await storage.getSpendingTrends(
          req.user.userId,
          period as string
        );
        res.json(trends);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
