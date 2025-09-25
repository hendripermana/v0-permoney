const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || '/api';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface Household {
  id: string;
  name: string;
  baseCurrency: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  members: HouseholdMember[];
}

export interface HouseholdMember {
  id: string;
  userId: string;
  householdId: string;
  role: 'ADMIN' | 'PARTNER' | 'FINANCE_STAFF';
  permissions: string[];
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface CreateHouseholdData {
  name: string;
  baseCurrency?: string;
  settings?: Record<string, any>;
}

export interface InviteMemberData {
  email: string;
  role: 'ADMIN' | 'PARTNER' | 'FINANCE_STAFF';
  permissions?: string[];
}

export interface UpdateMemberData {
  role?: 'ADMIN' | 'PARTNER' | 'FINANCE_STAFF';
  permissions?: string[];
}

export type ViewType = 'individual' | 'partner_only' | 'combined';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Household API methods
  async getHouseholds(): Promise<Household[]> {
    return this.request<Household[]>('/households');
  }

  async getHousehold(id: string): Promise<Household> {
    return this.request<Household>(`/households/${id}`);
  }

  async createHousehold(data: CreateHouseholdData): Promise<Household> {
    return this.request<Household>('/households', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHousehold(id: string, data: Partial<CreateHouseholdData>): Promise<Household> {
    return this.request<Household>(`/households/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHousehold(id: string): Promise<void> {
    await this.request(`/households/${id}`, {
      method: 'DELETE',
    });
  }

  async inviteMember(householdId: string, data: InviteMemberData): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/households/${householdId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMembers(householdId: string): Promise<HouseholdMember[]> {
    return this.request<HouseholdMember[]>(`/households/${householdId}/members`);
  }

  async updateMember(
    householdId: string,
    memberId: string,
    data: UpdateMemberData
  ): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/households/${householdId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeMember(householdId: string, memberId: string): Promise<void> {
    await this.request(`/households/${householdId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  async updateSettings(householdId: string, settings: Record<string, any>): Promise<Household> {
    return this.request<Household>(`/households/${householdId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getFilteredData(householdId: string, viewType: ViewType): Promise<{
    allowedUserIds: string[];
    allowedAccountIds: string[];
  }> {
    return this.request(`/households/${householdId}/filtered-data?viewType=${viewType}`);
  }

  async checkPermission(householdId: string, permission: string): Promise<{ hasPermission: boolean }> {
    return this.request(`/households/${householdId}/permissions/${permission}`);
  }

  async getUserRole(householdId: string): Promise<{ role: string | null }> {
    return this.request(`/households/${householdId}/role`);
  }

  async getAvailablePermissions(): Promise<{
    permissions: string[];
    permissionsByCategory: Record<string, string[]>;
    roleDefaults: Record<string, string[]>;
  }> {
    return this.request('/households/permissions');
  }

  async getHouseholdPermissions(householdId: string): Promise<{
    permissions: string[];
    role: string | null;
    permissionDescriptions: Record<string, string>;
  }> {
    return this.request(`/households/${householdId}/permissions`);
  }
}

export const apiClient = new ApiClient();
