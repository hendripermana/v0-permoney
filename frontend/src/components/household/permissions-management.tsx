'use client';

import React, { useState } from 'react';
import { Shield, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useAvailablePermissions, useUpdateMember } from '../../hooks/use-households';
import { HouseholdMember } from '../../lib/api';

interface PermissionsManagementProps {
  householdId: string;
  member: HouseholdMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PermissionsManagement({
  householdId,
  member,
  open,
  onOpenChange,
}: PermissionsManagementProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    member.permissions || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: availablePermissions, isLoading } = useAvailablePermissions();
  const updateMember = useUpdateMember();

  React.useEffect(() => {
    if (member) {
      setSelectedPermissions(member.permissions || []);
    }
  }, [member]);

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permission]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permission));
    }
  };

  const handleRoleDefaultsApply = () => {
    if (availablePermissions?.roleDefaults[member.role]) {
      setSelectedPermissions(availablePermissions.roleDefaults[member.role]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateMember.mutateAsync({
        householdId,
        memberId: member.userId,
        data: {
          role: member.role,
          permissions: selectedPermissions,
        },
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update permissions:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading permissions...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const roleDefaults = availablePermissions?.roleDefaults[member.role] || [];
  const hasChanges = JSON.stringify(selectedPermissions.sort()) !== 
                   JSON.stringify((member.permissions || []).sort());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions - {member.user.name}
          </DialogTitle>
          <DialogDescription>
            Configure specific permissions for this member. Admin role has all permissions by default.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Role Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <div className="font-medium">Current Role: {member.role}</div>
              <div className="text-sm text-muted-foreground">
                {roleDefaults.length} default permissions
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRoleDefaultsApply}
            >
              Apply Role Defaults
            </Button>
          </div>

          {/* Permissions List */}
          <ScrollArea className="h-[400px] border rounded-lg p-4">
            <div className="space-y-6">
              {availablePermissions?.permissionsByCategory && 
                Object.entries(availablePermissions.permissionsByCategory).map(
                  ([category, permissions]) => (
                    <div key={category}>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        {category}
                        <Badge variant="outline" className="text-xs">
                          {permissions.filter(p => selectedPermissions.includes(p)).length}/
                          {permissions.length}
                        </Badge>
                      </h4>
                      <div className="space-y-2 ml-4">
                        {permissions.map((permission) => {
                          const isSelected = selectedPermissions.includes(permission);
                          const isRoleDefault = roleDefaults.includes(permission);
                          
                          return (
                            <div
                              key={permission}
                              className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50"
                            >
                              <Checkbox
                                id={permission}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handlePermissionToggle(permission, checked as boolean)
                                }
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={permission}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </label>
                                {isRoleDefault && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    Role Default
                                  </Badge>
                                )}
                              </div>
                              {isSelected ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  )
                )}
            </div>
          </ScrollArea>

          {/* Summary */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <strong>Selected:</strong> {selectedPermissions.length} permissions
              {hasChanges && (
                <Badge variant="outline" className="ml-2">
                  Changes pending
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !hasChanges}
          >
            {isSubmitting ? 'Saving...' : 'Save Permissions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
