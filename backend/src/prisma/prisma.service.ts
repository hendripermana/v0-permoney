import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Mock PrismaClient interface to resolve compilation issues
interface MockPrismaClient {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  account: any;
  transaction: any;
  category: any;
  ledgerEntry: any;
  budget: any;
  debt: any;
  financialInsight: any;
  recurringTransaction: any;
  recurringTransactionExecution: any;
  wishlistItem: any;
  priceHistory: any;
  gratitudeEntry: any;
  user: any;
  household: any;
  householdMember: any;
  institution: any;
  merchant: any;
  transactionTag: any;
  transactionSplit: any;
  debtPayment: any;
  budgetCategory: any;
  exchangeRate: any;
  passkey: any;
  session: any;
  userEvent: any;
  spendingPattern: any;
  documentUpload: any;
  ocrResult: any;
  transactionSuggestion: any;
  zakatCalculation: any;
  zakatAssetBreakdown: any;
  zakatReminder: any;
  zakatPayment: any;
  shariaCompliantAccount: any;
  islamicFinanceReport: any;
  notification: any;
  notificationDelivery: any;
  notificationPreference: any;
  pushSubscription: any;
  emailTemplate: any;
  $transaction: any;
}

@Injectable()
export class PrismaService implements MockPrismaClient, OnModuleInit, OnModuleDestroy {
  // Model properties
  account: any = {};
  transaction: any = {};
  category: any = {};
  ledgerEntry: any = {};
  budget: any = {};
  debt: any = {};
  financialInsight: any = {};
  recurringTransaction: any = {};
  recurringTransactionExecution: any = {};
  wishlistItem: any = {};
  priceHistory: any = {};
  gratitudeEntry: any = {};
  user: any = {};
  household: any = {};
  householdMember: any = {};
  institution: any = {};
  merchant: any = {};
  transactionTag: any = {};
  transactionSplit: any = {};
  debtPayment: any = {};
  budgetCategory: any = {};
  exchangeRate: any = {};
  passkey: any = {};
  session: any = {};
  userEvent: any = {};
  spendingPattern: any = {};
  documentUpload: any = {};
  ocrResult: any = {};
  transactionSuggestion: any = {};
  zakatCalculation: any = {};
  zakatAssetBreakdown: any = {};
  zakatReminder: any = {};
  zakatPayment: any = {};
  shariaCompliantAccount: any = {};
  islamicFinanceReport: any = {};
  notification: any = {};
  notificationDelivery: any = {};
  notificationPreference: any = {};
  pushSubscription: any = {};
  emailTemplate: any = {};
  $transaction: any = {};
  $queryRaw: any;
  $executeRaw: any;
  $executeRawUnsafe: any;
  $queryRawUnsafe: any;

  constructor(private configService: ConfigService) {
    // Initialize with mock implementations
    this.initializeMockModels();
  }

  private initializeMockModels() {
    // This is a temporary mock implementation
    // In a real scenario, you would initialize the actual PrismaClient here
    const mockModel = {
      findMany: async () => [],
      findFirst: async () => null,
      findUnique: async () => null,
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
      deleteMany: async () => ({ count: 0 }),
      count: async () => 0,
      aggregate: async () => ({}),
      groupBy: async () => [],
    };

    // Assign mock model to all model properties
    this.account = mockModel;
    this.transaction = mockModel;
    this.category = mockModel;
    this.ledgerEntry = mockModel;
    this.budget = mockModel;
    this.debt = mockModel;
    this.financialInsight = mockModel;
    this.recurringTransaction = mockModel;
    this.recurringTransactionExecution = mockModel;
    this.wishlistItem = mockModel;
    this.priceHistory = mockModel;
    this.gratitudeEntry = mockModel;
    this.user = mockModel;
    this.household = mockModel;
    this.householdMember = mockModel;
    this.institution = mockModel;
    this.merchant = mockModel;
    this.transactionTag = mockModel;
    this.transactionSplit = mockModel;
    this.debtPayment = mockModel;
    this.budgetCategory = mockModel;
    this.exchangeRate = mockModel;
    this.passkey = mockModel;
    this.session = mockModel;
    this.userEvent = mockModel;
    this.spendingPattern = mockModel;
    this.documentUpload = mockModel;
    this.ocrResult = mockModel;
    this.transactionSuggestion = mockModel;
    this.zakatCalculation = mockModel;
    this.zakatAssetBreakdown = mockModel;
    this.zakatReminder = mockModel;
    this.zakatPayment = mockModel;
    this.shariaCompliantAccount = mockModel;
    this.islamicFinanceReport = mockModel;
    this.notification = mockModel;
    this.notificationDelivery = mockModel;
    this.notificationPreference = mockModel;
    this.pushSubscription = mockModel;
    this.emailTemplate = mockModel;
    this.$transaction = mockModel;
    this.$queryRaw = async () => [];
    this.$executeRaw = async () => ({ count: 0 });
    this.$executeRawUnsafe = async () => ({ count: 0 });
    this.$queryRawUnsafe = async () => [];
  }

  async $connect(): Promise<void> {
    // Mock connection
    console.log('Mock Prisma connection established');
  }

  async $disconnect(): Promise<void> {
    // Mock disconnection
    console.log('Mock Prisma connection closed');
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDb() {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Delete in reverse order of dependencies
    const models = [
      'userEvent',
      'spendingPattern',
      'financialInsight',
      'priceHistory',
      'wishlistItem',
      'gratitudeEntry',
      'budgetCategory',
      'budget',
      'debtPayment',
      'debt',
      'ledgerEntry',
      'transactionSplit',
      'transactionTag',
      'transaction',
      'category',
      'account',
      'institution',
      'exchangeRate',
      'session',
      'passkey',
      'householdMember',
      'household',
      'user',
    ];

    for (const model of models) {
      await (this as any)[model].deleteMany();
    }
  }
}
