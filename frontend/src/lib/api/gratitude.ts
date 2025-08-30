// Mock API for now - replace with actual implementation
const api = {
  get: async (url: string, config?: any) => Promise.resolve({}),
  post: async (url: string, data?: any) => Promise.resolve({}),
  patch: async (url: string, data?: any) => Promise.resolve({}),
  delete: async (url: string) => Promise.resolve({}),
};

export interface GratitudeEntry {
  id: string;
  householdId: string;
  giver: string;
  type: 'TREAT' | 'HELP' | 'GIFT';
  categoryId?: string;
  transactionId?: string;
  estimatedValueCents?: number;
  currency?: string;
  description: string;
  date: string;
  createdBy: string;
  createdAt: string;
  category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  transaction?: {
    id: string;
    description: string;
    amountCents: number;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateGratitudeEntryDto {
  giver: string;
  type: 'TREAT' | 'HELP' | 'GIFT';
  description: string;
  date: string;
  categoryId?: string;
  transactionId?: string;
  estimatedValueCents?: number;
  currency?: string;
}

export interface UpdateGratitudeEntryDto {
  giver?: string;
  type?: 'TREAT' | 'HELP' | 'GIFT';
  description?: string;
  date?: string;
  categoryId?: string;
  transactionId?: string;
  estimatedValueCents?: number;
  currency?: string;
}

export interface GratitudeFilters {
  type?: 'TREAT' | 'HELP' | 'GIFT';
  giver?: string;
  categoryId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface GratitudePaginatedResponse {
  entries: GratitudeEntry[];
  total: number;
  totalPages: number;
}

export interface GratitudeSummary {
  totalEntries: number;
  totalValueCents: number;
  currency: string;
  byType: GratitudeTypeBreakdown[];
  topGivers: GiverBreakdown[];
  monthlyTrend: MonthlyGratitudeTrend[];
}

export interface GratitudeTypeBreakdown {
  type: 'TREAT' | 'HELP' | 'GIFT';
  count: number;
  totalValueCents: number;
  averageValueCents: number;
}

export interface GiverBreakdown {
  giver: string;
  count: number;
  totalValueCents: number;
  lastGratitudeDate: string;
}

export interface MonthlyGratitudeTrend {
  month: string;
  count: number;
  totalValueCents: number;
}

export interface RelationshipInsights {
  insights: RelationshipInsight[];
  giverAnalysis: GiverRelationshipAnalysis[];
  reciprocityAnalysis: ReciprocityAnalysis[];
}

export interface RelationshipInsight {
  type: string;
  title: string;
  description: string;
  data: any;
  confidence: number;
}

export interface GiverRelationshipAnalysis {
  giver: string;
  relationshipStrength: number;
  primaryGratitudeType: 'TREAT' | 'HELP' | 'GIFT';
  averageFrequency: number;
  generosityScore: number;
  trend: string;
}

export interface ReciprocityAnalysis {
  person1: string;
  person2: string;
  person1ToPerson2: number;
  person2ToPerson1: number;
  reciprocityScore: number;
  relationshipType: string;
}

export const gratitudeApi = {
  // Create a new gratitude entry
  create: async (data: CreateGratitudeEntryDto): Promise<GratitudeEntry> => {
    const response = await api.post('/gratitude', data);
    return response as GratitudeEntry;
  },

  // Get all gratitude entries with filters and pagination
  getAll: async (
    filters: GratitudeFilters = {},
    page = 1,
    limit = 20
  ): Promise<GratitudePaginatedResponse> => {
    const response = await api.get('/gratitude', {
      params: {
        ...filters,
        page,
        limit,
      },
    });
    return response as GratitudePaginatedResponse;
  },

  // Get a specific gratitude entry
  getById: async (id: string): Promise<GratitudeEntry> => {
    const response = await api.get(`/gratitude/${id}`);
    return response as GratitudeEntry;
  },

  // Update a gratitude entry
  update: async (id: string, data: UpdateGratitudeEntryDto): Promise<GratitudeEntry> => {
    const response = await api.patch(`/gratitude/${id}`, data);
    return response as GratitudeEntry;
  },

  // Delete a gratitude entry
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/gratitude/${id}`);
    return response as { message: string };
  },

  // Get gratitude summary and statistics
  getSummary: async (fromDate?: string, toDate?: string): Promise<GratitudeSummary> => {
    const response = await api.get('/gratitude/summary', {
      params: {
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      },
    });
    return response as GratitudeSummary;
  },

  // Get relationship insights
  getInsights: async (): Promise<RelationshipInsights> => {
    const response = await api.get('/gratitude/insights');
    return response as RelationshipInsights;
  },
};
