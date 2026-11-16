import { Module } from "@nestjs/common";
import { DepositClaimsController } from "./deposit-claims.controller";
import { DepositClaimsService } from "./deposit-claims.service";

@Module({ controllers: [DepositClaimsController], providers: [DepositClaimsService], exports: [DepositClaimsService] })
export class DepositClaimsModule {}
