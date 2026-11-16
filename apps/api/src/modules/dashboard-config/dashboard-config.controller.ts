import { Controller } from "@nestjs/common";
import { DashboardConfigService } from "./dashboard-config.service";

@Controller("dashboard-config")
export class DashboardConfigController {
  constructor(private readonly service: DashboardConfigService) {}
}
