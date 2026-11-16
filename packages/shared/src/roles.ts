/** Roles from the PRD "Users and roles" table. */
export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** Fine-grained permissions checked by the API (never only the UI). */
export const Permission = {
  KYC_REVIEW: "kyc:review",
  TRADERS_MANAGE: "traders:manage",
  CLAIMS_MATCH: "claims:match",
  BUY_PLATFORMS_MANAGE: "buy-platforms:manage",
  DASHBOARD_CONFIGURE: "dashboard:configure",
  VISITORS_VIEW: "visitors:view",
  BALANCE_ADJUST: "balance:adjust",
  BALANCE_ADJUST_APPROVE_LARGE: "balance:adjust:approve-large",
  WALLET_ADDRESS_CHANGE: "wallet:address:change",
  ADMINS_MANAGE: "admins:manage",
  AUDIT_EXPORT: "audit:export",
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

const ADMIN_PERMISSIONS: Permission[] = [
  Permission.KYC_REVIEW,
  Permission.TRADERS_MANAGE,
  Permission.CLAIMS_MATCH,
  Permission.BUY_PLATFORMS_MANAGE,
  Permission.DASHBOARD_CONFIGURE,
  Permission.VISITORS_VIEW,
  Permission.BALANCE_ADJUST,
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  USER: [],
  ADMIN: ADMIN_PERMISSIONS,
  SUPER_ADMIN: [
    ...ADMIN_PERMISSIONS,
    Permission.BALANCE_ADJUST_APPROVE_LARGE,
    Permission.WALLET_ADDRESS_CHANGE,
    Permission.ADMINS_MANAGE,
    Permission.AUDIT_EXPORT,
  ],
};

export const hasPermission = (role: Role, p: Permission) => ROLE_PERMISSIONS[role].includes(p);
