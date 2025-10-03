import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ValidationResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

async function validateDatabaseSetup(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  try {
    // Test 1: Database Connection
    try {
      await prisma.$connect();
      results.push({
        name: 'Database Connection',
        status: 'pass',
        message: 'Successfully connected to PostgreSQL database'
      });
    } catch (error) {
      results.push({
        name: 'Database Connection',
        status: 'fail',
        message: `Failed to connect to database: ${error}`
      });
      return results; // Can't continue without connection
    }

    // Test 2: Schema Validation - Check if all core tables exist
    const coreModels = [
      'user', 'household', 'householdMember', 'institution', 'account',
      'category', 'transaction', 'ledgerEntry', 'debt', 'budget',
      'gratitudeEntry', 'exchangeRate', 'passkey', 'session'
    ];

    for (const model of coreModels) {
      try {
        // @ts-ignore - Dynamic model access
        await prisma[model].count();
        results.push({
          name: `Table: ${model}`,
          status: 'pass',
          message: `Table '${model}' exists and is accessible`
        });
      } catch (error) {
        results.push({
          name: `Table: ${model}`,
          status: 'fail',
          message: `Table '${model}' is missing or inaccessible`
        });
      }
    }

    // Test 3: Enhanced Categories Schema Validation
    try {
      const sampleCategory = await prisma.category.findFirst({
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
          type: true,
          parentId: true,
          householdId: true,
          isActive: true,
          sortOrder: true,
          createdAt: true
        }
      });

      if (sampleCategory) {
        results.push({
          name: 'Enhanced Categories Schema',
          status: 'pass',
          message: 'Categories table has all required enhanced fields (slug, icon, color, type, parentId, householdId, isActive, sortOrder)'
        });
      } else {
        results.push({
          name: 'Enhanced Categories Schema',
          status: 'warning',
          message: 'Categories table structure is correct but no data found'
        });
      }
    } catch (error) {
      results.push({
        name: 'Enhanced Categories Schema',
        status: 'fail',
        message: `Categories schema validation failed: ${error}`
      });
    }

    // Test 4: Category Indexes Validation
    try {
      // Test household + type index performance
      const start = Date.now();
      await prisma.category.findMany({
        where: {
          householdId: null,
          type: 'EXPENSE'
        },
        take: 10
      });
      const duration = Date.now() - start;

      results.push({
        name: 'Category Indexes',
        status: duration < 100 ? 'pass' : 'warning',
        message: `Category queries by household and type completed in ${duration}ms`
      });
    } catch (error) {
      results.push({
        name: 'Category Indexes',
        status: 'fail',
        message: `Category index validation failed: ${error}`
      });
    }

    // Test 5: Default Categories Seeding
    try {
      const categoryTypes = ['INCOME', 'EXPENSE', 'ASSET', 'LIABILITY', 'DEBT'];
      const categoryCounts = await Promise.all(
        categoryTypes.map(async (type) => {
          const count = await prisma.category.count({
            where: { type: type as any, householdId: null }
          });
          return { type, count };
        })
      );

      const totalGlobalCategories = categoryCounts.reduce((sum, { count }) => sum + count, 0);
      
      if (totalGlobalCategories >= 15) {
        results.push({
          name: 'Default Categories Seeding',
          status: 'pass',
          message: `Found ${totalGlobalCategories} global default categories across all types`
        });
      } else {
        results.push({
          name: 'Default Categories Seeding',
          status: 'warning',
          message: `Only ${totalGlobalCategories} global categories found. Expected at least 15.`
        });
      }

      // Check for subcategories
      const subcategoryCount = await prisma.category.count({
        where: { parentId: { not: null } }
      });

      if (subcategoryCount > 0) {
        results.push({
          name: 'Category Hierarchy',
          status: 'pass',
          message: `Found ${subcategoryCount} subcategories with proper parent relationships`
        });
      } else {
        results.push({
          name: 'Category Hierarchy',
          status: 'warning',
          message: 'No subcategories found. Consider adding hierarchical categories.'
        });
      }

      // Test enhanced category features
      const sampleCategory = await prisma.category.findFirst({
        select: {
          isEditable: true,
          isArchived: true,
        }
      });

      if (sampleCategoryWithEnhancements !== null) {
        results.push({
          name: 'Enhanced Category Features',
          status: 'pass',
          message: 'Categories have isEditable and isArchived fields for better UX'
        });
      } else {
        results.push({
          name: 'Enhanced Category Features',
          status: 'fail',
          message: 'Categories missing enhanced fields (isEditable, isArchived)'
        });
      }
    } catch (error) {
      results.push({
        name: 'Default Categories Seeding',
        status: 'fail',
        message: `Category seeding validation failed: ${error}`
      });
    }

    // Test 6: TimescaleDB Extension
    try {
      const result = await prisma.$queryRaw`
        SELECT EXISTS(
          SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
        ) as timescaledb_enabled;
      `;
      
      // @ts-ignore
      const isEnabled = result[0]?.timescaledb_enabled;
      
      if (isEnabled) {
        results.push({
          name: 'TimescaleDB Extension',
          status: 'pass',
          message: 'TimescaleDB extension is installed and enabled'
        });

        // Test hypertable
        try {
          const hypertableResult = await prisma.$queryRaw`
            SELECT * FROM timescaledb_information.hypertables 
            WHERE hypertable_name = 'transactions';
          `;
          
          // @ts-ignore
          if (hypertableResult.length > 0) {
            results.push({
              name: 'TimescaleDB Hypertable',
              status: 'pass',
              message: 'Transactions table is properly configured as a hypertable'
            });
          } else {
            results.push({
              name: 'TimescaleDB Hypertable',
              status: 'warning',
              message: 'Transactions table is not configured as a hypertable'
            });
          }
        } catch (error) {
          results.push({
            name: 'TimescaleDB Hypertable',
            status: 'warning',
            message: 'Could not verify hypertable configuration'
          });
        }
      } else {
        results.push({
          name: 'TimescaleDB Extension',
          status: 'warning',
          message: 'TimescaleDB extension is not installed. Basic PostgreSQL functionality will work.'
        });
      }
    } catch (error) {
      results.push({
        name: 'TimescaleDB Extension',
        status: 'warning',
        message: 'Could not check TimescaleDB status. Assuming basic PostgreSQL setup.'
      });
    }

    // Test 7: Migration Files
    const migrationDir = path.join(process.cwd(), 'prisma', 'migrations');
    if (fs.existsSync(migrationDir)) {
      const migrations = fs.readdirSync(migrationDir).filter(dir => 
        fs.statSync(path.join(migrationDir, dir)).isDirectory()
      );
      
      results.push({
        name: 'Database Migrations',
        status: 'pass',
        message: `Found ${migrations.length} migration(s): ${migrations.join(', ')}`
      });
    } else {
      results.push({
        name: 'Database Migrations',
        status: 'fail',
        message: 'No migrations directory found'
      });
    }

    // Test 8: Seed Data
    try {
      const institutionCount = await prisma.institution.count();
      const exchangeRateCount = await prisma.exchangeRate.count();
      
      if (institutionCount > 0 && exchangeRateCount > 0) {
        results.push({
          name: 'Seed Data',
          status: 'pass',
          message: `Database seeded with ${institutionCount} institutions and ${exchangeRateCount} exchange rates`
        });
      } else {
        results.push({
          name: 'Seed Data',
          status: 'warning',
          message: 'Database appears to be empty. Run `npm run db:seed` to populate with default data.'
        });
      }
    } catch (error) {
      results.push({
        name: 'Seed Data',
        status: 'fail',
        message: `Seed data validation failed: ${error}`
      });
    }

    // Test 9: Double-Entry Accounting Structure
    try {
      // Check if ledger entries table has proper structure
      await prisma.ledgerEntry.findFirst({
        select: {
          id: true,
          transactionId: true,
          accountId: true,
          type: true,
          amountCents: true,
          currency: true
        }
      });

      results.push({
        name: 'Double-Entry Accounting Structure',
        status: 'pass',
        message: 'Ledger entries table properly configured for double-entry accounting'
      });
    } catch (error) {
      results.push({
        name: 'Double-Entry Accounting Structure',
        status: 'fail',
        message: `Double-entry accounting structure validation failed: ${error}`
      });
    }

    // Test 10: Multi-Currency Support
    try {
      await prisma.transaction.findFirst({
        select: {
          currency: true,
          originalCurrency: true,
          exchangeRate: true
        }
      });

      results.push({
        name: 'Multi-Currency Support',
        status: 'pass',
        message: 'Transaction table properly configured for multi-currency support'
      });
    } catch (error) {
      results.push({
        name: 'Multi-Currency Support',
        status: 'fail',
        message: `Multi-currency support validation failed: ${error}`
      });
    }

    // Test 11: Merchant Enrichment Features
    try {
      // Check if merchants table exists and has proper structure
      const merchantCount = await prisma.merchant.count();
      
      // Check if transactions have merchant enrichment fields
      // Checking merchant enrichment fields
      const sampleCategory = await prisma.transaction.findFirst({
        select: {
          merchantId: true,
          merchantName: true,
          merchantLogoUrl: true,
          merchantColor: true,
        }
      });

      if (merchantCount > 0) {
        results.push({
          name: 'Merchant Enrichment',
          status: 'pass',
          message: `Found ${merchantCount} merchants with enrichment data for better transaction visualization`
        });
      } else {
        results.push({
          name: 'Merchant Enrichment',
          status: 'warning',
          message: 'Merchant table exists but no merchants found. Run seed to populate.'
        });
      }

      results.push({
        name: 'Transaction Merchant Fields',
        status: 'pass',
        message: 'Transactions have merchant enrichment fields (merchantId, merchantName, merchantLogoUrl, merchantColor)'
      });
    } catch (error) {
      results.push({
        name: 'Merchant Enrichment',
        status: 'fail',
        message: `Merchant enrichment validation failed: ${error}`
      });
    }

    // Test 12: Gratitude-Transaction Linking
    try {
      const sampleCategory = await prisma.gratitudeEntry.findFirst({
        select: {
          id: true,
          transactionId: true,
          giver: true,
          description: true,
        }
      });

      results.push({
        name: 'Gratitude-Transaction Linking',
        status: 'pass',
        message: 'Gratitude entries can be linked to transactions for financial storytelling'
      });
    } catch (error) {
      results.push({
        name: 'Gratitude-Transaction Linking',
        status: 'fail',
        message: `Gratitude-transaction linking validation failed: ${error}`
      });
    }

  } catch (error) {
    results.push({
      name: 'General Validation',
      status: 'fail',
      message: `Unexpected error during validation: ${error}`
    });
  } finally {
    await prisma.$disconnect();
  }

  return results;
}

async function main() {
  console.log('🔍 Validating Permoney Database Setup...\n');
  
  const results = await validateDatabaseSetup();
  
  let passCount = 0;
  let warningCount = 0;
  let failCount = 0;
  
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.name}: ${result.message}`);
    
    if (result.status === 'pass') passCount++;
    else if (result.status === 'warning') warningCount++;
    else failCount++;
  });
  
  console.log('\n📊 Validation Summary:');
  console.log(`  ✅ Passed: ${passCount}`);
  console.log(`  ⚠️  Warnings: ${warningCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  
  if (failCount > 0) {
    console.log('\n❌ Database setup has critical issues that need to be resolved.');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log('\n⚠️  Database setup is functional but has some warnings to consider.');
  } else {
    console.log('\n🎉 Database setup is perfect! All validations passed.');
  }
}

main().catch(console.error);
