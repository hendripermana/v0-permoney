import { db } from './db';
import { eq, and } from 'drizzle-orm';
import {
  users,
  accounts,
  transactions,
  budgets,
  goals,
  categories,
  type InsertUser,
  type User,
  type InsertAccount,
  type Account,
  type InsertTransaction,
  type Transaction,
  type InsertBudget,
  type Budget,
  type InsertGoal,
  type Goal,
  type Category,
} from '../shared/schema';

export interface Storage {
  // User operations
  insertUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserById(id: number): Promise<User | null>;

  // Account operations
  insertAccount(account: InsertAccount & { userId: number }): Promise<Account>;
  getAccountsByUserId(userId: number): Promise<Account[]>;
  updateAccount(
    id: number,
    userId: number,
    account: Partial<InsertAccount>
  ): Promise<Account>;
  deleteAccount(id: number, userId: number): Promise<void>;

  // Transaction operations
  insertTransaction(
    transaction: InsertTransaction & { userId: number }
  ): Promise<Transaction>;
  getTransactionsByUserId(
    userId: number,
    filters?: any
  ): Promise<Transaction[]>;
  updateTransaction(
    id: string,
    userId: number,
    transaction: Partial<InsertTransaction>
  ): Promise<Transaction>;
  deleteTransaction(id: string, userId: number): Promise<void>;

  // Category operations
  getCategoriesByUserId(userId: number): Promise<Category[]>;

  // Budget operations
  insertBudget(budget: InsertBudget & { userId: number }): Promise<Budget>;
  getBudgetsByUserId(userId: number): Promise<Budget[]>;

  // Goal operations
  insertGoal(goal: InsertGoal & { userId: number }): Promise<Goal>;
  getGoalsByUserId(userId: number): Promise<Goal[]>;

  // Dashboard operations
  getDashboardOverview(userId: number): Promise<any>;
  getSpendingTrends(userId: number, period: string): Promise<any>;
}

class DrizzleStorage implements Storage {
  constructor() {
    // Initialize default categories if needed
    this.initializeDefaultCategories();
  }

  private async initializeDefaultCategories() {
    // Create a system user if it doesn't exist
    const systemUserResult = await db
      .select()
      .from(users)
      .where(eq(users.id, 1))
      .limit(1);
    let systemUser = systemUserResult[0];
    if (!systemUser) {
      const insertedUsers = await db
        .insert(users)
        .values({
          username: 'system',
          email: 'system@permoney.app',
          password: 'system',
          firstName: 'System',
          lastName: 'User',
        })
        .returning();
      systemUser = insertedUsers[0];
    }

    const defaultCategories = [
      {
        name: 'Food & Dining',
        type: 'expense',
        color: '#FF6B6B',
        icon: 'UtensilsCrossed',
      },
      {
        name: 'Transportation',
        type: 'expense',
        color: '#4ECDC4',
        icon: 'Car',
      },
      {
        name: 'Shopping',
        type: 'expense',
        color: '#45B7D1',
        icon: 'ShoppingBag',
      },
      {
        name: 'Entertainment',
        type: 'expense',
        color: '#96CEB4',
        icon: 'Gamepad2',
      },
      {
        name: 'Bills & Utilities',
        type: 'expense',
        color: '#FFEAA7',
        icon: 'Receipt',
      },
      { name: 'Healthcare', type: 'expense', color: '#DDA0DD', icon: 'Heart' },
      { name: 'Salary', type: 'income', color: '#98D8C8', icon: 'Banknote' },
      {
        name: 'Freelance',
        type: 'income',
        color: '#F7DC6F',
        icon: 'Briefcase',
      },
      {
        name: 'Investment',
        type: 'income',
        color: '#BB8FCE',
        icon: 'TrendingUp',
      },
    ];

    for (const cat of defaultCategories) {
      const existingResult = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.name, cat.name),
            eq(categories.userId, systemUser.id),
            eq(categories.isDefault, true)
          )
        )
        .limit(1);

      if (existingResult.length === 0) {
        await db.insert(categories).values({
          userId: systemUser.id,
          ...cat,
          parentId: null,
          isDefault: true,
        });
      }
    }
  }

  // User operations
  async insertUser(user: InsertUser): Promise<User> {
    const insertedUsers = await db
      .insert(users)
      .values({
        ...user,
        currency: 'USD',
        timezone: 'UTC',
      })
      .returning();
    return insertedUsers[0];
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0] || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0] || null;
  }

  // Account operations
  async insertAccount(
    account: InsertAccount & { userId: number }
  ): Promise<Account> {
    const insertedAccounts = await db
      .insert(accounts)
      .values(account)
      .returning();
    return insertedAccounts[0];
  }

  async getAccountsByUserId(userId: number): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.userId, userId));
  }

  async updateAccount(
    id: number,
    userId: number,
    accountData: Partial<InsertAccount>
  ): Promise<Account> {
    const updatedAccounts = await db
      .update(accounts)
      .set(accountData)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning();
    return updatedAccounts[0];
  }

  async deleteAccount(id: number, userId: number): Promise<void> {
    await db
      .delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  }

  // Transaction operations
  async insertTransaction(
    transaction: InsertTransaction & { userId: number }
  ): Promise<Transaction> {
    const created = await this.prisma.transaction.create({ data: transaction });
    // Update account balance
    const account = await this.prisma.account.findUnique({
      where: { id: transaction.accountId },
    });
    if (account) {
      const amount = parseFloat(transaction.amount.toString());
      const currentBalance = parseFloat(account.balance.toString());
      const newBalance =
        transaction.type === 'income'
          ? currentBalance + amount
          : currentBalance - amount;
      await this.prisma.account.update({
        where: { id: transaction.accountId },
        data: { balance: newBalance },
      });
    }
    return created;
  }

  async getTransactionsByUserId(
    userId: number,
    filters?: any
  ): Promise<Transaction[]> {
    const where: any = { userId };
    if (filters?.accountId) where.accountId = parseInt(filters.accountId);
    if (filters?.categoryId) where.categoryId = parseInt(filters.categoryId);
    if (filters?.type) where.type = filters.type;
    return this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async updateTransaction(
    id: string,
    userId: number,
    transactionData: Partial<InsertTransaction>
  ): Promise<Transaction> {
    return this.prisma.transaction.update({
      where: { id, userId },
      data: transactionData,
    });
  }

  async deleteTransaction(id: string, userId: number): Promise<void> {
    await this.prisma.transaction.delete({ where: { id, userId } });
  }

  // Category operations
  async getCategoriesByUserId(userId: number): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        OR: [{ userId }, { userId: 1, isDefault: true }],
      },
    });
  }

  // Budget operations
  async insertBudget(
    budget: InsertBudget & { userId: number }
  ): Promise<Budget> {
    return this.prisma.budget.create({ data: budget });
  }

  async getBudgetsByUserId(userId: number): Promise<Budget[]> {
    return this.prisma.budget.findMany({ where: { userId } });
  }

  // Goal operations
  async insertGoal(goal: InsertGoal & { userId: number }): Promise<Goal> {
    return this.prisma.goal.create({ data: goal });
  }

  async getGoalsByUserId(userId: number): Promise<Goal[]> {
    return this.prisma.goal.findMany({ where: { userId } });
  }

  // Dashboard operations
  async getDashboardOverview(userId: number): Promise<any> {
    const [accounts, transactions, budgets, goals] = await Promise.all([
      this.getAccountsByUserId(userId),
      this.getTransactionsByUserId(userId),
      this.getBudgetsByUserId(userId),
      this.getGoalsByUserId(userId),
    ]);

    const totalBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.balance),
      0
    );
    const monthlyIncome = transactions
      .filter(
        t =>
          t.type === 'income' &&
          new Date(t.date).getMonth() === new Date().getMonth()
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyExpenses = transactions
      .filter(
        t =>
          t.type === 'expense' &&
          new Date(t.date).getMonth() === new Date().getMonth()
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      activeBudgets: budgets.filter(b => b.isActive).length,
      activeGoals: goals.filter(g => !g.isCompleted).length,
    };
  }

  async getSpendingTrends(userId: number, period: string): Promise<any> {
    const transactions = await this.getTransactionsByUserId(userId);
    // Implement spending trends logic
    return {};
  }
}

export const storage = new DrizzleStorage();
