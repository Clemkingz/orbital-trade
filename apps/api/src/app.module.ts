import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { KycApprovedGuard } from "./common/guards/kyc-approved.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { KycModule } from "./modules/kyc/kyc.module";
import { WalletsModule } from "./modules/wallets/wallets.module";
import { DepositClaimsModule } from "./modules/deposit-claims/deposit-claims.module";
import { LedgerModule } from "./modules/ledger/ledger.module";
import { WithdrawalsModule } from "./modules/withdrawals/withdrawals.module";
import { BuyPlatformsModule } from "./modules/buy-platforms/buy-platforms.module";
import { TradersModule } from "./modules/traders/traders.module";
import { CopyTradingModule } from "./modules/copy-trading/copy-trading.module";
import { DashboardConfigModule } from "./modules/dashboard-config/dashboard-config.module";
import { VisitorsModule } from "./modules/visitors/visitors.module";
import { MarketModule } from "./modules/market/market.module";
import { AuditModule } from "./modules/audit/audit.module";
import { UsersModule } from "./modules/users/users.module";

/** Scaffold only — modules are empty stubs. */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env"] }),
    PrismaModule,
    AuthModule,
    KycModule,
    WalletsModule,
    DepositClaimsModule,
    LedgerModule,
    WithdrawalsModule,
    BuyPlatformsModule,
    TradersModule,
    CopyTradingModule,
    DashboardConfigModule,
    VisitorsModule,
    MarketModule,
    AuditModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: KycApprovedGuard },
  ],
})
export class AppModule {}
