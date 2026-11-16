import { Module } from "@nestjs/common";
import { TradersController } from "./traders.controller";
import { TradersService } from "./traders.service";

@Module({ controllers: [TradersController], providers: [TradersService], exports: [TradersService] })
export class TradersModule {}
