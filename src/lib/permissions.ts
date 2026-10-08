import { Group, GroupAdminPermissions } from '../types/group';

export type EffectivePermissions = GroupAdminPermissions;

export const DEFAULT_EFFECTIVE_PERMISSIONS: EffectivePermissions = {
  accessPanel: false,
  manageUsers: false,
  manageGroups: false,
  manageBadges: false,
  manageForum: false,
  manageContent: false,
  manageCatalogs: false,
};

export const unionUserPermissions = (groups: Group[]): EffectivePermissions => {
  const result: EffectivePermissions = { ...DEFAULT_EFFECTIVE_PERMISSIONS };

  for (const group of groups) {
    if (!group?.permissions?.admin) continue;
    const admin = group.permissions.admin;
    if (admin.accessPanel) result.accessPanel = true;
    if (admin.manageUsers) result.manageUsers = true;
    if (admin.manageGroups) result.manageGroups = true;
    if (admin.manageBadges) result.manageBadges = true;
    if (admin.manageForum) result.manageForum = true;
    if (admin.manageContent) result.manageContent = true;
    if (admin.manageCatalogs) result.manageCatalogs = true;
  }

  return result;
};

export const deriveIsStaff = (groups: Group[]): boolean => {
  return groups.some((g) => g && g.isStaff === true);
};
