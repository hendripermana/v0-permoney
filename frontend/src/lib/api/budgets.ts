import {
  Budget,
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetProgress,
  BudgetAlert,
  BudgetRecommendation,
  BudgetAnalytics,
  Goal,
  CreateGoalDto,
  UpdateGoalDto,
  GoalProgress
} from '../../types/budget';

const API_BASE = '/api/budgets';
const GOALS_API_BASE = '/api/goals';
const CATEGORIES_API_BASE = '/api/categories';

// Budget API functions
export const budgetApi = {
  // Budget CRUD operations
  async createBudget(data: CreateBudgetDto): Promise<Budget> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create budget');
    }

    return response.json();
  },

  async getBudgets(filters?: {
    period?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<Budget[]> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_BASE}?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch budgets');
    }

    return response.json();
  },

  async getBudgetById(id: string): Promise<Budget> {
    const response = await fetch(`${API_BASE}/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch budget');
    }

    return response.json();
  },

  async updateBudget(id: string, data: UpdateBudgetDto): Promise<Budget> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update budget');
    }

    return response.json();
  },

  async deleteBudget(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete budget');
    }
  },

  // Budget progress and analytics
  async getBudgetProgress(id: string): Promise<BudgetProgress> {
    const response = await fetch(`${API_BASE}/${id}/progress`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch budget progress');
    }

    return response.json();
  },

  async getBudgetAlerts(id: string): Promise<BudgetAlert[]> {
    const response = await fetch(`${API_BASE}/${id}/alerts`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch budget alerts');
    }

    return response.json();
  },

  async getBudgetRecommendations(): Promise<BudgetRecommendation[]> {
    const response = await fetch(`${API_BASE}/recommendations`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch budget recommendations');
    }

    return response.json();
  },

  async getBudgetAnalytics(): Promise<BudgetAnalytics> {
    const response = await fetch(`${API_BASE}/analytics`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch budget analytics');
    }

    return response.json();
  },

  async getSpendingPatterns(months?: number): Promise<any[]> {
    const params = months ? `?months=${months}` : '';
    const response = await fetch(`${API_BASE}/spending-patterns${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch spending patterns');
    }

    return response.json();
  },

  // Budget actions
  async carryOverBudget(id: string): Promise<Budget> {
    const response = await fetch(`${API_BASE}/${id}/carry-over`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to carry over budget');
    }

    return response.json();
  },

  async recalculateBudgetSpending(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/${id}/recalculate`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to recalculate budget spending');
    }

    return response.json();
  }
};

// Goal API functions (placeholder - would need backend implementation)
export const goalApi = {
  async createGoal(data: CreateGoalDto): Promise<Goal> {
    const response = await fetch(GOALS_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create goal');
    }

    return response.json();
  },

  async getGoals(filters?: {
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<Goal[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.category) params.append('category', filters.category);

    const response = await fetch(`${GOALS_API_BASE}?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch goals');
    }

    return response.json();
  },

  async getGoalById(id: string): Promise<Goal> {
    const response = await fetch(`${GOALS_API_BASE}/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch goal');
    }

    return response.json();
  },

  async updateGoal(id: string, data: UpdateGoalDto): Promise<Goal> {
    const response = await fetch(`${GOALS_API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update goal');
    }

    return response.json();
  },

  async deleteGoal(id: string): Promise<void> {
    const response = await fetch(`${GOALS_API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete goal');
    }
  },

  async getGoalProgress(id: string): Promise<GoalProgress> {
    const response = await fetch(`${GOALS_API_BASE}/${id}/progress`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch goal progress');
    }

    return response.json();
  },

  async addGoalContribution(id: string, amount: number): Promise<Goal> {
    const response = await fetch(`${GOALS_API_BASE}/${id}/contribute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add goal contribution');
    }

    return response.json();
  }
};

// Categories API (for budget category selection)
export const categoryApi = {
  async getCategories(): Promise<any[]> {
    const response = await fetch(CATEGORIES_API_BASE);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch categories');
    }

    return response.json();
  }
};
