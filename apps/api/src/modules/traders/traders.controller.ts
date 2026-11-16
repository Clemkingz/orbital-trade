import { Controller } from "@nestjs/common";
import { TradersService } from "./traders.service";

@Controller("traders")
export class TradersController {
  constructor(private readonly service: TradersService) {}
}
