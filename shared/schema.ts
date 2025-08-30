import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  decimal,
  varchar,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password'), // Optional for social login users
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatar: text('avatar'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  timezone: text('timezone').default('UTC'),

  // Authentication fields
  emailVerified: boolean('email_verified').default(false),
  emailVerifiedAt: timestamp('email_verified_at'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'),
  lastLoginAt: timestamp('last_login_at'),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),

  // Social login fields
  googleId: text('google_id').unique(),
  githubId: text('github_id').unique(),
  appleId: text('apple_id').unique(),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Passkeys table
export const passkeys = pgTable('passkeys', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  credentialId: text('credential_id').notNull().unique(),
  publicKey: text('public_key').notNull(),
  counter: integer('counter').default(0),
  transports: text('transports').array(),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Accounts table (bank accounts, credit cards, etc.)
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // checking, savings, credit, investment
  balance: decimal('balance', { precision: 12, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  isActive: boolean('is_active').default(true),
  color: text('color').default('#3B82F6'),
  icon: text('icon').default('CreditCard'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references((): any => users.id)
    .notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // income, expense
  color: text('color').default('#6B7280'),
  icon: text('icon').default('Tag'),
  parentId: integer('parent_id').references((): any => categories.id),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id')
    .references((): any => users.id)
    .notNull(),
  accountId: integer('account_id')
    .references((): any => accounts.id)
    .notNull(),
  categoryId: integer('category_id').references((): any => categories.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  notes: text('notes'),
  type: text('type').notNull(), // income, expense, transfer
  date: timestamp('date').notNull(),
  isRecurring: boolean('is_recurring').default(false),
  recurringId: uuid('recurring_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Budgets table
export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  categoryId: integer('category_id')
    .references(() => categories.id)
    .notNull(),
  name: text('name').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  period: text('period').notNull(), // monthly, weekly, yearly
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
  alertThreshold: integer('alert_threshold').default(80), // percentage
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Financial Goals table
export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  targetAmount: decimal('target_amount', { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal('current_amount', { precision: 12, scale: 2 }).default(
    '0'
  ),
  targetDate: timestamp('target_date'),
  category: text('category').notNull(), // emergency, vacation, house, car, etc.
  priority: text('priority').default('medium'), // low, medium, high
  isCompleted: boolean('is_completed').default(false),
  color: text('color').default('#10B981'),
  icon: text('icon').default('Target'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Category = typeof categories.$inferSelect;

// Authentication schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const SocialLoginSchema = z.object({
  provider: z.enum(['google', 'github', 'apple']),
  accessToken: z.string(),
  profile: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    picture: z.string().optional(),
  }),
});

export const PasskeyRegistrationSchema = z.object({
  userId: z.number(),
  name: z.string().min(1, 'Passkey name is required'),
  credentialId: z.string(),
  publicKey: z.string(),
  transports: z.array(z.string()).optional(),
});

export const PasskeyAuthenticationSchema = z.object({
  credentialId: z.string(),
  authenticatorData: z.string(),
  clientDataJSON: z.string(),
  signature: z.string(),
});

export const TwoFactorSchema = z.object({
  code: z.string().length(6, '2FA code must be 6 digits'),
});
