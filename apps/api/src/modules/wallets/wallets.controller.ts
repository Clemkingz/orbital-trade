import { Controller } from "@nestjs/common";
import { WalletsService } from "./wallets.service";

@Controller("wallet")
export class WalletsController {
  constructor(private readonly service: WalletsService) {}
}
