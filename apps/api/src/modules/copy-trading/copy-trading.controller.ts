import { Controller } from "@nestjs/common";
import { CopyTradingService } from "./copy-trading.service";

@Controller("copy")
export class CopyTradingController {
  constructor(private readonly service: CopyTradingService) {}
}
