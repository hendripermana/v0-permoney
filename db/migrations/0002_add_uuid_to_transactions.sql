-- Migration: Add UUID support to transactions table
-- This migration updates the transactions table to use UUID for primary keys

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a new transactions table with UUID
CREATE TABLE transactions_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  category_id INTEGER REFERENCES categories(id),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  type TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurring_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Copy existing data from old table to new table (if any exists)
INSERT INTO transactions_new (
  user_id, account_id, category_id, amount, description, notes, 
  type, date, is_recurring, created_at, updated_at
)
SELECT 
  user_id, account_id, category_id, amount, description, notes,
  type, date, is_recurring, created_at, updated_at
FROM transactions;

-- Drop the old table
DROP TABLE IF EXISTS transactions;

-- Rename the new table
ALTER TABLE transactions_new RENAME TO transactions;

-- Add indexes for better performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
