export type ViewType = 'individual' | 'partner_only' | 'combined'

export type HouseholdRole =
  | 'ADMIN'
  | 'PARTNER'
  | 'FINANCE_STAFF'
  | 'FINANCE_ANALYST'
  | 'AUDITOR'
  | string

export interface HouseholdMember {
  id: string
  userId: string
  name: string
  email: string
  role: HouseholdRole
  status: string
  permissions: string[]
  joinedAt?: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
  }
}

export interface HouseholdSettings {
  defaultViewType?: ViewType
  timezone?: string
  baseCurrency?: string
  enableNotifications?: boolean
  enableBudgetAlerts?: boolean
  enablePriceAlerts?: boolean
  privacyMode?: boolean
  autoCategorizationEnabled?: boolean
  currencyDisplayFormat?: 'symbol' | 'code' | 'both'
  updatedAt?: string
  [key: string]: unknown
}

export interface Household {
  id: string
  name: string
  baseCurrency: string
  members: HouseholdMember[]
  createdAt: string
  updatedAt?: string
  settings?: HouseholdSettings | null
}

export interface CreateHouseholdData {
  name: string
  baseCurrency: string
}

export interface InviteMemberData {
  email: string
  role: string
  permissions?: string[]
  message?: string
}

export interface UpdateMemberData {
  role?: string
  permissions?: string[]
  status?: string
}

export interface FilteredViewData {
  allowedUserIds: string[]
  allowedAccountIds: string[]
  viewType: ViewType
}

export interface AvailablePermissionsResponse {
  permissionsByCategory: Record<string, string[]>
  roleDefaults: Record<string, string[]>
}

export interface PermissionCheckResponse {
  hasPermission: boolean
}

export interface HouseholdRoleResponse {
  role: string
}
