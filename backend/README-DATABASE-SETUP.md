# 🗄️ Database Setup Guide - Permoney Backend

## 📋 Overview

This guide will help you set up PostgreSQL database for the Permoney application. The setup is designed to be user-friendly and configurable for different environments.

## 🚀 Quick Setup (Recommended)

### Option 1: Automated Setup Script

```bash
cd backend
./setup-database.sh
```

This script will:
- Check PostgreSQL installation
- Guide you through database configuration
- Create database and user
- Update root `.env` file with your database settings
- Run database migrations

**Note**: Database configuration is stored in the root `.env` file as the single source of truth for the entire project.

### Option 2: Manual Setup

Follow the steps below for manual configuration.

## 📦 Prerequisites

### 1. Install PostgreSQL

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
- Download from [PostgreSQL Official Website](https://www.postgresql.org/download/windows/)
- Follow the installation wizard
- Remember the password you set for the `postgres` user

### 2. Verify Installation

```bash
psql --version
pg_isready
```

## ⚙️ Database Configuration

### 1. Create Database and User

Connect to PostgreSQL as superuser:

```bash
# macOS/Linux
sudo -u postgres psql

# Windows (if installed with default settings)
psql -U postgres
```

Run the following SQL commands:

```sql
-- Create database
CREATE DATABASE permoney;

-- Create user (optional, you can use postgres user)
CREATE USER permoney_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE permoney TO permoney_user;

-- Exit
\q
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
# Edit the root .env file (not in backend directory)
nano ../.env
```

Edit the root `.env` file with your database settings:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/permoney"

# Example configurations:
# For postgres user: postgresql://postgres:your_password@localhost:5432/permoney
# For custom user: postgresql://permoney_user:your_secure_password@localhost:5432/permoney
```

### 3. Run Database Migrations

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
```

## 🔧 Configuration Options

### Database Connection String Format

```
postgresql://[username]:[password]@[host]:[port]/[database_name]
```

### Common Configurations

**Local Development (Default):**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/permoney"
```

**Custom User:**
```env
DATABASE_URL="postgresql://permoney_user:secure_password@localhost:5432/permoney"
```

**Remote Database:**
```env
DATABASE_URL="postgresql://username:password@your-server.com:5432/permoney"
```

**Cloud Database (AWS RDS, Google Cloud SQL, etc.):**
```env
DATABASE_URL="postgresql://username:password@your-cloud-instance.amazonaws.com:5432/permoney"
```

## 🛠️ Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/permoney` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_MAX_CONNECTIONS` | Maximum database connections | `10` |
| `DB_CONNECTION_TIMEOUT` | Connection timeout (ms) | `30000` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key` |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiration | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |

## 🔒 Security Best Practices

### Development
- Use strong passwords
- Don't commit `.env` files to version control
- Use different credentials for different environments

### Production
- Use managed database services (AWS RDS, Google Cloud SQL)
- Enable SSL connections
- Use connection pooling
- Set up database backups
- Monitor database performance
- Use strong, unique secrets for JWT

## 🐛 Troubleshooting

### Common Issues

**1. Connection Refused**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Start PostgreSQL service
```bash
# macOS
brew services start postgresql

# Ubuntu
sudo systemctl start postgresql
```

**2. Authentication Failed**
```
Error: password authentication failed for user "postgres"
```
**Solution:** Check username and password in DATABASE_URL

**3. Database Does Not Exist**
```
Error: database "permoney" does not exist
```
**Solution:** Create the database
```sql
CREATE DATABASE permoney;
```

**4. Permission Denied**
```
Error: permission denied for database "permoney"
```
**Solution:** Grant privileges to user
```sql
GRANT ALL PRIVILEGES ON DATABASE permoney TO your_username;
```

### Testing Connection

Test your database connection:

```bash
# Test with psql
psql "postgresql://username:password@localhost:5432/permoney"

# Test with Node.js
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('Database connected successfully');
  process.exit(0);
}).catch((err) => {
  console.error('Database connection failed:', err);
  process.exit(1);
});
"
```

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Node.js PostgreSQL Best Practices](https://node-postgres.com/guides/project-structure)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your PostgreSQL installation
3. Check the application logs
4. Ensure all environment variables are set correctly
5. Test database connection manually

## 🎯 Next Steps

After successful database setup:

1. Start the backend: `npm run start:dev`
2. Start the frontend: `npm run dev` (from project root)
3. Test the application at `http://localhost:3000`
4. Check API health at `http://localhost:3001/api/auth/health`
