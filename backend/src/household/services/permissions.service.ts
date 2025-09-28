import { Injectable } from '@nestjs/common';
import { HouseholdRole } from '../../../../node_modules/.prisma/client';
import { HOUSEHOLD_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, HouseholdPermission } from '../constants/permissions';

@Injectable()
export class PermissionsService {
  /**
   * Get all available permissions
   */
  getAllPermissions(): HouseholdPermission[] {
    return Object.values(HOUSEHOLD_PERMISSIONS);
  }

  /**
   * Get default permissions for a role
   */
  getDefaultPermissionsForRole(role: HouseholdRole): readonly HouseholdPermission[] {
    return DEFAULT_ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if a role has a specific permission by default
   */
  roleHasPermission(role: HouseholdRole, permission: HouseholdPermission): boolean {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
    return (rolePermissions as HouseholdPermission[]).includes(permission);
  }

  /**
   * Get permissions grouped by category
   */
  getPermissionsByCategory(): Record<string, HouseholdPermission[]> {
    return {
      'Account Management': [
        HOUSEHOLD_PERMISSIONS.MANAGE_ACCOUNTS,
        HOUSEHOLD_PERMISSIONS.VIEW_ALL_ACCOUNTS,
        HOUSEHOLD_PERMISSIONS.CREATE_ACCOUNTS,
        HOUSEHOLD_PERMISSIONS.DELETE_ACCOUNTS,
      ],
      'Transaction Management': [
        HOUSEHOLD_PERMISSIONS.MANAGE_TRANSACTIONS,
        HOUSEHOLD_PERMISSIONS.VIEW_ALL_TRANSACTIONS,
        HOUSEHOLD_PERMISSIONS.CREATE_TRANSACTIONS,
        HOUSEHOLD_PERMISSIONS.DELETE_TRANSACTIONS,
        HOUSEHOLD_PERMISSIONS.CATEGORIZE_TRANSACTIONS,
      ],
      'Budget Management': [
        HOUSEHOLD_PERMISSIONS.MANAGE_BUDGETS,
        HOUSEHOLD_PERMISSIONS.VIEW_BUDGETS,
        HOUSEHOLD_PERMISSIONS.CREATE_BUDGETS,
        HOUSEHOLD_PERMISSIONS.DELETE_BUDGETS,
      ],
      'Debt Management': [
        HOUSEHOLD_PERMISSIONS.MANAGE_DEBTS,
        HOUSEHOLD_PERMISSIONS.VIEW_DEBTS,
        HOUSEHOLD_PERMISSIONS.CREATE_DEBTS,
        HOUSEHOLD_PERMISSIONS.DELETE_DEBTS,
      ],
      'Reports & Analytics': [
        HOUSEHOLD_PERMISSIONS.VIEW_REPORTS,
        HOUSEHOLD_PERMISSIONS.EXPORT_DATA,
        HOUSEHOLD_PERMISSIONS.VIEW_ANALYTICS,
      ],
      'Household Management': [
        HOUSEHOLD_PERMISSIONS.MANAGE_MEMBERS,
        HOUSEHOLD_PERMISSIONS.INVITE_MEMBERS,
        HOUSEHOLD_PERMISSIONS.REMOVE_MEMBERS,
        HOUSEHOLD_PERMISSIONS.MANAGE_SETTINGS,
      ],
      'Document Processing': [
        HOUSEHOLD_PERMISSIONS.USE_OCR,
        HOUSEHOLD_PERMISSIONS.UPLOAD_DOCUMENTS,
      ],
      'Gratitude Management': [
        HOUSEHOLD_PERMISSIONS.MANAGE_GRATITUDE,
        HOUSEHOLD_PERMISSIONS.VIEW_GRATITUDE,
      ],
    };
  }

  /**
   * Validate that permissions are valid
   */
  validatePermissions(permissions: string[]): boolean {
    const validPermissions = this.getAllPermissions();
    return permissions.every(permission => validPermissions.includes(permission as HouseholdPermission));
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(
    userId: string,
    householdId: string,
    permission: HouseholdPermission
  ): Promise<boolean> {
    // This would typically check user permissions in database
    // For now, return true as a placeholder
    // TODO: Implement proper permission checking logic
    return true;
  }

  /**
   * Get permission description
   */
  getPermissionDescription(permission: HouseholdPermission): string {
    const descriptions: Record<HouseholdPermission, string> = {
      [HOUSEHOLD_PERMISSIONS.MANAGE_ACCOUNTS]: 'Full access to manage all household accounts',
      [HOUSEHOLD_PERMISSIONS.VIEW_ALL_ACCOUNTS]: 'View all household accounts and balances',
      [HOUSEHOLD_PERMISSIONS.CREATE_ACCOUNTS]: 'Create new accounts for the household',
      [HOUSEHOLD_PERMISSIONS.DELETE_ACCOUNTS]: 'Delete existing accounts',
      [HOUSEHOLD_PERMISSIONS.MANAGE_TRANSACTIONS]: 'Full access to manage all transactions',
      [HOUSEHOLD_PERMISSIONS.VIEW_ALL_TRANSACTIONS]: 'View all household transactions',
      [HOUSEHOLD_PERMISSIONS.CREATE_TRANSACTIONS]: 'Create new transactions',
      [HOUSEHOLD_PERMISSIONS.DELETE_TRANSACTIONS]: 'Delete existing transactions',
      [HOUSEHOLD_PERMISSIONS.CATEGORIZE_TRANSACTIONS]: 'Categorize and tag transactions',
      [HOUSEHOLD_PERMISSIONS.MANAGE_BUDGETS]: 'Full access to manage budgets',
      [HOUSEHOLD_PERMISSIONS.VIEW_BUDGETS]: 'View budget information and progress',
      [HOUSEHOLD_PERMISSIONS.CREATE_BUDGETS]: 'Create new budgets',
      [HOUSEHOLD_PERMISSIONS.DELETE_BUDGETS]: 'Delete existing budgets',
      [HOUSEHOLD_PERMISSIONS.MANAGE_DEBTS]: 'Full access to manage debt information',
      [HOUSEHOLD_PERMISSIONS.VIEW_DEBTS]: 'View debt information and payment schedules',
      [HOUSEHOLD_PERMISSIONS.CREATE_DEBTS]: 'Add new debt entries',
      [HOUSEHOLD_PERMISSIONS.DELETE_DEBTS]: 'Delete existing debt entries',
      [HOUSEHOLD_PERMISSIONS.VIEW_REPORTS]: 'Access financial reports and summaries',
      [HOUSEHOLD_PERMISSIONS.EXPORT_DATA]: 'Export household financial data',
      [HOUSEHOLD_PERMISSIONS.VIEW_ANALYTICS]: 'Access advanced analytics and insights',
      [HOUSEHOLD_PERMISSIONS.MANAGE_MEMBERS]: 'Full access to manage household members',
      [HOUSEHOLD_PERMISSIONS.INVITE_MEMBERS]: 'Invite new members to the household',
      [HOUSEHOLD_PERMISSIONS.REMOVE_MEMBERS]: 'Remove members from the household',
      [HOUSEHOLD_PERMISSIONS.MANAGE_SETTINGS]: 'Modify household settings and preferences',
      [HOUSEHOLD_PERMISSIONS.USE_OCR]: 'Use OCR features for document processing',
      [HOUSEHOLD_PERMISSIONS.UPLOAD_DOCUMENTS]: 'Upload receipts and financial documents',
      [HOUSEHOLD_PERMISSIONS.MANAGE_GRATITUDE]: 'Full access to manage gratitude entries',
      [HOUSEHOLD_PERMISSIONS.VIEW_GRATITUDE]: 'View gratitude entries and summaries',
    };

    return descriptions[permission] || 'Unknown permission';
  }
}
