import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { KycStatus } from "@orbit/shared";
import { REQUIRE_KYC } from "../decorators/require-kyc.decorator";

/** Server-side KYC gate (FR-3.7): deposits, wallet-address reads, copy starts, withdrawals. */
@Injectable()
export class KycApprovedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_KYC, [ctx.getHandler(), ctx.getClass()]);
    if (!required) return true;
    const user = ctx.switchToHttp().getRequest().user;
    if (user?.kycStatus !== KycStatus.APPROVED) throw new ForbiddenException("Verify your ID to unlock deposits and copy trading.");
    return true;
  }
}
