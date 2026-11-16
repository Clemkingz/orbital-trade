import { SetMetadata } from "@nestjs/common";
import type { Permission } from "@orbit/shared";
export const PERMISSIONS = "permissions";
export const RequirePermissions = (...p: Permission[]) => SetMetadata(PERMISSIONS, p);
