import { Controller } from "@nestjs/common";
import { DepositClaimsService } from "./deposit-claims.service";

@Controller("deposit-claims")
export class DepositClaimsController {
  constructor(private readonly service: DepositClaimsService) {}
}
