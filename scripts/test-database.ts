import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test schema by counting tables
    const userCount = await prisma.user.count();
    const householdCount = await prisma.household.count();
    const categoryCount = await prisma.category.count();
    const institutionCount = await prisma.institution.count();
    
    console.log('📊 Database statistics:');
    console.log(`  Users: ${userCount}`);
    console.log(`  Households: ${householdCount}`);
    console.log(`  Categories: ${categoryCount}`);
    console.log(`  Institutions: ${institutionCount}`);
    
    // Test a simple query
    const globalCategories = await prisma.category.findMany({
      where: { householdId: null },
      take: 5,
      select: { name: true, type: true, icon: true }
    });
    
    console.log('🏷️  Sample global categories:');
    globalCategories.forEach(cat => {
      console.log(`  ${cat.icon} ${cat.name} (${cat.type})`);
    });
    
    console.log('✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
