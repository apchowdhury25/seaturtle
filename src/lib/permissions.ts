export const ROLES = [
  "owner",
  "administrator",
  "operations_manager",
  "inventory_manager",
  "customer_support",
  "sustainability_manager",
  "marketing_manager",
  "auditor",
] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "catalog.read",
  "catalog.write",
  "orders.read",
  "orders.write",
  "orders.refund",
  "customers.read",
  "customers.write",
  "discounts.write",
  "shipping.write",
  "content.write",
  "support.read",
  "support.write",
  "sustainability.read",
  "sustainability.write",
  "conservation.read",
  "conservation.write",
  "staff.manage",
  "audit.read",
  "settings.write",
  "analytics.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL = [...PERMISSIONS];
const READS = PERMISSIONS.filter((permission) => permission.endsWith(".read"));

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ALL,
  administrator: ALL.filter((permission) => permission !== "staff.manage"),
  operations_manager: [
    "orders.read",
    "orders.write",
    "orders.refund",
    "customers.read",
    "shipping.write",
    "support.read",
    "support.write",
    "analytics.read",
    "catalog.read",
  ],
  inventory_manager: ["catalog.read", "catalog.write", "orders.read", "analytics.read"],
  customer_support: ["orders.read", "orders.write", "customers.read", "customers.write", "support.read", "support.write"],
  sustainability_manager: [
    "catalog.read",
    "sustainability.read",
    "sustainability.write",
    "conservation.read",
    "conservation.write",
  ],
  marketing_manager: ["catalog.read", "content.write", "discounts.write", "analytics.read", "customers.read"],
  auditor: [...READS, "audit.read", "analytics.read"],
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function permissionsFor(roles: readonly string[]): Set<Permission> {
  const granted = new Set<Permission>();
  for (const role of roles) {
    if (!isRole(role)) continue;
    for (const permission of ROLE_PERMISSIONS[role]) granted.add(permission);
  }
  return granted;
}

export function hasPermission(roles: readonly string[], permission: Permission): boolean {
  return permissionsFor(roles).has(permission);
}
