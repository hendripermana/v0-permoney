'use client';

import { useState } from 'react';
import { MoreHorizontal, UserPlus, Shield, Users, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useHouseholdMembers, useRemoveMember, useUserRole } from '../../hooks/use-households';
import { HouseholdMember } from '../../lib/api';
import { InviteMemberDialog } from './invite-member-dialog';
import { UpdateMemberDialog } from './update-member-dialog';
import { PermissionsManagement } from './permissions-management';

interface MemberManagementProps {
  householdId: string;
}

const roleColors = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  PARTNER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  FINANCE_STAFF: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const roleIcons = {
  ADMIN: Shield,
  PARTNER: Users,
  FINANCE_STAFF: UserPlus,
};

export function MemberManagement({ householdId }: MemberManagementProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [updateMemberDialog, setUpdateMemberDialog] = useState<{
    open: boolean;
    member?: HouseholdMember;
  }>({ open: false });
  const [permissionsDialog, setPermissionsDialog] = useState<{
    open: boolean;
    member?: HouseholdMember;
  }>({ open: false });
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    member?: HouseholdMember;
  }>({ open: false });

  const { data: members, isLoading } = useHouseholdMembers(householdId);
  const { data: userRoleData } = useUserRole(householdId);
  const removeMember = useRemoveMember();

  const isAdmin = userRoleData?.role === 'ADMIN';

  const handleRemoveMember = async () => {
    if (!removeDialog.member) return;

    try {
      await removeMember.mutateAsync({
        householdId,
        memberId: removeDialog.member.userId,
      });
      setRemoveDialog({ open: false });
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading members...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Manage household members and their permissions
            </CardDescription>
          </div>
          {isAdmin && (
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members?.map((member) => {
              const roleKey = member.role as keyof typeof roleIcons;
              const RoleIcon = roleIcons[roleKey] ?? Users;
              const roleBadgeClass = roleColors[member.role as keyof typeof roleColors] ??
                'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-200';
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={member.user.avatarUrl || undefined} />
                      <AvatarFallback>
                        {member.user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.user.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={roleBadgeClass}>
                      <RoleIcon className="mr-1 h-3 w-3" />
                      {member.role}
                    </Badge>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setUpdateMemberDialog({ open: true, member })
                            }
                          >
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setPermissionsDialog({ open: true, member })
                            }
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Manage Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setRemoveDialog({ open: true, member })
                            }
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <InviteMemberDialog
        householdId={householdId}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

      <UpdateMemberDialog
        householdId={householdId}
        member={updateMemberDialog.member}
        open={updateMemberDialog.open}
        onOpenChange={(open) =>
          setUpdateMemberDialog({ open, member: updateMemberDialog.member })
        }
      />

      {permissionsDialog.member && (
        <PermissionsManagement
          householdId={householdId}
          member={permissionsDialog.member}
          open={permissionsDialog.open}
          onOpenChange={(open) =>
            setPermissionsDialog({ open, member: permissionsDialog.member })
          }
        />
      )}

      <AlertDialog
        open={removeDialog.open}
        onOpenChange={(open) => setRemoveDialog({ open, member: removeDialog.member })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removeDialog.member?.user.name} from
              this household? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
