import { Module } from "@nestjs/common";
import { BuyPlatformsController } from "./buy-platforms.controller";
import { BuyPlatformsService } from "./buy-platforms.service";

@Module({ controllers: [BuyPlatformsController], providers: [BuyPlatformsService], exports: [BuyPlatformsService] })
export class BuyPlatformsModule {}
