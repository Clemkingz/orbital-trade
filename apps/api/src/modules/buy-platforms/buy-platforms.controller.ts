import { Controller } from "@nestjs/common";
import { BuyPlatformsService } from "./buy-platforms.service";

@Controller("buy-platforms")
export class BuyPlatformsController {
  constructor(private readonly service: BuyPlatformsService) {}
}
