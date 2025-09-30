import { PrismaClient, CategoryType, InstitutionType, HouseholdRole } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to create or find global categories
const createGlobalCategory = async (data: any) => {
  const existing = await prisma.category.findFirst({
    where: { slug: data.slug, householdId: null }
  });
  if (existing) return existing;
  return await prisma.category.create({ data });
};

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default institutions
  console.log('📦 Creating default institutions...');
  const institutions = await Promise.all([
    // Indonesian Banks
    prisma.institution.upsert({
      where: { code: 'BCA' },
      update: {},
      create: {
        name: 'Bank Central Asia',
        code: 'BCA',
        logoUrl: 'https://example.com/logos/bca.png',
        country: 'ID',
        type: InstitutionType.BANK,
      },
    }),
    prisma.institution.upsert({
      where: { code: 'BNI' },
      update: {},
      create: {
        name: 'Bank Negara Indonesia',
        code: 'BNI',
        logoUrl: 'https://example.com/logos/bni.png',
        country: 'ID',
        type: InstitutionType.BANK,
      },
    }),
    prisma.institution.upsert({
      where: { code: 'BRI' },
      update: {},
      create: {
        name: 'Bank Rakyat Indonesia',
        code: 'BRI',
        logoUrl: 'https://example.com/logos/bri.png',
        country: 'ID',
        type: InstitutionType.BANK,
      },
    }),
    prisma.institution.upsert({
      where: { code: 'MANDIRI' },
      update: {},
      create: {
        name: 'Bank Mandiri',
        code: 'MANDIRI',
        logoUrl: 'https://example.com/logos/mandiri.png',
        country: 'ID',
        type: InstitutionType.BANK,
      },
    }),
    // Fintech Companies
    prisma.institution.upsert({
      where: { code: 'DANA' },
      update: {},
      create: {
        name: 'DANA',
        code: 'DANA',
        logoUrl: 'https://example.com/logos/dana.png',
        country: 'ID',
        type: InstitutionType.FINTECH,
      },
    }),
    prisma.institution.upsert({
      where: { code: 'GOPAY' },
      update: {},
      create: {
        name: 'GoPay',
        code: 'GOPAY',
        logoUrl: 'https://example.com/logos/gopay.png',
        country: 'ID',
        type: InstitutionType.FINTECH,
      },
    }),
    prisma.institution.upsert({
      where: { code: 'OVO' },
      update: {},
      create: {
        name: 'OVO',
        code: 'OVO',
        logoUrl: 'https://example.com/logos/ovo.png',
        country: 'ID',
        type: InstitutionType.FINTECH,
      },
    }),
  ]);

  console.log(`✅ Created ${institutions.length} institutions`);

  // Create sample merchants for enriched transaction data
  console.log('🏪 Creating sample merchants...');
  const merchants = await Promise.all([
    // Food & Dining
    prisma.merchant.upsert({
      where: { slug: 'starbucks' },
      update: {},
      create: {
        name: 'Starbucks',
        slug: 'starbucks',
        logoUrl: 'https://example.com/logos/starbucks.png',
        color: '#00704A',
      },
    }),
    prisma.merchant.upsert({
      where: { slug: 'mcdonalds' },
      update: {},
      create: {
        name: "McDonald's",
        slug: 'mcdonalds',
        logoUrl: 'https://example.com/logos/mcdonalds.png',
        color: '#FFC72C',
      },
    }),
    prisma.merchant.upsert({
      where: { slug: 'indomaret' },
      update: {},
      create: {
        name: 'Indomaret',
        slug: 'indomaret',
        logoUrl: 'https://example.com/logos/indomaret.png',
        color: '#0066CC',
      },
    }),
    // Transportation
    prisma.merchant.upsert({
      where: { slug: 'gojek' },
      update: {},
      create: {
        name: 'Gojek',
        slug: 'gojek',
        logoUrl: 'https://example.com/logos/gojek.png',
        color: '#00AA13',
      },
    }),
    prisma.merchant.upsert({
      where: { slug: 'grab' },
      update: {},
      create: {
        name: 'Grab',
        slug: 'grab',
        logoUrl: 'https://example.com/logos/grab.png',
        color: '#00B14F',
      },
    }),
    // Shopping
    prisma.merchant.upsert({
      where: { slug: 'tokopedia' },
      update: {},
      create: {
        name: 'Tokopedia',
        slug: 'tokopedia',
        logoUrl: 'https://example.com/logos/tokopedia.png',
        color: '#42B549',
      },
    }),
    prisma.merchant.upsert({
      where: { slug: 'shopee' },
      update: {},
      create: {
        name: 'Shopee',
        slug: 'shopee',
        logoUrl: 'https://example.com/logos/shopee.png',
        color: '#EE4D2D',
      },
    }),
  ]);

  console.log(`✅ Created ${merchants.length} merchants`);

  // Create default global categories
  console.log('📂 Creating default global categories...');
  
  // Income Categories
  const incomeCategories = await Promise.all([
    createGlobalCategory({
      name: 'Salary',
      slug: 'salary',
      icon: '💰',
      color: '#10B981',
      type: CategoryType.INCOME,
      householdId: null,
      sortOrder: 1,
    }),
    createGlobalCategory({
      name: 'Freelance',
      slug: 'freelance',
      icon: '💻',
      color: '#059669',
      type: CategoryType.INCOME,
      householdId: null,
      sortOrder: 2,
    }),
    createGlobalCategory({
      name: 'Investment Income',
      slug: 'investment-income',
      icon: '📈',
      color: '#047857',
      type: CategoryType.INCOME,
      householdId: null,
      sortOrder: 3,
    }),
    createGlobalCategory({
      name: 'Business Income',
      slug: 'business-income',
      icon: '🏢',
      color: '#065F46',
      type: CategoryType.INCOME,
      householdId: null,
      sortOrder: 4,
    }),
    createGlobalCategory({
      name: 'Other Income',
      slug: 'other-income',
      icon: '💸',
      color: '#064E3B',
      type: CategoryType.INCOME,
      householdId: null,
      sortOrder: 5,
    }),
  ]);

  // Expense Categories
  const expenseCategories = await Promise.all([
    createGlobalCategory({
      name: 'Food & Dining',
      slug: 'food-dining',
      icon: '🍽️',
      color: '#EF4444',
      type: CategoryType.EXPENSE,
      householdId: null,
      sortOrder: 1,
    }),
    createGlobalCategory({
      name: 'Transportation',
      slug: 'transportation',
      icon: '🚗',
      color: '#F97316',
      type: CategoryType.EXPENSE,
      householdId: null,
      sortOrder: 2,
    }),
    createGlobalCategory({
      name: 'Shopping',
      slug: 'shopping',
      icon: '🛍️',
      color: '#F59E0B',
      type: CategoryType.EXPENSE,
      householdId: null,
      sortOrder: 3,
    }),
    createGlobalCategory({
      name: 'Entertainment',
      slug: 'entertainment',
      icon: '🎬',
      color: '#EAB308',
      type: CategoryType.EXPENSE,
      householdId: null,
      sortOrder: 4,
    }),
    createGlobalCategory({
      name: 'Bills & Utilities',
      slug: 'bills-utilities',
      icon: '⚡',
      color: '#84CC16',
      type: CategoryType.EXPENSE,
      householdId: null,
      sortOrder: 5,
    }),
    createGlobalCategory({
      name: 'Healthcare',
      slug: 'healthcare',
      icon: '🏥',
      color: '#22C55E',
      type: CategoryType.EXPENSE,
      householdId: null,
      sortOrder: 6,
    }),
    createGlobalCategory({
      name: 'Education',
      slug: 'education',
      icon: '📚',
      color: '#06B6D4',
      type: CategoryType.EXPENSE,
      householdId: null,
      sortOrder: 7,
    }),
    createGlobalCategory({
      name: 'Travel',
      slug: 'travel',
      icon: '✈️',
      color: '#3B82F6',
      type: CategoryType.EXPENSE,
      householdId: null,
      sortOrder: 8,
    }),
    createGlobalCategory({
      name: 'Personal Care',
      slug: 'personal-care',
      icon: '💄',
      color: '#6366F1',
      type: CategoryType.EXPENSE,
      householdId: null,
      sortOrder: 9,
    }),
    createGlobalCategory({
      name: 'Gifts & Donations',
      slug: 'gifts-donations',
      icon: '🎁',
      color: '#8B5CF6',
      type: CategoryType.EXPENSE,
      householdId: null,
      sortOrder: 10,
    }),
  ]);

  // Create subcategories for Food & Dining
  const foodDiningParent = expenseCategories.find(cat => cat.slug === 'food-dining');
  if (foodDiningParent) {
    await Promise.all([
      createGlobalCategory({
        name: 'Restaurants',
        slug: 'restaurants',
        icon: '🍽️',
        color: '#DC2626',
        type: CategoryType.EXPENSE,
        parentId: foodDiningParent.id,
        householdId: null,
        sortOrder: 1,
      }),
      createGlobalCategory({
        name: 'Groceries',
        slug: 'groceries',
        icon: '🛒',
        color: '#B91C1C',
        type: CategoryType.EXPENSE,
        parentId: foodDiningParent.id,
        householdId: null,
        sortOrder: 2,
      }),
      createGlobalCategory({
        name: 'Coffee & Tea',
        slug: 'coffee-tea',
        icon: '☕',
        color: '#991B1B',
        type: CategoryType.EXPENSE,
        parentId: foodDiningParent.id,
        householdId: null,
        sortOrder: 3,
      }),
    ]);
  }

  // Create subcategories for Transportation
  const transportationParent = expenseCategories.find(cat => cat.slug === 'transportation');
  if (transportationParent) {
    await Promise.all([
      createGlobalCategory({
        name: 'Fuel',
        slug: 'fuel',
        icon: '⛽',
        color: '#EA580C',
        type: CategoryType.EXPENSE,
        parentId: transportationParent.id,
        householdId: null,
        sortOrder: 1,
      }),
      createGlobalCategory({
        name: 'Public Transport',
        slug: 'public-transport',
        icon: '🚌',
        color: '#C2410C',
        type: CategoryType.EXPENSE,
        parentId: transportationParent.id,
        householdId: null,
        sortOrder: 2,
      }),
      createGlobalCategory({
        name: 'Ride Sharing',
        slug: 'ride-sharing',
        icon: '🚕',
        color: '#9A3412',
        type: CategoryType.EXPENSE,
        parentId: transportationParent.id,
        householdId: null,
        sortOrder: 3,
      }),
    ]);
  }

  // Asset Categories
  const assetCategories = await Promise.all([
    createGlobalCategory({
      name: 'Cash',
      slug: 'cash',
      icon: '💵',
      color: '#10B981',
      type: CategoryType.ASSET,
      householdId: null,
      sortOrder: 1,
    }),
    createGlobalCategory({
      name: 'Bank Accounts',
      slug: 'bank-accounts',
      icon: '🏦',
      color: '#059669',
      type: CategoryType.ASSET,
      householdId: null,
      sortOrder: 2,
    }),
    createGlobalCategory({
      name: 'Investments',
      slug: 'investments',
      icon: '📊',
      color: '#047857',
      type: CategoryType.ASSET,
      householdId: null,
      sortOrder: 3,
    }),
  ]);

  // Liability Categories
  const liabilityCategories = await Promise.all([
    createGlobalCategory({
      name: 'Credit Cards',
      slug: 'credit-cards',
      icon: '💳',
      color: '#DC2626',
      type: CategoryType.LIABILITY,
      householdId: null,
      sortOrder: 1,
    }),
    createGlobalCategory({
      name: 'Loans',
      slug: 'loans',
      icon: '🏠',
      color: '#B91C1C',
      type: CategoryType.LIABILITY,
      householdId: null,
      sortOrder: 2,
    }),
  ]);

  // Debt Categories
  const debtCategories = await Promise.all([
    createGlobalCategory({
      name: 'Personal Debt',
      slug: 'personal-debt',
      icon: '👥',
      color: '#7C2D12',
      type: CategoryType.DEBT,
      householdId: null,
      sortOrder: 1,
    }),
    createGlobalCategory({
      name: 'Islamic Financing',
      slug: 'islamic-financing',
      icon: '🕌',
      color: '#92400E',
      type: CategoryType.DEBT,
      householdId: null,
      sortOrder: 2,
    }),
  ]);

  console.log(`✅ Created ${incomeCategories.length + expenseCategories.length + assetCategories.length + liabilityCategories.length + debtCategories.length} default categories`);

  // Create sample exchange rates
  console.log('💱 Creating sample exchange rates...');
  const today = new Date();

  const exchangeRates = await Promise.all([
    // USD to IDR
    prisma.exchangeRate.upsert({
      where: {
        fromCurrency_toCurrency_date: {
          fromCurrency: 'USD',
          toCurrency: 'IDR',
          date: today,
        },
      },
      update: {},
      create: {
        fromCurrency: 'USD',
        toCurrency: 'IDR',
        rate: 15750.00,
        date: today,
        source: 'seed',
      },
    }),
    // EUR to IDR
    prisma.exchangeRate.upsert({
      where: {
        fromCurrency_toCurrency_date: {
          fromCurrency: 'EUR',
          toCurrency: 'IDR',
          date: today,
        },
      },
      update: {},
      create: {
        fromCurrency: 'EUR',
        toCurrency: 'IDR',
        rate: 17250.00,
        date: today,
        source: 'seed',
      },
    }),
    // SGD to IDR
    prisma.exchangeRate.upsert({
      where: {
        fromCurrency_toCurrency_date: {
          fromCurrency: 'SGD',
          toCurrency: 'IDR',
          date: today,
        },
      },
      update: {},
      create: {
        fromCurrency: 'SGD',
        toCurrency: 'IDR',
        rate: 11650.00,
        date: today,
        source: 'seed',
      },
    }),
  ]);

  console.log(`✅ Created ${exchangeRates.length} exchange rates`);

  // Create a demo household with sample data
  console.log('🏠 Creating demo household...');
  
  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@permoney.id' },
    update: {},
    create: {
      email: 'demo@permoney.id',
      name: 'Demo User',
      avatarUrl: 'https://example.com/avatars/demo.png',
    },
  });

  // Create demo household
  const demoHousehold = await prisma.household.create({
    data: {
      name: 'Demo Family',
      baseCurrency: 'IDR',
      settings: {
        theme: 'light',
        notifications: true,
        privacy: {
          showBalances: true,
          allowAnalytics: true,
        },
      },
    },
  });

  // Add user to household as admin
  await prisma.householdMember.create({
    data: {
      userId: demoUser.id,
      householdId: demoHousehold.id,
      role: HouseholdRole.ADMIN,
      permissions: ['ALL'],
    },
  });

  // Create demo accounts
  const bcaInstitution = institutions.find(inst => inst.code === 'BCA');
  const danaInstitution = institutions.find(inst => inst.code === 'DANA');

  const demoAccounts = await Promise.all([
    prisma.account.create({
      data: {
        householdId: demoHousehold.id,
        name: 'BCA Checking',
        type: 'ASSET',
        subtype: 'CHECKING',
        currency: 'IDR',
        institutionId: bcaInstitution?.id,
        accountNumber: '****1234',
        balanceCents: 5000000000, // 50,000,000 IDR
        ownerId: demoUser.id,
      },
    }),
    prisma.account.create({
      data: {
        householdId: demoHousehold.id,
        name: 'DANA Wallet',
        type: 'ASSET',
        subtype: 'DIGITAL_WALLET',
        currency: 'IDR',
        institutionId: danaInstitution?.id,
        balanceCents: 500000000, // 5,000,000 IDR
        ownerId: demoUser.id,
      },
    }),
    prisma.account.create({
      data: {
        householdId: demoHousehold.id,
        name: 'Cash',
        type: 'ASSET',
        subtype: 'CASH',
        currency: 'IDR',
        balanceCents: 1000000000, // 10,000,000 IDR
        ownerId: demoUser.id,
      },
    }),
  ]);

  console.log(`✅ Created demo household with ${demoAccounts.length} accounts`);

  console.log('🌱 Database seeding completed successfully!');
  console.log(`
📊 Summary:
- ${institutions.length} institutions created
- ${incomeCategories.length + expenseCategories.length + assetCategories.length + liabilityCategories.length + debtCategories.length} categories created
- ${merchants.length} merchants created
- ${exchangeRates.length} exchange rates created
- 1 demo household with ${demoAccounts.length} accounts created
- Demo user: demo@permoney.id

✨ New Features:
- ✅ Editable & Archivable Categories (isEditable, isArchived fields)
- ✅ Merchant Enrichment (logos, colors, brand consistency)
- ✅ Gratitude-Transaction Linking (enables financial storytelling)
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
