import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasPermission, type Permission } from "@orbit/shared";
import { PERMISSIONS } from "../decorators/permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const needed = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS, [ctx.getHandler(), ctx.getClass()]);
    if (!needed?.length) return true;
    const user = ctx.switchToHttp().getRequest().user;
    if (!user || !needed.every((p) => hasPermission(user.role, p))) throw new ForbiddenException();
    return true;
  }
}
