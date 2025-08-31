import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient | null = null;
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
    const useMock = process.env.USE_MOCK_PRISMA === 'true';
    if (useMock) {
      this.initializeMockModels();
    } else {
      // Initialize real Prisma client
      this.prisma = new PrismaClient();
      this.assignModelDelegates();
    }
  }

  private assignModelDelegates() {
    if (!this.prisma) return;
    // Assign real delegates to properties for backward compatibility
    this.account = this.prisma.account;
    this.transaction = this.prisma.transaction;
    this.category = this.prisma.category;
    this.ledgerEntry = this.prisma.ledgerEntry;
    this.budget = this.prisma.budget;
    this.debt = this.prisma.debt;
    this.financialInsight = this.prisma.financialInsight as any;
    this.recurringTransaction = this.prisma.recurringTransaction as any;
    this.recurringTransactionExecution = this.prisma.recurringTransactionExecution as any;
    this.wishlistItem = (this.prisma as any).wishlistItem || {};
    this.priceHistory = (this.prisma as any).priceHistory || {};
    this.gratitudeEntry = (this.prisma as any).gratitudeEntry || {};
    this.user = this.prisma.user;
    this.household = this.prisma.household;
    this.householdMember = this.prisma.householdMember;
    this.institution = (this.prisma as any).institution || {};
    this.merchant = this.prisma.merchant as any;
    this.transactionTag = (this.prisma as any).transactionTag || {};
    this.transactionSplit = this.prisma.transactionSplit as any;
    this.debtPayment = (this.prisma as any).debtPayment || {};
    this.budgetCategory = this.prisma.budgetCategory as any;
    this.exchangeRate = (this.prisma as any).exchangeRate || {};
    this.passkey = (this.prisma as any).passkey || {};
    this.session = (this.prisma as any).session || {};
    this.userEvent = (this.prisma as any).userEvent || {};
    this.spendingPattern = (this.prisma as any).spendingPattern || {};
    this.documentUpload = (this.prisma as any).documentUpload || {};
    this.ocrResult = (this.prisma as any).ocrResult || {};
    this.transactionSuggestion = (this.prisma as any).transactionSuggestion || {};
    this.zakatCalculation = (this.prisma as any).zakatCalculation || {};
    this.zakatAssetBreakdown = (this.prisma as any).zakatAssetBreakdown || {};
    this.zakatReminder = (this.prisma as any).zakatReminder || {};
    this.zakatPayment = (this.prisma as any).zakatPayment || {};
    this.shariaCompliantAccount = (this.prisma as any).shariaCompliantAccount || {};
    this.islamicFinanceReport = (this.prisma as any).islamicFinanceReport || {};
    this.notification = (this.prisma as any).notification || {};
    this.notificationDelivery = (this.prisma as any).notificationDelivery || {};
    this.notificationPreference = (this.prisma as any).notificationPreference || {};
    this.pushSubscription = (this.prisma as any).pushSubscription || {};
    this.emailTemplate = (this.prisma as any).emailTemplate || {};
    this.$transaction = this.prisma.$transaction.bind(this.prisma);
    this.$queryRaw = (this.prisma as any).$queryRaw.bind(this.prisma);
    this.$executeRaw = (this.prisma as any).$executeRaw.bind(this.prisma);
    this.$executeRawUnsafe = (this.prisma as any).$executeRawUnsafe?.bind(this.prisma);
    this.$queryRawUnsafe = (this.prisma as any).$queryRawUnsafe?.bind(this.prisma);
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
    if (this.prisma) {
      await this.prisma.$connect();
    } else {
      console.log('Mock Prisma connection established');
    }
  }

  async $disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    } else {
      console.log('Mock Prisma connection closed');
    }
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
