import { Injectable } from "@nestjs/common";

/** FR-9: heartbeat every 15s, drop after 45s (Redis), IP geolocation, hashed IPs kept ≤ 90 days. */
@Injectable()
export class VisitorsService {}
